-- Sample Purchase Orders and Cancellations for Testing
-- This script creates sample purchase orders with different statuses

-- First, let's create some sample suppliers if they don't exist
INSERT INTO suppliers (id, name, email, phone, address, contact_person, created_at, updated_at)
VALUES 
    (uuid_generate_v4(), 'TechSupply Inc', 'orders@techsupply.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA', 'John Smith', NOW(), NOW()),
    (uuid_generate_v4(), 'Office Depot', 'wholesale@officedepot.com', '+1-555-0102', '456 Business Ave, New York, NY', 'Sarah Johnson', NOW(), NOW()),
    (uuid_generate_v4(), 'Global Electronics', 'sales@globalelectronics.com', '+1-555-0103', '789 Electronics Blvd, Austin, TX', 'Mike Chen', NOW(), NOW()),
    (uuid_generate_v4(), 'Furniture World', 'orders@furnitureworld.com', '+1-555-0104', '321 Furniture Lane, Chicago, IL', 'Lisa Brown', NOW(), NOW()),
    (uuid_generate_v4(), 'Stationery Plus', 'wholesale@stationeryplus.com', '+1-555-0105', '654 Paper Street, Boston, MA', 'David Wilson', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Get a sample user ID (assuming there's at least one user)
DO $$
DECLARE
    sample_user_id UUID;
    supplier_ids UUID[];
    po_counter INTEGER := 1;
    po_date DATE;
BEGIN
    -- Get the first user ID
    SELECT id INTO sample_user_id FROM users LIMIT 1;
    
    -- Get supplier IDs
    SELECT ARRAY_AGG(id) INTO supplier_ids FROM suppliers LIMIT 5;
    
    -- Create 20 sample purchase orders with different statuses
    FOR i IN 1..20 LOOP
        -- Vary the order date over the last 30 days
        po_date := CURRENT_DATE - (i * 1.5)::INTEGER;
        
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
            (RANDOM() * 10000 + 1000)::DECIMAL(12,2), -- Random amount between 1000-11000
            CASE 
                WHEN i <= 5 THEN 'pending'
                WHEN i <= 10 THEN 'approved'
                WHEN i <= 15 THEN 'received'
                WHEN i <= 18 THEN 'cancelled'  -- 3 cancelled orders
                ELSE 'pending'
            END,
            po_date,
            po_date + INTERVAL '7 days',
            CASE 
                WHEN i > 10 AND i <= 15 THEN po_date + INTERVAL '5 days'
                ELSE NULL
            END,
            CASE 
                WHEN i <= 5 THEN 'Urgent order - please expedite'
                WHEN i <= 10 THEN 'Standard order processing'
                WHEN i <= 15 THEN 'Order received and processed'
                WHEN i <= 18 THEN 'Order cancelled due to supplier issues'
                ELSE 'New order - pending approval'
            END,
            sample_user_id,
            NOW() - INTERVAL '1 day' * i,
            NOW() - INTERVAL '1 day' * i
        );
        
        po_counter := po_counter + 1;
    END LOOP;
    
    -- Create some additional cancelled orders for better testing
    FOR i IN 1..5 LOOP
        po_date := CURRENT_DATE - (i * 2)::INTEGER;
        
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
            (RANDOM() * 5000 + 500)::DECIMAL(12,2),
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
            NOW() - INTERVAL '2 days' * i,
            NOW() - INTERVAL '1 day' * i
        );
    END LOOP;
    
    RAISE NOTICE 'Created 25 sample purchase orders (20 regular + 5 cancelled)';
END $$;

-- Display summary of created purchase orders
SELECT 
    status,
    COUNT(*) as count,
    MIN(order_date) as earliest_date,
    MAX(order_date) as latest_date
FROM purchase_orders 
WHERE po_number LIKE 'PO-2024-%' OR po_number LIKE 'PO-CANCEL-%'
GROUP BY status
ORDER BY status;



