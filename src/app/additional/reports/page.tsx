
'use client';

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { useCurrency } from '@/context/CurrencyContext';
import { initialItems, Transaction } from '@/lib/data';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';

export default function ReportsPage() {
  const [items] = useState(initialItems);
  const { formatCurrency, currency } = useCurrency();

  const transactions = items.filter((item): item is Transaction => item.category === 'Transaction');

  const { totalIncome, totalExpenses, netProfit } = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses,
    };
  }, [transactions]);

  const chartData = [
    { name: 'Income', value: totalIncome, fill: 'hsl(var(--chart-2))' },
    { name: 'Expenses', value: totalExpenses, fill: 'hsl(var(--chart-5))' },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
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
          <CardDescription>A visual summary of your income versus expenses.</CardDescription>
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
