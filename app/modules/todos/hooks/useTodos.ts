import { useState, useEffect } from 'react';
import { todosService } from '../services/todosService';
import { projectsService } from '../services/projectsService';
import { Todo, TodoCategory, CreateTodoInput, UpdateTodoInput, Project, CreateProjectInput, UpdateProjectInput } from '../types';

export function useTodos(groupId?: string) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TodoCategory | 'all'>('all');

  // Fetch initial data
  useEffect(() => {
    loadData();
  }, [filter, groupId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const category = filter === 'all' ? undefined : filter;
      // CRITICAL: Pass groupId to projects service for data isolation
      const [todosData, projectsData] = await Promise.all([
        todosService.getTodos(category, groupId),
        projectsService.getProjects(groupId),
      ]);
      setTodos(todosData);
      setProjects(projectsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async (todo: CreateTodoInput) => {
    try {
      const newTodo = await todosService.createTodo(todo);
      setTodos(prev => [newTodo, ...prev]);
      return newTodo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create todo');
      throw err;
    }
  };

  const updateTodo = async (id: string, updates: UpdateTodoInput) => {
    try {
      const updatedTodo = await todosService.updateTodo(id, updates);
      setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));
      return updatedTodo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
      throw err;
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      await todosService.deleteTodo(id);
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
      throw err;
    }
  };

  const toggleTodo = async (id: string) => {
    try {
      const updatedTodo = await todosService.toggleTodo(id);
      setTodos(prev => prev.map(t => t.id === id ? updatedTodo : t));
      return updatedTodo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle todo');
      throw err;
    }
  };

  // Project management functions
  const createProject = async (project: CreateProjectInput) => {
    try {
      const newProject = await projectsService.createProject(project);
      setProjects(prev => [newProject, ...prev]);
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    }
  };

  const updateProject = async (id: string, updates: UpdateProjectInput) => {
    try {
      const updatedProject = await projectsService.updateProject(id, updates);
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      return updatedProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectsService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      // Also remove projectId from todos that belong to this project
      setTodos(prev => prev.map(t => t.projectId === id ? { ...t, projectId: undefined } : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    }
  };

  // Filter todos by current filter
  const filteredTodos = todos.filter(todo => {
    if (filter === 'all') return true;
    return todo.category === filter;
  });

  // Organize todos by project
  const todosByProject = filteredTodos.reduce((acc, todo) => {
    const projectId = todo.projectId || 'no-project';
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);

  return {
    todos: filteredTodos,
    allTodos: todos,
    projects,
    todosByProject,
    loading,
    error,
    filter,
    setFilter,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    createProject,
    updateProject,
    deleteProject,
    refreshTodos: loadData,
  };
}
