import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthProvider } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/public/LoginPage';
import { RegisterPage } from '@/pages/public/RegisterPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { HomePage } from '@/pages/public/HomePage';
import { CarListingPage } from '@/pages/public/CarListingPage';
import { CarDetailPage } from '@/pages/public/CarDetailPage';
import { MyBookingsPage } from '@/pages/customer/MyBookingsPage';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminCarListPage } from '@/pages/admin/AdminCarListPage';
import { AdminCarFormPage } from '@/pages/admin/AdminCarFormPage';
import { AdminBookingsPage } from '@/pages/admin/AdminBookingsPage';
import { ToastProvider } from '@/contexts/ToastContext';
import '@/assets/styles/main.css';
import '@/assets/styles/utils.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/cars" element={<CarListingPage />} />
                <Route path="/cars/:id" element={<CarDetailPage />} />
                
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Customer Routes - accessible by any auth user really */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/my/bookings" element={<MyBookingsPage />} />
                </Route>

                {/* Protected Admin Routes */}
                <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
                   <Route element={<AdminLayout />}>
                      <Route path="/admin" element={<AdminDashboardPage />} />
                      
                      {/* Fleet Management */}
                      <Route path="/admin/cars" element={<AdminCarListPage />} />
                      <Route path="/admin/cars/new" element={<AdminCarFormPage />} />
                      <Route path="/admin/cars/:id/edit" element={<AdminCarFormPage />} />
                      
                      <Route path="/admin/bookings" element={<AdminBookingsPage />} />
                   </Route>
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
