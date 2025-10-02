-- Complete Sample Data Creation Script
-- This script creates purchase orders, stock movements, and stock levels
-- including cancelled orders with proper stock reversals

-- First, let's create some sample suppliers if they don't exist
INSERT INTO suppliers (id, name, email, phone, address, contact_person, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'TechSupply Inc', 'orders@techsupply.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA', 'John Smith', NOW(), NOW()),
    (uuid_generate_v4(), 'Office Depot', 'wholesale@officedepot.com', '+1-555-0102', '456 Business Ave, New York, NY', 'Sarah Johnson', NOW(), NOW()),
    (uuid_generate_v4(), 'Global Electronics', 'sales@globalelectronics.com', '+1-555-0103', '789 Electronics Blvd, Austin, TX', 'Mike Chen', NOW(), NOW()),
    (uuid_generate_v4(), 'Furniture World', 'orders@furnitureworld.com', '+1-555-0104', '321 Furniture Lane, Chicago, IL', 'Lisa Brown', NOW(), NOW()),
    (uuid_generate_v4(), 'Stationery Plus', 'wholesale@stationeryplus.com', '+1-555-0105', '654 Paper Street, Boston, MA', 'David Wilson', NOW(), NOW())
-- ON CONFLICT (email) DO NOTHING;

-- Create sample products if they don't exist
INSERT INTO products (id, sku, name, description, unit_price, min_stock_level, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'LAPTOP-001', 'Dell Laptop XPS 13', 'High-performance business laptop', 1299.99, 5, NOW(), NOW()),
    (uuid_generate_v4(), 'MOUSE-001', 'Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 20, NOW(), NOW()),
    (uuid_generate_v4(), 'KEYB-001', 'Mechanical Keyboard', 'RGB mechanical keyboard', 89.99, 15, NOW(), NOW()),
    (uuid_generate_v4(), 'MON-001', '27" Monitor', '4K Ultra HD monitor', 399.99, 8, NOW(), NOW()),
    (uuid_generate_v4(), 'DESK-001', 'Office Desk', 'Adjustable height desk', 299.99, 3, NOW(), NOW()),
    (uuid_generate_v4(), 'CHAIR-001', 'Office Chair', 'Ergonomic office chair', 199.99, 5, NOW(), NOW()),
    (uuid_generate_v4(), 'PEN-001', 'Ballpoint Pen Set', 'Set of 12 ballpoint pens', 12.99, 50, NOW(), NOW()),
    (uuid_generate_v4(), 'NOTE-001', 'Notebook Pack', 'Pack of 10 notebooks', 24.99, 30, NOW(), NOW())
-- ON CONFLICT (sku) DO NOTHING;

-- Create sample warehouses if they don't exist
INSERT INTO warehouses (id, name, location, address, contact_person, contact_phone, is_active, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'Main Warehouse', 'City Center', '123 Storage St, City Center', 'John Manager', '+1-555-1001', true, NOW(), NOW()),
    (uuid_generate_v4(), 'Secondary Warehouse', 'Industrial Zone', '456 Depot Ave, Industrial Zone', 'Jane Supervisor', '+1-555-1002', true, NOW(), NOW()),
    (uuid_generate_v4(), 'Regional Warehouse', 'Suburbs', '789 Distribution Blvd, Suburbs', 'Mike Coordinator', '+1-555-1003', true, NOW(), NOW())
-- ON CONFLICT (name) DO NOTHING;

-- Get IDs for use in the script
DO $$
DECLARE
    sample_user_id UUID;
    supplier_ids UUID[];
    product_ids UUID[];
    warehouse_ids UUID[];
    po_counter INTEGER := 1;
    po_date DATE;
    po_id UUID;
    product_id UUID;
    warehouse_id UUID;
    movement_id UUID;
    stock_level_id UUID;
    current_quantity INTEGER;
    movement_quantity INTEGER;
    cost_price DECIMAL(10,2);
BEGIN
    -- Get the first user ID
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    -- Get supplier IDs
    SELECT ARRAY_AGG(id) INTO supplier_ids FROM suppliers LIMIT 5;
    
    -- Get product IDs
    SELECT ARRAY_AGG(id) INTO product_ids FROM products LIMIT 8;
    
    -- Get warehouse IDs
    SELECT ARRAY_AGG(id) INTO warehouse_ids FROM warehouses LIMIT 3;
    
    RAISE NOTICE 'Creating sample data with user: %, suppliers: %, products: %, warehouses: %', 
        sample_user_id, array_length(supplier_ids, 1), array_length(product_ids, 1), array_length(warehouse_ids, 1);
    
    -- Create 15 sample purchase orders with stock movements
    FOR i IN 1..15 LOOP
        -- Vary the order date over the last 30 days
        po_date := CURRENT_DATE - (i * 2)::INTEGER;
        
        -- Generate random cost price (70-90% of unit price)
        cost_price := (RANDOM() * 0.2 + 0.7) * 1000; -- Random between 700-900
        
        -- Insert purchase order
        INSERT INTO purchase_orders (
            id,
            po_number,
            supplier_name,
            supplier_contact,
            total_amount,
            status,
            order_date,
            expected_delivery_date,
            received_date,
            notes,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            'PO-2024-' || LPAD(po_counter::TEXT, 4, '0'),
            CASE (i % 5) + 1
                WHEN 1 THEN 'TechSupply Inc'
                WHEN 2 THEN 'Office Depot'
                WHEN 3 THEN 'Global Electronics'
                WHEN 4 THEN 'Furniture World'
                ELSE 'Stationery Plus'
            END,
            CASE (i % 5) + 1
                WHEN 1 THEN 'orders@techsupply.com'
                WHEN 2 THEN 'wholesale@officedepot.com'
                WHEN 3 THEN 'sales@globalelectronics.com'
                WHEN 4 THEN 'orders@furnitureworld.com'
                ELSE 'wholesale@stationeryplus.com'
            END,
            cost_price * (RANDOM() * 5 + 1), -- Random quantity 1-6
            CASE 
                WHEN i <= 8 THEN 'received'  -- 8 received orders
                WHEN i <= 12 THEN 'pending'  -- 4 pending orders
                WHEN i <= 15 THEN 'cancelled' -- 3 cancelled orders
                ELSE 'pending'
            END,
            po_date,
            po_date + INTERVAL '7 days',
            CASE 
                WHEN i <= 8 THEN po_date + INTERVAL '5 days'
                ELSE NULL
            END,
            CASE 
                WHEN i <= 8 THEN 'Order received and processed successfully'
                WHEN i <= 12 THEN 'Order pending approval'
                WHEN i <= 15 THEN 'Order cancelled due to supplier issues'
                ELSE 'New order - pending approval'
            END,
            sample_user_id,
            NOW() - INTERVAL '2 days' * i,
            NOW() - INTERVAL '1 day' * i
        ) RETURNING id INTO po_id;
        
        -- Create stock movements for received orders
        IF i <= 8 THEN
            -- Select random product and warehouse
            product_id := product_ids[1 + (i % array_length(product_ids, 1))];
            warehouse_id := warehouse_ids[1 + (i % array_length(warehouse_ids, 1))];
            movement_quantity := (RANDOM() * 5 + 1)::INTEGER; -- Random quantity 1-6
            
            -- Create stock movement (in)
            INSERT INTO stock_movements (
                id,
                product_id,
                warehouse_id,
                movement_type,
                quantity,
                cost_price,
                total_amount,
                reference_type,
                reference_id,
                reference_number,
                user_id,
                processed_by,
                processed_date,
                created_at
            ) VALUES (
                uuid_generate_v4(),
                product_id,
                warehouse_id,
                'in',
                movement_quantity,
                cost_price,
                cost_price * movement_quantity,
                'purchase_order',
                po_id,
                'PO-2024-' || LPAD(po_counter::TEXT, 4, '0'),
                sample_user_id,
                sample_user_id,
                po_date + INTERVAL '5 days',
                NOW() - INTERVAL '2 days' * i
            ) RETURNING id INTO movement_id;
            
            -- Update or create stock level
            INSERT INTO stock_levels (
                id,
                product_id,
                warehouse_id,
                quantity,
                reserved_quantity,
                available_quantity,
                min_stock_level,
                last_updated,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                product_id,
                warehouse_id,
                movement_quantity,
                0,
                movement_quantity,
                5, -- Default min stock level
                NOW(),
                NOW(),
                NOW()
            ) ON CONFLICT (product_id, warehouse_id) 
            DO UPDATE SET 
                quantity = stock_levels.quantity + EXCLUDED.quantity,
                available_quantity = stock_levels.available_quantity + EXCLUDED.quantity,
                last_updated = NOW(),
                updated_at = NOW();
        END IF;
        
        po_counter := po_counter + 1;
    END LOOP;
    
    -- Create 5 additional cancelled orders with stock reversals
    FOR i IN 1..5 LOOP
        po_date := CURRENT_DATE - (i * 3)::INTEGER;
        cost_price := (RANDOM() * 0.2 + 0.7) * 1000;
        
        -- Insert cancelled purchase order
        INSERT INTO purchase_orders (
            id,
            po_number,
            supplier_name,
            supplier_contact,
            total_amount,
            status,
            order_date,
            expected_delivery_date,
            received_date,
            notes,
            created_by,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            'PO-CANCEL-' || LPAD(i::TEXT, 3, '0'),
            CASE (i % 3) + 1
                WHEN 1 THEN 'TechSupply Inc'
                WHEN 2 THEN 'Office Depot'
                ELSE 'Global Electronics'
            END,
            CASE (i % 3) + 1
                WHEN 1 THEN 'orders@techsupply.com'
                WHEN 2 THEN 'wholesale@officedepot.com'
                ELSE 'sales@globalelectronics.com'
            END,
            cost_price * (RANDOM() * 3 + 1),
            'cancelled',
            po_date,
            po_date + INTERVAL '10 days',
            NULL,
            'Order cancelled - ' || CASE i
                WHEN 1 THEN 'Supplier unable to fulfill'
                WHEN 2 THEN 'Budget constraints'
                WHEN 3 THEN 'Product discontinued'
                WHEN 4 THEN 'Quality issues'
                ELSE 'Change in requirements'
            END,
            sample_user_id,
            NOW() - INTERVAL '3 days' * i,
            NOW() - INTERVAL '1 day' * i
        ) RETURNING id INTO po_id;
        
        -- Create stock movements for cancelled orders (simulating received then cancelled)
        product_id := product_ids[1 + (i % array_length(product_ids, 1))];
        warehouse_id := warehouse_ids[1 + (i % array_length(warehouse_ids, 1))];
        movement_quantity := (RANDOM() * 3 + 1)::INTEGER; -- Random quantity 1-4
        
        -- First, create the original stock movement (in) - simulating goods received
        INSERT INTO stock_movements (
            id,
            product_id,
            warehouse_id,
            movement_type,
            quantity,
            cost_price,
            total_amount,
            reference_type,
            reference_id,
            reference_number,
            user_id,
            processed_by,
            processed_date,
            created_at
        ) VALUES (
            uuid_generate_v4(),
            product_id,
            warehouse_id,
            'in',
            movement_quantity,
            cost_price,
            cost_price * movement_quantity,
            'purchase_order',
            po_id,
            'PO-CANCEL-' || LPAD(i::TEXT, 3, '0'),
            sample_user_id,
            sample_user_id,
            po_date + INTERVAL '5 days',
            NOW() - INTERVAL '3 days' * i
        );
        
        -- Update stock level for the received goods
        INSERT INTO stock_levels (
            id,
            product_id,
            warehouse_id,
            quantity,
            reserved_quantity,
            available_quantity,
            min_stock_level,
            last_updated,
            created_at,
            updated_at
        ) VALUES (
            uuid_generate_v4(),
            product_id,
            warehouse_id,
            movement_quantity,
            0,
            movement_quantity,
            5,
            NOW(),
            NOW(),
            NOW()
        ) ON CONFLICT (product_id, warehouse_id) 
        DO UPDATE SET 
            quantity = stock_levels.quantity + EXCLUDED.quantity,
            available_quantity = stock_levels.available_quantity + EXCLUDED.quantity,
            last_updated = NOW(),
            updated_at = NOW();
        
        -- Then create the reversal stock movement (out) - simulating cancellation
        INSERT INTO stock_movements (
            id,
            product_id,
            warehouse_id,
            movement_type,
            quantity,
            cost_price,
            total_amount,
            reference_type,
            reference_id,
            reference_number,
            user_id,
            processed_by,
            processed_date,
            created_at
        ) VALUES (
            uuid_generate_v4(),
            product_id,
            warehouse_id,
            'out',
            movement_quantity,
            cost_price,
            cost_price * movement_quantity,
            'purchase_order_cancellation',
            po_id,
            'PO-CANCEL-' || LPAD(i::TEXT, 3, '0'),
            sample_user_id,
            sample_user_id,
            po_date + INTERVAL '7 days', -- Cancelled 2 days after received
            NOW() - INTERVAL '2 days' * i
        );
        
        -- Update stock level to reflect the cancellation (remove the quantity)
        UPDATE stock_levels 
        SET 
            quantity = quantity - movement_quantity,
            available_quantity = available_quantity - movement_quantity,
            last_updated = NOW(),
            updated_at = NOW()
        WHERE stock_levels.product_id = product_id AND stock_levels.warehouse_id = warehouse_id;
    END LOOP;
    
    RAISE NOTICE 'Created 20 sample purchase orders (15 regular + 5 cancelled with stock reversals)';
    RAISE NOTICE 'Created corresponding stock movements and updated stock levels';
END $$;

-- Display summary of created data
SELECT 'Purchase Orders by Status' as summary;
SELECT 
    status,
    COUNT(*) as count,
    MIN(order_date) as earliest_date,
    MAX(order_date) as latest_date
FROM purchase_orders 
WHERE po_number LIKE 'PO-2024-%' OR po_number LIKE 'PO-CANCEL-%'
GROUP BY status
ORDER BY status;

SELECT 'Stock Movements by Type' as summary;
SELECT 
    movement_type,
    COUNT(*) as count,
    SUM(quantity) as total_quantity
FROM stock_movements 
WHERE reference_number LIKE 'PO-2024-%' OR reference_number LIKE 'PO-CANCEL-%'
GROUP BY movement_type
ORDER BY movement_type;

SELECT 'Current Stock Levels' as summary;
SELECT 
    p.name as product_name,
    w.name as warehouse_name,
    sl.quantity,
    sl.available_quantity,
    sl.min_stock_level
FROM stock_levels sl
JOIN products p ON sl.product_id = p.id
JOIN warehouses w ON sl.warehouse_id = w.id
ORDER BY p.name, w.name;
