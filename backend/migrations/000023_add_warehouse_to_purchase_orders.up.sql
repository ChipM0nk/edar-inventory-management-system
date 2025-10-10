-- Add warehouse_id to purchase_orders table
ALTER TABLE purchase_orders 
ADD COLUMN warehouse_id UUID REFERENCES warehouses(id);

-- Add index for better performance
CREATE INDEX idx_purchase_orders_warehouse_id ON purchase_orders(warehouse_id);
