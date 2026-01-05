-- Create plants table for tracking plants in the house
CREATE TABLE IF NOT EXISTS plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  common_name VARCHAR(255), -- Common plant name from AI (e.g., "Rosemary Bush")
  location VARCHAR(255), -- Where the plant is located
  recommended_water_schedule VARCHAR(100), -- Water schedule from AI (e.g., "1/week", "1/month")
  last_watered TIMESTAMPTZ, -- Last time the plant was watered
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create plant_photos table for tracking plant photos and growth
CREATE TABLE IF NOT EXISTS plant_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL, -- Cloudinary URL
  photo_date TIMESTAMPTZ NOT NULL DEFAULT NOW(), -- When this photo was taken
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_plants_group_id ON plants(group_id);
CREATE INDEX IF NOT EXISTS idx_plants_user_id ON plants(user_id);
CREATE INDEX IF NOT EXISTS idx_plant_photos_plant_id ON plant_photos(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_photos_photo_date ON plant_photos(photo_date DESC);

-- Enable Row Level Security
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE plant_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for plants table
-- Users can view plants in groups they're members of
CREATE POLICY "Users can view plants in their groups"
  ON plants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = plants.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can insert plants in groups they're members of
CREATE POLICY "Users can create plants in their groups"
  ON plants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = plants.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can update plants in groups they're members of
CREATE POLICY "Users can update plants in their groups"
  ON plants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = plants.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can delete plants in groups they're members of
CREATE POLICY "Users can delete plants in their groups"
  ON plants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = plants.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- RLS Policies for plant_photos table
-- Users can view photos for plants in their groups
CREATE POLICY "Users can view plant photos in their groups"
  ON plant_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM plants
      INNER JOIN group_members ON group_members.group_id = plants.group_id
      WHERE plants.id = plant_photos.plant_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can insert photos for plants in their groups
CREATE POLICY "Users can create plant photos in their groups"
  ON plant_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM plants
      INNER JOIN group_members ON group_members.group_id = plants.group_id
      WHERE plants.id = plant_photos.plant_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can delete photos for plants in their groups
CREATE POLICY "Users can delete plant photos in their groups"
  ON plant_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM plants
      INNER JOIN group_members ON group_members.group_id = plants.group_id
      WHERE plants.id = plant_photos.plant_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_plants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plants_updated_at
  BEFORE UPDATE ON plants
  FOR EACH ROW
  EXECUTE FUNCTION update_plants_updated_at();







