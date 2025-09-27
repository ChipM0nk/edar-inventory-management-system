-- Fix database schema by adding missing reference_number column
-- Run this SQL script manually on your database

-- Add reference_number field to stock_movements table
ALTER TABLE stock_movements 
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(255);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'stock_movements' 
AND column_name = 'reference_number';
