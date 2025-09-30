-- Recreate adjustments and adjustment_items tables with reference fields
-- This migration ensures the schema matches what SQLC expects

-- Drop existing tables (they will be recreated)
DROP TABLE IF EXISTS adjustment_items CASCADE;
DROP TABLE IF EXISTS adjustments CASCADE;

-- Recreate adjustments table with reference fields
CREATE TABLE adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(50) NOT NULL UNIQUE,
    adjustment_date DATE NOT NULL,
    total_quantity INTEGER NOT NULL DEFAULT 0,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'completed', 'cancelled')),
    created_by UUID NOT NULL REFERENCES users(id),
    processed_by UUID REFERENCES users(id),
    processed_date TIMESTAMPTZ,
    notes TEXT,
    reference_type VARCHAR(20) CHECK (reference_type IN ('purchase_order', 'sales_order', 'cycle_count', 'damage', 'theft', 'expired', 'transfer', 'other')),
    reference_id UUID,
    adjustment_reason VARCHAR(50) CHECK (adjustment_reason IN ('receiving_discrepancy', 'damaged_goods', 'quality_issue', 'short_shipment', 'over_shipment', 'customer_return', 'defective_return', 'exchange', 'warranty_replacement', 'cycle_count_correction', 'theft_loss', 'expired_product', 'storage_damage', 'transfer_correction', 'other')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recreate adjustment_items table with reference fields
CREATE TABLE adjustment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    adjustment_id UUID NOT NULL REFERENCES adjustments(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    cost_price NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    reason TEXT,
    reference_type VARCHAR(20) CHECK (reference_type IN ('purchase_order', 'sales_order', 'cycle_count', 'damage', 'theft', 'expired', 'transfer', 'other')),
    reference_id UUID,
    reference_number VARCHAR(100),
    adjustment_reason VARCHAR(50) CHECK (adjustment_reason IN ('receiving_discrepancy', 'damaged_goods', 'quality_issue', 'short_shipment', 'over_shipment', 'customer_return', 'defective_return', 'exchange', 'warranty_replacement', 'cycle_count_correction', 'theft_loss', 'expired_product', 'storage_damage', 'transfer_correction', 'other')),
    expected_quantity INTEGER,
    actual_quantity INTEGER,
    variance_quantity INTEGER GENERATED ALWAYS AS (actual_quantity - expected_quantity) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_adjustments_created_by ON adjustments(created_by);
CREATE INDEX idx_adjustments_processed_by ON adjustments(processed_by);
CREATE INDEX idx_adjustments_date ON adjustments(adjustment_date);
CREATE INDEX idx_adjustments_status ON adjustments(status);
CREATE INDEX idx_adjustments_reference_number ON adjustments(reference_number);
CREATE INDEX idx_adjustments_reference_type ON adjustments(reference_type);
CREATE INDEX idx_adjustments_reference_id ON adjustments(reference_id);

CREATE INDEX idx_adjustment_items_adjustment_id ON adjustment_items(adjustment_id);
CREATE INDEX idx_adjustment_items_product_id ON adjustment_items(product_id);
CREATE INDEX idx_adjustment_items_warehouse_id ON adjustment_items(warehouse_id);
CREATE INDEX idx_adjustment_items_reference_type ON adjustment_items(reference_type);
CREATE INDEX idx_adjustment_items_reference_id ON adjustment_items(reference_id);
CREATE INDEX idx_adjustment_items_adjustment_reason ON adjustment_items(adjustment_reason);


