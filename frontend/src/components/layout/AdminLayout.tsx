import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Car, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const AdminLayout: React.FC = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <Link to="/" className="text-xl font-bold flex items-center gap-2">
            <Car className="text-blue-700 h-6 w-6" />
            <span>Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          <Link 
            to="/admin" 
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive('/admin') ? 'bg-blue-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </Link>
          <Link 
            to="/admin/cars" 
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive('/admin/cars') ? 'bg-blue-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Car size={20} />
            Fleet
          </Link>
          <Link 
            to="/admin/bookings" 
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${isActive('/admin/bookings') ? 'bg-blue-700 text-white shadow-md' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Calendar size={20} />
            Bookings
          </Link>
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
