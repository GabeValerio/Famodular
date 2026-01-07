-- Migration: Create kitchen meal plans tables
-- These tables manage AI-generated meal plans and their associated data

-- Create kitchen_meal_plans table
CREATE TABLE kitchen_meal_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    dietary_preferences TEXT[] DEFAULT '{}', -- Array of dietary preferences
    total_prep_time INTEGER DEFAULT 0, -- in minutes
    total_cost DECIMAL(10,2) DEFAULT 0,
    created_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    group_id UUID NOT NULL REFERENCES groups(id),
    servings INTEGER NOT NULL DEFAULT 4,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kitchen_meals table
CREATE TABLE kitchen_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_plan_id UUID NOT NULL REFERENCES kitchen_meal_plans(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack', 'Dessert')),
    recipe_id UUID REFERENCES kitchen_recipes(id), -- Can link to saved recipes
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    prep_time INTEGER DEFAULT 0,
    cook_time INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create kitchen_meal_ingredients table (links meals to specific ingredients needed)
CREATE TABLE kitchen_meal_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID NOT NULL REFERENCES kitchen_meals(id) ON DELETE CASCADE,
    inventory_item_id UUID REFERENCES kitchen_inventory(id), -- Links to existing inventory
    name TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_kitchen_meal_plans_group_id ON kitchen_meal_plans (group_id);
CREATE INDEX idx_kitchen_meal_plans_created_by ON kitchen_meal_plans (created_by);

CREATE INDEX idx_kitchen_meals_meal_plan_id ON kitchen_meals (meal_plan_id);
CREATE INDEX idx_kitchen_meals_day_of_week ON kitchen_meals (day_of_week);
CREATE INDEX idx_kitchen_meals_type ON kitchen_meals (type);

CREATE INDEX idx_kitchen_meal_ingredients_meal_id ON kitchen_meal_ingredients (meal_id);
CREATE INDEX idx_kitchen_meal_ingredients_inventory_item_id ON kitchen_meal_ingredients (inventory_item_id);

-- Add comments
COMMENT ON TABLE kitchen_meal_plans IS 'AI-generated meal plans with dietary preferences and cost estimates';
COMMENT ON TABLE kitchen_meals IS 'Individual meals within a meal plan';
COMMENT ON TABLE kitchen_meal_ingredients IS 'Ingredients required for each meal';
COMMENT ON COLUMN kitchen_meals.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, etc.';
COMMENT ON COLUMN kitchen_meal_plans.dietary_preferences IS 'Array of dietary preferences like Vegetarian, Vegan, Keto, etc.';

-- Create triggers for updated_at
CREATE TRIGGER update_kitchen_meal_plans_updated_at
    BEFORE UPDATE ON kitchen_meal_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kitchen_meals_updated_at
    BEFORE UPDATE ON kitchen_meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

