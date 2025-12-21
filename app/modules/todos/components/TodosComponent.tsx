"use client";

import { useState, useEffect } from 'react';
import { Todo, TodoCategory, CreateTodoInput, UpdateTodoInput, Project, CreateProjectInput, UpdateProjectInput } from '../types';
import { Plus, Check, X, Trash2, Edit2, Calendar, Flag, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';

interface TodosComponentProps {
  todos: Todo[];
  projects: Project[];
  todosByProject: Record<string, Todo[]>;
  loading: boolean;
  error: string | null;
  filter: TodoCategory | 'all';
  onSetFilter: (filter: TodoCategory | 'all') => void;
  onCreateTodo: (todo: CreateTodoInput) => Promise<void>;
  onUpdateTodo: (id: string, updates: UpdateTodoInput) => Promise<void>;
  onDeleteTodo: (id: string) => Promise<void>;
  onToggleTodo: (id: string) => Promise<void>;
  onCreateProject: (project: CreateProjectInput) => Promise<void>;
  onUpdateProject: (id: string, updates: UpdateProjectInput) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  groupId?: string;
}

const FILTER_OPTIONS: Array<{ value: TodoCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'personal', label: 'Personal' },
  { value: 'work', label: 'Work' },
  { value: 'group', label: 'Group' },
];

const PRIORITY_COLORS = {
  low: 'text-green-600 bg-green-50 border-green-200',
  medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  high: 'text-red-600 bg-red-50 border-red-200',
};

