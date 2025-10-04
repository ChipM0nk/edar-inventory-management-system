-- Normalize adjustment_items table by removing unnecessary fields
-- The table currently only has: id, adjustment_id, product_id, warehouse_id, quantity, reason, cost_price, created_at
-- No fields need to be removed as the model was incorrectly defined

-- Add missing cost_price constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_cost_price_positive'
    ) THEN
        ALTER TABLE adjustment_items 
        ADD CONSTRAINT check_cost_price_positive 
        CHECK (cost_price >= 0);
    END IF;
END $$;

-- Add comment for clarity
COMMENT ON COLUMN adjustment_items.cost_price IS 'Cost price per unit for this adjustment item (must be >= 0)';
