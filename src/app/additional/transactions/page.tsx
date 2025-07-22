
'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowDown, ArrowUp, Pencil, Search, Trash2, ChevronDown } from "lucide-react";
import { useCurrency } from '@/context/CurrencyContext';
import { Transaction, getBirdIdentifier, Bird, Cage, Permit } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TransactionFormValues } from '@/components/add-transaction-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BirdDetailsDialog } from '@/components/bird-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { useItems } from '@/context/ItemsContext';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const AddTransactionDialog = dynamic(() => import('@/components/add-transaction-dialog').then(mod => mod.AddTransactionDialog), { ssr: false });

export default function TransactionsPage() {
  const { items, updateItem, addItem, deleteItem } = useItems();
  const { isReadOnly } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const { formatCurrency } = useCurrency();
  const [viewingBird, setViewingBird] = useState<Bird | null>(null);
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { allBirds, allCages, allPermits, transactions } = useMemo(() => {
    return {
      allBirds: items.filter((item): item is Bird => item.category === 'Bird'),
      allCages: items.filter((item): item is Cage => item.category === 'Cage'),
      allPermits: items.filter((item): item is Permit => item.category === 'Permit'),
      transactions: items
        .filter((item): item is Transaction => item.category === 'Transaction')
        .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
    };
  }, [items]);
    
  const filteredTransactions = useMemo(() => transactions.filter(t => 
    t.description.toLowerCase().includes(search.toLowerCase())
  ), [transactions, search]);

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
        const updatedTransaction = {
            ...data,
            date: format(data.date, 'yyyy-MM-dd')
        }
        updateItem(data.id, updatedTransaction);
        toast({ title: "Transaction Updated", description: "Your transaction has been successfully updated." });
    } else { // Creating new
        const newTransaction: Transaction = {
            ...data,
            id: `t${Date.now()}`,
            category: 'Transaction',
            date: format(data.date, 'yyyy-MM-dd'),
        };
        addItem(newTransaction);
        toast({ title: "Transaction Added", description: "The new transaction has been logged." });
    }
  };
  
  const handleDeleteConfirm = () => {
    if (!deletingTransactionId) return;
    deleteItem(deletingTransactionId);
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
            <Button onClick={handleAddClick} disabled={isReadOnly}>
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
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(t)} disabled={isReadOnly}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingTransactionId(t.id)} disabled={isReadOnly}>
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
                    const isExpanded = expandedId === t.id;
                    const bird = t.relatedBirdId ? allBirds.find(b => b.id === t.relatedBirdId) : null;
                    return (
                        <Card key={t.id} className="w-full">
                            <CardContent className="p-4" onClick={() => setExpandedId(isExpanded ? null : t.id)}>
                                <div className="flex justify-between items-start gap-2 cursor-pointer">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold">{t.description}</p>
                                        <p className="text-sm text-muted-foreground">{format(parseISO(t.date), 'PPP')}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className={`font-bold text-lg whitespace-nowrap ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                            {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                                        </p>
                                        <Badge variant={t.type === 'income' ? 'default' : 'secondary'} className="capitalize mt-1">
                                            {t.type === 'income' ? <ArrowUp className="h-3 w-3 mr-1"/> : <ArrowDown className="h-3 w-3 mr-1"/>}
                                            {t.type}
                                        </Badge>
                                    </div>
                                    <ChevronDown className={cn("h-5 w-5 text-muted-foreground transition-transform flex-shrink-0 mt-1", isExpanded && "rotate-180")} />
                                </div>

                                {isExpanded && (
                                    <div className="mt-4 pt-4 border-t space-y-4">
                                        {bird && (
                                            <div className="grid grid-cols-[auto_1fr] items-start gap-x-2">
                                                <p className="text-sm text-muted-foreground pt-px">Related to:</p>
                                                <Button variant="link" className="p-0 h-auto font-normal text-sm text-right justify-end whitespace-normal leading-snug" onClick={(e) => { e.stopPropagation(); setViewingBird(bird); }}>
                                                    {getBirdIdentifier(bird)}
                                                </Button>
                                            </div>
                                        )}
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick(t); }} disabled={isReadOnly}>
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); setDeletingTransactionId(t.id); }} disabled={isReadOnly}>
                                                <Trash2 className="h-4 w-4 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                )}
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
