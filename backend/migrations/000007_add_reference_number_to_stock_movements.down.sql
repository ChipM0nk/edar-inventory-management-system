-- Remove reference_number field from stock_movements table
ALTER TABLE stock_movements 
DROP COLUMN reference_number;
