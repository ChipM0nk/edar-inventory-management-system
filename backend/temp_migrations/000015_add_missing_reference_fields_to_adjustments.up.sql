-- Add missing reference fields to adjustments table
ALTER TABLE adjustments 
ADD COLUMN reference_type VARCHAR(20) CHECK (reference_type IN ('purchase_order', 'sales_order', 'cycle_count', 'damage', 'theft', 'expired', 'transfer', 'other')),
ADD COLUMN reference_id UUID,
ADD COLUMN adjustment_reason VARCHAR(50) CHECK (adjustment_reason IN ('receiving_discrepancy', 'damaged_goods', 'quality_issue', 'short_shipment', 'over_shipment', 'customer_return', 'defective_return', 'exchange', 'warranty_replacement', 'cycle_count_correction', 'theft_loss', 'expired_product', 'storage_damage', 'transfer_correction', 'other'));

-- Add indexes for better performance
CREATE INDEX idx_adjustments_reference_type ON adjustments(reference_type);
CREATE INDEX idx_adjustments_reference_id ON adjustments(reference_id);

-- Add comments for clarity
COMMENT ON COLUMN adjustments.reference_type IS 'Type of reference document (purchase_order, sales_order, etc.)';
COMMENT ON COLUMN adjustments.reference_id IS 'ID of the referenced document';
COMMENT ON COLUMN adjustments.adjustment_reason IS 'Specific reason for the adjustment';
