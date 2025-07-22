
'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Pie, PieChart, Line, LineChart, Legend } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useItems } from '@/context/ItemsContext';
import { Bird } from '@/lib/data';
import { format, subMonths, startOfMonth, parseISO } from 'date-fns';

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export default function AnalyticsPage() {
  const { items } = useItems();
  const allBirds = items.filter((item): item is Bird => item.category === 'Bird');

  const speciesDistribution = useMemo(() => {
    const counts: { [key: string]: number } = {};
    allBirds.forEach(bird => {
      counts[bird.species] = (counts[bird.species] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allBirds]);

  const birdStatus = useMemo(() => {
    const counts: { [key: string]: number } = { 'Available': 0, 'Sold': 0, 'Deceased': 0, 'Hand-rearing': 0 };
    allBirds.forEach(bird => {
        if(bird.status in counts) {
            counts[bird.status]++;
        }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [allBirds]);
  
  const populationGrowth = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11));

    // Initialize last 12 months
    for(let i=0; i < 12; i++) {
        const month = format(subMonths(new Date(), i), 'MMM yyyy');
        monthlyData[month] = 0;
    }
    
    allBirds.forEach(bird => {
        if (bird.birthDate) {
            const birthDate = parseISO(bird.birthDate);
            if (birthDate >= twelveMonthsAgo) {
                const month = format(birthDate, 'MMM yyyy');
                if(month in monthlyData) {
                    monthlyData[month]++;
                }
            }
        }
    });

    return Object.entries(monthlyData).map(([name, value]) => ({ name, value })).reverse();

  }, [allBirds]);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-8">Aviary Analytics</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Species Distribution</CardTitle>
            <CardDescription>Breakdown of all birds by their species.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={{}} className="h-[300px] w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip
                    cursor={{ fill: 'hsla(var(--muted))' }}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie data={speciesDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} fill="hsl(var(--primary))">
                    {speciesDistribution.map((entry, index) => (
                      <Pie key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Bird Status Overview</CardTitle>
            <CardDescription>Current status of all birds in the aviary.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={{}} className="h-[300px] w-full">
              <ResponsiveContainer>
                <BarChart data={birdStatus} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'hsla(var(--muted))' }}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Population Growth</CardTitle>
                <CardDescription>New birds added per month over the last year.</CardDescription>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={{}} className="h-[300px] w-full">
                    <ResponsiveContainer>
                        <LineChart data={populationGrowth} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                            <Tooltip content={<ChartTooltipContent indicator="dot" />} />
                            <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={false}/>
                        </LineChart>
                    </ResponsiveContainer>
                 </ChartContainer>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
