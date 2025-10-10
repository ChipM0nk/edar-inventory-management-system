-- Cleanup script to remove sample data
-- This script removes all sample purchase orders and related data

-- Delete stock movements related to sample purchase orders
DELETE FROM stock_movements 
WHERE reference_number LIKE 'PO-2024-%' 
   OR reference_number LIKE 'PO-CANCEL-%';

-- Delete purchase orders
DELETE FROM purchase_orders 
WHERE po_number LIKE 'PO-2024-%' 
   OR po_number LIKE 'PO-CANCEL-%';

-- Reset stock levels to 0 for all products (optional - you might want to keep existing stock)
-- UPDATE stock_levels SET quantity = 0, available_quantity = 0;

-- Show cleanup results
SELECT 'Cleanup completed' as status;
SELECT 'Remaining purchase orders' as summary;
SELECT COUNT(*) as count FROM purchase_orders;
SELECT 'Remaining stock movements' as summary;
SELECT COUNT(*) as count FROM stock_movements;










