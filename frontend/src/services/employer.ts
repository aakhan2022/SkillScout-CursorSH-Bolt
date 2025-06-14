import axios from 'axios';
import { getAuthHeader } from './auth';

const API_URL = 'http://localhost:8000/api';

export interface EmployerProfile {
  id: string;
  company_name: string;
  company_overview: string;
  work_type: 'remote' | 'hybrid' | 'onsite';
  location: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  location: string;
  education_level: string;
  skills: string[];
  experience_years: number;
  skill_score: number;
  repositories: any[];
  overall_score: number;
}

export interface CandidateDetail extends Candidate {
  bio: string;
  skill_score: number;
}

export interface Project {
  id: string;
  repo_name: string;
  repo_url: string;
  description: string;
  languages: string[];
  analysis_status: 'pending' | 'analyzing' | 'complete' | 'failed';
  analysis_results?: any;
  assessment?: any;
}

export const employerService = {
  async register(email: string, password: string, companyName: string): Promise<any> {
    const response = await axios.post(`${API_URL}/auth/register/employer/`, {
      email,
      password,
      company_name: companyName
    });
    
    if (response.data.access) {
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_role', 'employer');
      localStorage.setItem('user_email', email);
      localStorage.setItem('company_name', companyName);
    }
    
    return response.data;
  },

  async updateProfile(profileData: Partial<EmployerProfile>): Promise<EmployerProfile> {
    const response = await axios.put(
      `${API_URL}/employer/profile/`,
      profileData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  async getProfile(): Promise<EmployerProfile> {
    const response = await axios.get(
      `${API_URL}/employer/profile/`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  async searchCandidates(params: {
    q?: string;
    skills?: string[];
    sort_by?: 'best_match' | 'skill_score';
  }): Promise<Candidate[]> {
    const response = await axios.get(
      `${API_URL}/employer/candidates/`,
      {
        headers: getAuthHeader(),
        params
      }
    );
    return response.data;
  },

  async getCandidateProfile(candidateId: string): Promise<CandidateDetail> {
    const response = await axios.get(
      `${API_URL}/employer/candidates/${candidateId}/`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  async getCandidateProject(candidateId: string, projectId: string): Promise<Project> {
    const response = await axios.get(
      `${API_URL}/employer/candidates/${candidateId}/projects/${projectId}/`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  async contactCandidate(candidateId: string, subject: string, message: string): Promise<void> {
    const response = await axios.post(
      `${API_URL}/employer/candidates/${candidateId}/contact/`,
      { subject, message },
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};