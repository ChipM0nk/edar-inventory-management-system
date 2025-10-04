-- Rollback removal of unnecessary columns from adjustment_items table
-- Note: This rollback will not recreate the columns as they were not part of the original schema
-- This migration is primarily for cleaning up the model definition

-- The columns that were removed in the up migration were not part of the original database schema
-- so there's nothing to rollback in terms of database structure
