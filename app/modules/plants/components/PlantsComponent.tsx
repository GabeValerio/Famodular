"use client";

import { useState, useRef } from 'react';
import { Plant, CreatePlantInput, UpdatePlantInput } from '../types';
import { usePlantPhotos } from '../hooks/usePlants';
import { plantsService } from '../services/plantsService';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Droplet, 
  Camera, 
  Image as ImageIcon,
  X,
  Loader2,
  Sparkles
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Card } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface PlantsComponentProps {
  plants: Plant[];
  loading: boolean;
  error: string | null;
  onCreatePlant: (plant: CreatePlantInput) => Promise<Plant>;
  onUpdatePlant: (id: string, updates: UpdatePlantInput) => Promise<void>;
  onDeletePlant: (id: string) => Promise<void>;
  onMarkAsWatered: (id: string) => Promise<void>;
  groupId: string;
}

export function PlantsComponent({
  plants,
  loading,
  error,
  onCreatePlant,
  onUpdatePlant,
  onDeletePlant,
  onMarkAsWatered,
  groupId,
}: PlantsComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [identifying, setIdentifying] = useState(false);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [pendingPhotoBase64, setPendingPhotoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    commonName: '',
    location: '',
    recommendedWaterSchedule: '',
    waterAmount: '',
    lastWatered: '',
  });

  const { photos, loading: photosLoading, addPhoto, deletePhoto } = usePlantPhotos(
    selectedPlant?.id || null
  );

  const handleOpenModal = (plant?: Plant) => {
    if (plant) {
      setEditingPlant(plant);
      setFormData({
        name: plant.name,
        commonName: plant.commonName || '',
        location: plant.location || '',
        recommendedWaterSchedule: plant.recommendedWaterSchedule || '',
        waterAmount: plant.waterAmount || '',
        lastWatered: plant.lastWatered 
          ? new Date(plant.lastWatered).toISOString().split('T')[0]
          : '',
      });
    } else {
      setEditingPlant(null);
      setFormData({
        name: '',
        commonName: '',
        location: '',
        recommendedWaterSchedule: '',
        waterAmount: '',
        lastWatered: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlant(null);
    setPendingPhotoUrl(null);
    setPendingPhotoBase64(null);
    setFormData({
      name: '',
      commonName: '',
      location: '',
      recommendedWaterSchedule: '',
      waterAmount: '',
      lastWatered: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const plantData = {
        name: formData.name,
        commonName: formData.commonName || undefined,
        location: formData.location || undefined,
        recommendedWaterSchedule: formData.recommendedWaterSchedule || undefined,
        waterAmount: formData.waterAmount || undefined,
        lastWatered: formData.lastWatered ? new Date(formData.lastWatered) : undefined,
        groupId,
      };

      if (editingPlant) {
        await onUpdatePlant(editingPlant.id, plantData);
      } else {
        const newPlant = await onCreatePlant(plantData);
        
        // If there's a pending photo, add it to the newly created plant
        if (pendingPhotoUrl && newPlant) {
          try {
            await plantsService.addPlantPhoto({
              plantId: newPlant.id,
              imageUrl: pendingPhotoUrl,
              photoDate: new Date(),
            });
          } catch (photoError) {
            console.error('Error adding photo to new plant:', photoError);
            // Don't fail the whole operation if photo add fails
          }
          setPendingPhotoUrl(null);
        }
      }
      handleCloseModal();
    } catch (error) {
      console.error('Error saving plant:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      // Convert file to base64 for AI analysis
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      await new Promise<void>((resolve, reject) => {
        reader.onload = () => resolve();
        reader.onerror = reject;
      });

      const base64String = reader.result as string;

      // Upload image to Cloudinary first
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'plant-photos');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.data.url;

      // If creating a new plant, open modal with image ready for analysis
      if (!editingPlant) {
        setFormData({
          name: '',
          commonName: '',
          location: '',
          recommendedWaterSchedule: '',
          waterAmount: '',
          lastWatered: '',
        });
        setPendingPhotoUrl(imageUrl);
        setPendingPhotoBase64(base64String);
        setIsModalOpen(true);
      } else {
        // Add photo to existing plant
        await addPhoto({
          plantId: editingPlant.id,
          imageUrl,
          photoDate: new Date(),
        });
      }
    } catch (error) {
      console.error('Error handling image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const handleAnalyzePlant = async () => {
    if (!pendingPhotoBase64) {
      alert('Please upload an image first');
      return;
    }

    setIdentifying(true);
    try {
      const identification = await plantsService.identifyPlant(pendingPhotoBase64);
      setFormData(prev => ({
        ...prev,
        name: identification.commonName || prev.name,
        commonName: identification.commonName,
        recommendedWaterSchedule: identification.recommendedWaterSchedule,
        waterAmount: identification.waterAmount,
      }));
    } catch (error) {
      console.error('AI identification failed:', error);
      alert('Failed to identify plant. Please enter the information manually.');
    } finally {
      setIdentifying(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    await handleImageUpload(file);
  };

  const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPlant) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      // Upload image to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'plant-photos');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image');
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.data.url;

      await addPhoto({
        plantId: selectedPlant.id,
        imageUrl,
        photoDate: new Date(),
      });
    } catch (error) {
      console.error('Error adding photo:', error);
      alert('Failed to add photo. Please try again.');
    }
  };

  const getDaysSinceWatered = (lastWatered?: Date) => {
    if (!lastWatered) return null;
    const days = Math.floor((Date.now() - new Date(lastWatered).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getWateringStatus = (plant: Plant) => {
    const days = getDaysSinceWatered(plant.lastWatered);
    if (days === null) return { label: 'Never watered', color: 'text-gray-500' };
    if (days === 0) return { label: 'Watered today', color: 'text-green-600' };
    if (days === 1) return { label: 'Watered yesterday', color: 'text-green-500' };
    if (days < 7) return { label: `${days} days ago`, color: 'text-yellow-600' };
    return { label: `${days} days ago`, color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">House Plants</h2>
          <p className="text-slate-500">Track and care for your plants</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Camera className="mr-2 h-4 w-4" />
            Add Plant from Photo
          </Button>
          <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Plant
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {plants.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">No plants yet. Add your first plant to get started!</p>
          <Button onClick={() => handleOpenModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Plant
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plants.map(plant => {
            const wateringStatus = getWateringStatus(plant);
            
            return (
              <Card key={plant.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="space-y-3">
                  {/* Plant Image - placeholder for now, actual photos shown in gallery */}
                  <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden"
                       onClick={() => {
                         setSelectedPlant(plant);
                         setIsPhotoModalOpen(true);
                       }}>
                    {plant.latestPhotoUrl ? (
                      <img
                        src={plant.latestPhotoUrl}
                        alt={plant.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  {/* Plant Info */}
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800">{plant.name}</h3>
                    {plant.commonName && (
                      <p className="text-sm text-slate-600">{plant.commonName}</p>
                    )}
                    {plant.location && (
                      <p className="text-sm text-slate-500 mt-1">📍 {plant.location}</p>
                    )}
                  </div>

                  {/* Watering Info */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Watering:</span>
                      <span className={`text-sm font-medium ${wateringStatus.color}`}>
                        {wateringStatus.label}
                      </span>
                    </div>
                    {plant.recommendedWaterSchedule && (
                      <p className="text-xs text-slate-500">
                        Schedule: {plant.recommendedWaterSchedule}
                      </p>
                    )}
                    {plant.waterAmount && (
                      <p className="text-xs text-slate-500">
                        Amount: {plant.waterAmount}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkAsWatered(plant.id)}
                      className="flex-1"
                    >
                      <Droplet className="h-4 w-4 mr-1" />
                      Water
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedPlant(plant);
                        setIsPhotoModalOpen(true);
                      }}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(plant)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this plant?')) {
                          onDeletePlant(plant.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Plant Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPlant ? 'Edit Plant' : 'Add New Plant'}</DialogTitle>
          </DialogHeader>
          
          {/* Show uploaded image if available */}
          {pendingPhotoUrl && !editingPlant && (
            <div className="space-y-2 mb-4">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                <img
                  src={pendingPhotoUrl}
                  alt="Plant to identify"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                onClick={handleAnalyzePlant}
                disabled={identifying}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {identifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Plant
                  </>
                )}
              </Button>
              {identifying && (
                <p className="text-sm text-indigo-600 text-center">
                  Identifying plant and getting care instructions...
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Name *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., My Rosemary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Common Plant Name
              </label>
              <Input
                value={formData.commonName}
                onChange={(e) => setFormData({ ...formData, commonName: e.target.value })}
                placeholder="e.g., Rosemary Bush"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location
              </label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Living Room, Kitchen Window"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Recommended Water Schedule
              </label>
              <Input
                value={formData.recommendedWaterSchedule}
                onChange={(e) => setFormData({ ...formData, recommendedWaterSchedule: e.target.value })}
                placeholder="e.g., 1/week, 1/month"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Water Amount
              </label>
              <Input
                value={formData.waterAmount}
                onChange={(e) => setFormData({ ...formData, waterAmount: e.target.value })}
                placeholder="e.g., 1 cup, Soak soil"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Last Watered
              </label>
              <Input
                type="date"
                value={formData.lastWatered}
                onChange={(e) => setFormData({ ...formData, lastWatered: e.target.value })}
              />
            </div>


            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                {editingPlant ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Photo Gallery Modal */}
      <Dialog open={isPhotoModalOpen} onOpenChange={setIsPhotoModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPlant?.name} - Photo Gallery
            </DialogTitle>
          </DialogHeader>
          {selectedPlant && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-slate-600">
                  Track your plant's growth over time
                </p>
                <Button
                  onClick={() => photoFileInputRef.current?.click()}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Add Photo
                </Button>
              </div>
              <input
                ref={photoFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAddPhoto}
                className="hidden"
              />

              {photosLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : photos.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No photos yet. Add a photo to track growth!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={photo.imageUrl}
                          alt={`${selectedPlant.name} on ${new Date(photo.photoDate).toLocaleDateString()}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this photo?')) {
                              deletePhoto(photo.id);
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 text-center">
                        {new Date(photo.photoDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

