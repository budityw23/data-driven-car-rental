export type CarType = 'SUV' | 'SEDAN' | 'HATCHBACK' | 'MPV' | 'VAN';
export type Transmission = 'AT' | 'MT';
export type Fuel = 'GAS' | 'DIESEL' | 'EV';
export type CarStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  type: CarType;
  seats: number;
  transmission: Transmission;
  fuel: Fuel;
  dailyPrice: number;
  status: CarStatus;
  images: string[];
  isAvailable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CarFilterParams {
  page?: number;
  limit?: number;
  type?: CarType;
  seats?: number;
  transmission?: Transmission;
  fuel?: Fuel;
  priceMin?: number;
  priceMax?: number;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SingleCarResponse {
  success: boolean;
  data: Car;
}
