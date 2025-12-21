"use client";

import { useTodos } from '../hooks/useTodos';
import { TodosComponent } from '../components/TodosComponent';
import { useGroup } from '@/lib/GroupContext';
import { CreateTodoInput, UpdateTodoInput, CreateProjectInput, UpdateProjectInput } from '../types';

export function TodosPage() {
  const { currentGroup, isSelfView } = useGroup();
  
  // CRITICAL: Pass undefined for self view, groupId for group view (never empty string)
  // This ensures proper data isolation in the API
  const groupId = isSelfView || !currentGroup ? undefined : currentGroup.id;
  
  const {
    todos,
    projects,
    todosByProject,
    loading,
    error,
    filter,
    setFilter,
    createTodo: createTodoRaw,
    updateTodo: updateTodoRaw,
    deleteTodo,
    toggleTodo: toggleTodoRaw,
    createProject: createProjectRaw,
    updateProject: updateProjectRaw,
    deleteProject,
  } = useTodos(groupId);

  // Wrap functions to match component prop types (Promise<void>)
  const createTodo = async (todo: CreateTodoInput) => {
    await createTodoRaw(todo);
  };
  
  const updateTodo = async (id: string, updates: UpdateTodoInput) => {
    await updateTodoRaw(id, updates);
  };
  
  const toggleTodo = async (id: string) => {
    await toggleTodoRaw(id);
  };
  
  const createProject = async (project: CreateProjectInput) => {
    await createProjectRaw(project);
  };
  
  const updateProject = async (id: string, updates: UpdateProjectInput) => {
    await updateProjectRaw(id, updates);
  };

  return (
    <TodosComponent
      todos={todos}
      projects={projects}
      todosByProject={todosByProject}
      loading={loading}
      error={error}
      filter={filter}
      onSetFilter={setFilter}
      onCreateTodo={createTodo}
      onUpdateTodo={updateTodo}
      onDeleteTodo={deleteTodo}
      onToggleTodo={toggleTodo}
      onCreateProject={createProject}
      onUpdateProject={updateProject}
      onDeleteProject={deleteProject}
      groupId={groupId}
    />
  );
}
