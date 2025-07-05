
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowDown, ArrowUp, Pencil, Search } from "lucide-react";
import { useCurrency } from '@/context/CurrencyContext';
import { initialItems, Transaction, getBirdIdentifier, Bird } from '@/lib/data';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TransactionFormValues } from '@/components/add-transaction-dialog';

const AddTransactionDialog = dynamic(() => import('@/components/add-transaction-dialog').then(mod => mod.AddTransactionDialog), { ssr: false });

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
      {isFormOpen && <AddTransactionDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveTransaction}
        initialData={editingTransaction}
      />}
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
