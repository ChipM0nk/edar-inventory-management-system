-- Remove warehouse_id from purchase_orders table
DROP INDEX IF EXISTS idx_purchase_orders_warehouse_id;
ALTER TABLE purchase_orders DROP COLUMN IF EXISTS warehouse_id;
