
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useCurrency } from '@/context/CurrencyContext';
import { initialItems, Transaction } from '@/lib/data';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, parseISO } from 'date-fns';

type TimeFilter = 'month' | 'year' | 'all';

export default function ReportsPage() {
  const [items] = useState(initialItems);
  const { formatCurrency, currency } = useCurrency();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const transactions = items.filter((item): item is Transaction => item.category === 'Transaction');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    if (timeFilter === 'all') {
      return transactions;
    }
    
    let interval;
    if (timeFilter === 'month') {
      interval = { start: startOfMonth(now), end: endOfMonth(now) };
    } else { // year
      interval = { start: startOfYear(now), end: endOfYear(now) };
    }

    return transactions.filter(t => isWithinInterval(parseISO(t.date), interval));

  }, [transactions, timeFilter]);

  const { totalIncome, totalExpenses, netProfit } = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
    };
  }, [filteredTransactions]);

  const chartData = [
    { name: 'Income', value: totalIncome, fill: 'hsl(var(--chart-2))' },
    { name: 'Expenses', value: totalExpenses, fill: 'hsl(var(--chart-5))' },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
       <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as TimeFilter)} className="w-auto">
          <TabsList>
            <TabsTrigger value="month">This Month</TabsTrigger>
            <TabsTrigger value="year">This Year</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader><CardTitle>Total Income</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-500">{formatCurrency(totalIncome)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Total Expenses</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-500">{formatCurrency(totalExpenses)}</p></CardContent>
        </Card>
        <Card className={netProfit >= 0 ? 'border-green-500/50' : 'border-red-500/50'}>
          <CardHeader><CardTitle>Net Profit</CardTitle></CardHeader>
          <CardContent><p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>{formatCurrency(netProfit)}</p></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>A visual summary of your income versus expenses for the selected period.</CardDescription>
        </CardHeader>
        <CardContent>
           <ChartContainer config={{}} className="h-[250px] w-full">
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currency.symbol}${value}`} />
                <Tooltip 
                  cursor={{ fill: 'hsla(var(--muted))' }}
                  content={<ChartTooltipContent 
                    formatter={(value) => formatCurrency(value as number)}
                    hideLabel
                  />}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
