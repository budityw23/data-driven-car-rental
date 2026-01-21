export interface DashboardStats {
  revenue: {
    totalRevenue: number;
    monthlyRevenue: number;
    averageBookingValue: number;
  };
  bookings: {
    totalBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
  };
  fleet: {
    totalCars: number;
    activeCars: number;
    inactiveCars: number;
    utilizationRate: number;
  };
  topCars: Array<{
    carId: string;
    brand: string;
    model: string;
    bookingCount: number;
    revenue: number;
  }>;
}
