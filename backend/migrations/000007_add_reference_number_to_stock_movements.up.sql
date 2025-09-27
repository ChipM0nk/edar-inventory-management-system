-- Add reference_number field to stock_movements table
ALTER TABLE stock_movements 
ADD COLUMN reference_number VARCHAR(255);
