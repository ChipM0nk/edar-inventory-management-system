-- Add processed_by and processed_date to stock_movements table
ALTER TABLE stock_movements
ADD COLUMN processed_by UUID REFERENCES users(id),
ADD COLUMN processed_date TIMESTAMPTZ DEFAULT NOW();

-- Add index for processed_by
CREATE INDEX idx_stock_movements_processed_by ON stock_movements(processed_by);

-- Add index for processed_date
CREATE INDEX idx_stock_movements_processed_date ON stock_movements(processed_date);

