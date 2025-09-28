-- Revert default status back to 'pending' for purchase_orders table
ALTER TABLE purchase_orders 
ALTER COLUMN status SET DEFAULT 'pending';

-- Update the check constraint to include 'pending' instead of 'received'
ALTER TABLE purchase_orders 
DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE purchase_orders 
ADD CONSTRAINT purchase_orders_status_check 
CHECK (status IN ('pending', 'approved', 'received', 'cancelled'));
