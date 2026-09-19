import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, company: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const DEFAULT_USER: User = {
  id: 'usr_01',
  name: 'Devin Vance',
  email: 'devin@aurapackaging.com',
  company: 'Aura Packaging Labs',
  role: 'COMPANY_USER',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('niyamora_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_USER;
      }
    }
    return DEFAULT_USER; // Default logged in for smooth exploration
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('niyamora_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('niyamora_user');
    }
  }, [user]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Basic validation
    if (!email || !password) {
      return { success: false, error: 'Please enter both email and password' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters' };
    }

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substr(2, 6),
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email,
      company: 'Packaging Works Co.',
      role: 'COMPANY_USER',
    };
    setUser(newUser);
    return { success: true };
  };

  const signup = async (name: string, email: string, company: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!name || !email || !company || !password) {
      return { success: false, error: 'All fields are required' };
    }
    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long' };
    }

    const newUser: User = {
      id: 'usr_' + Math.random().toString(36).substr(2, 6),
      name,
      email,
      company,
      role: 'COMPANY_USER', // Strict default role for public signup
    };
    setUser(newUser);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    setUser({ ...user, ...data });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout, updateProfile }}>
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
