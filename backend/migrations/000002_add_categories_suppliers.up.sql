-- Create categories table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create suppliers table
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add category_id and supplier_id to products table
ALTER TABLE products 
ADD COLUMN category_id UUID REFERENCES categories(id),
ADD COLUMN supplier_id UUID REFERENCES suppliers(id);

-- Create indexes for better performance
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_email ON suppliers(email);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some default categories
INSERT INTO categories (name, description) VALUES 
('Electronics', 'Electronic devices and components'),
('Clothing', 'Apparel and fashion items'),
('Books', 'Books and educational materials'),
('Home & Garden', 'Home improvement and garden supplies'),
('Sports', 'Sports equipment and accessories'),
('Food & Beverage', 'Food and drink products'),
('Health & Beauty', 'Health and beauty products'),
('Automotive', 'Automotive parts and accessories');

-- Insert some default suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address, city, state, country) VALUES 
('TechSupply Inc', 'John Smith', 'john@techsupply.com', '+1-555-0101', '123 Tech Street', 'San Francisco', 'CA', 'USA'),
('Fashion Forward Ltd', 'Sarah Johnson', 'sarah@fashionforward.com', '+1-555-0102', '456 Fashion Ave', 'New York', 'NY', 'USA'),
('BookWorld Corp', 'Mike Davis', 'mike@bookworld.com', '+1-555-0103', '789 Library Lane', 'Boston', 'MA', 'USA'),
('Home Depot Pro', 'Lisa Wilson', 'lisa@homedepot.com', '+1-555-0104', '321 Hardware Blvd', 'Atlanta', 'GA', 'USA'),
('Sports Central', 'Tom Brown', 'tom@sportscentral.com', '+1-555-0105', '654 Athletic Way', 'Denver', 'CO', 'USA');






