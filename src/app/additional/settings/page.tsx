
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Crown, Star, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency, currencies } from "@/context/CurrencyContext";
import { addDays, format, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);

  useEffect(() => {
    const trialStartDateStr = localStorage.getItem('app_trial_start_date');
    let startDate: Date;

    if (trialStartDateStr) {
      startDate = new Date(trialStartDateStr);
    } else {
      startDate = new Date();
      localStorage.setItem('app_trial_start_date', startDate.toISOString());
    }
    
    setTrialEndDate(addDays(startDate, 7));

  }, []);

  const isTrialActive = trialEndDate && isFuture(trialEndDate);
  
  const premiumFeatures = [
    "Unlimited bird, cage, and pair entries",
    "Advanced breeding and incubation tracking",
    "Comprehensive financial reports",
    "AI Assistant for faster management"
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="general">
        <TabsList className="grid h-auto w-full grid-cols-1 md:grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Application Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                        <Switch id="dark-mode" defaultChecked disabled />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="notifications" className="text-base">Enable Notifications</Label>
                        <Switch id="notifications" />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label htmlFor="currency-select" className="text-base">Currency</Label>
                        <Select value={currency.code} onValueChange={setCurrency}>
                            <SelectTrigger id="currency-select" className="w-[200px]"><SelectValue placeholder="Select currency" /></SelectTrigger>
                            <SelectContent>
                                {currencies.map((c) => (<SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="subscription" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Subscription</CardTitle>
                    <CardDescription>Choose a plan that works for you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg border bg-secondary/50">
                        <h3 className="font-semibold mb-2">Current Plan</h3>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="default">7-day Free Trial</Badge>
                            </div>
                             <p className="text-sm text-muted-foreground">
                                {isTrialActive ? `Trial ends on ${format(trialEndDate!, 'PPP')}` : 'Your trial has ended.'}
                             </p>
                        </div>
                    </div>

                     <div className="space-y-4">
                        <h3 className="font-semibold">Choose Your Plan</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Crown className="text-muted-foreground"/> Monthly</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <p className="text-3xl font-bold">R35 <span className="text-lg font-normal text-muted-foreground">/ month</span></p>
                                    <ul className="text-sm text-muted-foreground space-y-2 flex-grow">
                                        {premiumFeatures.map(feature => <li key={feature} className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-green-500 shrink-0"/><span>{feature}</span></li>)}
                                    </ul>
                                    <Button className="w-full" variant="outline">Subscribe</Button>
                                </CardContent>
                            </Card>
                             <Card className="border-primary border-2 relative">
                                <Badge className="absolute -top-3 right-4">Best Value</Badge>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2"><Star className="text-primary"/> Yearly</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                     <p className="text-3xl font-bold">R300 <span className="text-lg font-normal text-muted-foreground">/ year</span></p>
                                     <p className="text-sm text-green-500 font-medium">Save R120 per year!</p>
                                     <ul className="text-sm text-muted-foreground space-y-2 flex-grow">
                                        {premiumFeatures.map(feature => <li key={feature} className="flex items-start gap-2"><Check className="h-4 w-4 mt-0.5 text-green-500 shrink-0"/><span>{feature}</span></li>)}
                                     </ul>
                                    <Button className="w-full">Subscribe</Button>
                                </CardContent>
                            </Card>
                        </div>
                     </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
