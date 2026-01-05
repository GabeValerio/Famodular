-- Migration: Create kitchen grocery lists tables
-- These tables manage shopping lists and their items

-- Create kitchen_grocery_lists table
CREATE TABLE kitchen_grocery_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    group_id UUID NOT NULL REFERENCES groups(id),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    total_estimated_cost DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kitchen_grocery_items table
CREATE TABLE kitchen_grocery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    list_id UUID NOT NULL REFERENCES kitchen_grocery_lists(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL,
    category TEXT CHECK (category IN ('Produce', 'Dairy', 'Meat', 'Seafood', 'Bakery', 'Pantry', 'Beverages', 'Snacks', 'Frozen', 'Condiments', 'Spices', 'Other')),
    is_completed BOOLEAN NOT NULL DEFAULT false,
    added_by UUID NOT NULL REFERENCES auth.users(id),
    group_id UUID NOT NULL REFERENCES groups(id),
    estimated_cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_kitchen_grocery_lists_group_id ON kitchen_grocery_lists (group_id);
CREATE INDEX idx_kitchen_grocery_lists_created_by ON kitchen_grocery_lists (created_by);
CREATE INDEX idx_kitchen_grocery_lists_completed ON kitchen_grocery_lists (is_completed);

CREATE INDEX idx_kitchen_grocery_items_list_id ON kitchen_grocery_items (list_id);
CREATE INDEX idx_kitchen_grocery_items_group_id ON kitchen_grocery_items (group_id);
CREATE INDEX idx_kitchen_grocery_items_completed ON kitchen_grocery_items (is_completed);
CREATE INDEX idx_kitchen_grocery_items_category ON kitchen_grocery_items (category);

-- Add comments
COMMENT ON TABLE kitchen_grocery_lists IS 'Shopping lists for groceries';
COMMENT ON TABLE kitchen_grocery_items IS 'Individual items within grocery lists';
COMMENT ON COLUMN kitchen_grocery_lists.total_estimated_cost IS 'Estimated total cost of all items in the list';

-- Create triggers for updated_at
CREATE TRIGGER update_kitchen_grocery_lists_updated_at
    BEFORE UPDATE ON kitchen_grocery_lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kitchen_grocery_items_updated_at
    BEFORE UPDATE ON kitchen_grocery_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
