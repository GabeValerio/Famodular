import { TimeTrackerProject, CreateProjectInput, UpdateProjectInput } from '../types';

const API_BASE = '/api/modules/user/timetracker';

export class ProjectsService {
  static async getProjects(groupId?: string): Promise<TimeTrackerProject[]> {
    const params = new URLSearchParams();
    if (groupId) params.set('groupId', groupId);

    const response = await fetch(`${API_BASE}/projects?${params}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch projects');
    }
    return response.json();
  }

  static async createProject(project: CreateProjectInput): Promise<TimeTrackerProject> {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }
    return response.json();
  }

  static async updateProject(id: string, project: UpdateProjectInput): Promise<TimeTrackerProject> {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project');
    }
    return response.json();
  }

  static async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }
  }
}
