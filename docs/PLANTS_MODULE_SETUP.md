# Plants Module Setup Guide

## Overview

The Plants module allows you to track house plants with the following features:
- Plant name and common name
- Location tracking
- Recommended watering schedule (AI-powered)
- Last watered date
- Photo gallery with growth tracking over time
- AI-powered plant identification from photos

## Setup Steps

### 1. Database Migrations

Run the following SQL migrations in order:

**Step 1: Create the plants tables**
```sql
-- File: docs/migrations/create_plants_tables.sql
```
This creates:
- `plants` table - stores plant information
- `plant_photos` table - stores plant photos with dates for growth tracking

**Step 2: Register the plants module**
```sql
-- File: docs/migrations/add_plants_module.sql
```
This adds the plants module to the `modules` table so it appears in group settings.

**Step 3: Update group defaults (optional)**
```sql
-- File: docs/migrations/add_plants_to_group_defaults.sql
```
This adds `plants: false` to the default enabled_modules for new groups.

### 2. Environment Variables

Add the following environment variable to your `.env.local` file:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Getting a Google Gemini API Key:**
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env.local` file

**Note:** The AI identification feature will not work without this key. The module will still function for manual plant entry and management.

### 3. Enable the Module

The module needs to be enabled in the group settings. By default, it should be available for groups.

## Features

### Plant Management
- **Add Plant**: Create a new plant with name, common name, location, and watering schedule
- **Edit Plant**: Update plant information
- **Delete Plant**: Remove a plant (cascades to delete all photos)
- **Mark as Watered**: Quick action to record when a plant was last watered

### Photo Management
- **Add Photo**: Upload photos to track plant growth over time
- **View Gallery**: See all photos for a plant with dates
- **Delete Photo**: Remove photos from the gallery

### AI-Powered Identification
- **Auto-Identify**: When adding a plant from a photo, use AI to:
  - Identify the common plant name (e.g., "Rosemary Bush", "Fiddle Leaf Fig")
  - Suggest a recommended watering schedule (e.g., "1/week", "1/month")

## Usage

### Adding a Plant Manually
1. Click "Add Plant" button
2. Fill in the plant details:
   - Name (required)
   - Common Plant Name (optional)
   - Location (optional)
   - Recommended Water Schedule (optional)
   - Last Watered (optional)
3. Click "Create"

### Adding a Plant from Photo (with AI)
1. Click "Add Plant from Photo" button
2. Select an image file
3. The image will be uploaded and displayed in the modal
4. Click the "Analyze Plant" button to use AI identification
5. The AI will identify the plant and populate the common name and watering schedule
6. Review and edit the information as needed
7. Fill in the plant name and other details
8. Click "Create"
9. The photo will be automatically added to the plant's gallery

### Tracking Growth
1. Click on a plant card to view its photo gallery
2. Click "Add Photo" to upload a new photo
3. Photos are automatically dated to track growth over time
4. View photos chronologically to see plant progress

### Watering Reminders
- The UI shows how many days since the plant was last watered
- Color coding:
  - Green: Recently watered (today or yesterday)
  - Yellow: Moderate time since watering
  - Red: Long time since watering
- Click the "Water" button to mark as watered today

## API Endpoints

- `GET /api/modules/group/plants?groupId={groupId}` - Get all plants for a group
- `POST /api/modules/group/plants` - Create a new plant
- `GET /api/modules/group/plants/{id}` - Get a specific plant
- `PATCH /api/modules/group/plants/{id}` - Update a plant
- `DELETE /api/modules/group/plants/{id}` - Delete a plant
- `GET /api/modules/group/plants/{id}/photos` - Get all photos for a plant
- `POST /api/modules/group/plants/{id}/photos` - Add a photo to a plant
- `DELETE /api/modules/group/plants/{id}/photos/{photoId}` - Delete a photo
- `POST /api/modules/group/plants/identify` - Identify plant from image (AI)

## Module Structure

```
app/modules/plants/
├── components/
│   └── PlantsComponent.tsx    # Main UI component
├── hooks/
│   └── usePlants.ts           # Data fetching and state management
├── pages/
│   └── PlantsPage.tsx         # Page wrapper component
├── services/
│   └── plantsService.ts       # API service functions
├── types.ts                   # TypeScript type definitions
└── index.ts                   # Public API exports
```

## Data Model

### Plant
- `id`: UUID
- `name`: User-given name
- `commonName`: Common plant name (from AI or manual)
- `location`: Where the plant is located
- `recommendedWaterSchedule`: Watering frequency suggestion
- `lastWatered`: Date of last watering
- `groupId`: Group the plant belongs to
- `userId`: User who created the plant
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### PlantPhoto
- `id`: UUID
- `plantId`: Reference to plant
- `imageUrl`: Cloudinary URL
- `photoDate`: When the photo was taken
- `createdAt`: Creation timestamp

## Security

- Row Level Security (RLS) is enabled on both tables
- Users can only view/edit plants in groups they're members of
- All API endpoints require authentication
- Image uploads are validated and stored in Cloudinary

## Notes

- Images are stored in Cloudinary under the `plant-photos` folder
- The AI identification uses Google Gemini 1.5 Flash model
- Photos are automatically dated when uploaded
- The module requires a group context (cannot be used in self view)

