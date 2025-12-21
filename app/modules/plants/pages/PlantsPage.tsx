"use client";

import { usePlants } from '../hooks/usePlants';
import { PlantsComponent } from '../components/PlantsComponent';

export function PlantsPage({ groupId }: { groupId: string }) {
  const {
    plants,
    loading,
    error,
    createPlant,
    updatePlant: updatePlantRaw,
    deletePlant,
    markAsWatered: markAsWateredRaw,
  } = usePlants(groupId);

  // Wrap to match component prop types (Promise<void>)
  const updatePlant = async (id: string, updates: import('../types').UpdatePlantInput) => {
    await updatePlantRaw(id, updates);
  };

  const markAsWatered = async (id: string) => {
    await markAsWateredRaw(id);
  };

  return (
    <PlantsComponent
      plants={plants}
      loading={loading}
      error={error}
      onCreatePlant={createPlant}
      onUpdatePlant={updatePlant}
      onDeletePlant={deletePlant}
      onMarkAsWatered={markAsWatered}
      groupId={groupId}
    />
  );
}

