
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useAuth, UserType } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, UserPlus, Shield, Crown, Calendar, User as UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<UserType | null>(null);
  const { login } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (userType: UserType) => {
    setIsLoading(userType);
    
    try {
      await login(userType);
      toast({
        title: "Login Successful",
        description: `You are now logged in as: ${userType}.`,
      });
      router.push(userType === 'admin' ? '/dashboard' : '/');
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: "Login Failed",
        description: err.message,
      });
      setIsLoading(null);
    }
  };
  
  const loginOptions: { type: UserType; label: string; icon: React.ElementType }[] = [
      { type: 'admin', label: 'Admin', icon: Shield },
      { type: 'monthly', label: 'Monthly Subscriber', icon: Crown },
      { type: 'trial', label: '7-Day Trial', icon: Calendar },
      { type: 'none', label: 'Not Subscribed', icon: UserIcon },
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Login / Register</CardTitle>
          <CardDescription>Select a user profile to simulate login.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            {loginOptions.map(({ type, label, icon: Icon }) => (
                 <Button key={type} onClick={() => handleLogin(type)} disabled={!!isLoading} className="w-full justify-start h-12 text-base">
                    {isLoading === type ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <Icon className="mr-3 h-5 w-5" />
                    )}
                    <span>Login as {label}</span>
                </Button>
            ))}
        </CardContent>
         <CardFooter className="flex-col items-start gap-4">
          <div className="text-sm text-center w-full text-muted-foreground">
            Or, create a new account.
          </div>
          <Button variant="outline" className="w-full">
            <UserPlus className="mr-2 h-5 w-5" />
            Register (Placeholder)
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
