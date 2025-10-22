-- Simple script to create sample purchase orders with stock movements
-- This script creates purchase orders with different statuses and proper stock movements

-- Get a sample user ID (assuming there's at least one user)
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
    
    -- Create 12 sample purchase orders with stock movements
    FOR i IN 1..12 LOOP
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
                WHEN i <= 6 THEN 'received'  -- 6 received orders
                WHEN i <= 9 THEN 'pending'   -- 3 pending orders
                WHEN i <= 12 THEN 'cancelled' -- 3 cancelled orders
                ELSE 'pending'
            END,
            po_date,
            po_date + INTERVAL '7 days',
            CASE 
                WHEN i <= 6 THEN po_date + INTERVAL '5 days'
                ELSE NULL
            END,
            CASE 
                WHEN i <= 6 THEN 'Order received and processed successfully'
                WHEN i <= 9 THEN 'Order pending approval'
                WHEN i <= 12 THEN 'Order cancelled due to supplier issues'
                ELSE 'New order - pending approval'
            END,
            sample_user_id,
            NOW() - INTERVAL '2 days' * i,
            NOW() - INTERVAL '1 day' * i
        ) RETURNING id INTO po_id;
        
        -- Create stock movements for received orders
        IF i <= 6 THEN
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
            );
            
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
    
    -- Create 3 additional cancelled orders with stock reversals
    FOR i IN 1..3 LOOP
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
                ELSE 'Product discontinued'
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
    
    RAISE NOTICE 'Created 15 sample purchase orders (12 regular + 3 cancelled with stock reversals)';
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














