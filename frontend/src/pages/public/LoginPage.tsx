import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { LoginInput } from '@/api/auth';
import { AxiosError } from 'axios';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>();

  const onSubmit = async (data: LoginInput) => {
    setServerError(null);
    try {
      await login(data);
      navigate('/');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setServerError(error.response?.data?.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="container flex items-center" style={{ justifyContent: 'center', minHeight: 'calc(100vh - 200px)' }}>
      <Card className="w-full max-w-md" style={{ width: '100%', maxWidth: '400px' }}>
        <h1 className="text-2xl mb-4 text-center">Login</h1>
        
        {serverError && (
          <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex-col gap-4">
          <Input 
            label="Email" 
            type="email" 
            {...register('email', { required: 'Email is required' })} 
            error={errors.email?.message}
            placeholder="john@example.com"
          />
          
          <Input 
            label="Password" 
            type="password" 
            {...register('password', { required: 'Password is required' })} 
            error={errors.password?.message}
            placeholder="••••••••"
          />

          <Button type="submit" isLoading={isSubmitting} className="mt-4 w-full">
            Login
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-muted">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </Card>
    </div>
  );
};
