import { client } from './client';
import type { Car, CarFilterParams, PaginatedResponse, SingleCarResponse } from '@/types/car';
import type { AvailabilityResponse } from '@/types/booking';

export const carsApi = {
  getAll: async (params?: CarFilterParams): Promise<PaginatedResponse<Car>> => {
    const response = await client.get<PaginatedResponse<Car>>('/cars', { params });
    return response.data;
  },

  getById: async (id: string, dateRange?: { startDate: string; endDate: string }): Promise<SingleCarResponse> => {
    const params = dateRange ? { startDate: dateRange.startDate, endDate: dateRange.endDate } : undefined;
    const response = await client.get<SingleCarResponse>(`/cars/${id}`, { params });
    return response.data;
  },

  // Admin methods (can be separated later)
  // Admin methods
  create: async (data: Partial<Car>): Promise<SingleCarResponse> => {
    const response = await client.post<SingleCarResponse>('/cars', data);
    return response.data;
  },

  update: async (id: string, data: Partial<Car>): Promise<SingleCarResponse> => {
    const response = await client.patch<SingleCarResponse>(`/cars/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<SingleCarResponse> => {
    // Assuming status update is just a partial update in the standard PATCH endpoint
    const response = await client.patch<SingleCarResponse>(`/cars/${id}`, { status });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await client.delete(`/cars/${id}`);
  },

  checkAvailability: async (id: string, startDate: string, endDate: string): Promise<AvailabilityResponse> => {
    const response = await client.get<AvailabilityResponse>(`/cars/${id}/availability`, {
      params: { startDate, endDate }
    });
    return response.data;
  }
};
