-- Drop cancellation tracking fields from purchase_orders table

-- Drop indexes first
DROP INDEX IF EXISTS idx_purchase_orders_cancelled_by;
DROP INDEX IF EXISTS idx_purchase_orders_cancelled_at;

-- Drop columns
ALTER TABLE purchase_orders 
DROP COLUMN IF EXISTS cancelled_by,
DROP COLUMN IF EXISTS cancelled_at,
DROP COLUMN IF EXISTS cancellation_reason;
