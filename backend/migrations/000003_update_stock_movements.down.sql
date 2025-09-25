-- Remove processed_by and processed_date from stock_movements table
DROP INDEX IF EXISTS idx_stock_movements_processed_date;
DROP INDEX IF EXISTS idx_stock_movements_processed_by;

ALTER TABLE stock_movements
DROP COLUMN IF EXISTS processed_date,
DROP COLUMN IF EXISTS processed_by;



