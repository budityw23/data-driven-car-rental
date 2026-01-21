import { client } from './client';
import type { AuthResponse } from '@/types/auth';
// Imports cleaned

// Define form types locally for now if types/forms.ts doesn't exist or just use inline
// But better to separate. defining here for simplicity to start.
export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export const authApi = {
  login: async (data: LoginInput): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterInput): Promise<AuthResponse> => {
    const response = await client.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  me: async (): Promise<{ success: boolean; data: import('@/types/auth').User }> => {
    const response = await client.get('/auth/profile');
    return response.data;
  },
  
  logout: async (): Promise<void> => {
    await client.post('/auth/logout');
  }
};
