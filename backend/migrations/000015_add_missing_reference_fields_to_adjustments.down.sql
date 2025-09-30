-- Remove reference fields from adjustments
ALTER TABLE adjustments 
DROP COLUMN IF EXISTS reference_type,
DROP COLUMN IF EXISTS reference_id,
DROP COLUMN IF EXISTS adjustment_reason;


