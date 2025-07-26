
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth, UserType } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, Shield, Crown, Calendar, CalendarX, KeyRound, LogIn, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
  </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup, loginWithGoogle, isDemoMode, user } = useAuth();
  const [isLoading, setIsLoading] = useState<UserType | 'google' | 'email' | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push(user.subscriptionStatus === 'admin' ? '/dashboard' : '/');
    } else {
      setIsPageLoading(false);
    }
  }, [user, router]);
  
  const handleMockLogin = async (userType: UserType) => {
    setIsLoading(userType);
    try {
      await login(userType);
      toast({
        title: "Login Successful",
        description: `You are now logged in as: ${userType}.`,
      });
      // Context will redirect
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Login Failed", description: err.message });
      setIsLoading(null);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading('google');
    try {
        await loginWithGoogle();
        // The context handles redirection on successful login
    } catch (error: any) {
        toast({ variant: 'destructive', title: "Google Login Failed", description: error.message });
        setIsLoading(null);
    }
  }

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('email');
    try {
        await signup(email, password);
        toast({ title: 'Confirmation Email Sent', description: 'Please check your inbox to verify your account.' });
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Signup Failed', description: error.message });
    } finally {
        setIsLoading(null);
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading('email');
    try {
        await login(email, password);
        // The context will handle redirection
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    } finally {
        setIsLoading(null);
    }
  }

  const loginOptions: { type: UserType; label: string; icon: React.ElementType }[] = [
      { type: 'admin', label: 'Admin', icon: Shield },
      { type: 'monthly', label: 'Monthly Subscriber', icon: Crown },
      { type: 'trial', label: '7-Day Trial', icon: Calendar },
      { type: 'expired', label: 'Expired Trial', icon: CalendarX },
  ];

  if (isPageLoading) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
              <Loader2 className="h-10 w-10 animate-spin" />
          </div>
      )
  }

  if (isDemoMode) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Demo Login</CardTitle>
              <CardDescription>Select a user profile to simulate login.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {loginOptions.map(({ type, label, icon: Icon }) => (
                     <Button key={type} onClick={() => handleMockLogin(type)} disabled={!!isLoading} className="w-full justify-start h-12 text-base">
                        {isLoading === type ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        ) : (
                            <Icon className="mr-3 h-5 w-5" />
                        )}
                        <span>Login as {label}</span>
                    </Button>
                ))}
            </CardContent>
          </Card>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>Sign in or create an account to continue.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Button variant="outline" onClick={handleGoogleLogin} disabled={!!isLoading}>
            {isLoading === 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <GoogleIcon />}
            Sign in with Google
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!isLoading}/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={!!isLoading}/>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
            <div className='flex w-full gap-2'>
                 <Button onClick={handleEmailLogin} className="w-full" disabled={!!isLoading}>
                    {isLoading === 'email' && isLoading !== 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4" />}
                    Sign In
                </Button>
                <Button onClick={handleEmailSignup} variant="secondary" className="w-full" disabled={!!isLoading}>
                    {isLoading === 'email' && isLoading !== 'google' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4" />}
                    Sign Up
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">Signing up agrees to our (non-existent) Terms of Service.</p>
        </CardFooter>
      </Card>
    </div>
  );
}
