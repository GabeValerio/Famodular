import { Todo, CreateTodoInput, UpdateTodoInput } from '../types';

const API_BASE = '/api/modules/user/todos';

export const todosService = {
  async getTodos(category?: string, groupId?: string | null): Promise<Todo[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    // Only append groupId if it's a valid non-empty string
    // null/undefined/empty string should not be appended (API will treat as self view)
    if (groupId && groupId.trim() !== '') {
      params.append('groupId', groupId);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch todos');
    return response.json();
  },

  async createTodo(todo: CreateTodoInput): Promise<Todo> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create todo' }));
      throw new Error(errorData.error || 'Failed to create todo');
    }
    return response.json();
  },

  async updateTodo(id: string, updates: UpdateTodoInput): Promise<Todo> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update todo');
    return response.json();
  },

  async deleteTodo(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete todo');
  },

  async toggleTodo(id: string): Promise<Todo> {
    const response = await fetch(`${API_BASE}/${id}/toggle`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to toggle todo');
    return response.json();
  },
};
