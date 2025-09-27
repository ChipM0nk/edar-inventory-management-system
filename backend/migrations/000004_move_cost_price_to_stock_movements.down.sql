-- Add cost_price back to products table
ALTER TABLE products ADD COLUMN cost_price DECIMAL(10,2);

-- Remove cost_price and total_amount from stock_movements table
DROP INDEX IF EXISTS idx_stock_movements_total_amount;
DROP INDEX IF EXISTS idx_stock_movements_cost_price;
ALTER TABLE stock_movements DROP COLUMN IF EXISTS total_amount;
ALTER TABLE stock_movements DROP COLUMN IF EXISTS cost_price;






