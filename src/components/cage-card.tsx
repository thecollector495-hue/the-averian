
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bird, Cage, getBirdIdentifier } from '@/lib/data';
import { Pencil, Trash2 } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

export function CageCard({ cage, allBirds, onBirdClick, onEditClick, onDeleteClick }: { cage: Cage, allBirds: Bird[], onBirdClick: (bird: Bird) => void, onEditClick: (cage: Cage) => void, onDeleteClick: (cageId: string) => void }) {
    const birdsInCage = allBirds.filter(b => cage.birdIds.includes(b.id));
    const { formatCurrency } = useCurrency();

    return (
        <Card className="flex flex-col h-full">
            <CardHeader className="p-4 flex-row justify-between items-start">
                <div>
                    <CardTitle>{cage.name}</CardTitle>
                    <CardDescription>{birdsInCage.length} {birdsInCage.length === 1 ? 'bird' : 'birds'} in this cage</CardDescription>
                </div>
                 {cage.cost && <div className="text-sm font-semibold text-muted-foreground">{formatCurrency(cage.cost)}</div>}
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
                <div className="space-y-3">
                    <h4 className="text-sm font-medium">Occupants</h4>
                    {birdsInCage.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                            {birdsInCage.map(bird => (
                                <li key={bird.id}>
                                    <Button variant="link" className="p-0 h-auto font-normal text-base text-left" onClick={() => onBirdClick(bird)}>
                                        {getBirdIdentifier(bird)}
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground text-sm">This cage is empty.</p>
                    )}
                </div>
            </CardContent>
             <CardFooter className="p-4 pt-0 mt-auto flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => onEditClick(cage)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={() => onDeleteClick(cage.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                </Button>
            </CardFooter>
        </Card>
    );
}
