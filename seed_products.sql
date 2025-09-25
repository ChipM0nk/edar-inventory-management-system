-- Insert products with correct category and supplier IDs
INSERT INTO products (id, sku, name, description, category_id, supplier_id, unit_price, min_stock_level, is_active, created_at, updated_at) VALUES
-- Electronics from TechCorp
('770e8400-e29b-41d4-a716-446655440001', 'LAPTOP-001', 'Gaming Laptop', 'High-performance gaming laptop with RTX 4070, 16GB RAM, 1TB SSD', '6dbf8a2a-75fc-43a2-bb21-240f6dc3e8b1', '660e8400-e29b-41d4-a716-446655440001', 1299.99, 5, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440002', 'MOUSE-001', 'Wireless Gaming Mouse', 'High-precision wireless gaming mouse with RGB lighting', '6dbf8a2a-75fc-43a2-bb21-240f6dc3e8b1', '660e8400-e29b-41d4-a716-446655440001', 79.99, 20, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440003', 'KEYBOARD-001', 'Mechanical Keyboard', 'RGB mechanical keyboard with blue switches', '6dbf8a2a-75fc-43a2-bb21-240f6dc3e8b1', '660e8400-e29b-41d4-a716-446655440001', 149.99, 15, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440004', 'MONITOR-001', '4K Gaming Monitor', '27-inch 4K gaming monitor 144Hz refresh rate', '6dbf8a2a-75fc-43a2-bb21-240f6dc3e8b1', '660e8400-e29b-41d4-a716-446655440001', 399.99, 8, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440005', 'HEADPHONE-001', 'Gaming Headset', 'Wireless gaming headset with noise cancellation', '6dbf8a2a-75fc-43a2-bb21-240f6dc3e8b1', '660e8400-e29b-41d4-a716-446655440001', 199.99, 12, true, NOW(), NOW()),

-- Books from BookWorld Publishers
('770e8400-e29b-41d4-a716-446655440006', 'BOOK-001', 'Programming Guide', 'Complete guide to programming fundamentals', 'c46a6ce2-257b-457a-a473-84f2fcda9e49', '660e8400-e29b-41d4-a716-446655440002', 49.99, 25, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440007', 'BOOK-002', 'Database Design', 'Advanced database design principles and practices', 'c46a6ce2-257b-457a-a473-84f2fcda9e49', '660e8400-e29b-41d4-a716-446655440002', 59.99, 20, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440008', 'BOOK-003', 'Web Development', 'Modern web development with React and Node.js', 'c46a6ce2-257b-457a-a473-84f2fcda9e49', '660e8400-e29b-41d4-a716-446655440002', 69.99, 18, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440009', 'BOOK-004', 'Business Management', 'Effective business management strategies', 'c46a6ce2-257b-457a-a473-84f2fcda9e49', '660e8400-e29b-41d4-a716-446655440002', 39.99, 30, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440010', 'BOOK-005', 'Marketing Guide', 'Digital marketing for beginners', 'c46a6ce2-257b-457a-a473-84f2fcda9e49', '660e8400-e29b-41d4-a716-446655440002', 44.99, 22, true, NOW(), NOW()),

-- Clothing from Fashion Forward
('770e8400-e29b-41d4-a716-446655440011', 'SHIRT-001', 'Cotton T-Shirt', 'Comfortable cotton t-shirt in various colors', '5836facc-81db-46f0-a64e-640d28cd1ee7', '660e8400-e29b-41d4-a716-446655440003', 19.99, 50, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440012', 'JEANS-001', 'Denim Jeans', 'Classic blue denim jeans, multiple sizes', '5836facc-81db-46f0-a64e-640d28cd1ee7', '660e8400-e29b-41d4-a716-446655440003', 59.99, 30, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440013', 'JACKET-001', 'Leather Jacket', 'Genuine leather jacket with modern design', '5836facc-81db-46f0-a64e-640d28cd1ee7', '660e8400-e29b-41d4-a716-446655440003', 199.99, 10, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440014', 'SNEAKER-001', 'Running Shoes', 'Comfortable running shoes with good support', '5836facc-81db-46f0-a64e-640d28cd1ee7', '660e8400-e29b-41d4-a716-446655440003', 89.99, 25, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440015', 'HAT-001', 'Baseball Cap', 'Adjustable baseball cap with team logo', '5836facc-81db-46f0-a64e-640d28cd1ee7', '660e8400-e29b-41d4-a716-446655440003', 24.99, 40, true, NOW(), NOW()),

