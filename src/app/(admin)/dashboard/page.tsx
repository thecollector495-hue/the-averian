
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { mockSubscriptions, Subscription } from '@/lib/admin-data';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const MONTHLY_PRICE = 35;
const YEARLY_PRICE = 300;

// Helper function to calculate metrics
const calculateMetrics = (subscriptions: Subscription[]) => {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const activeMonthlySubs = subscriptions.filter(s => s.plan === 'monthly' && s.status === 'active');
  const activeYearlySubs = subscriptions.filter(s => s.plan === 'yearly' && s.status === 'active');

  // New yearly subs this month for cash flow calculation
  const newYearlySubsThisMonth = subscriptions.filter(s => 
    s.plan === 'yearly' && 
    new Date(s.startDate) >= startOfThisMonth &&
    new Date(s.startDate) <= now
  );
  
  // To calculate last month's income, we need to know who was active then.
  // A monthly sub was active last month if it started before the end of last month AND is still active now (a simplification for this mock data)
  const monthlySubsActiveLastMonth = subscriptions.filter(s => {
    const startDate = new Date(s.startDate);
    return s.plan === 'monthly' && startDate <= endOfLastMonth && s.status === 'active';
  });

  const newYearlySubsLastMonth = subscriptions.filter(s =>
    s.plan === 'yearly' &&
    new Date(s.startDate) >= startOfLastMonth &&
    new Date(s.startDate) <= endOfLastMonth
  );
  
  const lastMonthMonthlyIncome = monthlySubsActiveLastMonth.length * MONTHLY_PRICE;
  const lastMonthYearlyIncome = newYearlySubsLastMonth.length * YEARLY_PRICE;
  const lastMonthTotalIncome = lastMonthMonthlyIncome + lastMonthYearlyIncome;

  // Actual cash flow this month
  const monthlyIncomeThisMonth = activeMonthlySubs.length * MONTHLY_PRICE;
  const yearlyIncomeThisMonth = newYearlySubsThisMonth.length * YEARLY_PRICE;
  const totalIncomeThisMonth = monthlyIncomeThisMonth + yearlyIncomeThisMonth;
  
  // Placeholder for expenses
  const totalExpenses = 0; 
  const netProfitThisMonth = totalIncomeThisMonth - totalExpenses;
  
  // Estimated income for next month from monthly subs
  const nextMonthEstimated = activeMonthlySubs.length * MONTHLY_PRICE;

  return {
    monthlySubCount: activeMonthlySubs.length,
    yearlySubCount: activeYearlySubs.length,
    totalIncomeThisMonth: totalIncomeThisMonth.toFixed(2),
    netProfitThisMonth: netProfitThisMonth.toFixed(2),
    nextMonthEstimated: nextMonthEstimated.toFixed(2),
    lastMonthMonthlyIncome: lastMonthMonthlyIncome.toFixed(2),
    lastMonthYearlyIncome: lastMonthYearlyIncome.toFixed(2),
    lastMonthTotalIncome: lastMonthTotalIncome.toFixed(2),
  };
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payfastMerchantId, setPayfastMerchantId] = useState('');
  const [payfastMerchantKey, setPayfastMerchantKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // In a real app, this data would come from a database
  const metrics = calculateMetrics(mockSubscriptions);
  
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Placeholder save logic
    setTimeout(() => {
        console.log('Saving Payfast settings:', { payfastMerchantId, payfastMerchantKey });
        toast({
            title: "Settings Saved",
            description: "Your Payfast API settings have been updated.",
        });
        setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.email || 'Admin'}!</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Subs</CardTitle>
            <CardDescription>Active monthly plans</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{metrics.monthlySubCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Yearly Subs</CardTitle>
            <CardDescription>Active yearly plans</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{metrics.yearlySubCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Income (This Month)</CardTitle>
            <CardDescription>Actual cash flow this month</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">R{metrics.totalIncomeThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Next Month's Est. Income</CardTitle>
            <CardDescription>From monthly subs only</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">R{metrics.nextMonthEstimated}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Net Profit (Month)</CardTitle>
            <CardDescription>Income minus expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-green-500">R{metrics.netProfitThisMonth}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Previous Month Income</CardTitle>
            <CardDescription>Breakdown of last month's revenue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-3xl font-bold">R{metrics.lastMonthTotalIncome}</p>
            <p className="text-sm text-muted-foreground">
                Monthly: R{metrics.lastMonthMonthlyIncome}<br/>
                Yearly: R{metrics.lastMonthYearlyIncome}
            </p>
          </CardContent>
        </Card>
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
                    />
                 </div>
            </CardContent>
            <CardFooter>
                 <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Save Settings
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
