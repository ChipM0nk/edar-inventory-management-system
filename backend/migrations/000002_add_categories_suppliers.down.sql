-- Remove triggers
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;

-- Remove indexes
DROP INDEX IF EXISTS idx_products_supplier;
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_suppliers_email;
DROP INDEX IF EXISTS idx_suppliers_name;
DROP INDEX IF EXISTS idx_categories_name;

-- Remove foreign key columns from products
ALTER TABLE products DROP COLUMN IF EXISTS supplier_id;
ALTER TABLE products DROP COLUMN IF EXISTS category_id;

-- Drop tables
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS categories;


