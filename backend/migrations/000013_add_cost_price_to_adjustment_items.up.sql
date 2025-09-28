-- Add cost_price column to adjustment_items table
ALTER TABLE adjustment_items 
ADD COLUMN cost_price DECIMAL(10,2) NOT NULL DEFAULT 0.00;

-- Add comment for clarity
COMMENT ON COLUMN adjustment_items.cost_price IS 'Cost price per unit for this adjustment item';
