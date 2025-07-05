
'use client';

import { useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, parseISO } from 'date-fns';
import { Transaction } from '@/lib/data';
import { cn } from '@/lib/utils';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon } from 'lucide-react';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: "Transaction type is required." }),
  date: z.date({ required_error: "Date is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  amount: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number({ invalid_type_error: "Amount must be a number." }).min(0.01, "Amount must be positive.")
  ),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export function AddTransactionDialog({ isOpen, onOpenChange, onSave, initialData }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: TransactionFormValues & { id?: string }) => void, initialData: Transaction | null }) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
        type: 'expense',
        date: new Date(),
        description: '',
        amount: undefined,
    }
  });

  const { reset } = form;

  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            reset({
                ...initialData,
                date: parseISO(initialData.date),
            });
        } else {
            reset({
                type: 'expense',
                date: new Date(),
                description: '',
                amount: undefined,
            });
        }
    }
  }, [initialData, reset, isOpen]);

  function onSubmit(data: TransactionFormValues) {
    onSave({ ...data, id: initialData?.id });
    onOpenChange(false);
  }

  const isEditMode = initialData !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
          <DialogDescription>Log an income or expense item.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem><FormLabel>Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="income">Income</SelectItem><SelectItem value="expense">Expense</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem className="flex flex-col"><FormLabel>Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><> {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g., Bird food" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="amount" render={({ field }) => (
              <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 25.50" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">{isEditMode ? 'Save Changes' : 'Save Transaction'}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
