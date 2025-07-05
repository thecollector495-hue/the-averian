
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { initialItems, Bird, Cage, NoteReminder } from '@/lib/data';
import { BirdDetailsDialog } from '@/components/bird-details-dialog';
import { NoteCard } from '@/components/note-card';

const AddNoteDialog = dynamic(() => import('@/components/add-note-dialog').then(mod => mod.AddNoteDialog), { ssr: false });

export default function NotesPage() {
    const allItems = initialItems;
    const allBirds = allItems.filter((item): item is Bird => item.category === 'Bird');
    const allCages = allItems.filter((item): item is Cage => item.category === 'Cage');
    const initialNotes = allItems.filter((item): item is NoteReminder => item.category === 'NoteReminder');

    const [notes, setNotes] = useState<NoteReminder[]>(initialNotes);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [viewingBird, setViewingBird] = useState<Bird | null>(null);

    const handleSaveNote = (data: Omit<NoteReminder, 'id' | 'category' | 'completed'>) => {
        const newNote: NoteReminder = {
            ...data,
            id: `nr${Date.now()}`,
            category: 'NoteReminder',
            subTasks: data.subTasks.map(t => ({ ...t, id: `st${Date.now()}${Math.random()}` })),
            completed: false,
        };
        setNotes(prev => [newNote, ...prev]);
    };
    
    const handleUpdateNote = (updatedNote: NoteReminder) => {
        setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    };
    
    const handleViewBirdClick = (bird: Bird) => {
      setViewingBird(bird);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            {isAddDialogOpen && <AddNoteDialog 
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSave={handleSaveNote}
                allBirds={allBirds}
            />}
            <BirdDetailsDialog 
                bird={viewingBird}
                allBirds={allBirds}
                allCages={allCages}
                allPermits={[]}
                onClose={() => setViewingBird(null)}
                onBirdClick={handleViewBirdClick}
            />

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Notes & Reminders</h1>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add Note
                </Button>
            </div>

            {notes.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map(note => (
                        <NoteCard key={note.id} note={note} allBirds={allBirds} onUpdate={handleUpdateNote} onBirdClick={handleViewBirdClick} />
                    ))}
                 </div>
            ) : (
                <div className="text-center py-16 rounded-lg border border-dashed">
                    <h2 className="text-xl font-semibold">No Notes Yet</h2>
                    <p className="text-muted-foreground mt-2">Click "Add Note" to create your first note or reminder.</p>
                </div>
            )}
        </div>
    );
}
