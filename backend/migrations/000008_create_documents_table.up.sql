CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_documents_purchase_order 
        FOREIGN KEY (purchase_order_id) 
        REFERENCES purchase_orders(id) 
        ON DELETE CASCADE
);

CREATE INDEX idx_documents_purchase_order_id ON documents(purchase_order_id);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at);
