-- Add min_stock_level field to products table
ALTER TABLE products ADD COLUMN min_stock_level INTEGER DEFAULT 0 CHECK (min_stock_level >= 0);
