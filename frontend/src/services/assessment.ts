import axios from 'axios';
import { getAuthHeader } from './auth';

const API_URL = 'http://localhost:8000/api';

export interface Question {
  text: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export interface Assessment {
  id: string;
  repository: string;
  questions: Question[];
  score: number | null;
  completed_at: string | null;
  created_at: string;
  answers?: number[];
  correct_answers?: number;
}

export interface AssessmentAttempt {
  id: string;
  assessment: string;
  answers: number[];
  correct_answers: number;
  score: number;
  time_spent: number;
  completed_at: string;
}

export const assessmentService = {
  async generateAssessment(repoId: string): Promise<Assessment> {
    const response = await axios.post(
      `${API_URL}/repositories/${repoId}/assessment/generate/`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  async getAssessment(repoId: string): Promise<Assessment> {
    const response = await axios.get(
      `${API_URL}/repositories/${repoId}/assessment/`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  async submitAssessment(
    assessmentId: string,
    answers: number[],
    timeSpent: number
  ): Promise<AssessmentAttempt> {
    const response = await axios.post(
      `${API_URL}/assessment/${assessmentId}/submit/`,
      { answers, time_spent: timeSpent },
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};