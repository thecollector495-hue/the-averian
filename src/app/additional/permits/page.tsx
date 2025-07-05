
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar as CalendarIcon, ShieldCheck } from "lucide-react";
import { initialItems, Permit } from '@/lib/data';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const permitSchema = z.object({
  permitNumber: z.string().min(1, { message: "Permit number is required." }),
  issuingAuthority: z.string().min(1, { message: "Issuing authority is required." }),
  issueDate: z.date({ required_error: "Issue date is required." }),
  expiryDate: z.date().optional(),
});

type PermitFormValues = z.infer<typeof permitSchema>;

function AddPermitDialog({ isOpen, onOpenChange, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: PermitFormValues) => void }) {
  const form = useForm<PermitFormValues>({
    resolver: zodResolver(permitSchema),
  });

  function onSubmit(data: PermitFormValues) {
    onSave(data);
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Permit</DialogTitle>
          <DialogDescription>Log a new regulatory permit.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="permitNumber" render={({ field }) => (
              <FormItem><FormLabel>Permit Number</FormLabel><FormControl><Input placeholder="e.g., ZA-WC-12345" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="issuingAuthority" render={({ field }) => (
              <FormItem><FormLabel>Issuing Authority</FormLabel><FormControl><Input placeholder="e.g., CapeNature" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="issueDate" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Issue Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><> {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="expiryDate" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Expiry Date (Optional)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><> {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent></Popover><FormMessage /></FormItem>
            )} />
            <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">Save Permit</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function PermitsPage() {
  const [items, setItems] = useState(initialItems);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const permits = items.filter((item): item is Permit => item.category === 'Permit');

  const handleSavePermit = (data: PermitFormValues) => {
    const newPermit: Permit = {
      ...data,
      id: `p${Date.now()}`,
      category: 'Permit',
      issueDate: format(data.issueDate, 'yyyy-MM-dd'),
      expiryDate: data.expiryDate ? format(data.expiryDate, 'yyyy-MM-dd') : undefined,
    };
    setItems(prev => [newPermit, ...prev]);
  };
  
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <AddPermitDialog
        isOpen={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSave={handleSavePermit}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Permits</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4"/>
          Add Permit
        </Button>
      </div>
       {permits.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {permits.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="text-primary"/>{p.permitNumber}</CardTitle>
                <CardDescription>{p.issuingAuthority}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                    <p><span className="font-medium text-muted-foreground">Issued:</span> {format(new Date(p.issueDate), 'PPP')}</p>
                    <p><span className="font-medium text-muted-foreground">Expires:</span> {p.expiryDate ? format(new Date(p.expiryDate), 'PPP') : 'No expiry'}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        ) : (
            <div className="text-center py-16 rounded-lg border border-dashed">
                <h2 className="text-xl font-semibold">No Permits Yet</h2>
                <p className="text-muted-foreground mt-2">Click "Add Permit" to log your first one.</p>
            </div>
        )}
    </div>
  );
}
