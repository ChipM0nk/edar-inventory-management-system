-- Add warehouse_id back to adjustment_items
ALTER TABLE adjustment_items ADD COLUMN warehouse_id UUID;

-- Populate warehouse_id from adjustments
UPDATE adjustment_items ai
SET warehouse_id = (
    SELECT a.warehouse_id
    FROM adjustments a
    WHERE a.id = ai.adjustment_id
);

-- Make warehouse_id NOT NULL after populating
ALTER TABLE adjustment_items ALTER COLUMN warehouse_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE adjustment_items ADD CONSTRAINT adjustment_items_warehouse_id_fkey 
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE;

-- Recreate index on adjustment_items.warehouse_id
CREATE INDEX idx_adjustment_items_warehouse_id ON adjustment_items(warehouse_id);

-- Remove warehouse_id from adjustments
ALTER TABLE adjustments DROP COLUMN warehouse_id;

