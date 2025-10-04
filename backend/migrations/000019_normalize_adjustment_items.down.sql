-- Rollback normalization of adjustment_items table
-- Remove the cost_price constraint
ALTER TABLE adjustment_items 
DROP CONSTRAINT IF EXISTS check_cost_price_positive;
