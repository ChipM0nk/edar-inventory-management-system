-- Add cancellation tracking fields to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN cancelled_by UUID REFERENCES users(id),
ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN cancellation_reason TEXT;

-- Add index for better query performance on cancelled_by
CREATE INDEX idx_purchase_orders_cancelled_by ON purchase_orders(cancelled_by) WHERE cancelled_by IS NOT NULL;

-- Add index for cancelled_at for better filtering performance
CREATE INDEX idx_purchase_orders_cancelled_at ON purchase_orders(cancelled_at) WHERE cancelled_at IS NOT NULL;
