
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { initialBirds, initialPairs, initialBreedingRecords, Bird, BreedingRecord } from '@/lib/data';
import { BirdDetailsDialog } from '@/components/bird-details-dialog';
import { BreedingRecordCard } from '@/components/breeding-record-card';

const AddBreedingRecordDialog = dynamic(() => import('@/components/add-breeding-record-dialog').then(mod => mod.AddBreedingRecordDialog), { ssr: false });

export default function BreedingPage() {
    const [records, setRecords] = useState<BreedingRecord[]>(initialBreedingRecords);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [viewingBird, setViewingBird] = useState<Bird | null>(null);

    const handleViewBirdClick = (bird: Bird) => {
      setViewingBird(bird);
    };

    const handleSaveRecord = (data: Omit<BreedingRecord, 'id' | 'category'>) => {
        const newRecord: BreedingRecord = {
            ...data,
            id: `br${Date.now()}`,
            category: 'BreedingRecord',
        };
        setRecords(prev => [newRecord, ...prev]);
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            {isAddDialogOpen && <AddBreedingRecordDialog 
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                pairs={initialPairs}
                onSave={handleSaveRecord}
            />}
             <BirdDetailsDialog
              bird={viewingBird}
              allBirds={initialBirds}
              allCages={[]}
              allPermits={[]}
              onClose={() => setViewingBird(null)}
              onBirdClick={(bird) => setViewingBird(bird)}
            />

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Breeding Records</h1>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add Record
                </Button>
            </div>
            
            {records.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                   {records.map(record => (
                       <BreedingRecordCard key={record.id} record={record} allBirds={initialBirds} allPairs={initialPairs} onBirdClick={handleViewBirdClick} />
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
