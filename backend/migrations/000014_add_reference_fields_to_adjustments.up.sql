-- Add reference fields to adjustments table for better tracking
ALTER TABLE adjustments 
ADD COLUMN reference_type VARCHAR(20) CHECK (reference_type IN ('purchase_order', 'sales_order', 'cycle_count', 'damage', 'theft', 'expired', 'transfer', 'other')),
ADD COLUMN reference_id UUID,
ADD COLUMN reference_number VARCHAR(100),
ADD COLUMN adjustment_reason VARCHAR(50) CHECK (adjustment_reason IN ('receiving_discrepancy', 'damaged_goods', 'quality_issue', 'short_shipment', 'over_shipment', 'customer_return', 'defective_return', 'exchange', 'warranty_replacement', 'cycle_count_correction', 'theft_loss', 'expired_product', 'storage_damage', 'transfer_correction', 'other')),
ADD COLUMN approval_required BOOLEAN DEFAULT false,
ADD COLUMN approved_by UUID REFERENCES users(id),
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approval_notes TEXT;

-- Add indexes for better performance
CREATE INDEX idx_adjustments_reference_type ON adjustments(reference_type);
CREATE INDEX idx_adjustments_reference_id ON adjustments(reference_id);
CREATE INDEX idx_adjustments_approval_required ON adjustments(approval_required);
CREATE INDEX idx_adjustments_approved_by ON adjustments(approved_by);

-- Add comments for clarity
COMMENT ON COLUMN adjustments.reference_type IS 'Type of reference document (purchase_order, sales_order, etc.)';
COMMENT ON COLUMN adjustments.reference_id IS 'ID of the referenced document';
COMMENT ON COLUMN adjustments.reference_number IS 'Reference number of the document (PO number, SO number, etc.)';
COMMENT ON COLUMN adjustments.adjustment_reason IS 'Specific reason for the adjustment';
COMMENT ON COLUMN adjustments.approval_required IS 'Whether this adjustment requires approval';
COMMENT ON COLUMN adjustments.approved_by IS 'User who approved the adjustment';
COMMENT ON COLUMN adjustments.approved_at IS 'When the adjustment was approved';
COMMENT ON COLUMN adjustments.approval_notes IS 'Notes from the approver';

-- Add reference fields to adjustment_items for item-level tracking
ALTER TABLE adjustment_items 
ADD COLUMN reference_type VARCHAR(20) CHECK (reference_type IN ('purchase_order', 'sales_order', 'cycle_count', 'damage', 'theft', 'expired', 'transfer', 'other')),
ADD COLUMN reference_id UUID,
ADD COLUMN reference_number VARCHAR(100),
ADD COLUMN adjustment_reason VARCHAR(50) CHECK (adjustment_reason IN ('receiving_discrepancy', 'damaged_goods', 'quality_issue', 'short_shipment', 'over_shipment', 'customer_return', 'defective_return', 'exchange', 'warranty_replacement', 'cycle_count_correction', 'theft_loss', 'expired_product', 'storage_damage', 'transfer_correction', 'other')),
ADD COLUMN expected_quantity INTEGER,
ADD COLUMN actual_quantity INTEGER,
ADD COLUMN variance_quantity INTEGER GENERATED ALWAYS AS (actual_quantity - expected_quantity) STORED;

-- Add indexes for adjustment_items
CREATE INDEX idx_adjustment_items_reference_type ON adjustment_items(reference_type);
CREATE INDEX idx_adjustment_items_reference_id ON adjustment_items(reference_id);
CREATE INDEX idx_adjustment_items_adjustment_reason ON adjustment_items(adjustment_reason);

-- Add comments for adjustment_items
COMMENT ON COLUMN adjustment_items.reference_type IS 'Type of reference document for this item';
COMMENT ON COLUMN adjustment_items.reference_id IS 'ID of the referenced document for this item';
COMMENT ON COLUMN adjustment_items.reference_number IS 'Reference number for this item';
COMMENT ON COLUMN adjustment_items.adjustment_reason IS 'Specific reason for this item adjustment';
COMMENT ON COLUMN adjustment_items.expected_quantity IS 'Expected quantity (from PO/SO)';
COMMENT ON COLUMN adjustment_items.actual_quantity IS 'Actual quantity found/received';
COMMENT ON COLUMN adjustment_items.variance_quantity IS 'Calculated variance (actual - expected)';
