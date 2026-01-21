import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { carsApi } from '@/api/cars';
import { CarCard } from '@/components/cars/CarCard';
import { Button } from '@/components/ui/Button';

export const CarListingPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filters] = useState({}); // Placeholder for filter state

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cars', page, filters],
    queryFn: () => carsApi.getAll({ page, limit: 9, ...filters }),
  });

  if (isLoading) return <div className="container py-8 text-center">Loading cars...</div>;
  if (isError) return <div className="container py-8 text-center text-red-500">Error loading cars. Please try again.</div>;

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Our Fleet</h1>
        {/* Sort Dropdown Placeholder */}
        <select className="p-2 border rounded">
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {data?.data.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
      
      {data?.data.length === 0 && (
        <div className="text-center py-12 text-muted">No cars found matching your criteria.</div>
      )}

      {/* Basic Pagination */}
      <div className="flex justify-center gap-4 mt-8">
        <Button 
          disabled={page === 1} 
          onClick={() => setPage(p => p - 1)}
          variant="outline"
        >
          Previous
        </Button>
        <span className="self-center">Page {data?.meta.page} of {data?.meta.totalPages}</span>
        <Button 
          disabled={page === data?.meta.totalPages} 
          onClick={() => setPage(p => p + 1)}
          variant="outline"
        >
          Next
        </Button>
      </div>
    </div>
  );
};
