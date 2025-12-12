import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AdminUser, LoginData, AuthResponse } from '../types';
import { ApiClient, setAuthToken, getAuthToken, clearAuthToken } from '../lib/api';

interface AuthContextType {
  user: User | AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (data: LoginData, isAdminLogin?: boolean) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to decode JWT payload without verification
const decodeToken = (token: string): { is_admin?: boolean } | null => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | AdminUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      // Decode token to check if it's an admin token
      const payload = decodeToken(token);
      const isAdminToken = payload?.is_admin === true;

      // Use the appropriate endpoint based on token type
      const endpoint = isAdminToken ? '/admin/auth/me' : '/auth/me';
      const response = await ApiClient.get<{ user: User | AdminUser; isAdmin: boolean }>(endpoint);
      setUser(response.user);
      setIsAdmin(response.isAdmin);
    } catch {
      clearAuthToken();
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (data: LoginData, isAdminLogin: boolean = false) => {
    const endpoint = isAdminLogin ? '/admin/auth/login' : '/auth/login';
    const response = await ApiClient.post<AuthResponse>(endpoint, data);

    if (response.success && response.token && response.user) {
      setAuthToken(response.token);
      setUser(response.user);
      setIsAdmin(isAdminLogin);
    } else {
      throw new Error(response.message || 'Login failed');
    }
  };

  const logout = () => {
    clearAuthToken();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
