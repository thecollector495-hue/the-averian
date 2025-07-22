
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { FullPageLoader } from '@/components/full-page-loader';

// This is a placeholder user type. It will be replaced by Firebase's User type.
interface User {
  uid: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // In a real app, you'd check for a saved session or token here.
    // For this placeholder, we just simulate a loading state.
    const sessionUser = sessionStorage.getItem('auth-user');
    if (sessionUser) {
      setUser(JSON.parse(sessionUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    // Placeholder login logic. In a real app, this would be an API call to Firebase.
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Dummy validation
        if (email === 'admin@example.com' && pass === 'password') {
          const mockUser: User = { uid: '123', email: 'admin@example.com' };
          setUser(mockUser);
          sessionStorage.setItem('auth-user', JSON.stringify(mockUser));
          resolve();
        } else {
          reject(new Error('Invalid email or password.'));
        }
      }, 1000);
    });
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('auth-user');
    router.push('/login');
  };

  const value = {
    user,
    loading,
    login,
    logout,
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
