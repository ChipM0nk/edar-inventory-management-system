-- Insert test categories
INSERT INTO categories (id, name, description, is_active, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Electronics', 'Electronic devices and components', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Books', 'Books and educational materials', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Clothing', 'Apparel and accessories', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Home & Garden', 'Home improvement and garden supplies', true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Sports', 'Sports equipment and gear', true, NOW(), NOW());

-- Insert test suppliers
INSERT INTO suppliers (id, name, contact_person, email, phone, address, city, state, postal_code, country, is_active, created_at, updated_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'TechCorp Electronics', 'John Smith', 'john@techcorp.com', '+1-555-0101', '123 Tech Street', 'San Francisco', 'CA', '94105', 'USA', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440002', 'BookWorld Publishers', 'Jane Doe', 'jane@bookworld.com', '+1-555-0102', '456 Book Avenue', 'New York', 'NY', '10001', 'USA', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440003', 'Fashion Forward', 'Mike Johnson', 'mike@fashion.com', '+1-555-0103', '789 Style Blvd', 'Los Angeles', 'CA', '90210', 'USA', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440004', 'Home Depot', 'Sarah Wilson', 'sarah@homedepot.com', '+1-555-0104', '321 Hardware Lane', 'Atlanta', 'GA', '30309', 'USA', true, NOW(), NOW()),
('660e8400-e29b-41d4-a716-446655440005', 'Sports Central', 'Tom Brown', 'tom@sports.com', '+1-555-0105', '654 Athletic Way', 'Chicago', 'IL', '60601', 'USA', true, NOW(), NOW());

-- Insert test products
INSERT INTO products (id, sku, name, description, unit_price, category_id, supplier_id, is_active, created_at, updated_at) VALUES
-- Electronics from TechCorp
('770e8400-e29b-41d4-a716-446655440001', 'LAPTOP-001', 'Gaming Laptop', 'High-performance gaming laptop with RTX 4070', 1299.99, '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440006', 'MOUSE-001', 'Wireless Gaming Mouse', 'High-precision wireless gaming mouse', 79.99, '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440007', 'KEYBOARD-001', 'Mechanical Keyboard', 'RGB mechanical keyboard with blue switches', 149.99, '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440008', 'MONITOR-001', '4K Gaming Monitor', '27-inch 4K gaming monitor 144Hz', 399.99, '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440009', 'HEADPHONE-001', 'Gaming Headset', 'Wireless gaming headset with noise cancellation', 199.99, '550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', true, NOW(), NOW()),

-- Books from BookWorld
('770e8400-e29b-41d4-a716-446655440002', 'BOOK-001', 'Programming Guide', 'Complete guide to programming', 49.99, '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440010', 'BOOK-002', 'Database Design', 'Advanced database design principles', 59.99, '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440011', 'BOOK-003', 'Web Development', 'Modern web development with React', 69.99, '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440012', 'BOOK-004', 'Business Management', 'Effective business management strategies', 39.99, '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440013', 'BOOK-005', 'Marketing Guide', 'Digital marketing for beginners', 44.99, '550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', true, NOW(), NOW()),

-- Clothing from Fashion Forward
('770e8400-e29b-41d4-a716-446655440003', 'SHIRT-001', 'Cotton T-Shirt', 'Comfortable cotton t-shirt', 19.99, '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440014', 'JEANS-001', 'Denim Jeans', 'Classic blue denim jeans', 59.99, '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440015', 'JACKET-001', 'Leather Jacket', 'Genuine leather jacket', 199.99, '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440016', 'SNEAKER-001', 'Running Shoes', 'Comfortable running shoes', 89.99, '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440017', 'HAT-001', 'Baseball Cap', 'Adjustable baseball cap', 24.99, '550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', true, NOW(), NOW()),

-- Home & Garden from Home Depot
('770e8400-e29b-41d4-a716-446655440004', 'TOOL-001', 'Hammer Set', 'Professional hammer set', 39.99, '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440018', 'DRILL-001', 'Cordless Drill', '18V cordless drill with battery', 129.99, '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440019', 'PAINT-001', 'Interior Paint', 'Premium interior wall paint', 45.99, '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440020', 'LIGHT-001', 'LED Light Bulb', 'Energy-efficient LED light bulb', 12.99, '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440021', 'PLANT-001', 'Indoor Plant', 'Low-maintenance indoor plant', 29.99, '550e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440004', true, NOW(), NOW()),

-- Sports from Sports Central
('770e8400-e29b-41d4-a716-446655440005', 'BALL-001', 'Soccer Ball', 'Professional soccer ball', 29.99, '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440022', 'BASKETBALL-001', 'Basketball', 'Official size basketball', 34.99, '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440023', 'TENNIS-001', 'Tennis Racket', 'Professional tennis racket', 149.99, '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440024', 'GYM-001', 'Dumbbell Set', 'Adjustable dumbbell set', 199.99, '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW()),
('770e8400-e29b-41d4-a716-446655440025', 'YOGA-001', 'Yoga Mat', 'Non-slip yoga mat', 39.99, '550e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440005', true, NOW(), NOW());

-- Insert test warehouses
INSERT INTO warehouses (id, name, location, capacity, is_active, created_at, updated_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'Main Warehouse', '123 Storage Street, City, State 12345', 10000, true, NOW(), NOW()),
('880e8400-e29b-41d4-a716-446655440002', 'Secondary Warehouse', '456 Depot Road, City, State 12345', 5000, true, NOW(), NOW());

-- Insert test users
INSERT INTO users (id, username, email, password_hash, role, is_active, created_at, updated_at) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'admin', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', true, NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440002', 'manager', 'manager@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', true, NOW(), NOW()),
('990e8400-e29b-41d4-a716-446655440003', 'staff', 'staff@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff', true, NOW(), NOW());


