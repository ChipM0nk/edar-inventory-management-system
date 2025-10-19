-- Create complete sample data with purchase orders AND their items
-- This script creates purchase orders with proper items in purchase_order_items table

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
    current_product_id UUID;
    current_warehouse_id UUID;
    movement_quantity INTEGER;
    cost_price DECIMAL(10,2);
    current_stock INTEGER;
    i INTEGER;
    j INTEGER;
    item_quantity INTEGER;
    item_unit_price DECIMAL(10,2);
    item_total_price DECIMAL(10,2);
    po_total_amount DECIMAL(10,2);
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
    
    -- Create 15 sample purchase orders - ALL AS RECEIVED
    FOR i IN 1..15 LOOP
        -- Vary the order date over the last 30 days
        po_date := CURRENT_DATE - (i * 2)::INTEGER;
        
        -- Initialize total amount
        po_total_amount := 0;
        
        -- Insert purchase order - ALL AS RECEIVED
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
            0, -- Will be updated after items are added
            'received', -- ALL AS RECEIVED
            po_date,
            po_date + INTERVAL '7 days',
            po_date + INTERVAL '5 days', -- All have received dates
            'Order received and processed successfully',
            sample_user_id,
            NOW() - INTERVAL '2 days' * i,
            NOW() - INTERVAL '1 day' * i
        ) RETURNING id INTO po_id;
        
        -- Add 2-4 items per purchase order
        FOR j IN 1..(2 + (i % 3)) LOOP
            -- Select random product and warehouse
            current_product_id := product_ids[1 + ((i + j) % array_length(product_ids, 1))];
            current_warehouse_id := warehouse_ids[1 + ((i + j) % array_length(warehouse_ids, 1))];
            
            -- Generate item details
            item_quantity := (RANDOM() * 5 + 1)::INTEGER; -- Random quantity 1-6
            item_unit_price := (RANDOM() * 0.2 + 0.7) * 1000; -- Random price 700-900
            item_total_price := item_quantity * item_unit_price;
            po_total_amount := po_total_amount + item_total_price;
            
            -- Insert purchase order item
            INSERT INTO purchase_order_items (
                id,
                purchase_order_id,
                product_id,
                quantity,
                unit_price,
                total_price,
                received_quantity,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                po_id,
                current_product_id,
                item_quantity,
                item_unit_price,
                item_total_price,
                item_quantity, -- All items are fully received
                NOW() - INTERVAL '2 days' * i,
                NOW() - INTERVAL '1 day' * i
            );
            
            -- Create stock movement (in) for this item
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
                current_product_id,
                current_warehouse_id,
                'in',
                item_quantity,
                item_unit_price,
                item_total_price,
                'purchase_order',
                po_id,
                'PO-2024-' || LPAD(po_counter::TEXT, 4, '0'),
                sample_user_id,
                sample_user_id,
                po_date + INTERVAL '5 days',
                NOW() - INTERVAL '2 days' * i
            );
            
            -- Update or create stock level
            SELECT quantity INTO current_stock 
            FROM stock_levels 
            WHERE product_id = current_product_id AND warehouse_id = current_warehouse_id;
            
            IF current_stock IS NULL THEN
                -- Create new stock level
                INSERT INTO stock_levels (
                    id,
                    product_id,
                    warehouse_id,
                    quantity,
                    reserved_quantity,
                    min_stock_level,
                    last_updated,
                    created_at,
                    updated_at
                ) VALUES (
                    uuid_generate_v4(),
                    current_product_id,
                    current_warehouse_id,
                    item_quantity,
                    0,
                    5, -- Default min stock level
                    NOW(),
                    NOW(),
                    NOW()
                );
            ELSE
                -- Update existing stock level
                UPDATE stock_levels 
                SET 
                    quantity = quantity + item_quantity,
                    last_updated = NOW(),
                    updated_at = NOW()
                WHERE product_id = current_product_id AND warehouse_id = current_warehouse_id;
            END IF;
        END LOOP;
        
        -- Update the purchase order total amount
        UPDATE purchase_orders 
        SET total_amount = po_total_amount
        WHERE id = po_id;
        
        po_counter := po_counter + 1;
    END LOOP;
    
    -- Create 5 additional cancelled orders (these will be filtered out from adjustments)
    FOR i IN 1..5 LOOP
        po_date := CURRENT_DATE - (i * 3)::INTEGER;
        po_total_amount := 0;
        
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
            0, -- Will be updated after items are added
            'cancelled', -- These are cancelled
            po_date,
            po_date + INTERVAL '10 days',
            NULL, -- No received date for cancelled orders
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
        
        -- Add 1-2 items per cancelled purchase order (but no stock movements)
        FOR j IN 1..(1 + (i % 2)) LOOP
            current_product_id := product_ids[1 + ((i + j) % array_length(product_ids, 1))];
            
            item_quantity := (RANDOM() * 3 + 1)::INTEGER; -- Random quantity 1-4
            item_unit_price := (RANDOM() * 0.2 + 0.7) * 1000; -- Random price 700-900
            item_total_price := item_quantity * item_unit_price;
            po_total_amount := po_total_amount + item_total_price;
            
            -- Insert purchase order item (but no stock movements for cancelled orders)
            INSERT INTO purchase_order_items (
                id,
                purchase_order_id,
                product_id,
                quantity,
                unit_price,
                total_price,
                received_quantity, -- 0 for cancelled orders
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                po_id,
                current_product_id,
                item_quantity,
                item_unit_price,
                item_total_price,
                0, -- No received quantity for cancelled orders
                NOW() - INTERVAL '3 days' * i,
                NOW() - INTERVAL '1 day' * i
            );
        END LOOP;
        
        -- Update the cancelled purchase order total amount
        UPDATE purchase_orders 
        SET total_amount = po_total_amount
        WHERE id = po_id;
    END LOOP;
    
    RAISE NOTICE 'Created 20 sample purchase orders (15 received + 5 cancelled) with items';
    RAISE NOTICE 'Created stock movements and updated stock levels for all received orders';
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

SELECT 'Purchase Order Items by Status' as summary;
SELECT 
    po.status,
    COUNT(poi.id) as item_count,
    SUM(poi.quantity) as total_quantity,
    SUM(poi.total_price) as total_value
FROM purchase_orders po
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE po.po_number LIKE 'PO-2024-%' OR po.po_number LIKE 'PO-CANCEL-%'
GROUP BY po.status
ORDER BY po.status;

SELECT 'Stock Movements by Type' as summary;
SELECT 
    movement_type,
    COUNT(*) as count,
    SUM(quantity) as total_quantity
FROM stock_movements 
WHERE reference_number LIKE 'PO-2024-%' OR reference_number LIKE 'PO-CANCEL-%'
GROUP BY movement_type
ORDER BY movement_type;

-- Show some sample purchase orders with their items
SELECT 'Sample Purchase Orders with Items' as summary;
SELECT 
    po.po_number,
    po.supplier_name,
    po.status,
    po.total_amount,
    COUNT(poi.id) as item_count,
    SUM(poi.quantity) as total_quantity
FROM purchase_orders po
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
WHERE po.po_number LIKE 'PO-2024-%' OR po.po_number LIKE 'PO-CANCEL-%'
GROUP BY po.id, po.po_number, po.supplier_name, po.status, po.total_amount
ORDER BY po.order_date DESC
LIMIT 10;












