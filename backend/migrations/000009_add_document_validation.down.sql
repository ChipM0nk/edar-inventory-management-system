-- Remove validation fields from documents table
DROP INDEX IF EXISTS idx_documents_validation_status;
ALTER TABLE documents DROP COLUMN IF EXISTS validation_notes;
ALTER TABLE documents DROP COLUMN IF EXISTS validation_status;
ALTER TABLE documents DROP COLUMN IF EXISTS has_matching_date;
ALTER TABLE documents DROP COLUMN IF EXISTS has_po_reference;
