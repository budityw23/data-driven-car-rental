import { client } from './client';
import type { DashboardStats } from '../types/analytics';

export const adminApi = {
  getDashboardStats: async () => {
    const response = await client.get<{ success: boolean; data: DashboardStats }>('/admin/dashboard');
    return response.data;
  },
};
