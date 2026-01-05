-- Migration: Create kitchen_inventory table for managing food inventory
-- This table tracks items in the kitchen (fridge, pantry, etc.)

-- Create kitchen_inventory table
CREATE TABLE kitchen_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Produce', 'Dairy', 'Meat', 'Seafood', 'Bakery', 'Pantry', 'Beverages', 'Snacks', 'Frozen', 'Condiments', 'Spices', 'Other')),
    location TEXT NOT NULL CHECK (location IN ('Fridge', 'Freezer', 'Pantry', 'Cabinet', 'Counter')),
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL, -- pieces, lbs, oz, cups, cans, bottles, packages, etc.
    expiration_date DATE,
    added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID NOT NULL REFERENCES auth.users(id),
    group_id UUID NOT NULL REFERENCES groups(id),
    image_url TEXT,
    barcode TEXT,
    nutritional_info JSONB, -- calories, protein, carbs, fat, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_kitchen_inventory_group_id ON kitchen_inventory (group_id);
CREATE INDEX idx_kitchen_inventory_location ON kitchen_inventory (location);
CREATE INDEX idx_kitchen_inventory_category ON kitchen_inventory (category);
CREATE INDEX idx_kitchen_inventory_expiration ON kitchen_inventory (expiration_date);
CREATE INDEX idx_kitchen_inventory_added_by ON kitchen_inventory (added_by);

-- Add comments
COMMENT ON TABLE kitchen_inventory IS 'Kitchen inventory items including fridge, pantry, and cabinet contents';
COMMENT ON COLUMN kitchen_inventory.location IS 'Where the item is stored (Fridge, Freezer, Pantry, etc.)';
COMMENT ON COLUMN kitchen_inventory.nutritional_info IS 'JSON object with nutritional information per serving';

-- Create trigger for updated_at
CREATE TRIGGER update_kitchen_inventory_updated_at
    BEFORE UPDATE ON kitchen_inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
