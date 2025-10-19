-- Add warehouse_id to adjustments table
ALTER TABLE adjustments ADD COLUMN warehouse_id UUID REFERENCES warehouses(id);

-- Populate warehouse_id from the first adjustment_item (assuming all items have the same warehouse)
UPDATE adjustments a
SET warehouse_id = (
    SELECT ai.warehouse_id
    FROM adjustment_items ai
    WHERE ai.adjustment_id = a.id
    LIMIT 1
);

-- Make warehouse_id NOT NULL after populating
ALTER TABLE adjustments ALTER COLUMN warehouse_id SET NOT NULL;

-- Remove warehouse_id from adjustment_items
ALTER TABLE adjustment_items DROP COLUMN warehouse_id;

-- Create index for the new warehouse_id column
CREATE INDEX idx_adjustments_warehouse_id ON adjustments(warehouse_id);

-- Drop the old index on adjustment_items.warehouse_id (already dropped with the column)
-- No need to explicitly drop the index as it's dropped with the column

