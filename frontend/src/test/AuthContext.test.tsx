import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, AuthContext } from '@/contexts/AuthContext';
import { authApi } from '@/api/auth';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import React, { useContext } from 'react';

// Mock authApi
vi.mock('@/api/auth', () => ({
  authApi: {
    me: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Test component to consume context
const TestComponent = () => {
  const context = useContext(AuthContext);
  if (!context) return <div>No Context</div>;
  return (
    <div>
      <span data-testid="user-name">{context.user?.name || 'No User'}</span>
      <span data-testid="is-loading">{context.isLoading ? 'Loading' : 'Loaded'}</span>
      <span data-testid="is-authenticated">{context.isAuthenticated ? 'Yes' : 'No'}</span>
      <button onClick={() => context.login({ email: 'test@test.com', password: 'password' })}>
        Login
      </button>
      <button onClick={() => context.logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('should start with loading state and attempt to fetch user if token exists', async () => {
    localStorageMock.getItem.mockReturnValue('fake-token');
    (authApi.me as any).mockResolvedValue({
      data: { id: '1', name: 'Test User', role: 'CUSTOMER' },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('is-loading')).toHaveTextContent('Loading');

    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('Loaded');
      expect(screen.getByTestId('user-name')).toHaveTextContent('Test User');
    });

    expect(authApi.me).toHaveBeenCalled();
  });

  it('should not fetch user if no token exists', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-loading')).toHaveTextContent('Loaded');
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
    });

    expect(authApi.me).not.toHaveBeenCalled();
  });

  it('should login successfully', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    (authApi.login as any).mockResolvedValue({
      data: {
        user: { id: '1', name: 'Logged In User', role: 'CUSTOMER' },
        token: { accessToken: 'new-token' },
      },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state
    await waitFor(() => expect(screen.getByTestId('is-loading')).toHaveTextContent('Loaded'));

    // Perform login
    await act(async () => {
      screen.getByText('Login').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Logged In User');
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token');
  });

  it('should logout successfully', async () => {
    // Setup initial logged in state
    localStorageMock.getItem.mockReturnValue('fake-token');
    (authApi.me as any).mockResolvedValue({
      data: { id: '1', name: 'Test User', role: 'CUSTOMER' },
    });
    (authApi.logout as any).mockResolvedValue({});

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-name')).toHaveTextContent('Test User'));

    // Perform logout
    await act(async () => {
      screen.getByText('Logout').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('No User');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('No');
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
  });
});
