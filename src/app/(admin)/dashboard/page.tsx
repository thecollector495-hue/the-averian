
'use client';

import { useState, useEffect, use } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Users, Crown, Users2, TrendingUp, UserPlus } from 'lucide-react';
import { getPayfastSettings, savePayfastSettings, getDashboardMetrics, DashboardMetrics } from '@/app/actions/admin-actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payfastMerchantId, setPayfastMerchantId] = useState('');
  const [payfastMerchantKey, setPayfastMerchantKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [settings, dashboardMetrics] = await Promise.all([
                getPayfastSettings(),
                getDashboardMetrics()
            ]);

            if (settings) {
                setPayfastMerchantId(settings.merchant_id);
                setPayfastMerchantKey(settings.merchant_key);
            }
            setMetrics(dashboardMetrics);

        } catch (error) {
            console.error("Failed to load dashboard data", error);
            toast({
                variant: 'destructive',
                title: "Error",
                description: "Could not load dashboard data.",
            });
        } finally {
            setIsLoading(false);
        }
    };
    loadInitialData();
  }, [user, toast]);
  
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
        await savePayfastSettings({
            userId: user.uid,
            merchantId: payfastMerchantId,
            merchantKey: payfastMerchantKey
        });
        toast({
            title: "Settings Saved",
            description: "Your Payfast API settings have been updated.",
        });
    } catch (error: any) {
         toast({
            variant: 'destructive',
            title: "Error Saving Settings",
            description: error.message,
        });
    } finally {
        setIsSaving(false);
    }
  };

  const metricCards = [
    { title: 'Subscribed Users', value: metrics?.subscribedUserCount, description: 'Total paying users', icon: Crown },
    { title: 'Free Users', value: metrics?.freeUserCount, description: "Users on a trial plan", icon: Users },
    { title: 'Total Users', value: metrics?.totalUserCount, description: 'All registered users', icon: Users2 },
    { title: 'Est. Monthly Income', value: `R${metrics?.estimatedMonthlyIncome}`, description: 'From all active subs', icon: TrendingUp },
    { title: 'New Users (Month)', value: metrics?.newUsersThisMonth, description: 'New signups this month', icon: UserPlus },
    { title: 'New Users (Today)', value: metrics?.newUsersToday, description: 'New signups today', icon: UserPlus },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.email || 'Admin'}!</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        {isLoading || !metrics ? (
            Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-6 w-6" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-4 w-full mt-2" />
                    </CardContent>
                </Card>
            ))
        ) : (
            <>
                {metricCards.map(card => (
                    <Card key={card.title}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                        <card.icon className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-4xl font-bold">{card.value}</div>
                        <p className="text-xs text-muted-foreground">{card.description}</p>
                      </CardContent>
                    </Card>
                ))}
            </>
        )}
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Payfast API Settings</CardTitle>
            <CardDescription>Configure your Payfast integration credentials. This is a secure place to store your keys.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSaveSettings}>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="merchant-id">Merchant ID</Label>
                    <Input 
                        id="merchant-id" 
                        placeholder="Enter your Payfast Merchant ID" 
                        value={payfastMerchantId}
                        onChange={(e) => setPayfastMerchantId(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="merchant-key">Merchant Key</Label>
                    <Input 
                        id="merchant-key" 
                        type="password"
                        placeholder="Enter your Payfast Merchant Key" 
                        value={payfastMerchantKey}
                        onChange={(e) => setPayfastMerchantKey(e.target.value)}
                        required
                        disabled={isLoading}
                    />
                 </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSaving || isLoading}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Settings
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
