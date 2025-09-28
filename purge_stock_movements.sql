-- Purge all stock movements data
-- WARNING: This will permanently delete all stock movements and related data

-- Disable foreign key checks temporarily
SET session_replication_role = replica;

-- Delete all stock movements (this will cascade to related tables if any)
DELETE FROM stock_movements;

-- Delete all purchase orders (since they're created from stock movements)
DELETE FROM purchase_orders;

-- Delete all stock levels
DELETE FROM stock_levels;

-- Delete all adjustments and adjustment items
DELETE FROM adjustment_items;
DELETE FROM adjustments;

-- Delete all transfers and transfer items
DELETE FROM transfer_items;
DELETE FROM transfers;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;

-- Show remaining counts
SELECT 'Stock Movements' as table_name, COUNT(*) as remaining_count FROM stock_movements
UNION ALL
SELECT 'Purchase Orders', COUNT(*) FROM purchase_orders
UNION ALL
SELECT 'Stock Levels', COUNT(*) FROM stock_levels
UNION ALL
SELECT 'Adjustments', COUNT(*) FROM adjustments
UNION ALL
SELECT 'Adjustment Items', COUNT(*) FROM adjustment_items
UNION ALL
SELECT 'Transfers', COUNT(*) FROM transfers
UNION ALL
SELECT 'Transfer Items', COUNT(*) FROM transfer_items;

-- Show success message
SELECT 'All stock movements, purchase orders, stock levels, adjustments, and transfers purged successfully!' as message;
