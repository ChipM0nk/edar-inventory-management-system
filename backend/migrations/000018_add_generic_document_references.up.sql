-- Add generic reference columns to documents table
ALTER TABLE documents ADD COLUMN reference_type VARCHAR(50);
ALTER TABLE documents ADD COLUMN reference_id UUID;

-- Update existing records to use the new structure
UPDATE documents SET 
    reference_type = 'purchase_order',
    reference_id = purchase_order_id
WHERE purchase_order_id IS NOT NULL;

-- Make purchase_order_id nullable since we now have generic reference
ALTER TABLE documents ALTER COLUMN purchase_order_id DROP NOT NULL;

-- Add index for the new reference columns
CREATE INDEX idx_documents_reference ON documents(reference_type, reference_id);

-- Add check constraint to ensure we have either old or new reference
ALTER TABLE documents ADD CONSTRAINT chk_documents_reference 
    CHECK (
        (purchase_order_id IS NOT NULL) OR 
        (reference_type IS NOT NULL AND reference_id IS NOT NULL)
    );
