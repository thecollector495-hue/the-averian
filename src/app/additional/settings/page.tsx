
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { PlusCircle, Crown, Star, Check, Pencil, Trash2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCurrency, currencies } from "@/context/CurrencyContext";
import { useItems, CustomSpecies, CustomMutation } from '@/context/ItemsContext';
import { AddSpeciesFormValues } from '@/components/add-species-dialog';
import { AddMutationFormValues } from '@/components/add-mutation-dialog';
import { CageFormValues } from '@/components/add-cage-dialog';
import { Cage, Transaction } from '@/lib/data';
import { addDays, format, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const AddSpeciesDialog = dynamic(() => import('@/components/add-species-dialog').then(mod => mod.AddSpeciesDialog), { ssr: false });
const AddMutationDialog = dynamic(() => import('@/components/add-mutation-dialog').then(mod => mod.AddMutationDialog), { ssr: false });
const AddCageDialog = dynamic(() => import('@/components/add-cage-dialog').then(mod => mod.AddCageDialog), { ssr: false });


export default function SettingsPage() {
  const { currency, setCurrency, formatCurrency } = useCurrency();
  const { items, addItem, updateItem, deleteItem, addItems } = useItems();
  const { toast } = useToast();

  const [isSpeciesDialogOpen, setIsSpeciesDialogOpen] = useState(false);
  const [isMutationDialogOpen, setIsMutationDialogOpen] = useState(false);
  const [isCageDialogOpen, setIsCageDialogOpen] = useState(false);
  const [editingCage, setEditingCage] = useState<Cage | null>(null);
  const [deletingCageId, setDeletingCageId] = useState<string | null>(null);

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
  const allCages = items.filter((item): item is Cage => item.category === 'Cage');
  const cageToDelete = deletingCageId ? allCages.find(c => c.id === deletingCageId) : null;
  
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

  const handleEditCageClick = (cage: Cage) => {
    setEditingCage(cage);
    setIsCageDialogOpen(true);
  };

  const handleAddCageClick = () => {
    setEditingCage(null);
    setIsCageDialogOpen(true);
  };

  const handleSaveCage = (data: CageFormValues & { id?: string }) => {
    const itemsToSave: (Cage | Transaction)[] = [];
    if (data.id) { // Editing
      const updatedCage = {
        id: data.id,
        name: data.name,
        cost: data.cost,
      };
      updateItem(data.id, updatedCage);
      toast({ title: "Cage Updated", description: `Cage "${data.name}" has been updated.` });
    } else { // Adding
      const newCage: Cage = {
        id: `c_${Date.now()}`,
        category: 'Cage',
        name: data.name,
        birdIds: [],
        cost: data.cost,
      };
      itemsToSave.push(newCage);

      if (data.addToExpenses && data.cost && data.cost > 0) {
        const newTransaction: Transaction = {
          id: `t_${Date.now()}`,
          category: 'Transaction',
          type: 'expense',
          date: format(new Date(), 'yyyy-MM-dd'),
          description: `Purchase of cage: ${data.name}`,
          amount: data.cost,
        };
        itemsToSave.push(newTransaction);
        toast({ title: 'Expense Added', description: `Purchase of cage ${data.name} logged.` });
      }
      addItems(itemsToSave);
      toast({ title: 'Cage Added', description: `Cage "${data.name}" has been created.` });
    }
  };
  
  const handleDeleteCage = () => {
    if (!deletingCageId) return;
    deleteItem(deletingCageId);
    toast({ title: 'Cage Deleted', description: 'The cage has been removed.' });
    setDeletingCageId(null);
  };

  const isTrialActive = trialEndDate && isFuture(trialEndDate);
  
  const premiumFeatures = [
    "Unlimited bird, cage, and pair entries",
    "Advanced breeding and incubation tracking",
    "Comprehensive financial reports",
    "Custom species and mutation management"
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {isSpeciesDialogOpen && <AddSpeciesDialog isOpen={isSpeciesDialogOpen} onOpenChange={setIsSpeciesDialogOpen} onSave={handleSaveSpecies} />}
      {isMutationDialogOpen && <AddMutationDialog isOpen={isMutationDialogOpen} onOpenChange={setIsMutationDialogOpen} onSave={handleSaveMutation} />}
      {isCageDialogOpen && <AddCageDialog isOpen={isCageDialogOpen} onOpenChange={setIsCageDialogOpen} onSave={handleSaveCage} initialData={editingCage} />}
      
       <AlertDialog open={!!deletingCageId} onOpenChange={(open) => !open && setDeletingCageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the cage '{cageToDelete?.name}'.
              {cageToDelete && cageToDelete.birdIds.length > 0 && ` The ${cageToDelete.birdIds.length} bird(s) in this cage will be uncaged.`}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCage}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Tabs defaultValue="general">
        <TabsList className="grid h-auto w-full grid-cols-1 md:grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="cages">Cages</TabsTrigger>
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
        <TabsContent value="cages" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manage Cages</CardTitle>
                    <CardDescription>Add, edit, or delete your cages.</CardDescription>
                </div>
                <Button onClick={handleAddCageClick}><PlusCircle className="mr-2 h-4 w-4" /> Add Cage</Button>
            </CardHeader>
            <CardContent>
                {allCages.length > 0 ? (
                    <ul className="space-y-3">
                        {allCages.map(cage => (
                            <li key={cage.id} className="p-3 border rounded-md flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{cage.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        Occupants: {cage.birdIds.length} | Cost: {formatCurrency(cage.cost)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon" onClick={() => handleEditCageClick(cage)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => setDeletingCageId(cage.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground text-center py-4">No cages added yet.</p>
                )}
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
