
'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Bird, Cage, BreedingRecord, NoteReminder, Pair, getBirdIdentifier } from '@/lib/data';
import { BirdDetailsDialog } from '@/components/bird-details-dialog';
import { BreedingRecordCard } from '@/components/breeding-record-card';
import { useItems } from '@/context/ItemsContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

const AddBreedingRecordDialog = dynamic(() => import('@/components/add-breeding-record-dialog').then(mod => mod.AddBreedingRecordDialog), { ssr: false });

export default function BreedingPage() {
    const { items, addItem, addItems } = useItems();
    const { isReadOnly } = useAuth();
    const { toast } = useToast();
    
    const { allBirds, allCages, allPairs, records } = useMemo(() => ({
      allBirds: items.filter((item): item is Bird => item.category === 'Bird'),
      allCages: items.filter((item): item is Cage => item.category === 'Cage'),
      allPairs: items.filter((item): item is Pair => item.category === 'Pair'),
      records: items.filter((item): item is BreedingRecord => item.category === 'BreedingRecord'),
    }), [items]);
    
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [viewingBird, setViewingBird] = useState<Bird | null>(null);

    const handleViewBirdClick = (bird: Bird) => {
      setViewingBird(bird);
    };

    const handleSaveRecord = (data: Omit<BreedingRecord, 'id' | 'category'> & { createHatchReminders: boolean }) => {
        const newRecord: BreedingRecord = {
            ...data,
            id: `br${Date.now()}`,
            category: 'BreedingRecord',
        };
        
        const itemsToAdd: (BreedingRecord | NoteReminder)[] = [newRecord];

        if (data.createHatchReminders) {
            let remindersCreated = 0;
            const pair = allPairs.find(p => p.id === newRecord.pairId);
            const male = allBirds.find(b => b.id === pair?.maleId);

            newRecord.eggs.forEach(egg => {
                if (egg.expectedHatchDate) {
                    const reminder: NoteReminder = {
                        id: `nr${Date.now()}${Math.random()}`,
                        category: 'NoteReminder',
                        title: `Check egg for hatch: ${male ? getBirdIdentifier(male) : `Pair ${newRecord.pairId}`}`,
                        content: `Egg laid on ${format(new Date(egg.laidDate), 'PPP')} is expected to hatch today.`,
                        isReminder: true,
                        reminderDate: egg.expectedHatchDate,
                        isRecurring: false,
                        recurrencePattern: 'none',
                        associatedBirdIds: pair ? [pair.maleId, pair.femaleId] : [],
                        subTasks: [],
                        completed: false,
                    };
                    itemsToAdd.push(reminder);
                    remindersCreated++;
                }
            });
            if (remindersCreated > 0) {
                 toast({ title: "Reminders Created", description: `${remindersCreated} hatch reminders have been added to your notes.` });
            }
        }
        
        addItems(itemsToAdd);
        toast({ title: "Breeding Record Added", description: "The new record has been saved." });
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            {isAddDialogOpen && <AddBreedingRecordDialog 
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                pairs={allPairs}
                allBirds={allBirds}
                onSave={handleSaveRecord}
            />}
             <BirdDetailsDialog
              bird={viewingBird}
              allBirds={allBirds}
              allCages={allCages}
              allPermits={[]}
              onClose={() => setViewingBird(null)}
              onBirdClick={(bird) => setViewingBird(bird)}
            />

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Breeding Records</h1>
                <Button onClick={() => setIsAddDialogOpen(true)} disabled={isReadOnly}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add Record
                </Button>
            </div>
            
            {records.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                   {records.map(record => (
                       <BreedingRecordCard key={record.id} record={record} allBirds={allBirds} allPairs={allPairs} onBirdClick={handleViewBirdClick} />
                   ))}
                </div>
            ) : (
                <div className="text-center py-16 rounded-lg border border-dashed">
                    <h2 className="text-xl font-semibold">No Breeding Records Yet</h2>
                    <p className="text-muted-foreground mt-2">Click "Add Record" to start logging a new breeding attempt.</p>
                </div>
            )}
        </div>
    );
}
