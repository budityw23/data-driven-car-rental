import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Users, Calendar, DollarSign, Activity } from 'lucide-react';
import { adminApi } from '@/api/admin';
import { formatUtils } from '@/utils/formatUtils';

export const AdminDashboardPage: React.FC = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboardStats,
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading dashboard analytics...</div>;
  }

  if (isError || !data?.data) {
    return <div className="p-8 text-center text-red-500">Failed to load dashboard data.</div>;
  }

  const { revenue, bookings, fleet, topCars } = data.data;

  const stats = [
    { 
      title: 'Total Revenue', 
      value: formatUtils.formatCurrency(revenue.totalRevenue), 
      icon: <DollarSign className="text-green-600" />, 
      subtext: `Monthly: ${formatUtils.formatCurrency(revenue.monthlyRevenue)}`
    },
    { 
      title: 'Active Bookings', 
      value: bookings.activeBookings.toString(), 
      icon: <Calendar className="text-blue-600" />, 
      subtext: `${bookings.pendingBookings} Pending`
    },
    { 
      title: 'Fleet Utilization', 
      value: formatUtils.formatPercentage(fleet.utilizationRate), 
      icon: <Activity className="text-orange-600" />, 
      subtext: `${fleet.activeCars}/${fleet.totalCars} Cars Active`
    },
    { 
      title: 'Total Bookings', 
      value: bookings.totalBookings.toString(), 
      icon: <Users className="text-purple-600" />, 
      subtext: `${bookings.completedBookings} Completed` 
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                {stat.icon}
              </div>
            </div>
            <h3 className="text-muted text-sm font-medium">{stat.title}</h3>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
            <p className="text-xs text-muted mt-2">{stat.subtext}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Revenue Breakdown</h3>
           <div className="space-y-4">
             <div className="flex justify-between items-center border-b pb-2">
               <span className="text-muted">Total Revenue</span>
               <span className="font-semibold">{formatUtils.formatCurrency(revenue.totalRevenue)}</span>
             </div>
             <div className="flex justify-between items-center border-b pb-2">
               <span className="text-muted">Avg. Booking Value</span>
               <span className="font-semibold">{formatUtils.formatCurrency(revenue.averageBookingValue)}</span>
             </div>
             <div className="flex justify-between items-center pt-2">
               <span className="text-muted">Confirmed Bookings Revenue (Est.)</span>
               <span className="font-semibold text-green-600">
                 {formatUtils.formatCurrency(bookings.confirmedBookings * revenue.averageBookingValue)}
               </span>
             </div>
           </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold mb-4">Top Performing Cars</h3>
          {topCars.length === 0 ? (
            <div className="text-center text-muted py-8">No data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-muted border-b">
                    <th className="pb-2">Car</th>
                    <th className="pb-2 text-right">Bookings</th>
                    <th className="pb-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {topCars.map((car) => (
                    <tr key={car.carId} className="border-b last:border-0">
                      <td className="py-3 font-medium">{car.brand} {car.model}</td>
                      <td className="py-3 text-right">{car.bookingCount}</td>
                      <td className="py-3 text-right">{formatUtils.formatCurrency(car.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
