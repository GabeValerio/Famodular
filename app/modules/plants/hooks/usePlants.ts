import { useState, useEffect } from 'react';
import { plantsService } from '../services/plantsService';
import { Plant, PlantPhoto, CreatePlantInput, UpdatePlantInput, CreatePlantPhotoInput } from '../types';

export function usePlants(groupId: string) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }
    loadData();
  }, [groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const plantsData = await plantsService.getPlants(groupId);
      setPlants(plantsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plants');
    } finally {
      setLoading(false);
    }
  };

  const createPlant = async (plant: CreatePlantInput) => {
    try {
      const newPlant = await plantsService.createPlant(plant);
      setPlants(prev => [newPlant, ...prev]);
      return newPlant;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plant');
      throw err;
    }
  };

  const updatePlant = async (id: string, updates: UpdatePlantInput) => {
    try {
      const updatedPlant = await plantsService.updatePlant(id, updates);
      setPlants(prev => prev.map(p => p.id === id ? { ...updatedPlant, latestPhotoUrl: p.latestPhotoUrl } : p));
      return updatedPlant;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plant');
      throw err;
    }
  };

  const deletePlant = async (id: string) => {
    try {
      await plantsService.deletePlant(id);
      setPlants(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete plant');
      throw err;
    }
  };

  const markAsWatered = async (id: string) => {
    try {
      const updatedPlant = await plantsService.updatePlant(id, {
        lastWatered: new Date(),
      });
      setPlants(prev => prev.map(p => p.id === id ? { ...updatedPlant, latestPhotoUrl: p.latestPhotoUrl } : p));
      return updatedPlant;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark plant as watered');
      throw err;
    }
  };

  return {
    plants,
    loading,
    error,
    createPlant,
    updatePlant,
    deletePlant,
    markAsWatered,
    refreshPlants: loadData,
  };
}

export function usePlantPhotos(plantId: string | null) {
  const [photos, setPhotos] = useState<PlantPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!plantId) {
      setLoading(false);
      return;
    }
    loadPhotos();
  }, [plantId]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      setError(null);
      const photosData = await plantsService.getPlantPhotos(plantId!);
      setPhotos(photosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plant photos');
    } finally {
      setLoading(false);
    }
  };

  const addPhoto = async (photo: CreatePlantPhotoInput) => {
    try {
      const newPhoto = await plantsService.addPlantPhoto(photo);
      setPhotos(prev => [newPhoto, ...prev]);
      return newPhoto;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add photo');
      throw err;
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      if (!plantId) throw new Error('Plant ID is required');
      await plantsService.deletePlantPhoto(plantId, photoId);
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
      throw err;
    }
  };

  return {
    photos,
    loading,
    error,
    addPhoto,
    deletePhoto,
    refreshPhotos: loadPhotos,
  };
}

