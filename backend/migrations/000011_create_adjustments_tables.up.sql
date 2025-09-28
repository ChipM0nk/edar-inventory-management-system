-- Create adjustments table
CREATE TABLE adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    adjustment_date DATE NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES users(id),
    processed_by UUID REFERENCES users(id),
    processed_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create adjustment_items table
CREATE TABLE adjustment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adjustment_id UUID NOT NULL REFERENCES adjustments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL, -- Can be positive (add) or negative (subtract)
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transfers table
CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(50) UNIQUE NOT NULL,
    transfer_date DATE NOT NULL,
    from_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    to_warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    total_quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'completed', 'cancelled')),
    reason TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    processed_by UUID REFERENCES users(id),
    processed_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
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
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_adjustments_reference_number ON adjustments(reference_number);
CREATE INDEX idx_adjustments_status ON adjustments(status);
CREATE INDEX idx_adjustments_created_by ON adjustments(created_by);
CREATE INDEX idx_adjustments_processed_by ON adjustments(processed_by);
CREATE INDEX idx_adjustments_date ON adjustments(adjustment_date);

CREATE INDEX idx_adjustment_items_adjustment_id ON adjustment_items(adjustment_id);
CREATE INDEX idx_adjustment_items_product_id ON adjustment_items(product_id);
CREATE INDEX idx_adjustment_items_warehouse_id ON adjustment_items(warehouse_id);

CREATE INDEX idx_transfers_reference_number ON transfers(reference_number);
CREATE INDEX idx_transfers_status ON transfers(status);
CREATE INDEX idx_transfers_from_warehouse ON transfers(from_warehouse_id);
CREATE INDEX idx_transfers_to_warehouse ON transfers(to_warehouse_id);
CREATE INDEX idx_transfers_created_by ON transfers(created_by);
CREATE INDEX idx_transfers_processed_by ON transfers(processed_by);
CREATE INDEX idx_transfers_date ON transfers(transfer_date);

CREATE INDEX idx_transfer_items_transfer_id ON transfer_items(transfer_id);
CREATE INDEX idx_transfer_items_product_id ON transfer_items(product_id);

-- Add comments for documentation
COMMENT ON TABLE adjustments IS 'Main adjustments table for inventory adjustments';
COMMENT ON TABLE adjustment_items IS 'Individual items within an adjustment';
COMMENT ON TABLE transfers IS 'Main transfers table for inventory transfers between warehouses';
COMMENT ON TABLE transfer_items IS 'Individual items within a transfer';

COMMENT ON COLUMN adjustments.reference_number IS 'Unique reference number for the adjustment (e.g., ADJ-2024-001)';
COMMENT ON COLUMN adjustments.total_quantity IS 'Total quantity of all items in the adjustment';
COMMENT ON COLUMN adjustments.status IS 'Current status of the adjustment';
COMMENT ON COLUMN adjustments.created_by IS 'User who created the adjustment';
COMMENT ON COLUMN adjustments.processed_by IS 'User who processed/approved the adjustment';

COMMENT ON COLUMN adjustment_items.quantity IS 'Quantity adjustment (positive for add, negative for subtract)';
COMMENT ON COLUMN adjustment_items.reason IS 'Reason for this specific item adjustment';

COMMENT ON COLUMN transfers.reference_number IS 'Unique reference number for the transfer (e.g., TRF-2024-001)';
COMMENT ON COLUMN transfers.total_quantity IS 'Total quantity of all items in the transfer';
COMMENT ON COLUMN transfers.status IS 'Current status of the transfer';
COMMENT ON COLUMN transfers.created_by IS 'User who created the transfer';
COMMENT ON COLUMN transfers.processed_by IS 'User who processed the transfer';

COMMENT ON COLUMN transfer_items.quantity IS 'Quantity to transfer (always positive)';
COMMENT ON COLUMN transfer_items.reason IS 'Reason for this specific item transfer';
