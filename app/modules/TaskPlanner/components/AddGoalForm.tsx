'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";

export interface NewGoalForm {
  text: string;
  goal?: string;
  progress?: number;
}

interface AddGoalFormProps {
  newGoal: NewGoalForm;
  setNewGoal: (goal: NewGoalForm) => void;
  handleAddGoal: (e: React.FormEvent) => Promise<void>;
  setIsAddingGoal: (isAdding: boolean) => void;
}

export default function AddGoalForm({
  newGoal,
  setNewGoal,
  handleAddGoal,
  setIsAddingGoal,
}: AddGoalFormProps) {
  return (
    <form onSubmit={handleAddGoal} className="space-y-4">
      <div>
        <Label htmlFor="goal-text">Goal Title</Label>
        <Input
          id="goal-text"
          type="text"
          value={newGoal.text}
          onChange={(e) => setNewGoal({ ...newGoal, text: e.target.value })}
          placeholder="Enter your goal..."
          className="mt-1"
          required
          autoFocus
        />
      </div>

      <div>
        <Label htmlFor="goal-description">Description (Optional)</Label>
        <Textarea
          id="goal-description"
          value={newGoal.goal || ''}
          onChange={(e) => setNewGoal({ ...newGoal, goal: e.target.value })}
          placeholder="Add more details about your goal..."
          className="mt-1"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="goal-progress">Initial Progress (%)</Label>
        <Input
          id="goal-progress"
          type="number"
          min="0"
          max="100"
          value={newGoal.progress || 0}
          onChange={(e) => setNewGoal({ ...newGoal, progress: parseInt(e.target.value) || 0 })}
          className="mt-1"
        />
      </div>

      <div className="flex gap-4 mt-6">
        <Button
          type="submit"
          className="flex-1 bg-black text-white py-3 px-4 rounded-md hover:bg-gray-800 font-medium border border-black shadow-sm transition-all duration-200"
        >
          Add Goal
        </Button>
        <Button
          type="button"
          onClick={() => setIsAddingGoal(false)}
          variant="outline"
          className="flex-1 bg-white py-3 px-4 rounded-md hover:bg-gray-100 text-gray-700 font-medium border border-gray-300 shadow-sm transition-all duration-200"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}

