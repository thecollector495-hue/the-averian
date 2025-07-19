
'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bird, Cage, getBirdIdentifier } from '@/lib/data';
import { Pencil, Trash2 } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';

export function CageCard({ cage, allBirds, onBirdClick, onEditClick, onDeleteClick, onImageClick }: { cage: Cage, allBirds: Bird[], onBirdClick: (bird: Bird) => void, onEditClick: (cage: Cage) => void, onDeleteClick: (cageId: string) => void, onImageClick: (imageUrl: string) => void }) {
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
                        <div className="flex flex-wrap gap-2">
                            {birdsInCage.map(bird => (
                                <div key={bird.id} className="flex flex-col items-center gap-1 text-center w-20">
                                  <Avatar className="h-12 w-12 border-2 border-muted cursor-pointer" onClick={() => onBirdClick(bird)}>
                                    <AvatarImage src={bird.imageUrl} alt={getBirdIdentifier(bird)} onClick={(e) => { e.stopPropagation(); if(bird.imageUrl) onImageClick(bird.imageUrl); }} data-ai-hint={`${bird.species}`} />
                                    <AvatarFallback>{bird.species.substring(0,2)}</AvatarFallback>
                                  </Avatar>
                                  <Button variant="link" className="p-0 h-auto text-xs leading-tight text-center" onClick={() => onBirdClick(bird)}>
                                    {getBirdIdentifier(bird)}
                                  </Button>
                                </div>
                            ))}
                        </div>
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
