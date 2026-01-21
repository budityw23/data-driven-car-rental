import { client } from './client';
import type { Location } from '@/types/location';

export const locationsApi = {
  getAll: async (): Promise<{ success: boolean; data: Location[] }> => {
    const response = await client.get<{ success: boolean; data: Location[] }>('/locations');
    return response.data;
  },
};
