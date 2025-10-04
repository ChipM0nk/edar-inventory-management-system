-- Revert removal of validation fields and purchase_order_id from documents table

-- Add back purchase_order_id column
ALTER TABLE documents ADD COLUMN purchase_order_id UUID;

-- Add back validation fields
ALTER TABLE documents ADD COLUMN has_po_reference BOOLEAN;
ALTER TABLE documents ADD COLUMN has_matching_date BOOLEAN;
ALTER TABLE documents ADD COLUMN validation_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN validation_notes TEXT;

-- Update purchase_order_id for documents that reference purchase orders
UPDATE documents SET 
    purchase_order_id = reference_id
WHERE reference_type = 'purchase_order';

-- Make purchase_order_id NOT NULL for purchase order documents
-- Note: This might fail if there are non-purchase_order documents
-- ALTER TABLE documents ALTER COLUMN purchase_order_id SET NOT NULL;

-- Add back foreign key constraint
ALTER TABLE documents ADD CONSTRAINT fk_documents_purchase_order 
    FOREIGN KEY (purchase_order_id) 
    REFERENCES purchase_orders(id) 
    ON DELETE CASCADE;

-- Add back indexes
CREATE INDEX idx_documents_purchase_order_id ON documents(purchase_order_id);
CREATE INDEX idx_documents_validation_status ON documents(validation_status);

-- Make reference_type and reference_id nullable again
ALTER TABLE documents ALTER COLUMN reference_type DROP NOT NULL;
ALTER TABLE documents ALTER COLUMN reference_id DROP NOT NULL;

-- Add back check constraint
ALTER TABLE documents ADD CONSTRAINT chk_documents_reference 
    CHECK (
        (purchase_order_id IS NOT NULL) OR 
        (reference_type IS NOT NULL AND reference_id IS NOT NULL)
    );

