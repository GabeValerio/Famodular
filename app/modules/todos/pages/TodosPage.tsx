"use client";

import { useTodos } from '../hooks/useTodos';
import { TodosComponent } from '../components/TodosComponent';
import { useGroup } from '@/lib/GroupContext';

export function TodosPage() {
  const { currentGroup, isSelfView } = useGroup();
  
  // CRITICAL: Pass null for self view, groupId for group view (never undefined or empty string)
  // This ensures proper data isolation in the API
  const groupId = isSelfView || !currentGroup ? null : currentGroup.id;
  
  const {
    todos,
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
  } = useTodos(groupId);

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
