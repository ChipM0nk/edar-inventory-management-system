-- PURGE ALL INVENTORY DATA
-- WARNING: This will permanently delete ALL inventory data including:
-- - Stock movements
-- - Purchase orders
-- - Sales orders (if any)
-- - Stock levels
-- - Product stock history

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Delete all stock movements
DELETE FROM stock_movements;

-- Delete all purchase orders
DELETE FROM purchase_orders;

-- Delete all sales orders (if any exist)
DELETE FROM sales_orders;

-- Delete all stock levels
DELETE FROM stock_levels;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Show remaining counts
SELECT 'Stock Movements' as table_name, COUNT(*) as remaining_count FROM stock_movements
UNION ALL
SELECT 'Purchase Orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'Sales Orders', COUNT(*) FROM sales_orders
UNION ALL
SELECT 'Stock Levels', COUNT(*) FROM stock_levels;

-- Show success message
SELECT 'All inventory data purged successfully!' as message;
