-- Change default status from 'pending' to 'received' for purchase_orders table
ALTER TABLE purchase_orders 
ALTER COLUMN status SET DEFAULT 'received';

-- Update the check constraint to include 'received' instead of 'pending'
ALTER TABLE purchase_orders 
DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE purchase_orders 
ADD CONSTRAINT purchase_orders_status_check 
CHECK (status IN ('received', 'cancelled'));
