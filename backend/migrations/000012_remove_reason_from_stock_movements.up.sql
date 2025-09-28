-- Remove reason column from stock_movements table
-- The reason field is now handled at the adjustment/transfer level instead

ALTER TABLE stock_movements DROP COLUMN IF EXISTS reason;

-- Add comment to clarify the change
COMMENT ON TABLE stock_movements IS 'Stock movements table - reason is now tracked at the adjustment/transfer level';
