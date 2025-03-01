import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    email: string;
    username: string;
    role: string;
    has_github: boolean;
  };
}

export const authService = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/register/`, {
      email,
      username: email,
      password,
      role: 'candidate'  // Include role in request
    });
    
    if (response.data.access) {
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_role', response.data.user.role);
      localStorage.setItem('user_email', response.data.user.email);
    }
    
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/login/`, {
      email,
      password
    });
    
    if (response.data.access) {
      localStorage.setItem('token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      localStorage.setItem('user_role', response.data.user.role);
      localStorage.setItem('user_email', response.data.user.email);
      localStorage.setItem('has_github', String(response.data.user.has_github));
    }
    
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_email');
    localStorage.removeItem('has_github');
  }
};

export const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return {
    Authorization: `Bearer ${token}`
  };
}; 