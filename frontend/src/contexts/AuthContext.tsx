import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '@/types/auth';
import { authApi } from '@/api/auth';
import type { LoginInput, RegisterInput } from '@/api/auth';


interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verify token and get user (optional: rely on local storage user if simpler, but /me is safer)
          // For MVP, we'll try to fetch /me. If it fails, we logout.
          const { data } = await authApi.me();
          setUser(data);
        } catch (error) {
          console.error("Auth initialization failed", error);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (data: LoginInput) => {
    const response = await authApi.login(data);
    const { user, token } = response.data;
    
    localStorage.setItem('token', token.accessToken);
    // Client interceptor picks this up automatically for subsequent requests
    setUser(user);
    // Optional: reload or navigate handled by component
  };

  const register = async (data: RegisterInput) => {
    const response = await authApi.register(data);
    const { user, token } = response.data;
    
    localStorage.setItem('token', token.accessToken);
    setUser(user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN'
    }}>
      {children}
    </AuthContext.Provider>
  );
};
