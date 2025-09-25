-- Seed data for EDAR Inventory Management System
-- This file contains sample data for categories, suppliers, warehouses, and products

-- Insert categories
INSERT INTO categories (id, name, description, is_active, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Electronics', 'Electronic devices and components', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Books', 'Books and educational materials', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Clothing', 'Apparel and accessories', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Home & Garden', 'Home improvement and garden supplies', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Sports', 'Sports equipment and gear', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'Automotive', 'Car parts and automotive accessories', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'Health & Beauty', 'Health and beauty products', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440008', 'Office Supplies', 'Office equipment and supplies', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert suppliers
INSERT INTO suppliers (id, name, contact_person, email, phone, address, city, state, country, postal_code, is_active, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'TechCorp Electronics', 'John Smith', 'john@techcorp.com', '+1-555-0101', '123 Tech Street', 'San Francisco', 'CA', 'USA', '94105', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'BookWorld Publishers', 'Jane Doe', 'jane@bookworld.com', '+1-555-0102', '456 Book Avenue', 'New York', 'NY', 'USA', '10001', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'Fashion Forward', 'Mike Johnson', 'mike@fashion.com', '+1-555-0103', '789 Style Blvd', 'Los Angeles', 'CA', 'USA', '90210', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'Home Depot', 'Sarah Wilson', 'sarah@homedepot.com', '+1-555-0104', '321 Hardware Lane', 'Atlanta', 'GA', 'USA', '30309', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'Sports Central', 'Tom Brown', 'tom@sports.com', '+1-555-0105', '654 Athletic Way', 'Chicago', 'IL', 'USA', '60601', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440006', 'AutoParts Plus', 'Lisa Davis', 'lisa@autoparts.com', '+1-555-0106', '987 Car Street', 'Detroit', 'MI', 'USA', '48201', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440007', 'Beauty Supply Co', 'Emma White', 'emma@beauty.com', '+1-555-0107', '147 Beauty Blvd', 'Miami', 'FL', 'USA', '33101', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440008', 'OfficeMax Solutions', 'David Lee', 'david@officemax.com', '+1-555-0108', '258 Office Plaza', 'Seattle', 'WA', 'USA', '98101', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert warehouses
INSERT INTO warehouses (id, name, location, address, contact_person, contact_phone, is_active, created_at, updated_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Main Warehouse', 'San Francisco, CA', '123 Storage Street, San Francisco, CA 94105', 'Robert Manager', '+1-555-1001', true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440002', 'Secondary Warehouse', 'Los Angeles, CA', '456 Depot Road, Los Angeles, CA 90210', 'Maria Supervisor', '+1-555-1002', true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440003', 'East Coast Distribution', 'New York, NY', '789 Distribution Ave, New York, NY 10001', 'James Coordinator', '+1-555-1003', true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440004', 'Central Hub', 'Chicago, IL', '321 Central Blvd, Chicago, IL 60601', 'Jennifer Lead', '+1-555-1004', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert products
INSERT INTO products (id, sku, name, description, category_id, supplier_id, unit_price, min_stock_level, is_active, created_at, updated_at) VALUES
-- Electronics from TechCorp
('770e8400-e29b-41d4-a716-446655440001', 'LAPTOP-001', 'Gaming Laptop', 'High-performance gaming laptop with RTX 4070, 16GB RAM, 1TB SSD', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 1299.99, 5, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440002', 'MOUSE-001', 'Wireless Gaming Mouse', 'High-precision wireless gaming mouse with RGB lighting', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 79.99, 20, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440003', 'KEYBOARD-001', 'Mechanical Keyboard', 'RGB mechanical keyboard with blue switches', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 149.99, 15, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440004', 'MONITOR-001', '4K Gaming Monitor', '27-inch 4K gaming monitor 144Hz refresh rate', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 399.99, 8, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440005', 'HEADPHONE-001', 'Gaming Headset', 'Wireless gaming headset with noise cancellation', '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 199.99, 12, true, NOW(), NOW()),

-- Books from BookWorld
('770e8400-e29b-41d4-a716-446655440006', 'BOOK-001', 'Programming Guide', 'Complete guide to programming fundamentals', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 49.99, 25, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440007', 'BOOK-002', 'Database Design', 'Advanced database design principles and practices', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 59.99, 20, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440008', 'BOOK-003', 'Web Development', 'Modern web development with React and Node.js', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 69.99, 18, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440009', 'BOOK-004', 'Business Management', 'Effective business management strategies', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 39.99, 30, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440010', 'BOOK-005', 'Marketing Guide', 'Digital marketing for beginners', '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 44.99, 22, true, NOW(), NOW()),

-- Clothing from Fashion Forward
('770e8400-e29b-41d4-a716-446655440011', 'SHIRT-001', 'Cotton T-Shirt', 'Comfortable cotton t-shirt in various colors', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 19.99, 50, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440012', 'JEANS-001', 'Denim Jeans', 'Classic blue denim jeans, multiple sizes', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 59.99, 30, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440013', 'JACKET-001', 'Leather Jacket', 'Genuine leather jacket with modern design', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 199.99, 10, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440014', 'SNEAKER-001', 'Running Shoes', 'Comfortable running shoes with good support', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 89.99, 25, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440015', 'HAT-001', 'Baseball Cap', 'Adjustable baseball cap with team logo', '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 24.99, 40, true, NOW(), NOW()),

-- Home & Garden from Home Depot
('770e8400-e29b-41d4-a716-446655440016', 'TOOL-001', 'Hammer Set', 'Professional hammer set with multiple sizes', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 39.99, 15, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440017', 'DRILL-001', 'Cordless Drill', '18V cordless drill with battery and charger', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 129.99, 8, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440018', 'PAINT-001', 'Interior Paint', 'Premium interior wall paint, 1 gallon', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 45.99, 20, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440019', 'LIGHT-001', 'LED Light Bulb', 'Energy-efficient LED light bulb, 60W equivalent', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 12.99, 100, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440020', 'PLANT-001', 'Indoor Plant', 'Low-maintenance indoor plant for home decoration', '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', 29.99, 35, true, NOW(), NOW()),

-- Sports from Sports Central
('770e8400-e29b-41d4-a716-446655440021', 'BALL-001', 'Soccer Ball', 'Professional soccer ball, size 5', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 29.99, 20, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440022', 'BASKETBALL-001', 'Basketball', 'Official size basketball for indoor/outdoor use', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 34.99, 15, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440023', 'TENNIS-001', 'Tennis Racket', 'Professional tennis racket with case', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 149.99, 8, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440024', 'GYM-001', 'Dumbbell Set', 'Adjustable dumbbell set, 5-50 lbs', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 199.99, 5, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440025', 'YOGA-001', 'Yoga Mat', 'Non-slip yoga mat with carrying strap', '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', 39.99, 25, true, NOW(), NOW()),

-- Automotive from AutoParts Plus
('770e8400-e29b-41d4-a716-446655440026', 'OIL-001', 'Motor Oil', '5W-30 synthetic motor oil, 5 quart', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 24.99, 30, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440027', 'FILTER-001', 'Air Filter', 'High-performance air filter for most vehicles', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 19.99, 40, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440028', 'BRAKE-001', 'Brake Pads', 'Ceramic brake pads, front set', '550e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440006', 89.99, 12, true, NOW(), NOW()),

-- Health & Beauty from Beauty Supply Co
('770e8400-e29b-41d4-a716-446655440029', 'SHAMPOO-001', 'Shampoo', 'Natural ingredients shampoo, 16 oz', '550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', 12.99, 50, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440030', 'LOTION-001', 'Body Lotion', 'Moisturizing body lotion with vitamin E', '550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', 8.99, 60, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440031', 'VITAMIN-001', 'Multivitamin', 'Daily multivitamin supplement, 60 tablets', '550e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440007', 15.99, 40, true, NOW(), NOW()),

-- Office Supplies from OfficeMax Solutions
('770e8400-e29b-41d4-a716-446655440032', 'PEN-001', 'Ballpoint Pen', 'Blue ink ballpoint pen, pack of 12', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', 4.99, 100, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440033', 'PAPER-001', 'Copy Paper', 'White copy paper, 8.5x11, 500 sheets', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', 6.99, 50, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440034', 'STAPLER-001', 'Desktop Stapler', 'Heavy-duty desktop stapler with staples', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', 12.99, 25, true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440035', 'FOLDER-001', 'File Folder', 'Manila file folders, pack of 25', '550e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440008', 9.99, 40, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert some initial stock levels
INSERT INTO stock_levels (product_id, warehouse_id, quantity, reserved_quantity, created_at, updated_at) VALUES
-- Main Warehouse stock
('770e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 10, 0, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440001', 25, 2, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440001', 18, 1, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440001', 12, 0, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440005', '880e8400-e29b-41d4-a716-446655440001', 15, 1, NOW(), NOW()),

-- Secondary Warehouse stock
('770e8400-e29b-41d4-a716-446655440006', '880e8400-e29b-41d4-a716-446655440002', 30, 0, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440007', '880e8400-e29b-41d4-a716-446655440002', 25, 0, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440008', '880e8400-e29b-41d4-a716-446655440002', 20, 0, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440011', '880e8400-e29b-41d4-a716-446655440002', 45, 3, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440012', '880e8400-e29b-41d4-a716-446655440002', 28, 2, NOW(), NOW()),

-- East Coast Distribution stock
('770e8400-e29b-41d4-a716-446655440016', '880e8400-e29b-41d4-a716-446655440003', 20, 0, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440017', '880e8400-e29b-41d4-a716-446655440003', 10, 1, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440021', '880e8400-e29b-41d4-a716-446655440003', 22, 0, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440022', '880e8400-e29b-41d4-a716-446655440003', 18, 0, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440032', '880e8400-e29b-41d4-a716-446655440003', 80, 5, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440033', '880e8400-e29b-41d4-a716-446655440003', 45, 0, NOW(), NOW()),

-- Central Hub stock
('770e8400-e29b-41d4-a716-446655440026', '880e8400-e29b-41d4-a716-446655440004', 35, 0, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440027', '880e8400-e29b-41d4-a716-446655440004', 42, 2, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440029', '880e8400-e29b-41d4-a716-446655440004', 55, 3, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440030', '880e8400-e29b-41d4-a716-446655440004', 65, 1, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440034', '880e8400-e29b-41d4-a716-446655440004', 28, 0, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440035', '880e8400-e29b-41d4-a716-446655440004', 38, 2, NOW(), NOW())
ON CONFLICT (product_id, warehouse_id) DO NOTHING;
