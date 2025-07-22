
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageLoader } from '@/components/full-page-loader';

export type UserType = 'admin' | 'monthly' | 'trial' | 'expired';

interface User {
  uid: string;
  email: string;
  subscriptionStatus: UserType;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userType: UserType) => Promise<void>;
  logout: () => void;
  isReadOnly: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockUsers: Record<UserType, User> = {
    admin: { uid: 'admin123', email: 'admin@example.com', subscriptionStatus: 'admin' },
    monthly: { uid: 'monthly123', email: 'monthly@example.com', subscriptionStatus: 'monthly' },
    trial: { uid: 'trial123', email: 'trial@example.com', subscriptionStatus: 'trial' },
    expired: { uid: 'expired123', email: 'expired@example.com', subscriptionStatus: 'expired' },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for a saved session in sessionStorage
    const sessionUser = sessionStorage.getItem('auth-user');
    if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }
    setLoading(false);
  }, []);

  const login = async (userType: UserType) => {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const mockUser = mockUsers[userType];
        setUser(mockUser);
        sessionStorage.setItem('auth-user', JSON.stringify(mockUser));
        resolve();
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('auth-user');
    router.push('/login');
  };
  
  const isReadOnly = user?.subscriptionStatus === 'expired';

  const value = {
    user,
    loading,
    login,
    logout,
    isReadOnly,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <FullPageLoader /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
