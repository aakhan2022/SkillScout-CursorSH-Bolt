import axios from 'axios';
import { getAuthHeader } from './auth';

const API_URL = 'http://localhost:8000/api';

export interface LinkedRepository {
  id: string;
  repo_name: string;
  repo_url: string;
  description: string;
  languages: string[];
  analysis_status: 'pending' | 'analyzing' | 'complete' | 'failed';
  analysis_results?: any;
}

export const repositoryService = {
  async addRepository(repo: { full_name: string }): Promise<LinkedRepository> {
    const response = await axios.post(
      `${API_URL}/repositories/add/`,
      repo,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  async getRepositories(): Promise<LinkedRepository[]> {
    const response = await axios.get(
      `${API_URL}/repositories/`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  async deleteRepository(id: string): Promise<void> {
    await axios.delete(
      `${API_URL}/repositories/${id}/`,
      { headers: getAuthHeader() },

    );
  },

  async getRepositorySummary(id: string): Promise<void> {
    const response = await axios.get(
      `${API_URL}/repositories/${id}/summary/`,
      { headers: getAuthHeader()},
    );
    return response.data;
  },

  async pollAnalysisStatus(repoId: string): Promise<LinkedRepository> {
    const response = await axios.get(
      `${API_URL}/repositories/${repoId}/`,
      { headers: getAuthHeader() }
    );
    return response.data;
  }
}; 