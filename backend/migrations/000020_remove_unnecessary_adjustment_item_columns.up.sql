-- Remove unnecessary columns from adjustment_items table
-- These columns are not needed and were incorrectly added to the model

-- First, drop the generated column that depends on other columns
DO $$
BEGIN
    -- Drop variance_quantity column if it exists (it's a generated column)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'adjustment_items' AND column_name = 'variance_quantity') THEN
        ALTER TABLE adjustment_items DROP COLUMN variance_quantity;
    END IF;

    -- Drop expected_quantity column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'adjustment_items' AND column_name = 'expected_quantity') THEN
        ALTER TABLE adjustment_items DROP COLUMN expected_quantity;
    END IF;

    -- Drop actual_quantity column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'adjustment_items' AND column_name = 'actual_quantity') THEN
        ALTER TABLE adjustment_items DROP COLUMN actual_quantity;
    END IF;

    -- Drop reference_type column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'adjustment_items' AND column_name = 'reference_type') THEN
        ALTER TABLE adjustment_items DROP COLUMN reference_type;
    END IF;

    -- Drop reference_id column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'adjustment_items' AND column_name = 'reference_id') THEN
        ALTER TABLE adjustment_items DROP COLUMN reference_id;
    END IF;

    -- Drop reference_number column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'adjustment_items' AND column_name = 'reference_number') THEN
        ALTER TABLE adjustment_items DROP COLUMN reference_number;
    END IF;

    -- Drop adjustment_reason column if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'adjustment_items' AND column_name = 'adjustment_reason') THEN
        ALTER TABLE adjustment_items DROP COLUMN adjustment_reason;
    END IF;
END $$;

-- Drop related indexes
DROP INDEX IF EXISTS idx_adjustment_items_reference_type;
DROP INDEX IF EXISTS idx_adjustment_items_reference_id;
DROP INDEX IF EXISTS idx_adjustment_items_adjustment_reason;

-- Add comment for clarity
COMMENT ON TABLE adjustment_items IS 'Individual items within an adjustment - normalized table with only necessary fields';
