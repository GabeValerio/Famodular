-- Add water_amount column to plants table
ALTER TABLE plants ADD COLUMN IF NOT EXISTS water_amount VARCHAR(100);


