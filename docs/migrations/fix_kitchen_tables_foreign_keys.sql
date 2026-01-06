-- Migration: Fix kitchen tables foreign keys to reference public.users instead of auth.users
-- The application uses a custom users table in the public schema, not Supabase's auth.users
-- This migration updates all kitchen-related tables to use the correct foreign key reference

-- Fix kitchen_inventory table
ALTER TABLE kitchen_inventory
DROP CONSTRAINT IF EXISTS kitchen_inventory_added_by_fkey;

ALTER TABLE kitchen_inventory
ADD CONSTRAINT kitchen_inventory_added_by_fkey
FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE;

-- Fix kitchen_recipes table
ALTER TABLE kitchen_recipes
DROP CONSTRAINT IF EXISTS kitchen_recipes_created_by_fkey;

ALTER TABLE kitchen_recipes
ADD CONSTRAINT kitchen_recipes_created_by_fkey
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- Fix kitchen_meal_plans table
ALTER TABLE kitchen_meal_plans
DROP CONSTRAINT IF EXISTS kitchen_meal_plans_created_by_fkey;

ALTER TABLE kitchen_meal_plans
ADD CONSTRAINT kitchen_meal_plans_created_by_fkey
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- Fix kitchen_grocery_lists table
ALTER TABLE kitchen_grocery_lists
DROP CONSTRAINT IF EXISTS kitchen_grocery_lists_created_by_fkey;

ALTER TABLE kitchen_grocery_lists
ADD CONSTRAINT kitchen_grocery_lists_created_by_fkey
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- Fix kitchen_grocery_items table
ALTER TABLE kitchen_grocery_items
DROP CONSTRAINT IF EXISTS kitchen_grocery_items_added_by_fkey;

ALTER TABLE kitchen_grocery_items
ADD CONSTRAINT kitchen_grocery_items_added_by_fkey
FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE;

