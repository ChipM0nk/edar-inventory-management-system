-- Remove reference fields from adjustment_items
ALTER TABLE adjustment_items 
DROP COLUMN IF EXISTS reference_type,
DROP COLUMN IF EXISTS reference_id,
DROP COLUMN IF EXISTS reference_number,
DROP COLUMN IF EXISTS adjustment_reason,
DROP COLUMN IF EXISTS expected_quantity,
DROP COLUMN IF EXISTS actual_quantity,
DROP COLUMN IF EXISTS variance_quantity;

-- Remove reference fields from adjustments
ALTER TABLE adjustments 
DROP COLUMN IF EXISTS reference_type,
DROP COLUMN IF EXISTS reference_id,
DROP COLUMN IF EXISTS reference_number,
DROP COLUMN IF EXISTS adjustment_reason;