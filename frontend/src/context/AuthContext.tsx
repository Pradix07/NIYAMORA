import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api, getAuthToken, clearAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, company: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('niyamora_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate stored session with backend on initial mount
  useEffect(() => {
    async function verifySession() {
      const token = getAuthToken();
      if (token) {
        try {
          const me = await api.getMe();
          const liveUser: User = {
            id: me.id,
            name: me.name,
            email: me.email,
            company: me.company_name || 'Packaging Works Co.',
            role: me.role,
          };
          setUser(liveUser);
          localStorage.setItem('niyamora_user', JSON.stringify(liveUser));
        } catch {
          // Token expired or invalid
          clearAuthToken();
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    verifySession();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!email || !password) {
      return { success: false, error: 'Please enter both email and password' };
    }

    try {
      const res = await api.login({ email, password });
      const authenticatedUser: User = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        company: res.user.company_name || 'Company',
        role: res.user.role,
      };
      setUser(authenticatedUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed. Please check your credentials.' };
    }
  };

  const signup = async (name: string, email: string, company: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!name || !email || !company || !password) {
      return { success: false, error: 'All fields are required' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    try {
      const res = await api.signup({
        name,
        email,
        company_name: company,
        password,
      });
      const registeredUser: User = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        company: res.user.company_name || company,
        role: res.user.role,
      };
      setUser(registeredUser);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Signup failed. Please try again.' };
    }
  };

  const logout = () => {
    api.logout().finally(() => {
      setUser(null);
    });
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('niyamora_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, signup, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
