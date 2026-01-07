"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import {
  Package,
  ShoppingCart,
  ChefHat,
  BarChart3,
  Refrigerator,
  Calculator,
  Sparkles,
  Users
} from 'lucide-react';
import { InventoryComponent, GroceryListComponent, MealPlanComponent } from '../components';
import { useKitchen } from '../hooks';

interface KitchenPageProps {
  groupId: string;
}

export function KitchenPage({ groupId }: KitchenPageProps) {
  const {
    inventory,
    groceryLists,
    mealPlans,
    inventoryAnalysis,
    expiringSoon,
    lowStock,
  } = useKitchen(groupId);

  const [activeTab, setActiveTab] = useState('overview');

  // Calculate some stats for the overview
  const totalInventoryItems = inventory.length;
  const activeGroceryLists = groceryLists.filter(list => !list.isCompleted).length;
  const totalGroceryItems = groceryLists.reduce((total, list) => total + list.items.length, 0);
  const completedGroceryItems = groceryLists.reduce((total, list) =>
    total + list.items.filter(item => item.isCompleted).length, 0
  );
  const totalMealPlans = mealPlans.length;

  const groceryCompletionRate = totalGroceryItems > 0
    ? Math.round((completedGroceryItems / totalGroceryItems) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kitchen</h1>
          <p className="text-muted-foreground">
            Manage your food inventory, create shopping lists, and plan meals with AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            Family Kitchen
          </Badge>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="shopping" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Shopping
          </TabsTrigger>
          <TabsTrigger value="meals" className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Meal Planning
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Inventory Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalInventoryItems}</div>
                <p className="text-xs text-muted-foreground">
                  {expiringSoon.length > 0 && `${expiringSoon.length} expiring soon`}
                  {expiringSoon.length === 0 && lowStock.length === 0 && 'All stocked up'}
                  {lowStock.length > 0 && !expiringSoon.length && `${lowStock.length} running low`}
                </p>
              </CardContent>
            </Card>

            {/* Grocery Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shopping Lists</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeGroceryLists}</div>
                <p className="text-xs text-muted-foreground">
                  {completedGroceryItems}/{totalGroceryItems} items completed
                </p>
              </CardContent>
            </Card>

            {/* Meal Planning Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Meal Plans</CardTitle>
                <ChefHat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMealPlans}</div>
                <p className="text-xs text-muted-foreground">
                  AI-generated plans
                </p>
              </CardContent>
            </Card>

            {/* Completion Rate */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Shopping Progress</CardTitle>
                <Calculator className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{groceryCompletionRate}%</div>
                <p className="text-xs text-muted-foreground">
                  Average completion rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Jump to common kitchen tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <button
                  onClick={() => setActiveTab('inventory')}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Refrigerator className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Add to Inventory</span>
                </button>

                <button
                  onClick={() => setActiveTab('shopping')}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Create Shopping List</span>
                </button>

                <button
                  onClick={() => setActiveTab('meals')}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <ChefHat className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Plan Meals</span>
                </button>

                <button
                  onClick={() => setActiveTab('inventory')}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">AI Analysis</span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity / Alerts */}
          {(expiringSoon.length > 0 || lowStock.length > 0 || inventoryAnalysis) && (
            <Card>
              <CardHeader>
                <CardTitle>Alerts & Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {expiringSoon.length > 0 && (
                  <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-800">
                        {expiringSoon.length} items expiring soon
                      </span>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      {expiringSoon.slice(0, 3).map(item => item.name).join(', ')}
                      {expiringSoon.length > 3 && ` and ${expiringSoon.length - 3} more`}
                    </p>
                  </div>
                )}

                {lowStock.length > 0 && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="h-4 w-4 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        {lowStock.length} items running low
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mt-1">
                      {lowStock.slice(0, 3).map(item => item.name).join(', ')}
                      {lowStock.length > 3 && ` and ${lowStock.length - 3} more`}
                    </p>
                  </div>
                )}

                {inventoryAnalysis && (
                  <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-800">AI Insights</span>
                    </div>
                    <ul className="text-sm text-green-700 mt-1 space-y-1">
                      {inventoryAnalysis.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <InventoryComponent groupId={groupId} />
        </TabsContent>

        {/* Shopping Tab */}
        <TabsContent value="shopping">
          <GroceryListComponent groupId={groupId} />
        </TabsContent>

        {/* Meal Planning Tab */}
        <TabsContent value="meals">
          <MealPlanComponent groupId={groupId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

