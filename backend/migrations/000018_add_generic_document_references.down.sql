-- Remove the constraint
ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_reference;

-- Remove the index
DROP INDEX IF EXISTS idx_documents_reference;

-- Make purchase_order_id NOT NULL again (this will fail if there are adjustment documents)
-- ALTER TABLE documents ALTER COLUMN purchase_order_id SET NOT NULL;

-- Remove the new columns
ALTER TABLE documents DROP COLUMN IF EXISTS reference_type;
ALTER TABLE documents DROP COLUMN IF EXISTS reference_id;
