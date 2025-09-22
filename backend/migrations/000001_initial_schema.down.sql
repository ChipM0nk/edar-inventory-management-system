-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
DROP TRIGGER IF EXISTS update_stock_levels_updated_at ON stock_levels;
DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
DROP TRIGGER IF EXISTS update_purchase_order_items_updated_at ON purchase_order_items;
DROP TRIGGER IF EXISTS update_sales_orders_updated_at ON sales_orders;
DROP TRIGGER IF EXISTS update_sales_order_items_updated_at ON sales_order_items;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop indexes
DROP INDEX IF EXISTS idx_stock_levels_product_warehouse;
DROP INDEX IF EXISTS idx_stock_movements_product_warehouse;
DROP INDEX IF EXISTS idx_stock_movements_created_at;
DROP INDEX IF EXISTS idx_purchase_orders_status;
DROP INDEX IF EXISTS idx_sales_orders_status;
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_products_sku;
DROP INDEX IF EXISTS idx_products_name;

-- Drop tables in reverse order
DROP TABLE IF EXISTS sales_order_items;
DROP TABLE IF EXISTS sales_orders;
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS stock_movements;
DROP TABLE IF EXISTS stock_levels;
DROP TABLE IF EXISTS warehouses;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

