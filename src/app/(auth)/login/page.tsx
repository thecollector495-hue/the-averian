
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, LogIn, Bird, Sparkles, FolderKanban, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, signup, user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
  
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const { user: newUser, error } = await signup(email, password);
        if (error) throw error;
        
        // Supabase returns a user object on successful signup.
        // If the user's email is not confirmed, the `identities` array will be empty.
        // This is a reliable way to check if confirmation is required.
        const requiresConfirmation = newUser && newUser.identities && newUser.identities.length === 0;

        if (requiresConfirmation) {
            toast({ title: 'Confirmation Email Sent', description: 'Please check your inbox to verify your account.' });
        } else {
            // If no confirmation is needed, log the user in immediately.
            await login(email, password);
            toast({ title: 'Account Created!', description: "You've been successfully signed up and logged in." });
        }
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Signup Failed', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        await login(email, password);
    } catch(error: any) {
        toast({ variant: 'destructive', title: 'Login Failed', description: error.message });
    } finally {
        setIsLoading(false);
    }
  }

  const featureList = [
    { icon: Bird, text: "Comprehensive bird and cage management" },
    { icon: FolderKanban, text: "Track breeding, notes, and permits" },
    { icon: Sparkles, text: "AI Assistant to streamline your tasks" },
    { icon: Banknote, text: "Detailed financial tracking and reports" },
  ];

  if (isPageLoading) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-background p-4">
              <Loader2 className="h-10 w-10 animate-spin" />
          </div>
      )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
            <div className="flex items-center justify-center text-3xl font-bold mb-2">
                <Bird className="mr-2 h-8 w-8 text-primary" />
                The Avarian
            </div>
            <p className="mt-2 text-muted-foreground">Your all-in-one solution for modern aviary management.</p>
        </div>
        
        <Card className="w-full text-left">
          <CardHeader>
            <CardTitle className="text-2xl">Login or Sign Up</CardTitle>
            <CardDescription>Enter your email and password to access your aviary.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}/>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
              <div className='flex w-full gap-2'>
                   <Button onClick={handleEmailLogin} className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4" />}
                      Sign In
                  </Button>
                  <Button onClick={handleEmailSignup} variant="secondary" className="w-full" disabled={isLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <UserPlus className="mr-2 h-4 w-4" />}
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

        <div className="mt-8 text-center">
            <h3 className="text-lg font-semibold mb-4">Key Features</h3>
            <ul className="space-y-4 text-sm inline-block text-left">
                {featureList.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                    <feature.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature.text}</span>
                </li>
                ))}
            </ul>
        </div>
      </div>
    </div>
  );
}
