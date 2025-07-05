
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar as CalendarIcon, ArrowDown, ArrowUp, Pencil, Search } from "lucide-react";
import { useCurrency } from '@/context/CurrencyContext';
import { initialItems, Transaction, getBirdIdentifier, Bird } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense'], { required_error: "Transaction type is required." }),
  date: z.date({ required_error: "Date is required." }),
  description: z.string().min(1, { message: "Description is required." }),
  amount: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number({ invalid_type_error: "Amount must be a number." }).min(0.01, "Amount must be positive.")
  ),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

function AddTransactionDialog({ isOpen, onOpenChange, onSave, initialData }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: TransactionFormValues & { id?: string }) => void, initialData: Transaction | null }) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        date: parseISO(initialData.date),
      });
    } else {
      form.reset({
        type: 'expense',
        date: new Date(),
        description: '',
        amount: undefined,
      });
    }
  }, [initialData, form, isOpen]);

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
              <FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" step="0.01" placeholder="e.g., 25.50" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit">{isEditMode ? 'Save Changes' : 'Save Transaction'}</Button></DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function TransactionsPage() {
  const [items, setItems] = useState(initialItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const { formatCurrency } = useCurrency();

  const allBirds = items.filter((item): item is Bird => item.category === 'Bird');

  const transactions = items
    .filter((item): item is Transaction => item.category === 'Transaction')
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    
  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddClick = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };
  
  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleSaveTransaction = (data: TransactionFormValues & { id?: string }) => {
    if (data.id) { // Editing existing
        setItems(prev => prev.map(item =>
            item.id === data.id
                ? { ...item, ...data, date: format(data.date, 'yyyy-MM-dd') }
                : item
        ));
    } else { // Creating new
        const newTransaction: Transaction = {
            ...data,
            id: `t${Date.now()}`,
            category: 'Transaction',
            date: format(data.date, 'yyyy-MM-dd'),
        };
        setItems(prev => [newTransaction, ...prev]);
    }
  };
  
  return (
    <div className="p-4 sm:p-6 md:p-8">
      <AddTransactionDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
      />
       <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Transactions</h1>
        <div className="flex w-full sm:w-auto sm:justify-end gap-2">
            <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search transactions..."
                    className="pl-10 w-full sm:w-64"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button onClick={handleAddClick}>
                <PlusCircle className="mr-2 h-4 w-4"/>
                Add
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>A log of all your income and expenses.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => {
                  const bird = t.relatedBirdId ? allBirds.find(b => b.id === t.relatedBirdId) : null;
                  return (
                    <TableRow key={t.id}>
                      <TableCell>{format(parseISO(t.date), 'PPP')}</TableCell>
                      <TableCell>
                        {t.description}
                        {bird && <p className="text-xs text-muted-foreground">{getBirdIdentifier(bird)}</p>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={t.type === 'income' ? 'default' : 'secondary'} className="capitalize">
                          {t.type === 'income' ? <ArrowUp className="h-3 w-3 mr-1"/> : <ArrowDown className="h-3 w-3 mr-1"/>}
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                      </TableCell>
                       <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(t)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit Transaction</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                    {search ? 'No transactions match your search.' : 'No transactions yet.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
