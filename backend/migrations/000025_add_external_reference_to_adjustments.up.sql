-- Add external_reference field to adjustments table
ALTER TABLE adjustments 
ADD COLUMN external_reference VARCHAR(100);

-- Add index for better performance
CREATE INDEX idx_adjustments_external_reference ON adjustments(external_reference);

-- Add comment for clarity
COMMENT ON COLUMN adjustments.external_reference IS 'External reference number (PO, SO, Transfer, etc.) provided by user';
