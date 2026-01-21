import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Car, Menu, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-background sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Car className="text-primary h-6 w-6" />
          <span>RentCar</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/cars" className="text-sm font-medium hover:text-primary transition-colors">Browse Cars</Link>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              <Link to="/my/bookings" className="text-sm font-medium hover:text-primary transition-colors">My Bookings</Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors">Admin</Link>
              )}
              <div className="flex items-center gap-2 border-l pl-4 ml-2">
                <span className="text-sm font-medium">{user?.name}</span>
                <Button variant="outline" size="sm" onClick={() => logout()}>Logout</Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Register</Button>
              </Link>
            </div>
          )}
        </div>

        <div className={`md:hidden absolute top-16 left-0 right-0 bg-background border-b p-4 flex flex-col gap-4 shadow-lg transition-all duration-200 ${isMobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
          <Link to="/cars" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Browse Cars</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/my/bookings" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>My Bookings</Link>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Admin</Link>
              )}
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center gap-2 mb-4">
                   <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {user?.name?.[0]?.toUpperCase()}
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-medium">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                   </div>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => logout()}>Logout</Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">Login</Button>
              </Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button size="sm" className="w-full">Register</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden p-2 hover:bg-accent rounded-md" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
    </nav>
  );
};
