import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { carsApi } from '@/api/cars';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ChevronLeft } from 'lucide-react';

interface CarFormData {
  brand: string;
  model: string;
  year: number;
  type: string;
  seats: number;
  transmission: 'MT' | 'AT';
  fuel: 'GAS' | 'DIESEL' | 'EV';
  dailyPrice: number;
  isAvailable: boolean;
  images: string;
}

export const AdminCarFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CarFormData>();

  // Fetch car data if in edit mode
  const { data: carData } = useQuery({
    queryKey: ['car', id],
    queryFn: () => carsApi.getById(id!),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (carData?.data) {
      const car = carData.data;
      reset({
        brand: car.brand,
        model: car.model,
        year: car.year,
        type: car.type,
        seats: car.seats,
        transmission: car.transmission,
        fuel: car.fuel,
        dailyPrice: car.dailyPrice,
        isAvailable: car.isAvailable,
        images: car.images.join(','),
      });
    }
  }, [carData, reset]);

  const mutation = useMutation({
    mutationFn: (data: CarFormData) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
            ...data,
            images: data.images.split(',').map(url => url.trim()).filter(Boolean)
        };
        
        if (isEditMode && id) {
            return carsApi.update(id, payload);
        } else {
            return carsApi.create(payload);
        }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cars'] });
      queryClient.invalidateQueries({ queryKey: ['cars'] });
      navigate('/admin/cars');
    },
    onError: (error) => {
        console.error(error);
        alert('Failed to save car');
    }
  });

  const onSubmit = (data: CarFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/cars')}>
          <ChevronLeft size={20} />
        </Button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Car' : 'Add New Car'}</h1>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Brand" 
              {...register('brand', { required: 'Brand is required' })} 
              error={errors.brand?.message}
            />
            <Input 
              label="Model" 
              {...register('model', { required: 'Model is required' })} 
              error={errors.model?.message}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input 
              label="Year" 
              type="number"
              {...register('year', { required: 'Year is required', min: 2000 })} 
              error={errors.year?.message}
            />
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Type</label>
                <select 
                    {...register('type', { required: 'Type is required' })}
                    className="p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                >
                    <option value="SUV">SUV</option>
                    <option value="SEDAN">Sedan</option>
                    <option value="HATCHBACK">Hatchback</option>
                    <option value="MPV">MPV</option>
                    <option value="VAN">Van</option>
                </select>
            </div>
            <Input 
              label="Seats" 
              type="number"
              {...register('seats', { required: 'Seats is required', min: 2, max: 10 })} 
              error={errors.seats?.message}
            />
            <Input 
              label="Daily Price (IDR)" 
              type="number"
              {...register('dailyPrice', { required: 'Price is required', min: 0 })} 
              error={errors.dailyPrice?.message}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Transmission</label>
                <select 
                    {...register('transmission')}
                    className="p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                >
                    <option value="AT">Automatic</option>
                    <option value="MT">Manual</option>
                </select>
            </div>
             <div className="flex flex-col gap-1">
                <label className="text-sm font-medium">Fuel</label>
                <select 
                    {...register('fuel')}
                    className="p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none"
                >
                    <option value="GAS">Gas</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="EV">Electric</option>
                </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium mb-1">Image URLs (comma separated)</label>
             <textarea
                {...register('images')}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-primary focus:outline-none min-h-[80px]"
                placeholder="https://example.com/car1.jpg, https://example.com/car2.jpg"
             />
          </div>

          <div className="flex items-center gap-2">
            <input 
                type="checkbox" 
                id="isAvailable"
                {...register('isAvailable')}
                className="w-4 h-4 text-primary"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium">Available for Booking</label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/cars')}>
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              {isEditMode ? 'Update Car' : 'Create Car'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
