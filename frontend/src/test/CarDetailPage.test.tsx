import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { CarDetailPage } from '@/pages/public/CarDetailPage';
import { carsApi } from '@/api/cars';
import { bookingsApi } from '@/api/bookings';
import { locationsApi } from '@/api/locations';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '@/contexts/AuthContext';

// Mocks
vi.mock('@/api/cars');
vi.mock('@/api/bookings');
vi.mock('@/api/locations');

// Mock specific hooks if needed or wrap providers
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

const mockUser = { id: '1', name: 'Test User', email: 'test@test.com', role: 'CUSTOMER' };
const mockAuthenticatedAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  isAdmin: false,
};

const mockCar = {
  id: 'c1',
  brand: 'Toyota',
  model: 'Camry',
  year: 2024,
  status: 'ACTIVE',
  dailyPrice: 500000,
  images: ['img.jpg'],
  seats: 5,
  transmission: 'Automatic',
  fuel: 'Petrol',
  type: 'SEDAN',
};

const mockLocations = [
  { id: 'l1', name: 'Airport', address: 'Airport Rd', isActive: true },
  { id: 'l2', name: 'Downtown', address: 'Center St', isActive: true },
];

describe('CarDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (carsApi.getById as any).mockResolvedValue({ data: mockCar });
    (locationsApi.getAll as any).mockResolvedValue({ data: mockLocations });
  });

  const renderComponent = (authContextValue = mockAuthenticatedAuthContext) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={authContextValue as any}>
          <MemoryRouter initialEntries={['/cars/c1']}>
            <Routes>
              <Route path="/cars/:id" element={<CarDetailPage />} />
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };

  it('should render car details correctly', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
      expect(screen.getByText('Rp 500.000')).toBeInTheDocument();
    });
  });

  it('should check availability when dates are selected', async () => {
    (carsApi.checkAvailability as any).mockResolvedValue({
      data: { available: true, conflictingBookings: [] },
    });

    renderComponent();
    await waitFor(() => screen.getByText('Toyota Camry'));

    const startDateInput = screen.getByLabelText(/Pick-up Date/i);
    const endDateInput = screen.getByLabelText(/Return Date/i);

    fireEvent.change(startDateInput, { target: { value: '2026-02-01' } });
    fireEvent.change(endDateInput, { target: { value: '2026-02-05' } });

    await waitFor(() => {
      // Expect the API to be called (with ISO strings roughly)
      expect(carsApi.checkAvailability).toHaveBeenCalled();
    });

    expect(await screen.findByText('✓ Car is available!')).toBeInTheDocument();
  });

  it('should show error when car is unavailable', async () => {
    (carsApi.checkAvailability as any).mockResolvedValue({
      data: {
        available: false,
        conflictingBookings: [{ id: 'b1', startDate: '2026-02-02', endDate: '2026-02-04' }],
      },
    });

    renderComponent();
    await waitFor(() => screen.getByText('Toyota Camry'));

    fireEvent.change(screen.getByLabelText(/Pick-up Date/i), { target: { value: '2026-02-01' } });
    fireEvent.change(screen.getByLabelText(/Return Date/i), { target: { value: '2026-02-05' } });

    await waitFor(() => {
        expect(carsApi.checkAvailability).toHaveBeenCalled();
        expect(screen.getByText(/Not Available:/)).toBeInTheDocument();
    });

    // Button should be disabled
    const button = screen.getByRole('button', { name: /Book Now/i });
    expect(button).toBeDisabled();
  });
});
