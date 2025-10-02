-- Simple script to create sample purchase orders
-- This script creates purchase orders with different statuses

-- Get a sample user ID (assuming there's at least one user)
DO $$
DECLARE
    sample_user_id UUID;
    po_counter INTEGER := 1;
    po_date DATE;
    cost_price DECIMAL(10,2);
BEGIN
    -- Get the first user ID
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    RAISE NOTICE 'Creating sample purchase orders with user: %', sample_user_id;
    
    -- Create 15 sample purchase orders
    FOR i IN 1..15 LOOP
        -- Vary the order date over the last 30 days
        po_date := CURRENT_DATE - (i * 2)::INTEGER;
        
        -- Generate random cost price
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
        );
        
        po_counter := po_counter + 1;
    END LOOP;
    
    -- Create 5 additional cancelled orders
    FOR i IN 1..5 LOOP
        po_date := CURRENT_DATE - (i * 3)::INTEGER;
        cost_price := (RANDOM() * 0.2 + 0.7) * 1000;
        
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
        );
    END LOOP;
    
    RAISE NOTICE 'Created 20 sample purchase orders (15 regular + 5 cancelled)';
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

-- Show some sample purchase orders
SELECT 'Sample Purchase Orders' as summary;
SELECT 
    po_number,
    supplier_name,
    status,
    total_amount,
    order_date
FROM purchase_orders 
WHERE po_number LIKE 'PO-2024-%' OR po_number LIKE 'PO-CANCEL-%'
ORDER BY order_date DESC
LIMIT 10;


