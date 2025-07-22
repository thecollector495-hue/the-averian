
'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, BarChart3, Settings, ChevronRight, ShieldCheck, AreaChart } from 'lucide-react';

const additionalLinks = [
  {
    href: '/additional/transactions',
    title: 'Transactions',
    description: 'Manage your income and expenses.',
    icon: Wallet,
  },
  {
    href: '/additional/reports',
    title: 'Reports',
    description: 'View financial summaries and charts.',
    icon: BarChart3,
  },
  {
    href: '/additional/analytics',
    title: 'Analytics',
    description: 'View charts on species, status, and population.',
    icon: AreaChart,
  },
   {
    href: '/additional/permits',
    title: 'Permits',
    description: 'Manage regulatory permits.',
    icon: ShieldCheck,
  },
  {
    href: '/additional/settings',
    title: 'Settings',
    description: 'Configure application preferences.',
    icon: Settings,
  },
];

export default function AdditionalPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Additional</h1>
        <p className="text-muted-foreground">More tools and settings for your aviary.</p>
      </div>
      <div className="grid gap-4">
        {additionalLinks.map((link) => (
          <Link href={link.href} key={link.href} className="block">
            <Card className="hover:bg-muted/50 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                   <link.icon className="h-8 w-8 text-primary" />
                   <div>
                      <CardTitle className="text-lg">{link.title}</CardTitle>
                      <CardDescription>{link.description}</CardDescription>
                   </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
