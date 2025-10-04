-- Remove validation fields and purchase_order_id from documents table
-- This migration removes the validation fields and the legacy purchase_order_id field
-- All documents should now use the generic reference_type and reference_id fields

-- First, ensure all documents have proper reference_type and reference_id
-- Update any remaining documents that might still only have purchase_order_id
UPDATE documents SET 
    reference_type = 'purchase_order',
    reference_id = purchase_order_id
WHERE purchase_order_id IS NOT NULL 
  AND (reference_type IS NULL OR reference_id IS NULL);

-- Drop the check constraint that requires either old or new reference
ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_reference;

-- Drop validation-related indexes
DROP INDEX IF EXISTS idx_documents_validation_status;

-- Drop validation fields
ALTER TABLE documents DROP COLUMN IF EXISTS has_po_reference;
ALTER TABLE documents DROP COLUMN IF EXISTS has_matching_date;
ALTER TABLE documents DROP COLUMN IF EXISTS validation_status;
ALTER TABLE documents DROP COLUMN IF EXISTS validation_notes;

-- Drop the legacy purchase_order_id column and its foreign key constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_purchase_order;
DROP INDEX IF EXISTS idx_documents_purchase_order_id;
ALTER TABLE documents DROP COLUMN IF EXISTS purchase_order_id;

-- Make reference_type and reference_id NOT NULL since they're now the only way to reference documents
ALTER TABLE documents ALTER COLUMN reference_type SET NOT NULL;
ALTER TABLE documents ALTER COLUMN reference_id SET NOT NULL;

-- Add comment for clarity
COMMENT ON TABLE documents IS 'Generic document storage for all stock movement types - uses reference_type and reference_id for linking';

