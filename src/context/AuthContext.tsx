
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { FullPageLoader } from '@/components/full-page-loader';
import { createBrowserClient, User as SupabaseUser, SignUpWithPasswordCredentials } from '@supabase/ssr';
import { useToast } from '@/hooks/use-toast';

export type UserType = 'admin' | 'monthly' | 'yearly' | 'trial' | 'expired';

interface AppUser {
  uid: string;
  email: string;
  subscriptionStatus: UserType;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (userTypeOrEmail: UserType | string, password?: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<{ user: SupabaseUser | null, error: any }>;
  logout: () => void;
  isReadOnly: boolean;
  isDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- Mock Data for Demo Mode ---
const mockUsers: Record<UserType, AppUser> = {
    admin: { uid: 'admin123', email: 'thecollector495@gmail.com', subscriptionStatus: 'admin' },
    monthly: { uid: 'monthly123', email: 'monthly@example.com', subscriptionStatus: 'monthly' },
    yearly: { uid: 'yearly123', email: 'yearly@example.com', subscriptionStatus: 'yearly' },
    trial: { uid: 'trial123', email: 'trial@example.com', subscriptionStatus: 'trial' },
    expired: { uid: 'expired123', email: 'expired@example.com', subscriptionStatus: 'expired' },
};

// --- Main Auth Provider Component ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_SUPABASE_URL');
  
  const supabase = isSupabaseConfigured ? createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ) : null;
  
  const isDemoMode = !supabase;

  useEffect(() => {
    if (isDemoMode) {
      const sessionUser = sessionStorage.getItem('auth-user');
      if (sessionUser) {
        setUser(JSON.parse(sessionUser));
      }
      setLoading(false);
      return;
    }

    // --- Real Supabase Auth Logic ---
    const { data: { subscription } } = supabase!.auth.onAuthStateChange((event, session) => {
      handleAuthStateChange(session?.user ?? null);
    });

    // Initial check
    supabase!.auth.getUser().then(({ data: { user } }) => {
        handleAuthStateChange(user);
    });

    return () => subscription.unsubscribe();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDemoMode]);

  const handleAuthStateChange = (supabaseUser: SupabaseUser | null) => {
    if (supabaseUser) {
        const appUser: AppUser = {
            uid: supabaseUser.id,
            email: supabaseUser.email!,
            subscriptionStatus: supabaseUser.user_metadata?.subscription_status || 'trial'
        };
        setUser(appUser);
        if (pathname === '/login') {
            router.push(appUser.subscriptionStatus === 'admin' ? '/dashboard' : '/');
        }
    } else {
        setUser(null);
    }
    setLoading(false);
  }

  // --- Auth Actions ---

  const login = async (userTypeOrEmail: UserType | string, password?: string) => {
    if (isDemoMode) {
      // Mock Login
      const mockUser = mockUsers[userTypeOrEmail as UserType];
      setUser(mockUser);
      sessionStorage.setItem('auth-user', JSON.stringify(mockUser));
      router.push(mockUser.subscriptionStatus === 'admin' ? '/dashboard' : '/');
      return;
    }

    // Real Supabase Login
    const { error } = await supabase!.auth.signInWithPassword({
        email: userTypeOrEmail,
        password: password!,
    });
    if (error) throw error;
    // onAuthStateChange will handle the rest
  };
  
  const signup = async (email: string, password: string) => {
      if (isDemoMode) throw new Error("Signup is not available in demo mode.");
      const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: {
            // This metadata will be set on the user in the 'auth.users' table
            data: {
              subscription_status: 'trial' 
            }
          }
      });
      // Do not throw here, let the caller handle the error.
      return { user: data.user, error };
  }

  const logout = async () => {
    if (isDemoMode) {
      setUser(null);
      sessionStorage.removeItem('auth-user');
      router.push('/login');
      return;
    }
    await supabase!.auth.signOut();
    router.push('/login');
  };
  
  const isReadOnly = !isDemoMode && user?.subscriptionStatus === 'expired';

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isReadOnly,
    isDemoMode,
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
