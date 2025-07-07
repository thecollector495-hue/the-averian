
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Egg, StickyNote, Pencil } from "lucide-react";
import { format, formatDistanceToNow, isFuture, parseISO } from 'date-fns';
import { Bird, Pair, BreedingRecord, getBirdIdentifier } from '@/lib/data';

export function BreedingRecordCard({ record, allBirds, allPairs, onBirdClick }: { record: BreedingRecord, allBirds: Bird[], allPairs: Pair[], onBirdClick: (bird: Bird) => void; }) {
    const [expandedSection, setExpandedSection] = useState<string | null>(null);
    const pair = allPairs.find(p => p.id === record.pairId);
    if (!pair) return <Card className="border-destructive"><CardHeader><CardTitle>Error: Pair not found</CardTitle></CardHeader></Card>;
    
    const male = allBirds.find(b => b.id === pair.maleId);
    const female = allBirds.find(b => b.id === pair.femaleId);
    
    if (!male || !female) return <Card className="border-destructive"><CardHeader><CardTitle>Error: Bird in pair not found</CardTitle></CardHeader></Card>;

    const toggleSection = (section: string) => {
      setExpandedSection(prev => prev === section ? null : section);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{getBirdIdentifier(male)} &amp; {getBirdIdentifier(female)}</CardTitle>
                <CardDescription>Started on {format(new Date(record.startDate), 'PPP')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-1 text-sm">
                    <p>
                        <span className="font-medium text-muted-foreground w-16 inline-block">Male:</span> 
                        <Button variant="link" className="p-0 h-auto" onClick={() => onBirdClick(male)}>{getBirdIdentifier(male)}</Button>
                    </p>
                    <p>
                        <span className="font-medium text-muted-foreground w-16 inline-block">Female:</span> 
                        <Button variant="link" className="p-0 h-auto" onClick={() => onBirdClick(female)}>{getBirdIdentifier(female)}</Button>
                    </p>
                </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 pt-0">
                <div className="w-full pt-2 flex flex-wrap justify-between items-center gap-2">
                    <div className="flex gap-2">
                        <Button size="sm" variant={expandedSection === 'eggs' ? 'default' : 'secondary'} onClick={() => toggleSection('eggs')}>
                            <Egg className="h-4 w-4 mr-2" /> Eggs ({record.eggs.length})
                        </Button>
                        {record.notes && (
                        <Button size="sm" variant={expandedSection === 'notes' ? 'default' : 'secondary'} onClick={() => toggleSection('notes')}>
                            <StickyNote className="h-4 w-4 mr-2" /> Notes
                        </Button>
                        )}
                    </div>
                     <Button variant="outline" size="sm" disabled>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                </div>
                 {expandedSection && (
                    <div className="w-full pt-4 mt-2 border-t border-border">
                        {expandedSection === 'eggs' && (
                           <div className="space-y-2">
                             {record.eggs.length > 0 ? record.eggs.map(egg => {
                                const expectedDate = egg.expectedHatchDate ? parseISO(egg.expectedHatchDate) : null;
                                const isHatched = egg.status === 'Hatched';
                                return (
                                    <div key={egg.id} className="text-sm p-2 border rounded-md grid grid-cols-2 gap-x-4 gap-y-1">
                                        <p><span className="text-muted-foreground">Laid:</span> {format(new Date(egg.laidDate), 'PPP')}</p>
                                        <p><span className="text-muted-foreground">Status:</span> {egg.status}</p>
                                        {expectedDate && !isHatched && (
                                            <p className="col-span-2">
                                                <span className="text-muted-foreground">Est. Hatch:</span> {format(expectedDate, 'PPP')}
                                                {isFuture(expectedDate) && ` (in ${formatDistanceToNow(expectedDate)})`}
                                            </p>
                                        )}
                                        {egg.hatchDate && <p><span className="text-muted-foreground">Hatched:</span> {format(new Date(egg.hatchDate), 'PPP')}</p>}
                                        {egg.chickId && allBirds.find(b => b.id === egg.chickId) && 
                                            <p className="col-span-2"><span className="text-muted-foreground">Chick:</span> <Button variant="link" onClick={() => onBirdClick(allBirds.find(b => b.id === egg.chickId)!)} className="p-0 h-auto">{getBirdIdentifier(allBirds.find(b => b.id === egg.chickId)!)}</Button></p>
                                        }
                                    </div>
                                )
                             }) : <p className="text-muted-foreground text-center">No eggs recorded.</p>}
                         </div>
                        )}
                        {expandedSection === 'notes' && (
                           <div>
                               <p className="text-sm text-muted-foreground">{record.notes}</p>
                           </div>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
