import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingsApi } from '@/api/bookings';
import type { Booking, BookingStatus } from '@/types/booking';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { dateUtils } from '@/utils/dateUtils';
import { Link } from 'react-router-dom';

export const MyBookingsPage: React.FC = () => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => bookingsApi.getMyBookings({ limit: 50 }),
  });

  if (isLoading) return <div className="container py-8 text-center">Loading bookings...</div>;
  if (isError) return <div className="container py-8 text-center text-red-500">Error loading bookings.</div>;

  const bookings = data?.data || [];

  const handleCancel = async (id: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      await bookingsApi.cancel(id);
      refetch();
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-muted mb-4">You haven't made any bookings yet.</p>
          <Link to="/cars">
            <Button>Browse Cars</Button>
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {bookings.map((booking) => (
            <BookingItem key={booking.id} booking={booking} onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  );
};

const BookingItem: React.FC<{ booking: Booking; onCancel: (id: string) => void }> = ({ booking, onCancel }) => {
  const statusColors: Record<BookingStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    PICKED_UP: 'bg-blue-100 text-blue-800',
    RETURNED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[booking.status]}`}>
            {booking.status}
          </span>
          <span className="text-sm text-muted">ID: {booking.id.slice(0, 8)}</span>
        </div>
        
        <h3 className="text-lg font-semibold">
          {booking.car?.brand} {booking.car?.model} <span className="text-sm font-normal text-muted">({booking.car?.year})</span>
        </h3>
        
        <div className="text-sm text-muted mt-1">
          {dateUtils.formatDate(booking.startDate)} - {dateUtils.formatDate(booking.endDate)} 
          <span className="mx-2">•</span>
          {dateUtils.calculateDays(booking.startDate, booking.endDate)} Days
        </div>
      </div>

      <div className="text-right flex flex-col items-end gap-2">
        <p className="text-lg font-bold text-primary">{formatCurrency(booking.totalPrice)}</p>
        
        {booking.status === 'PENDING' || booking.status === 'CONFIRMED' ? (
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => onCancel(booking.id)}
          >
            Cancel Booking
          </Button>
        ) : null}
      </div>
    </Card>
  );
};
