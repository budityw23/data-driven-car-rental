import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Car, ShieldCheck, Zap } from 'lucide-react';

export const HomePage: React.FC = () => {
  return (
    <div className="flex-col">
      {/* Hero Section */}
      <section className="bg-primary text-white py-20" style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '5rem 0' }}>
        <div className="container flex-col items-center text-center gap-6">
          <h1 className="text-4xl font-bold" style={{ fontSize: '3rem', lineHeight: '1.2' }}>
            Drive Your Data-Driven Journey
          </h1>
          <p className="text-xl opacity-90" style={{ maxWidth: '600px' }}>
            Experience the future of car rental with our transparent, analytics-backed booking platform.
          </p>
          <div className="flex gap-4 mt-4">
            <Link to="/cars">
              <Button size="lg" className="bg-white text-primary hover:bg-gray-100" style={{ backgroundColor: 'white', color: 'var(--primary)' }}>
                Browse Fleet
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 container" style={{ padding: '4rem 1rem' }}>
        <h2 className="text-2xl font-bold text-center mb-10">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <FeatureCard 
            icon={<Car size={32} className="text-primary" />}
            title="Premium Fleet"
            description="Choose from our wide range of high-quality vehicles."
          />
          <FeatureCard 
            icon={<Zap size={32} className="text-primary" />}
            title="Instant Booking"
            description="Real-time availability and instant confirmation."
          />
          <FeatureCard 
            icon={<ShieldCheck size={32} className="text-primary" />}
            title="Secure & Reliable"
            description="Verified cars and secure payment processing (simulated)."
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <Card className="flex-col items-center text-center p-6 gap-4">
    <div className="p-3 bg-blue-50 rounded-full" style={{ backgroundColor: '#eff6ff', borderRadius: '999px', padding: '1rem' }}>
      {icon}
    </div>
    <h3 className="text-xl font-semibold">{title}</h3>
    <p className="text-muted">{description}</p>
  </Card>
);
