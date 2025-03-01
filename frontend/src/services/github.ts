import axios from 'axios';
import { getAuthHeader } from './auth';

const API_URL = 'http://localhost:8000/api';

export interface GithubRepo {
  full_name: string;
  description: string | null;
  language: string;
}

export const githubService = {
  async getRepositories(): Promise<GithubRepo[]> {
    const response = await axios.get(
      `${API_URL}/github/repositories/`,
      { headers: getAuthHeader() }
    );
    return response.data;
  }
}; 