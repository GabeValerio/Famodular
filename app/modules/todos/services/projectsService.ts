import { Project, CreateProjectInput, UpdateProjectInput } from '../types';

const API_BASE = '/api/modules/user/todos/projects';

export const projectsService = {
  async getProjects(groupId?: string | null): Promise<Project[]> {
    const params = new URLSearchParams();
    // Only append groupId if it's a valid non-empty string
    // null/undefined/empty string should not be appended (API will treat as self view)
    if (groupId && groupId.trim() !== '') {
      params.append('groupId', groupId);
    }
    
    const queryString = params.toString();
    const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  async createProject(project: CreateProjectInput): Promise<Project> {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create project' }));
      throw new Error(errorData.error || 'Failed to create project');
    }
    return response.json();
  },

  async updateProject(id: string, updates: UpdateProjectInput): Promise<Project> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
  },

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete project');
  },
};
