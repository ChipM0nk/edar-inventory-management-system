-- Add validation fields to documents table
ALTER TABLE documents ADD COLUMN has_po_reference BOOLEAN;
ALTER TABLE documents ADD COLUMN has_matching_date BOOLEAN;
ALTER TABLE documents ADD COLUMN validation_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN validation_notes TEXT;

-- Add index for validation status
CREATE INDEX idx_documents_validation_status ON documents(validation_status);
