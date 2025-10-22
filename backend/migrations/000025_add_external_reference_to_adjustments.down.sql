-- Remove external_reference field from adjustments table
DROP INDEX IF EXISTS idx_adjustments_external_reference;
ALTER TABLE adjustments DROP COLUMN IF EXISTS external_reference;


