
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Crown, Star, Check, PlusCircle, Trash2, LogIn, LogOut, Send } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency, currencies } from "@/context/CurrencyContext";
import { addDays, format, isFuture, isPast } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useItems } from '@/context/ItemsContext';
import { CustomMutation, CustomSpecies, inheritanceTypes } from '@/lib/data';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AddMutationFormValues } from '@/components/add-mutation-dialog';
import { AddSpeciesFormValues } from '@/components/add-species-dialog';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { usePushNotifications } from '@/hooks/use-push-notifications';

const AddMutationDialog = dynamic(() => import('@/components/add-mutation-dialog').then(mod => mod.AddMutationDialog), { ssr: false });
const AddSpeciesDialog = dynamic(() => import('@/components/add-species-dialog').then(mod => mod.AddSpeciesDialog), { ssr: false });


export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
  const { items, addItem, deleteItem, addItems } = useItems();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const { user, logout, isReadOnly } = useAuth();
  const {
    isSubscribed,
    isSubscriptionLoading,
    handleSubscriptionChange,
    sendTestNotification,
  } = usePushNotifications();

  const [trialEndDate, setTrialEndDate] = useState<Date | null>(null);
  const [isMutationDialogOpen, setIsMutationDialogOpen] = useState(false);
  const [isSpeciesDialogOpen, setIsSpeciesDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const customMutations = items.filter((item): item is CustomMutation => item.category === 'CustomMutation');
  const customSpecies = items.filter((item): item is CustomSpecies => item.category === 'CustomSpecies');

  const itemToDelete = deletingItemId ? items.find(i => i.id === deletingItemId) : null;

  useEffect(() => {
    setIsMounted(true);
    // In a real app, trial date would be tied to the user account
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
  
  const isTrialActive = user?.subscriptionStatus === 'trial' && trialEndDate && isFuture(trialEndDate);
  
  const premiumFeatures = [
    "Unlimited bird, cage, and pair entries",
    "Advanced breeding and incubation tracking",
    "Comprehensive financial reports",
    "AI Assistant for faster management"
  ];
  
  const handleSaveMutation = (data: AddMutationFormValues) => {
    const newMutation: CustomMutation = {
      ...data,
      id: `cm${Date.now()}`,
      category: 'CustomMutation',
    };
    addItem(newMutation);
    toast({ title: "Mutation Added", description: `The "${data.name}" mutation has been saved.` });
  };

  const handleSaveSpecies = (data: AddSpeciesFormValues) => {
    const newSpecies: CustomSpecies = {
      name: data.name,
      incubationPeriod: data.incubationPeriod,
      subspecies: data.subspecies.map(s => s.value),
      id: `cs${Date.now()}`,
      category: 'CustomSpecies',
    };
    addItem(newSpecies);
    toast({ title: "Species Added", description: `The "${data.name}" species has been saved.` });
  };
  
  const handleDeleteItem = () => {
    if (!deletingItemId) return;
    deleteItem(deletingItemId);
    toast({ title: "Item Deleted", description: "The custom data has been removed." });
    setDeletingItemId(null);
  };

  if (!isMounted) {
    return null;
  }

  const getBadgeVariant = () => {
    switch (user?.subscriptionStatus) {
      case 'admin':
      case 'monthly':
        return 'default';
      case 'trial':
        return 'secondary';
      case 'expired':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {isMutationDialogOpen && <AddMutationDialog isOpen={isMutationDialogOpen} onOpenChange={setIsMutationDialogOpen} onSave={handleSaveMutation} />}
      {isSpeciesDialogOpen && <AddSpeciesDialog isOpen={isSpeciesDialogOpen} onOpenChange={setIsSpeciesDialogOpen} onSave={handleSaveSpecies} />}

      <AlertDialog open={!!deletingItemId} onOpenChange={(open) => !open && setDeletingItemId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the custom item. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
            <Card>
                <CardHeader><CardTitle>Application Settings</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="dark-mode" className="text-base">Dark Mode</Label>
                        <Switch
                          id="dark-mode"
                          checked={theme === 'dark'}
                          onCheckedChange={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className='flex flex-col gap-1'>
                            <Label htmlFor="notifications" className="text-base">Enable Notifications</Label>
                            <p className="text-[0.8rem] text-muted-foreground">Receive reminders for hatch dates, etc.</p>
                        </div>
                        <Switch
                          id="notifications"
                          checked={isSubscribed}
                          onCheckedChange={handleSubscriptionChange}
                          disabled={isSubscriptionLoading}
                        />
                    </div>
                    {isSubscribed && (
                        <div className='flex justify-end'>
                            <Button variant="outline" size="sm" onClick={sendTestNotification}>
                                <Send className="mr-2 h-4 w-4"/>
                                Send Test Notification
                            </Button>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="currency-select" className="text-base">Currency</Label>
                        <Select value={currency.code} onValueChange={setCurrency}>
                            <SelectTrigger id="currency-select" className="w-[200px]"><SelectValue placeholder="Select currency" /></SelectTrigger>
                            <SelectContent>
                                {currencies.map((c) => (<SelectItem key={c.code} value={c.code}>{c.name} ({c.code})</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between">
                         <Label className="text-base">Account</Label>
                        {user ? (
                          <Button variant="outline" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </Button>
                        ) : (
                          <Button asChild variant="outline">
                            <Link href="/login">
                              <LogIn className="mr-2 h-4 w-4" />
                              Login or Register
                            </Link>
                          </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="data" className="mt-6 space-y-6">
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Custom Mutations</CardTitle>
                    <Button size="sm" onClick={() => setIsMutationDialogOpen(true)} disabled={isReadOnly}><PlusCircle className="mr-2 h-4 w-4"/>Add Mutation</Button>
                </CardHeader>
                <CardContent>
                    {customMutations.length > 0 ? (
                        <ul className="space-y-2">
                           {customMutations.map(m => (
                               <li key={m.id} className="flex items-center justify-between rounded-md border p-3">
                                   <div>
                                       <p className="font-medium">{m.name}</p>
                                       <p className="text-sm text-muted-foreground">{m.inheritance}</p>
                                   </div>
                                   <Button variant="ghost" size="icon" onClick={() => setDeletingItemId(m.id)} disabled={isReadOnly}>
                                       <Trash2 className="h-4 w-4 text-destructive"/>
                                   </Button>
                               </li>
                           ))}
                        </ul>
                    ) : <p className="text-center text-muted-foreground py-4">No custom mutations added yet.</p>}
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Custom Species</CardTitle>
                    <Button size="sm" onClick={() => setIsSpeciesDialogOpen(true)} disabled={isReadOnly}><PlusCircle className="mr-2 h-4 w-4"/>Add Species</Button>
                </CardHeader>
                <CardContent>
                     {customSpecies.length > 0 ? (
                        <ul className="space-y-2">
                           {customSpecies.map(s => (
                               <li key={s.id} className="flex items-center justify-between rounded-md border p-3">
                                   <div>
                                       <p className="font-medium">{s.name}</p>
                                       <p className="text-sm text-muted-foreground">Incubation: {s.incubationPeriod} days. Subspecies: {s.subspecies.length}</p>
                                   </div>
                                    <Button variant="ghost" size="icon" onClick={() => setDeletingItemId(s.id)} disabled={isReadOnly}>
                                       <Trash2 className="h-4 w-4 text-destructive"/>
                                   </Button>
                               </li>
                           ))}
                        </ul>
                    ) : <p className="text-center text-muted-foreground py-4">No custom species added yet.</p>}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="subscription" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Manage Subscription</CardTitle>
                    <CardDescription>All new accounts start with a free 7-day trial. Choose a plan that works for you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg border bg-secondary/50">
                        <h3 className="font-semibold mb-2">Current Plan</h3>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant={getBadgeVariant()} className="capitalize">{user?.subscriptionStatus || 'None'}</Badge>
                            </div>
                             {isTrialActive && trialEndDate && (
                                <p className="text-sm text-muted-foreground">
                                    Trial ends on {format(trialEndDate, 'PPP')}
                                </p>
                             )}
                             {user?.subscriptionStatus === 'expired' && (
                                <p className="text-sm font-semibold text-destructive">
                                    Your trial has expired.
                                </p>
                             )}
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
