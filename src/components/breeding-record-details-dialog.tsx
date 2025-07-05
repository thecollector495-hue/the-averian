'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bird, Pair, BreedingRecord, getBirdIdentifier } from '@/lib/data';
import { format } from 'date-fns';

export function BreedingRecordDetailsDialog({ record, allBirds, allPairs, onClose, onBirdClick }: { record: BreedingRecord | null, allBirds: Bird[], allPairs: Pair[], onClose: () => void, onBirdClick: (bird: Bird) => void }) {
    if (!record) return null;

    const pair = allPairs.find(p => p.id === record.pairId);
    if (!pair) return null;

    const male = allBirds.find(b => b.id === pair.maleId);
    const female = allBirds.find(b => b.id === pair.femaleId);

    return (
        <Dialog open={!!record} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Breeding Record Details</DialogTitle>
                    <DialogDescription>Started on {format(new Date(record.startDate), 'PPP')}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
                    {male && female && (
                       <div className="space-y-2 rounded-lg border p-3">
                            <h4 className="font-medium text-base">Breeding Pair</h4>
                            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
                                <span className="text-muted-foreground">Male:</span>
                                <Button variant="link" onClick={() => onBirdClick(male)} className="p-0 h-auto justify-start font-semibold">{getBirdIdentifier(male)}</Button>
                                <span className="text-muted-foreground">Female:</span>
                                <Button variant="link" onClick={() => onBirdClick(female)} className="p-0 h-auto justify-start font-semibold">{getBirdIdentifier(female)}</Button>
                            </div>
                        </div>
                    )}
                    <div className="space-y-2 rounded-lg border p-3">
                         <h4 className="font-medium text-base">Egg Log</h4>
                         <div className="space-y-2">
                            {record.eggs.length > 0 ? record.eggs.map(egg => (
                                <div key={egg.id} className="text-sm p-2 border rounded-md grid grid-cols-2 gap-x-4">
                                    <p><span className="text-muted-foreground">Laid:</span> {format(new Date(egg.laidDate), 'PPP')}</p>
                                    <p><span className="text-muted-foreground">Status:</span> {egg.status}</p>
                                    {egg.hatchDate && <p><span className="text-muted-foreground">Hatched:</span> {format(new Date(egg.hatchDate), 'PPP')}</p>}
                                    {egg.chickId && allBirds.find(b => b.id === egg.chickId) && 
                                        <p className="col-span-2"><span className="text-muted-foreground">Chick:</span> <Button variant="link" onClick={() => onBirdClick(allBirds.find(b => b.id === egg.chickId)!)} className="p-0 h-auto">{getBirdIdentifier(allBirds.find(b => b.id === egg.chickId)!)}</Button></p>
                                    }
                                </div>
                            )) : <p className="text-muted-foreground">No eggs recorded.</p>}
                        </div>
                    </div>

                    {record.notes && (
                         <div className="space-y-2 rounded-lg border p-3">
                            <h4 className="font-medium text-base">Notes</h4>
                            <p className="text-sm text-muted-foreground">{record.notes}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
