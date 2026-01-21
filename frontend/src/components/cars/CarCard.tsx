import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Fuel, Settings } from 'lucide-react';
import type { Car as CarType } from '@/types/car';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface CarCardProps {
  car: CarType;
}

export const CarCard: React.FC<CarCardProps> = ({ car }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR', // Or USD
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <Card padding="none" className="overflow-hidden flex-col h-full">
      <div className="relative h-48 bg-gray-200">
        <img 
          src={car.images[0] || 'https://via.placeholder.com/400x300?text=No+Image'} 
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        {car.isAvailable === false && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            Unavailable
          </div>
        )}
      </div>
      
      <div className="p-4 flex-col gap-2 flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{car.brand} {car.model}</h3>
            <p className="text-sm text-muted">{car.type} • {car.year}</p>
          </div>
          <div className="text-right">
            <p className="text-primary font-bold">{formatCurrency(car.dailyPrice)}</p>
            <p className="text-xs text-muted">/ day</p>
          </div>
        </div>

        <div className="flex gap-4 my-2 text-sm text-muted">
          <div className="flex items-center gap-1" title="Seats">
            <Users size={16} /> {car.seats}
          </div>
          <div className="flex items-center gap-1" title="Transmission">
            <Settings size={16} /> {car.transmission}
          </div>
          <div className="flex items-center gap-1" title="Fuel">
            <Fuel size={16} /> {car.fuel}
          </div>
        </div>

        <div className="mt-auto pt-2">
          <Link to={`/cars/${car.id}`}>
            <Button className="w-full" variant="outline">View Details</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
