import axios from 'axios';
import { getAuthHeader } from './auth';

const API_URL = 'http://localhost:8000/api';

export interface CandidateProfile {
  full_name: string;
  age: number;
  gender: string;
  location: string;
  education_level: string;
  bio: string;
}

export const profileService = {
  async updateProfile(profileData: CandidateProfile): Promise<CandidateProfile> {
    const response = await axios.put(
      `${API_URL}/candidate/profile/`,
      profileData,
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  },

  async getProfile(): Promise<CandidateProfile> {
    const response = await axios.get(
      `${API_URL}/candidate/profile/`,
      {
        headers: getAuthHeader(),
      }
    );
    return response.data;
  },
}; 