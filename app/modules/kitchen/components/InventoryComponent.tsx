"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import {
  Plus,
  Camera,
  AlertTriangle,
  Package,
  Refrigerator,
  Snowflake,
  Archive,
  ChefHat,
  Trash2,
  Edit,
  Calendar,
  Search
} from 'lucide-react';
import { KitchenInventoryItem, KitchenLocation, KitchenItemCategory, InventoryAnalysis } from '../types';
import { useInventory } from '../hooks';
import { PhotoUploadComponent } from './PhotoUploadComponent';

interface InventoryComponentProps {
  groupId: string;
}

const locationIcons = {
  [KitchenLocation.FRIDGE]: Refrigerator,
  [KitchenLocation.FREEZER]: Snowflake,
  [KitchenLocation.PANTRY]: Archive,
  [KitchenLocation.CABINET]: Package,
  [KitchenLocation.COUNTER]: ChefHat,
};

const locationColors = {
  [KitchenLocation.FRIDGE]: 'bg-blue-100 text-blue-800',
  [KitchenLocation.FREEZER]: 'bg-cyan-100 text-cyan-800',
  [KitchenLocation.PANTRY]: 'bg-amber-100 text-amber-800',
  [KitchenLocation.CABINET]: 'bg-gray-100 text-gray-800',
  [KitchenLocation.COUNTER]: 'bg-green-100 text-green-800',
};

export function InventoryComponent({ groupId }: InventoryComponentProps) {
  const {
    items,
    analysis,
    loading,
    error,
    loadItems,
    addItem,
    updateItem,
    deleteItem,
    addFromPhoto,
    analyze,
    byLocation,
    expiringSoon,
    lowStock,
  } = useInventory();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KitchenInventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for adding/editing items
  const [formData, setFormData] = useState({
    name: '',
    category: KitchenItemCategory.OTHER,
    location: KitchenLocation.FRIDGE,
    quantity: 1,
    unit: 'pieces',
    expirationDate: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: KitchenItemCategory.OTHER,
      location: KitchenLocation.FRIDGE,
      quantity: 1,
      unit: 'pieces',
      expirationDate: '',
    });
    setEditingItem(null);
  };

  const handleAddItem = async () => {
    try {
      await addItem({
        ...formData,
        groupId,
        addedBy: 'current-user', // This should come from auth context
      });
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    try {
      await updateItem(editingItem.id, formData);
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(itemId);
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handlePhotoUpload = async (imageData: string[]) => {
    try {
      // Process each image
      for (const image of imageData) {
        await addFromPhoto(image, groupId, 'current-user');
      }
      setIsPhotoDialogOpen(false);
    } catch (error) {
      console.error('Error adding items from photos:', error);
    }
  };

  const handleAnalyze = async () => {
    try {
      await analyze(groupId);
    } catch (error) {
      console.error('Error analyzing inventory:', error);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openEditDialog = (item: KitchenInventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      location: item.location,
      quantity: item.quantity,
      unit: item.unit,
      expirationDate: item.expirationDate || '',
    });
    setIsAddDialogOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8">Loading inventory...</div>;
  }

  if (error) {
    return (
      <Alert className="border-red-200">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kitchen Inventory</h2>
          <p className="text-muted-foreground">Track what's in your fridge, pantry, and cabinets</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Camera className="h-4 w-4 mr-2" />
                Add by Photo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Items by Photo</DialogTitle>
              </DialogHeader>
              <PhotoUploadComponent onPhotoTaken={handlePhotoUpload} />
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Item Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Milk, Bread, Apples"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as KitchenItemCategory })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(KitchenItemCategory).map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Select value={formData.location} onValueChange={(value) => setFormData({ ...formData, location: value as KitchenLocation })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(KitchenLocation).map((location) => (
                          <SelectItem key={location} value={location}>
                            {location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.1"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pieces">pieces</SelectItem>
                        <SelectItem value="lbs">lbs</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                        <SelectItem value="cups">cups</SelectItem>
                        <SelectItem value="cans">cans</SelectItem>
                        <SelectItem value="bottles">bottles</SelectItem>
                        <SelectItem value="packages">packages</SelectItem>
                        <SelectItem value="gallons">gallons</SelectItem>
                        <SelectItem value="quarts">quarts</SelectItem>
                        <SelectItem value="pints">pints</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="expiration">Expiration Date (optional)</Label>
                  <Input
                    id="expiration"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={editingItem ? handleUpdateItem : handleAddItem}
                    disabled={!formData.name.trim()}
                    className="flex-1"
                  >
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={handleAnalyze}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Alerts */}
      {(expiringSoon.length > 0 || lowStock.length > 0) && (
        <div className="space-y-2">
          {expiringSoon.length > 0 && (
            <Alert className="border-orange-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {expiringSoon.length} items expiring soon: {expiringSoon.map(item => item.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {lowStock.length > 0 && (
            <Alert className="border-blue-200">
              <Package className="h-4 w-4" />
              <AlertDescription>
                {lowStock.length} items running low: {lowStock.map(item => item.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Inventory Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({filteredItems.length})</TabsTrigger>
          <TabsTrigger value={KitchenLocation.FRIDGE}>
            Fridge ({byLocation[KitchenLocation.FRIDGE]?.length || 0})
          </TabsTrigger>
          <TabsTrigger value={KitchenLocation.FREEZER}>
            Freezer ({byLocation[KitchenLocation.FREEZER]?.length || 0})
          </TabsTrigger>
          <TabsTrigger value={KitchenLocation.PANTRY}>
            Pantry ({byLocation[KitchenLocation.PANTRY]?.length || 0})
          </TabsTrigger>
          <TabsTrigger value={KitchenLocation.CABINET}>
            Cabinet ({byLocation[KitchenLocation.CABINET]?.length || 0})
          </TabsTrigger>
          <TabsTrigger value={KitchenLocation.COUNTER}>
            Counter ({byLocation[KitchenLocation.COUNTER]?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <InventoryGrid
            items={filteredItems}
            onEdit={openEditDialog}
            onDelete={handleDeleteItem}
          />
        </TabsContent>

        {Object.values(KitchenLocation).map((location) => (
          <TabsContent key={location} value={location}>
            <InventoryGrid
              items={filteredItems.filter(item => item.location === location)}
              onEdit={openEditDialog}
              onDelete={handleDeleteItem}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* AI Analysis */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>AI Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analysis.suggestions.map((suggestion, index) => (
                <p key={index} className="text-sm text-muted-foreground">
                  • {suggestion}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Components
function InventoryGrid({
  items,
  onEdit,
  onDelete
}: {
  items: KitchenInventoryItem[];
  onEdit: (item: KitchenInventoryItem) => void;
  onDelete: (itemId: string) => void;
}) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No items found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-medium truncate">{item.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-xs ${locationColors[item.location]}`}
                  >
                    {item.location}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(item)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Quantity: {item.quantity} {item.unit}</p>
              {item.expirationDate && (
                <p className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Expires: {new Date(item.expirationDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

