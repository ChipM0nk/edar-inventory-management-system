-- This migration recreates tables, so the down migration just drops them
-- The previous migration files will recreate the original schema if needed
DROP TABLE IF EXISTS adjustment_items CASCADE;
DROP TABLE IF EXISTS adjustments CASCADE;


