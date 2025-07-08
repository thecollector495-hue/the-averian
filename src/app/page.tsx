'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Bird, Users2, Bell, Sparkles } from 'lucide-react';
import { useItems } from '@/context/ItemsContext';
import { Pair, NoteReminder } from '@/lib/data';
import { format, isFuture, parseISO } from 'date-fns';

const AIAssistantDialog = dynamic(() => import('@/components/ai-assistant-dialog').then(mod => mod.AIAssistantDialog), { ssr: false });

export default function DashboardPage() {
    const { items } = useItems();
    const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);

    const birdCount = items.filter(item => item.category === 'Bird').length;
    const pairCount = items.filter((item): item is Pair => item.category === 'Pair').length;
    
    const upcomingReminders = items
        .filter((item): item is NoteReminder => 
            item.category === 'NoteReminder' && 
            !item.completed && 
            item.isReminder && 
            item.reminderDate && 
            isFuture(parseISO(item.reminderDate))
        )
        .sort((a, b) => parseISO(a.reminderDate!).getTime() - parseISO(b.reminderDate!).getTime())
        .slice(0, 3);


    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            {isAiDialogOpen && <AIAssistantDialog isOpen={isAiDialogOpen} onOpenChange={setIsAiDialogOpen} />}

            <div className="mb-8">
                <h1 className="text-4xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">A quick overview of your aviary.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* AI Assistant Card */}
                <Card className="md:col-span-2 lg:col-span-1 bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <Sparkles className="text-primary"/> AI Aviary Assistant
                        </CardTitle>
                        <CardDescription>Need help identifying a bird? Let AI assist you.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button className="w-full" onClick={() => setIsAiDialogOpen(true)}>
                           Launch Assistant
                        </Button>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2"><Bird/> Total Birds</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{birdCount}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                         <CardTitle className="flex items-center gap-2"><Users2 /> Breeding Pairs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{pairCount}</p>
                    </CardContent>
                </Card>
                
                {/* Upcoming Reminders Card */}
                <Card className="md:col-span-2">
                     <CardHeader>
                         <CardTitle className="flex items-center gap-2"><Bell/> Upcoming Reminders</CardTitle>
                         <CardDescription>Your next few tasks and reminders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingReminders.length > 0 ? (
                            <ul className="space-y-2">
                                {upcomingReminders.map(note => (
                                    <li key={note.id} className="text-sm flex justify-between items-center p-2 rounded-md bg-muted/50">
                                        <span>{note.title}</span>
                                        <span className="font-medium">{note.reminderDate ? format(parseISO(note.reminderDate), 'MMM dd') : ''}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No upcoming reminders.</p>
                        )}
                        <Button asChild variant="outline" className="w-full mt-4">
                            <Link href="/notes">View All Notes</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
