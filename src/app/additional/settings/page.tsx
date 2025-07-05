
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { PlusCircle, Crown, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency, currencies } from "@/context/CurrencyContext";
import { useItems, CustomSpecies, CustomMutation } from '@/context/ItemsContext';
import { AddSpeciesFormValues } from '@/components/add-species-dialog';
import { AddMutationFormValues } from '@/components/add-mutation-dialog';
import { addDays, format, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const AddSpeciesDialog = dynamic(() => import('@/components/add-species-dialog').then(mod => mod.AddSpeciesDialog), { ssr: false });
const AddMutationDialog = dynamic(() => import('@/components/add-mutation-dialog').then(mod => mod.AddMutationDialog), { ssr: false });

export default function SettingsPage() {
  const { currency, setCurrency } = useCurrency();
  const { items, addItem } = useItems();

  const [isSpeciesDialogOpen, setIsSpeciesDialogOpen] = useState(false);
  const [isMutationDialogOpen, setIsMutationDialogOpen] = useState(false);
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

  const customSpecies = items.filter((item): item is CustomSpecies => item.category === 'CustomSpecies');
  const customMutations = items.filter((item): item is CustomMutation => item.category === 'CustomMutation');
  
  const handleSaveSpecies = (data: AddSpeciesFormValues) => {
    const subspeciesArray = data.subspecies.map(s => s.value.trim()).filter(Boolean);
    const newSpecies: CustomSpecies = {
        id: `cs_${Date.now()}`,
        category: 'CustomSpecies',
        name: data.name,
        incubationPeriod: data.incubationPeriod,
        subspecies: subspeciesArray,
    };
    addItem(newSpecies);
  };
  
  const handleSaveMutation = (data: AddMutationFormValues) => {
    const newMutation: CustomMutation = {
        id: `cm_${Date.now()}`,
        category: 'CustomMutation',
        name: data.name,
    };
    addItem(newMutation);
  };

  const isTrialActive = trialEndDate && isFuture(trialEndDate);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {isSpeciesDialogOpen && <AddSpeciesDialog isOpen={isSpeciesDialogOpen} onOpenChange={setIsSpeciesDialogOpen} onSave={handleSaveSpecies} />}
      {isMutationDialogOpen && <AddMutationDialog isOpen={isMutationDialogOpen} onOpenChange={setIsMutationDialogOpen} onSave={handleSaveMutation} />}

      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="species">Species</TabsTrigger>
          <TabsTrigger value="mutations">Mutations</TabsTrigger>
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
        <TabsContent value="species" className="mt-6">
           <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Custom Species</CardTitle>
                        <CardDescription>Add and manage your own species definitions.</CardDescription>
                    </div>
                    <Button onClick={() => setIsSpeciesDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Species</Button>
                </CardHeader>
                <CardContent>
                    {customSpecies.length > 0 ? (
                        <ul className="space-y-3">
                            {customSpecies.map(s => (
                                <li key={s.id} className="p-3 border rounded-md flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{s.name}</p>
                                        <p className="text-sm text-muted-foreground">Incubation: {s.incubationPeriod} days | Subspecies: {s.subspecies.length}</p>
                                    </div>
                                    {/* Edit/Delete buttons can go here in the future */}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-center py-4">No custom species added yet.</p>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="mutations" className="mt-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Custom Mutations</CardTitle>
                        <CardDescription>Add and manage your own mutation names.</CardDescription>
                    </div>
                    <Button onClick={() => setIsMutationDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Add Mutation</Button>
                </CardHeader>
                <CardContent>
                    {customMutations.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                           {customMutations.map(m => (
                                <div key={m.id} className="px-3 py-1.5 border rounded-md bg-secondary text-secondary-foreground font-medium">
                                    {m.name}
                                </div>
                           ))}
                        </div>
                    ) : (
                         <p className="text-muted-foreground text-center py-4">No custom mutations added yet.</p>
                    )}
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
                                    <Button className="w-full">Subscribe</Button>
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
