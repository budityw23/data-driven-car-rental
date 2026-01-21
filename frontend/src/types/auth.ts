export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: {
      accessToken: string;
      expiresIn: string;
    };
  };
}

export interface LoginConfig {
  user: User;
  token: string;
}