-- Home & Garden from Home Depot
('770e8400-e29b-41d4-a716-446655440016', 'TOOL-001', 'Hammer Set', 'Professional hammer set with multiple sizes', 'b67c640c-54c2-46a9-84d9-2792d124ec2c', '660e8400-e29b-41d4-a716-446655440004', 39.99, 15, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440017', 'DRILL-001', 'Cordless Drill', '18V cordless drill with battery and charger', 'b67c640c-54c2-46a9-84d9-2792d124ec2c', '660e8400-e29b-41d4-a716-446655440004', 129.99, 8, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440018', 'PAINT-001', 'Interior Paint', 'Premium interior wall paint, 1 gallon', 'b67c640c-54c2-46a9-84d9-2792d124ec2c', '660e8400-e29b-41d4-a716-446655440004', 45.99, 20, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440019', 'LIGHT-001', 'LED Light Bulb', 'Energy-efficient LED light bulb, 60W equivalent', 'b67c640c-54c2-46a9-84d9-2792d124ec2c', '660e8400-e29b-41d4-a716-446655440004', 12.99, 100, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440020', 'PLANT-001', 'Indoor Plant', 'Low-maintenance indoor plant for home decoration', 'b67c640c-54c2-46a9-84d9-2792d124ec2c', '660e8400-e29b-41d4-a716-446655440004', 29.99, 35, true, NOW(), NOW()),

-- Sports from Sports Central
('770e8400-e29b-41d4-a716-446655440021', 'BALL-001', 'Soccer Ball', 'Professional soccer ball, size 5', '7dc1f7df-049d-44e4-8f61-a7bade502371', '660e8400-e29b-41d4-a716-446655440005', 29.99, 20, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440022', 'BASKETBALL-001', 'Basketball', 'Official size basketball for indoor/outdoor use', '7dc1f7df-049d-44e4-8f61-a7bade502371', '660e8400-e29b-41d4-a716-446655440005', 34.99, 15, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440023', 'TENNIS-001', 'Tennis Racket', 'Professional tennis racket with case', '7dc1f7df-049d-44e4-8f61-a7bade502371', '660e8400-e29b-41d4-a716-446655440005', 149.99, 8, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440024', 'GYM-001', 'Dumbbell Set', 'Adjustable dumbbell set, 5-50 lbs', '7dc1f7df-049d-44e4-8f61-a7bade502371', '660e8400-e29b-41d4-a716-446655440005', 199.99, 5, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440025', 'YOGA-001', 'Yoga Mat', 'Non-slip yoga mat with carrying strap', '7dc1f7df-049d-44e4-8f61-a7bade502371', '660e8400-e29b-41d4-a716-446655440005', 39.99, 25, true, NOW(), NOW()),

-- Automotive from AutoParts Plus
('770e8400-e29b-41d4-a716-446655440026', 'OIL-001', 'Motor Oil', '5W-30 synthetic motor oil, 5 quart', '84c74370-5435-45ce-814b-da9184f0c08b', '660e8400-e29b-41d4-a716-446655440006', 24.99, 30, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440027', 'FILTER-001', 'Air Filter', 'High-performance air filter for most vehicles', '84c74370-5435-45ce-814b-da9184f0c08b', '660e8400-e29b-41d4-a716-446655440006', 19.99, 40, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440028', 'BRAKE-001', 'Brake Pads', 'Ceramic brake pads, front set', '84c74370-5435-45ce-814b-da9184f0c08b', '660e8400-e29b-41d4-a716-446655440006', 89.99, 12, true, NOW(), NOW()),

-- Health & Beauty from Beauty Supply Co
('770e8400-e29b-41d4-a716-446655440029', 'SHAMPOO-001', 'Shampoo', 'Natural ingredients shampoo, 16 oz', '439e5c96-6726-4227-a24a-ec125314c090', '660e8400-e29b-41d4-a716-446655440007', 12.99, 50, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440030', 'LOTION-001', 'Body Lotion', 'Moisturizing body lotion with vitamin E', '439e5c96-6726-4227-a24a-ec125314c090', '660e8400-e29b-41d4-a716-446655440007', 8.99, 60, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440031', 'VITAMIN-001', 'Multivitamin', 'Daily multivitamin supplement, 60 tablets', '439e5c96-6726-4227-a24a-ec125314c090', '660e8400-e29b-41d4-a716-446655440007', 15.99, 40, true, NOW(), NOW()),

-- Office Supplies from OfficeMax Solutions
('770e8400-e29b-41d4-a716-446655440032', 'PEN-001', 'Ballpoint Pen', 'Blue ink ballpoint pen, pack of 12', 'c46a6ce2-257b-457a-a473-84f2fcda9e49', '660e8400-e29b-41d4-a716-446655440008', 4.99, 100, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440033', 'PAPER-001', 'Copy Paper', 'White copy paper, 8.5x11, 500 sheets', 'c46a6ce2-257b-457a-a473-84f2fcda9e49', '660e8400-e29b-41d4-a716-446655440008', 6.99, 50, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440034', 'STAPLER-001', 'Desktop Stapler', 'Heavy-duty desktop stapler with staples', 'c46a6ce2-257b-457a-a473-84f2fcda9e49', '660e8400-e29b-41d4-a716-446655440008', 12.99, 25, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440035', 'FOLDER-001', 'File Folder', 'Manila file folders, pack of 25', 'c46a6ce2-257b-457a-a473-84f2fcda9e49', '660e8400-e29b-41d4-a716-446655440008', 9.99, 40, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
