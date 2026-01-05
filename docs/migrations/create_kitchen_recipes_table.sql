-- Migration: Create kitchen_recipes table
-- This table stores recipes, both user-created and AI-generated

-- Create kitchen_recipes table
CREATE TABLE kitchen_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT[] DEFAULT '{}', -- Array of instruction steps
    prep_time INTEGER DEFAULT 0, -- in minutes
    cook_time INTEGER DEFAULT 0, -- in minutes
    servings INTEGER NOT NULL DEFAULT 4,
    dietary_tags TEXT[] DEFAULT '{}', -- Array of dietary tags
    image_url TEXT,
    nutritional_info JSONB, -- calories, protein, carbs, fat, etc. per serving
    source TEXT DEFAULT 'User Created', -- AI Generated, User Created, etc.
    created_by UUID NOT NULL REFERENCES auth.users(id),
    group_id UUID NOT NULL REFERENCES groups(id),
    is_public BOOLEAN NOT NULL DEFAULT false, -- Can be shared across groups
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kitchen_recipe_ingredients table
CREATE TABLE kitchen_recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID NOT NULL REFERENCES kitchen_recipes(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES kitchen_inventory(id), -- Links to existing inventory items
    name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_kitchen_recipes_group_id ON kitchen_recipes (group_id);
CREATE INDEX idx_kitchen_recipes_created_by ON kitchen_recipes (created_by);
CREATE INDEX idx_kitchen_recipes_is_public ON kitchen_recipes (is_public);
CREATE INDEX idx_kitchen_recipes_dietary_tags ON kitchen_recipes USING GIN (dietary_tags);

CREATE INDEX idx_kitchen_recipe_ingredients_recipe_id ON kitchen_recipe_ingredients (recipe_id);
CREATE INDEX idx_kitchen_recipe_ingredients_inventory_item_id ON kitchen_recipe_ingredients (inventory_item_id);

-- Add comments
COMMENT ON TABLE kitchen_recipes IS 'Recipes for meals, both AI-generated and user-created';
COMMENT ON TABLE kitchen_recipe_ingredients IS 'Ingredients required for each recipe';
COMMENT ON COLUMN kitchen_recipes.instructions IS 'Array of cooking instruction steps';
COMMENT ON COLUMN kitchen_recipes.dietary_tags IS 'Array of dietary classifications like Vegetarian, Vegan, Gluten Free, etc.';
COMMENT ON COLUMN kitchen_recipes.source IS 'How the recipe was created (AI Generated, User Created, etc.)';
COMMENT ON COLUMN kitchen_recipes.is_public IS 'Whether this recipe can be viewed by other groups';

-- Create triggers for updated_at
CREATE TRIGGER update_kitchen_recipes_updated_at
    BEFORE UPDATE ON kitchen_recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
