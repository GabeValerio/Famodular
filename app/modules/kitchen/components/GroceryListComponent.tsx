"use client";

import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import {
  Plus,
  ShoppingCart,
  CheckSquare,
  Square,
  Trash2,
  Edit,
  DollarSign,
  PlusCircle,
  ChefHat
} from 'lucide-react';
import { KitchenGroceryList, KitchenGroceryItem, KitchenItemCategory } from '../types';
import { useKitchen } from '../hooks';

interface GroceryListComponentProps {
  groupId: string;
}

export function GroceryListComponent({ groupId }: GroceryListComponentProps) {
  const {
    groceryLists,
    loading,
    createGroceryList,
    updateGroceryList,
    deleteGroceryList,
    addGroceryItem,
    updateGroceryItem,
    deleteGroceryItem,
    generateGrocerySuggestions,
  } = useKitchen(groupId);

  const [isCreateListDialogOpen, setIsCreateListDialogOpen] = useState(false);
  const [selectedList, setSelectedList] = useState<KitchenGroceryList | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'pieces',
    category: KitchenItemCategory.OTHER,
    estimatedCost: 0,
    notes: '',
  });

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      await createGroceryList({
        name: newListName,
        groupId,
        createdBy: 'current-user', // Should come from auth
      });
      setNewListName('');
      setIsCreateListDialogOpen(false);
    } catch (error) {
      console.error('Error creating grocery list:', error);
    }
  };

  const handleAddItem = async (listId: string) => {
    if (!newItem.name.trim()) return;
    try {
      await addGroceryItem(listId, {
        ...newItem,
        groupId,
        addedBy: 'current-user', // Should come from auth
      });
      setNewItem({
        name: '',
        quantity: 1,
        unit: 'pieces',
        category: KitchenItemCategory.OTHER,
        estimatedCost: 0,
        notes: '',
      });
    } catch (error) {
      console.error('Error adding grocery item:', error);
    }
  };

  const handleToggleItem = async (list: KitchenGroceryList, itemId: string, isCompleted: boolean) => {
    try {
      await updateGroceryItem(list.id, itemId, { isCompleted });
    } catch (error) {
      console.error('Error updating grocery item:', error);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (confirm('Are you sure you want to delete this grocery list?')) {
      try {
        await deleteGroceryList(listId);
        if (selectedList?.id === listId) {
          setSelectedList(null);
        }
      } catch (error) {
        console.error('Error deleting grocery list:', error);
      }
    }
  };

  const handleDeleteItem = async (listId: string, itemId: string) => {
    try {
      await deleteGroceryItem(listId, itemId);
    } catch (error) {
      console.error('Error deleting grocery item:', error);
    }
  };

  const handleGenerateFromMealPlan = async () => {
    // This would typically open a dialog to select a meal plan
    // For now, we'll just show a placeholder
    alert('Meal plan integration coming soon!');
  };

  const getCompletedCount = (items: KitchenGroceryItem[]) => {
    return items.filter(item => item.isCompleted).length;
  };

  const getTotalEstimatedCost = (items: KitchenGroceryItem[]) => {
    return items.reduce((total, item) => total + (item.estimatedCost || 0), 0);
  };

  if (loading.groceryLists) {
    return <div className="text-center py-8">Loading grocery lists...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Grocery Lists</h2>
          <p className="text-muted-foreground">Create and manage shopping lists</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateFromMealPlan}>
            <ChefHat className="h-4 w-4 mr-2" />
            From Meal Plan
          </Button>

          <Dialog open={isCreateListDialogOpen} onOpenChange={setIsCreateListDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Grocery List</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="listName">List Name</Label>
                  <Input
                    id="listName"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., Weekly Groceries, Party Supplies"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleCreateList} disabled={!newListName.trim()} className="flex-1">
                    Create List
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateListDialogOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lists Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {groceryLists.map((list) => (
          <Card key={list.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{list.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedList(selectedList?.id === list.id ? null : list)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteList(list.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{getCompletedCount(list.items)}/{list.items.length} items</span>
                <span className="flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {getTotalEstimatedCost(list.items).toFixed(2)}
                </span>
              </div>
            </CardHeader>

            {selectedList?.id === list.id && (
              <CardContent className="space-y-4">
                {/* Add new item form */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-medium">Add Item</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Item name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                    <div className="flex gap-1">
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 1 })}
                        className="w-20"
                      />
                      <select
                        value={newItem.unit}
                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="pieces">pieces</option>
                        <option value="lbs">lbs</option>
                        <option value="oz">oz</option>
                        <option value="cups">cups</option>
                        <option value="cans">cans</option>
                        <option value="bottles">bottles</option>
                        <option value="packages">packages</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Est. cost"
                      value={newItem.estimatedCost}
                      onChange={(e) => setNewItem({ ...newItem, estimatedCost: parseFloat(e.target.value) || 0 })}
                      className="w-24"
                    />
                    <Button
                      onClick={() => handleAddItem(list.id)}
                      disabled={!newItem.name.trim()}
                      size="sm"
                    >
                      <PlusCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Items list */}
                <div className="border-t pt-4 space-y-2">
                  <h4 className="font-medium">Items</h4>
                  {list.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No items yet</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {list.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                          <Checkbox
                            checked={item.isCompleted}
                            onCheckedChange={(checked) =>
                              handleToggleItem(list, item.id, checked as boolean)
                            }
                          />
                          <div className="flex-1">
                            <span className={item.isCompleted ? 'line-through text-muted-foreground' : ''}>
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{item.quantity} {item.unit}</span>
                              {item.estimatedCost > 0 && (
                                <span className="flex items-center">
                                  <DollarSign className="h-3 w-3 mr-1" />
                                  {item.estimatedCost.toFixed(2)}
                                </span>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(list.id, item.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {/* Empty state */}
        {groceryLists.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No grocery lists yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first shopping list to get started
              </p>
              <Button onClick={() => setIsCreateListDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Grocery List
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
