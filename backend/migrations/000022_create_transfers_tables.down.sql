-- Drop triggers
DROP TRIGGER IF EXISTS update_transfer_total_quantity_trigger ON transfer_items;
DROP TRIGGER IF EXISTS update_transfer_items_updated_at ON transfer_items;
DROP TRIGGER IF EXISTS update_transfers_updated_at ON transfers;

-- Drop function
DROP FUNCTION IF EXISTS update_transfer_total_quantity();

-- Drop indexes
DROP INDEX IF EXISTS idx_transfer_items_product_id;
DROP INDEX IF EXISTS idx_transfer_items_transfer_id;
DROP INDEX IF EXISTS idx_transfers_created_at;
DROP INDEX IF EXISTS idx_transfers_status;
DROP INDEX IF EXISTS idx_transfers_to_warehouse;
DROP INDEX IF EXISTS idx_transfers_from_warehouse;
DROP INDEX IF EXISTS idx_transfers_reference_number;

-- Drop tables
DROP TABLE IF EXISTS transfer_items;
DROP TABLE IF EXISTS transfers;




