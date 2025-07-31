
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth, UserType } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, LogIn, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup, isDemoMode, user } = useAuth();
  const [isLoading, setIsLoading] = useState<UserType | 'email' | null>(null);
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
    } catch (err: any) {
      toast({ variant: 'destructive', title: "Login Failed", description: err.message });
      setIsLoading(null);
    }
  };

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
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    } finally {
        setIsLoading(null);
    }
  }

  const loginOptions: { type: UserType; label: string; icon: React.ElementType }[] = [
      { type: 'admin', label: 'Admin', icon: Shield },
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
          <CardDescription>Enter your email and password to sign in.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
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
                    {isLoading === 'email' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4" />}
                    Sign In
                </Button>
                <Button onClick={handleEmailSignup} variant="secondary" className="w-full" disabled={!!isLoading}>
                    {isLoading === 'email' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4" />}
                    Sign Up
                </Button>
            </div>
            <p className="px-8 text-center text-xs text-muted-foreground">
              By clicking continue, you agree to our{' '}
              <Link
                href="/legal/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/legal/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
