import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { RegisterInput } from '@/api/auth';
import { AxiosError } from 'axios';

export const RegisterPage: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>();

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    try {
      await registerAuth(data);
      navigate('/');
    } catch (err) {
      const error = err as AxiosError<{ message?: string, error?: string }>;
      setServerError(error.response?.data?.message || error.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="container flex items-center" style={{ justifyContent: 'center', minHeight: 'calc(100vh - 200px)' }}>
      <Card className="w-full max-w-md" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="text-2xl mb-4 text-center">Register</h1>
        
        {serverError && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex-col gap-4">
          <Input 
            label="Full Name" 
            type="text" 
            {...register('name', { required: 'Name is required' })} 
            error={errors.name?.message}
            placeholder="John Doe"
          />

          <Input 
            label="Email" 
            type="email" 
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address"
              }
            })} 
            error={errors.email?.message}
            placeholder="john@example.com"
          />
          
          <Input 
            label="Password" 
            type="password" 
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 8,
                message: "Password must be at least 8 characters"
              }
            })} 
            error={errors.password?.message}
            placeholder="••••••••"
          />

          <Button type="submit" isLoading={isSubmitting} className="mt-4 w-full">
            Create Account
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-muted">
          Already have an account? <Link to="/login" className="text-primary hover:underline">Login</Link>
        </p>
      </Card>
    </div>
  );
};
