-- Remove cost_price from products table
ALTER TABLE products DROP COLUMN IF EXISTS cost_price;

-- Add cost_price to stock_movements table
ALTER TABLE stock_movements ADD COLUMN cost_price DECIMAL(10,2);

-- Add total_amount to stock_movements table (quantity * cost_price)
ALTER TABLE stock_movements ADD COLUMN total_amount DECIMAL(10,2);

-- Create index for cost_price queries
CREATE INDEX idx_stock_movements_cost_price ON stock_movements(cost_price);

-- Create index for total_amount queries
CREATE INDEX idx_stock_movements_total_amount ON stock_movements(total_amount);

