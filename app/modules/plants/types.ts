// Module-specific types for Plants

export interface Plant {
  id: string;
  name: string; // User-given name (e.g., "My Rosemary")
  commonName: string; // Common plant name from AI (e.g., "Rosemary Bush")
  location: string; // Where the plant is located (e.g., "Living Room", "Kitchen Window")
  recommendedWaterSchedule?: string; // Water schedule from AI (e.g., "1/week", "1/month")
  waterAmount?: string; // How much water to add (e.g. "1 cup", "Soak soil")
  lastWatered?: Date; // Last time the plant was watered
  latestPhotoUrl?: string; // URL of the most recent photo
  groupId: string; // Group this plant belongs to
  userId: string; // User who created the plant
  createdAt: Date;
  updatedAt: Date;
}

export interface PlantPhoto {
  id: string;
  plantId: string;
  imageUrl: string; // Cloudinary URL
  photoDate: Date; // When this photo was taken
  createdAt: Date;
}

export type CreatePlantInput = Omit<Plant, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
  userId?: string; // Optional, will be set by API
};

export type UpdatePlantInput = Partial<Omit<Plant, 'id' | 'userId' | 'groupId' | 'createdAt' | 'updatedAt'>>;

export type CreatePlantPhotoInput = Omit<PlantPhoto, 'id' | 'createdAt'>;

export interface PlantIdentificationResult {
  commonName: string;
  recommendedWaterSchedule: string;
  waterAmount: string;
  confidence?: string;
}

