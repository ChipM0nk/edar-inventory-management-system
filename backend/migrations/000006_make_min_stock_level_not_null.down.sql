-- Revert min_stock_level to nullable
ALTER TABLE products ALTER COLUMN min_stock_level DROP NOT NULL;
