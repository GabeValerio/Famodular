// Public API - only export what other modules/pages should use
export { PlantsPage } from './pages/PlantsPage';
export { PlantsComponent } from './components/PlantsComponent';
export { usePlants, usePlantPhotos } from './hooks/usePlants';
export type { Plant, PlantPhoto, CreatePlantInput, UpdatePlantInput, CreatePlantPhotoInput, PlantIdentificationResult } from './types';
export { plantsService } from './services/plantsService';



