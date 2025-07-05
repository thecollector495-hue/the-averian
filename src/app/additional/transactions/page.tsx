
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowDown, ArrowUp, Pencil, Search, Trash2 } from "lucide-react";
import { useCurrency } from '@/context/CurrencyContext';
import { initialItems, Transaction, getBirdIdentifier, Bird, Cage, Permit } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TransactionFormValues } from '@/components/add-transaction-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BirdDetailsDialog } from '@/components/bird-details-dialog';
import { useToast } from '@/hooks/use-toast';

const AddTransactionDialog = dynamic(() => import('@/components/add-transaction-dialog').then(mod => mod.AddTransactionDialog), { ssr: false });

export default function TransactionsPage() {
  const [items, setItems] = useState(initialItems);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { formatCurrency } = useCurrency();
  const [viewingBird, setViewingBird] = useState<Bird | null>(null);
  const { toast } = useToast();

  const allBirds = items.filter((item): item is Bird => item.category === 'Bird');
  const allCages = items.filter((item): item is Cage => item.category === 'Cage');
  const allPermits = items.filter((item): item is Permit => item.category === 'Permit');

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
        toast({ title: "Transaction Updated", description: "Your transaction has been successfully updated." });
    } else { // Creating new
        const newTransaction: Transaction = {
            ...data,
            id: `t${Date.now()}`,
            category: 'Transaction',
            date: format(data.date, 'yyyy-MM-dd'),
        };
        setItems(prev => [newTransaction, ...prev]);
        toast({ title: "Transaction Added", description: "The new transaction has been logged." });
    }
  };
  
  const handleDeleteConfirm = () => {
    if (!deletingTransactionId) return;
    setItems(prev => prev.filter(item => item.id !== deletingTransactionId));
    toast({ title: "Transaction Deleted", description: "The transaction has been removed." });
    setDeletingTransactionId(null);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      {isFormOpen && <AddTransactionDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
      />}
       <BirdDetailsDialog
        bird={viewingBird}
        allBirds={allBirds}
        allCages={allCages}
        allPermits={allPermits}
        onClose={() => setViewingBird(null)}
        onBirdClick={(bird) => setViewingBird(bird)}
      />
       <AlertDialog open={!!deletingTransactionId} onOpenChange={(open) => !open && setDeletingTransactionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. This will permanently delete the transaction.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          <div className="hidden md:block">
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
                          {bird && (
                            <Button variant="link" className="p-0 h-auto font-normal text-xs block text-muted-foreground" onClick={() => setViewingBird(bird)}>
                              {getBirdIdentifier(bird)}
                            </Button>
                          )}
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
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingTransactionId(t.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            <span className="sr-only">Delete</span>
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
          </div>

          <div className="md:hidden space-y-4">
            {filteredTransactions.length > 0 ? (
                filteredTransactions.map(t => {
                    const bird = t.relatedBirdId ? allBirds.find(b => b.id === t.relatedBirdId) : null;
                    return (
                        <Card key={t.id} className="w-full">
                            <CardContent className="p-4 space-y-4">
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <p className="font-semibold">{t.description}</p>
                                        <p className="text-sm text-muted-foreground">{format(parseISO(t.date), 'PPP')}</p>
                                        {bird && (
                                            <Button variant="link" className="p-0 h-auto font-normal text-xs block text-muted-foreground" onClick={() => setViewingBird(bird)}>
                                                {getBirdIdentifier(bird)}
                                            </Button>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`font-bold text-lg ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                            {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                        </p>
                                        <Badge variant={t.type === 'income' ? 'default' : 'secondary'} className="capitalize mt-1">
                                            {t.type === 'income' ? <ArrowUp className="h-3 w-3 mr-1"/> : <ArrowDown className="h-3 w-3 mr-1"/>}
                                            {t.type}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                     <Button variant="outline" size="sm" onClick={() => handleEditClick(t)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => setDeletingTransactionId(t.id)}>
                                        <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                        Delete
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })
            ) : (
                <div className="text-center text-muted-foreground py-12">
                    {search ? 'No transactions match your search.' : 'No transactions yet.'}
                </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
