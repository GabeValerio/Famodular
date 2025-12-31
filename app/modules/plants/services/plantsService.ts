import { Plant, PlantPhoto, CreatePlantInput, UpdatePlantInput, CreatePlantPhotoInput, PlantIdentificationResult } from '../types';

const API_BASE = '/api/modules/group/plants';

export const plantsService = {
  async getPlants(groupId: string): Promise<Plant[]> {
    const response = await fetch(`${API_BASE}?groupId=${groupId}`);
    if (!response.ok) throw new Error('Failed to fetch plants');
    return response.json();
  },

  async getPlant(id: string): Promise<Plant> {
    const response = await fetch(`${API_BASE}/${id}`);
    if (!response.ok) throw new Error('Failed to fetch plant');
    return response.json();
  },

  async createPlant(plant: CreatePlantInput): Promise<Plant> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plant),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create plant' }));
      throw new Error(errorData.error || 'Failed to create plant');
    }
    return response.json();
  },

  async updatePlant(id: string, updates: UpdatePlantInput): Promise<Plant> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update plant');
    return response.json();
  },

  async deletePlant(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete plant');
  },

  async getPlantPhotos(plantId: string): Promise<PlantPhoto[]> {
    const response = await fetch(`${API_BASE}/${plantId}/photos`);
    if (!response.ok) throw new Error('Failed to fetch plant photos');
    return response.json();
  },

  async addPlantPhoto(photo: CreatePlantPhotoInput): Promise<PlantPhoto> {
    const response = await fetch(`${API_BASE}/${photo.plantId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl: photo.imageUrl,
        photoDate: photo.photoDate,
      }),
    });
    if (!response.ok) throw new Error('Failed to add plant photo');
    return response.json();
  },

  async deletePlantPhoto(plantId: string, photoId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${plantId}/photos/${photoId}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete plant photo');
  },

  async identifyPlant(imageBase64: string): Promise<PlantIdentificationResult> {
    const response = await fetch(`${API_BASE}/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to identify plant' }));
      throw new Error(errorData.error || 'Failed to identify plant');
    }
    return response.json();
  },
};





