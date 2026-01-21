import { client } from './client';
import type { Booking, CreateBookingInput, BookingFilterParams } from '@/types/booking';
import type { PaginatedResponse } from '@/types/car';

export const bookingsApi = {
  create: async (data: CreateBookingInput): Promise<{ success: boolean; data: Booking }> => {
    const response = await client.post<{ success: boolean; data: Booking }>('/bookings', data);
    return response.data;
  },

  getMyBookings: async (params?: BookingFilterParams): Promise<PaginatedResponse<Booking>> => {
    const response = await client.get<PaginatedResponse<Booking>>('/bookings', { params });
    return response.data;
  },

  getById: async (id: string): Promise<{ success: boolean; data: Booking }> => {
    const response = await client.get<{ success: boolean; data: Booking }>(`/bookings/${id}`);
    return response.data;
  },

  cancel: async (id: string): Promise<{ success: boolean; data: Booking }> => {
    const response = await client.post<{ success: boolean; data: Booking }>(`/bookings/${id}/cancel`);
    return response.data;
  },

  // Admin methods
  getAll: async (params?: BookingFilterParams): Promise<PaginatedResponse<Booking>> => {
    const response = await client.get<PaginatedResponse<Booking>>('/admin/bookings', { params });
    return response.data;
  }
};
