-- Create transfers table
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(100) UNIQUE NOT NULL,
    from_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    to_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    reason TEXT,
    transfer_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (from_warehouse_id != to_warehouse_id)
);

-- Create transfer_items table
CREATE TABLE transfer_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(transfer_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX idx_transfers_reference_number ON transfers(reference_number);
CREATE INDEX idx_transfers_from_warehouse ON transfers(from_warehouse_id);
CREATE INDEX idx_transfers_to_warehouse ON transfers(to_warehouse_id);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_created_at ON transfers(created_at);
CREATE INDEX idx_transfer_items_transfer_id ON transfer_items(transfer_id);
CREATE INDEX idx_transfer_items_product_id ON transfer_items(product_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_transfers_updated_at
    BEFORE UPDATE ON transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_items_updated_at
    BEFORE UPDATE ON transfer_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update transfer total quantity
CREATE OR REPLACE FUNCTION update_transfer_total_quantity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE transfers 
        SET total_quantity = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM transfer_items 
            WHERE transfer_id = NEW.transfer_id
        )
        WHERE id = NEW.transfer_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE transfers 
        SET total_quantity = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM transfer_items 
            WHERE transfer_id = OLD.transfer_id
        )
        WHERE id = OLD.transfer_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update total quantity when transfer items change
CREATE TRIGGER update_transfer_total_quantity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON transfer_items
    FOR EACH ROW
    EXECUTE FUNCTION update_transfer_total_quantity();
