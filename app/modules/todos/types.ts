// Module-specific types for Todos
export type TodoCategory = 'personal' | 'work' | 'group';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color?: string; // Hex color for UI customization
  userId: string;
  groupId?: string; // NULL for self/personal projects, UUID for group projects
  createdAt: Date;
  updatedAt: Date;
}

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  category: TodoCategory;
  userId: string;
  groupId?: string; // Optional - only for group todos
  projectId?: string; // Optional - todos can belong to a project
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  priority?: 'low' | 'medium' | 'high';
}

export type CreateProjectInput = Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
  userId?: string; // Optional, will be set by API
};
export type UpdateProjectInput = Partial<Omit<Project, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;

export type CreateTodoInput = Omit<Todo, 'id' | 'userId' | 'createdAt' | 'updatedAt'> & {
  userId?: string; // Optional, will be set by API
};
export type UpdateTodoInput = Partial<Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>>;
