"use client";

import { usePlants } from '../hooks/usePlants';
import { PlantsComponent } from '../components/PlantsComponent';

export function PlantsPage({ groupId }: { groupId: string }) {
  const {
    plants,
    loading,
    error,
    createPlant,
    updatePlant,
    deletePlant,
    markAsWatered,
  } = usePlants(groupId);

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