const CATEGORY_COLORS = {
  personal: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  work: 'bg-slate-100 text-slate-700 border-slate-200',
  group: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

export function TodosComponent({
  todos,
  projects,
  todosByProject,
  loading,
  error,
  filter,
  onSetFilter,
  onCreateTodo,
  onUpdateTodo,
  onDeleteTodo,
  onToggleTodo,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  groupId,
}: TodosComponentProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'personal' as TodoCategory,
    priority: 'medium' as 'low' | 'medium' | 'high',
    dueDate: '',
    projectId: '',
  });
  const [projectFormData, setProjectFormData] = useState({
    name: '',
    description: '',
    color: '#6366f1', // Default indigo color
  });

  // Expand projects with active todos by default
  useEffect(() => {
    const projectsWithActiveTodos = projects
      .filter(project => {
        const projectTodos = todosByProject[project.id] || [];
        return projectTodos.some(t => !t.completed);
      })
      .map(p => p.id);
    
    if (projectsWithActiveTodos.length > 0) {
      setExpandedProjects(new Set(projectsWithActiveTodos));
    }
  }, [projects, todosByProject]);

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleOpenModal = (todo?: Todo) => {
    if (todo) {
      setEditingTodo(todo);
      setFormData({
        title: todo.title,
        description: todo.description || '',
        category: todo.category,
        priority: todo.priority || 'medium',
        dueDate: todo.dueDate ? new Date(todo.dueDate).toISOString().split('T')[0] : '',
        projectId: todo.projectId || '',
      });
    } else {
      setEditingTodo(null);
      setFormData({
        title: '',
        description: '',
        category: groupId ? 'group' : 'personal',
        priority: 'medium',
        dueDate: '',
        projectId: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenProjectModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setProjectFormData({
        name: project.name,
        description: project.description || '',
        color: project.color || '#6366f1',
      });
    } else {
      setEditingProject(null);
      setProjectFormData({
        name: '',
        description: '',
        color: '#6366f1',
      });
    }
    setIsProjectModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTodo(null);
    setFormData({
      title: '',
      description: '',
      category: groupId ? 'group' : 'personal',
      priority: 'medium',
      dueDate: '',
      projectId: '',
    });
  };

  const handleCloseProjectModal = () => {
    setIsProjectModalOpen(false);
    setEditingProject(null);
    setProjectFormData({
      name: '',
      description: '',
      color: '#6366f1',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingTodo) {
        await onUpdateTodo(editingTodo.id, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          projectId: formData.projectId || undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        });
      } else {
        // CRITICAL: Set groupId based on context, not just category
        // If we're in group view, ALL todos should have groupId (for data isolation)
        // If we're in self view, todos should have groupId = null/undefined
        await onCreateTodo({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          completed: false,
          // In group view, set groupId for proper data isolation
          // In self view, groupId should be null/undefined
          groupId: groupId || undefined,
          projectId: formData.projectId || undefined,
          dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        });
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save todo:', error);
      // Show error to user
      const errorMessage = error instanceof Error ? error.message : 'Failed to save todo';
      alert(errorMessage); // TODO: Replace with a proper toast/notification component
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFormData.name.trim()) return;

    try {
      if (editingProject) {
        await onUpdateProject(editingProject.id, {
          name: projectFormData.name,
          description: projectFormData.description,
          color: projectFormData.color,
        });
      } else {
        // CRITICAL: Set groupId based on context for data isolation
        // In group view, set groupId for proper data isolation
        // In self view, groupId should be null/undefined
        await onCreateProject({
          name: projectFormData.name,
          description: projectFormData.description,
          color: projectFormData.color,
          groupId: groupId || undefined,
        });
      }
      handleCloseProjectModal();
    } catch (error) {
      console.error('Failed to save project:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save project';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  const completedTodos = todos.filter(t => t.completed);
  const activeTodos = todos.filter(t => !t.completed);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleOpenProjectModal()}
            variant="outline"
            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50"
          >
            <Folder size={18} />
          </Button>
          <Button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus size={18} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-800">{activeTodos.length}</div>
          <div className="text-sm text-slate-500">Active</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-2xl font-bold text-slate-800">{completedTodos.length}</div>
          <div className="text-sm text-slate-500">Completed</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2 md:col-span-1">
          <div className="text-2xl font-bold text-slate-800">{todos.length}</div>
          <div className="text-sm text-slate-500">Total</div>
        </div>
      </div>

      {/* Projects Section */}
      {projects.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Projects</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {projects.map((project) => {
              const projectTodos = todosByProject[project.id] || [];
              const projectActiveTodos = projectTodos.filter(t => !t.completed);
              const projectCompletedTodos = projectTodos.filter(t => t.completed);
              const isExpanded = expandedProjects.has(project.id);

              return (
                <div key={project.id} className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleProject(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-slate-400" />
                        ) : (
                          <ChevronRight size={20} className="text-slate-400" />
                        )}
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: project.color || '#6366f1' }}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800">{project.name}</h4>
                          {project.description && (
                            <p className="text-sm text-slate-500 mt-1">{project.description}</p>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">
                          {projectActiveTodos.length} active, {projectCompletedTodos.length} completed
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setFormData({
                              title: '',
                              description: '',
                              category: groupId ? 'group' : 'personal',
                              priority: 'medium',
                              dueDate: '',
                              projectId: project.id,
                            });
                            setEditingTodo(null);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Add task to project"
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenProjectModal(project)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete project "${project.name}"? Todos will be unassigned but not deleted.`)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-2 border-t border-slate-100 pt-4">
                      {projectActiveTodos.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-slate-600 mb-2">Active</h5>
                          <div className="space-y-2">
                            {projectActiveTodos.map((todo) => (
                              <TodoItem
                                key={todo.id}
                                todo={todo}
                                onToggle={onToggleTodo}
                                onEdit={() => handleOpenModal(todo)}
                                onDelete={onDeleteTodo}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {projectCompletedTodos.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-slate-600 mb-2">Completed</h5>
                          <div className="space-y-2">
                            {projectCompletedTodos.map((todo) => (
                              <TodoItem
                                key={todo.id}
                                todo={todo}
                                onToggle={onToggleTodo}
                                onEdit={() => handleOpenModal(todo)}
                                onDelete={onDeleteTodo}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {projectTodos.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">
                          No todos in this project yet.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Todos without Projects */}
      {todosByProject['no-project'] && todosByProject['no-project'].length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Other Todos</h3>
          <div className="space-y-2">
            {todosByProject['no-project'].map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={onToggleTodo}
                onEdit={() => handleOpenModal(todo)}
                onDelete={onDeleteTodo}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {todos.length === 0 && projects.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500">No todos yet. Create your first one!</p>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {editingTodo ? 'Edit Todo' : 'New Todo'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter todo title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add details..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TodoCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    disabled={!!groupId && formData.category === 'group'}
                  >
                    <option value="personal">Personal</option>
                    <option value="work">Work</option>
                    <option value="group" disabled={!groupId}>Group</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Project (Optional)
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">No Project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {editingTodo ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {isProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">
                {editingProject ? 'Edit Project' : 'New Project'}
              </h3>
              <button
                onClick={handleCloseProjectModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleProjectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name *
                </label>
                <Input
                  value={projectFormData.name}
                  onChange={(e) => setProjectFormData({ ...projectFormData, name: e.target.value })}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={projectFormData.description}
                  onChange={(e) => setProjectFormData({ ...projectFormData, description: e.target.value })}
                  placeholder="Add project description..."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={projectFormData.color}
                    onChange={(e) => setProjectFormData({ ...projectFormData, color: e.target.value })}
                    className="w-16 h-10 rounded border border-slate-300 cursor-pointer"
                  />
                  <Input
                    type="text"
                    value={projectFormData.color}
                    onChange={(e) => setProjectFormData({ ...projectFormData, color: e.target.value })}
                    placeholder="#6366f1"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseProjectModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {editingProject ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => Promise<void>;
  onEdit: () => void;
  onDelete: (id: string) => Promise<void>;
}

function TodoItem({ todo, onToggle, onEdit, onDelete }: TodoItemProps) {
  return (
    <div
      className={`bg-white rounded-xl border-2 p-4 transition-all ${
        todo.completed
          ? 'border-slate-200 opacity-60'
          : 'border-slate-200 hover:border-indigo-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(todo.id)}
          className={`mt-1 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            todo.completed
              ? 'bg-indigo-600 border-indigo-600'
              : 'border-slate-300 hover:border-indigo-500'
          }`}
        >
          {todo.completed && <Check size={14} className="text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4
                className={`font-medium ${
                  todo.completed ? 'line-through text-slate-500' : 'text-slate-800'
                }`}
              >
                {todo.title}
              </h4>
              {todo.description && (
                <p className="text-sm text-slate-600 mt-1">{todo.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={onEdit}
                className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={() => onDelete(todo.id)}
                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded border ${CATEGORY_COLORS[todo.category]}`}
            >
              {todo.category}
            </span>
            {todo.priority && (
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded border flex items-center gap-1 ${PRIORITY_COLORS[todo.priority]}`}
              >
                <Flag size={10} />
                {todo.priority}
              </span>
            )}
            {todo.dueDate && (
              <span className="px-2 py-0.5 text-xs text-slate-600 flex items-center gap-1">
                <Calendar size={10} />
                {new Date(todo.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
