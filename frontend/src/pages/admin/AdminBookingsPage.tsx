import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '@/api/bookings';
import type { Booking } from '@/types/booking';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { dateUtils } from '@/utils/dateUtils';

export const AdminBookingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => bookingsApi.getAll({ limit: 100 }), // Add pagination later
  });

  // Example mutation for status change (not fully implemented in backend API wrapper yet, but structurally ready)
  // For now, we only have 'cancel' in the API wrapper. We might need 'updateStatus'.
  // We'll stick to 'cancel' for now as per available API methods, or add a generic update.
  
  const cancelMutation = useMutation({
    mutationFn: bookingsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: () => alert('Failed to cancel booking')
  });

  if (isLoading) return <div className="p-8 text-center">Loading bookings...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error loading bookings.</div>;

  const bookings = data?.data || [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Booking Management</h1>

      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold">ID</th>
              <th className="p-4 font-semibold">User</th>
              <th className="p-4 font-semibold">Car</th>
              <th className="p-4 font-semibold">Dates</th>
              <th className="p-4 font-semibold">Total</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking: Booking) => (
              <tr key={booking.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4 font-mono text-xs">{booking.id.slice(0, 8)}...</td>
                <td className="p-4 text-sm">{booking.userId /* In real app, join user name */}</td>
                <td className="p-4 text-sm">
                  {booking.car ? `${booking.car.brand} ${booking.car.model}` : 'Unknown Car'}
                </td>
                <td className="p-4 text-sm">
                  {dateUtils.formatDate(booking.startDate)} <br/> 
                  <span className="text-muted text-xs">to</span> {dateUtils.formatDate(booking.endDate)}
                </td>
                <td className="p-4 text-sm font-medium">
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(booking.totalPrice)}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold 
                    ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' : 
                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {booking.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                   {booking.status !== 'CANCELLED' && booking.status !== 'RETURNED' && (
                     <Button 
                       variant="danger" 
                       size="sm"
                       onClick={() => {
                         if(confirm('Cancel this booking?')) cancelMutation.mutate(booking.id);
                       }}
                       isLoading={cancelMutation.isPending}
                     >
                       Cancel
                     </Button>
                   )}
                </td>
              </tr>
            ))}
             {bookings.length === 0 && (
                <tr>
                    <td colSpan={7} className="p-8 text-center text-muted">No bookings found.</td>
                </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
