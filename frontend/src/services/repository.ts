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
  assessment_score?: number;
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

  async getFileContent(repoId: string, filePath: string): Promise<string[]> {
    const response = await axios.get(
      `${API_URL}/repositories/${repoId}/file/${filePath}/`,
      { headers: getAuthHeader() }
    );
    return response.data.content;
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
      `${API_URL}/repositories/${id}/delete`,
      { headers: getAuthHeader() }
    );
  },

  async getRepositorySummary(id: string): Promise<any> {
    const response = await axios.get(
      `${API_URL}/repositories/${id}/summary/`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  async pollAnalysisStatus(repoId: string): Promise<LinkedRepository> {
    const response = await axios.get(
      `${API_URL}/repositories/${repoId}/`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  startPolling(repoId: string, onUpdate: (repo: LinkedRepository) => void, interval: number = 5000): () => void {
    const pollInterval = setInterval(async () => {
      try {
        const repo = await this.pollAnalysisStatus(repoId);
        onUpdate(repo);
        
        // Stop polling if analysis is complete or failed
        if (repo.analysis_status === 'complete' || repo.analysis_status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(pollInterval);
      }
    }, interval);

    // Return cleanup function
    return () => clearInterval(pollInterval);
  }
};



