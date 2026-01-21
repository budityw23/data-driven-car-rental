import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { carsApi } from '@/api/cars';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Plus, Edit, Trash2, Eye } from 'lucide-react';
import type { Car } from '@/types/car';

export const AdminCarListPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-cars'],
    queryFn: () => carsApi.getAll({ limit: 100 }), // Fetch all for now or implement pagination
  });

  const deleteMutation = useMutation({
    mutationFn: carsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cars'] });
    },
    onError: (error) => {
        alert('Failed to delete car');
        console.error(error);
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this car?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading fleet...</div>;
  if (isError) return <div className="p-8 text-center text-red-500">Error loading fleet.</div>;

  const cars = data?.data || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Fleet Management</h1>
        <Link to="/admin/cars/new">
          <Button className="flex items-center gap-2">
            <Plus size={18} /> Add New Car
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="p-4 font-semibold">Car</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Daily Rate</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cars.map((car: Car) => (
              <tr key={car.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={car.images[0] || 'https://via.placeholder.com/40'} 
                      alt="" 
                      className="w-10 h-10 rounded object-cover bg-gray-200"
                    />
                    <div>
                      <div className="font-medium">{car.brand} {car.model}</div>
                      <div className="text-xs text-muted">{car.year}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-sm">{car.type}</td>
                <td className="p-4 text-sm font-medium">{formatCurrency(car.dailyPrice)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${car.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {car.isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link to={`/cars/${car.id}`} target="_blank">
                       <Button variant="ghost" size="sm" title="View Public Page">
                         <Eye size={16} />
                       </Button>
                    </Link>
                    <Link to={`/admin/cars/${car.id}/edit`}>
                      <Button variant="outline" size="sm" title="Edit">
                        <Edit size={16} />
                      </Button>
                    </Link>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      title="Delete"
                      onClick={() => handleDelete(car.id)}
                      isLoading={deleteMutation.isPending && deleteMutation.variables === car.id}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {cars.length === 0 && (
                <tr>
                    <td colSpan={5} className="p-8 text-center text-muted">No cars found in fleet.</td>
                </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
