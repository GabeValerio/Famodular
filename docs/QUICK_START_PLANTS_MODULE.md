# Quick Start: Enable Plants Module

To see the Plants module in your group settings, you need to run this SQL in your Supabase database:

## Step 1: Open Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"

## Step 2: Run This SQL

Copy and paste this SQL into the editor and click "Run":

```sql
-- Add plants module to the modules table
INSERT INTO modules (id, name, description, icon, category, default_enabled, route) 
VALUES ('plants', 'Plants', 'Track and care for house plants', 'Sprout', 'group', false, '/dashboard/plants')
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  route = EXCLUDED.route,
  is_active = true;
```

## Step 3: Refresh Your Browser

After running the SQL:
1. Go back to your application
2. Refresh the Settings page (or hard refresh with Cmd+Shift+R / Ctrl+Shift+R)
3. You should now see "Plants" in the Enabled Modules section!

## Optional: Update Group Defaults

If you want to add `plants: false` to all existing groups' enabled_modules, also run:

```sql
-- Add plants: false to existing groups
UPDATE groups
SET enabled_modules = enabled_modules || '{"plants": false}'::jsonb
WHERE enabled_modules::jsonb ? 'plants' = false;
```

This ensures consistency, but isn't required - the module will work fine without it.




