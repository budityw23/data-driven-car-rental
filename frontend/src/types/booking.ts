import type { Car } from './car';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'PICKED_UP' | 'RETURNED' | 'CANCELLED';

export interface Booking {
  id: string;
  userId: string;
  carId: string;
  startDate: string; // ISO Date
  endDate: string;   // ISO Date
  days: number;
  basePrice: number;
  addonPrice: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  car?: Car; // Joined car details
}

export interface CreateBookingInput {
  carId: string;
  startDate: string;
  endDate: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  addonIds?: string[];
}

export interface BookingFilterParams {
  page?: number;
  limit?: number;
  status?: BookingStatus;
}
export interface ConflictingBooking {
  id: string;
  startDate: string;
  endDate: string;
  status: BookingStatus;
}

export interface AvailabilityResponse {
  success: boolean;
  data: {
    available: boolean;
    carId: string;
    requestedStartDate: string;
    requestedEndDate: string;
    conflictingBookings: ConflictingBooking[];
  };
}
