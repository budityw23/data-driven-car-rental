import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { carsApi } from '@/api/cars';
import { bookingsApi } from '@/api/bookings';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Users, Settings, Fuel, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { dateUtils } from '@/utils/dateUtils';
import { AxiosError } from 'axios';

import { locationsApi } from '@/api/locations';
import type { Location } from '@/types/location';

import type { BookingFormInput } from './types'; // Or keep inline if not exported
import type { AvailabilityResponse } from '@/types/booking';

interface BookingFormInput {
  startDate: string;
  endDate: string;
  pickupLocationId: string;
  dropoffLocationId: string;
}

export const CarDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  // Availability state
  const [availability, setAvailability] = useState<AvailabilityResponse['data'] | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['car', id],
    queryFn: () => carsApi.getById(id!),
    enabled: !!id,
  });

  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: locationsApi.getAll,
  });

  const locations = locationsData?.data || [];

  const { register, watch, handleSubmit, formState: { errors, isSubmitting } } = useForm<BookingFormInput>();
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Check availability when dates change
  React.useEffect(() => {
    const checkAvailability = async () => {
      if (!id || !startDate || !endDate) {
        setAvailability(null);
        return;
      }
      
      // Basic validation before API call
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        setAvailability(null);
        return;
      }

      setIsCheckingAvailability(true);
      setBookingError(null); // Clear previous errors
      try {
        const result = await carsApi.checkAvailability(
          id, 
          start.toISOString(), 
          end.toISOString()
        );
        setAvailability(result.data);
      } catch (error) {
        console.error("Failed to check availability", error);
        // Don't block user if check fails, but maybe show warning?
        // or just availabilty null
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    const debounceTimer = setTimeout(checkAvailability, 500); // Debounce 500ms
    return () => clearTimeout(debounceTimer);
  }, [id, startDate, endDate]);

  const creationMutation = useMutation({
    mutationFn: bookingsApi.create,
    onSuccess: () => {
      navigate('/my/bookings');
    },
    onError: (err: AxiosError<{ message: string }>) => {
      setBookingError(err.response?.data?.message || 'Failed to create booking');
    }
  });

  if (isLoading) return <div className="container py-8 text-center">Loading car details...</div>;
  if (isError || !data?.data) return <div className="container py-8 text-center text-red-500">Error loading car.</div>;

  const car = data.data;

  // Formatting currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const calculateTotal = () => {
    if (!startDate || !endDate) return 0;
    const days = dateUtils.calculateDays(startDate, endDate);
    if (days <= 0) return 0;
    return days * car.dailyPrice;
  };

  const total = calculateTotal();
  const days = startDate && endDate ? dateUtils.calculateDays(startDate, endDate) : 0;

  const onSubmit = (formData: BookingFormInput) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/cars/${id}` } });
      return;
    }
    
    // Prevent submission if unavailable (double check)
    if (availability && !availability.available) {
      setBookingError('Car is not available for the selected dates.');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);

    creationMutation.mutate({
      carId: car.id,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      pickupLocationId: formData.pickupLocationId,
      dropoffLocationId: formData.dropoffLocationId
    });
  };

  return (
    <div className="container py-8">
      <Link to="/cars" className="inline-flex items-center gap-2 text-muted hover:text-primary mb-6">
        <ChevronLeft size={20} /> Back to Fleet
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: '2rem' }}>
        {/* Left Column: Images & Info */}
        <div className="lg:col-span-2">
          <div className="bg-gray-200 rounded-lg overflow-hidden h-96 mb-6">
             <img 
               src={car.images[0] || 'https://via.placeholder.com/800x600?text=No+Image'} 
               alt={`${car.brand} ${car.model}`}
               className="w-full h-full object-cover"
               style={{ width: '100%', height: '100%', objectFit: 'cover' }}
             />
          </div>

          <h1 className="text-3xl font-bold mb-2">{car.brand} {car.model}</h1>
          <p className="text-muted text-lg mb-6">{car.year} • {car.type}</p>

          <Card className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Specifications</h2>
            <div className="grid grid-cols-3 gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded">
                <Users className="text-primary mb-2" />
                <span className="font-semibold">{car.seats} Seats</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded">
                <Settings className="text-primary mb-2" />
                <span className="font-semibold">{car.transmission}</span>
                <span className="text-xs text-muted">Transmission</span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-50 rounded">
                <Fuel className="text-primary mb-2" />
                <span className="font-semibold">{car.fuel}</span>
                <span className="text-xs text-muted">Fuel Type</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Booking Widget */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
             <div className="flex justify-between items-end mb-6 border-b pb-4">
               <div>
                 <span className="text-muted">Daily Rate</span>
               </div>
               <div className="text-right">
                 <span className="text-2xl font-bold text-primary">{formatCurrency(car.dailyPrice)}</span>
                 <span className="text-sm text-muted"> / day</span>
               </div>
             </div>

             {/* Booking Errors */}
             {bookingError && (
               <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded">
                 {bookingError}
               </div>
             )}
             
             {/* Availability Feedback */}
             {availability && !availability.available && (
               <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm rounded">
                 <strong>Not Available:</strong> Car is booked for these dates.
                 {availability.conflictingBookings.length > 0 && (
                   <ul className="list-disc ml-4 mt-1 text-xs">
                     {availability.conflictingBookings.map(b => (
                       <li key={b.id}>
                         {new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}
                       </li>
                     ))}
                   </ul>
                 )}
               </div>
             )}
            {availability && availability.available && (
               <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm rounded">
                 ✓ Car is available!
               </div>
             )}


             <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
               <div className="grid grid-cols-2 gap-4">
                 <Input 
                   type="date" 
                   label="Pick-up Date"
                   {...register('startDate', { required: 'Start date is required' })}
                   error={errors.startDate?.message}
                 />
                 <Input 
                   type="date" 
                   label="Return Date"
                   {...register('endDate', { 
                      required: 'End date is required',
                      validate: (value) => {
                        if (startDate && new Date(value) <= new Date(startDate)) {
                          return 'End date must be after start date';
                        }
                        return true;
                      }
                   })}
                   error={errors.endDate?.message}
                 />
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Pick-up Location</label>
                 <select 
                   className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                   style={{ height: '42px', backgroundColor: 'white' }} 
                   {...register('pickupLocationId', { required: 'Pick-up location is required' })}
                 >
                   <option value="">Select location</option>
                   {locations.map(loc => (
                     <option key={loc.id} value={loc.id}>{loc.name}</option>
                   ))}
                 </select>
                 {errors.pickupLocationId && <p className="text-sm text-red-500 mt-1">{errors.pickupLocationId.message}</p>}
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Return Location</label>
                 <select 
                   className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                   style={{ height: '42px', backgroundColor: 'white' }} 
                   {...register('dropoffLocationId', { required: 'Return location is required' })}
                 >
                   <option value="">Select location</option>
                   {locations.map(loc => (
                     <option key={loc.id} value={loc.id}>{loc.name}</option>
                   ))}
                 </select>
                 {errors.dropoffLocationId && <p className="text-sm text-red-500 mt-1">{errors.dropoffLocationId.message}</p>}
               </div>

               {total > 0 && (
                 <div className="bg-gray-50 p-4 rounded mt-2">
                   <div className="flex justify-between mb-2">
                     <span>Duration</span>
                     <span>{days} Days</span>
                   </div>
                   <div className="flex justify-between font-bold text-lg border-t pt-2">
                     <span>Total</span>
                     <span>{formatCurrency(total)}</span>
                   </div>
                 </div>
               )}

               <Button 
                 type="submit" 
                 size="lg" 
                 className="w-full mt-4"
                 isLoading={isSubmitting || creationMutation.isPending || isCheckingAvailability}
                 disabled={car.status !== 'ACTIVE' || (!!availability && !availability.available)}
               >
                 {isCheckingAvailability ? 'Checking...' : (isAuthenticated ? 'Book Now' : 'Login to Book')}
               </Button>
               
               <p className="text-xs text-center text-muted mt-2">
                 {isAuthenticated ? "You won't be charged instantly." : "Redirects to login page."}
               </p>
             </form>
          </Card>
        </div>
      </div>
    </div>
  );
};
