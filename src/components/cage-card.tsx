'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bird, Cage, getBirdIdentifier } from '@/lib/data';

export function CageCard({ cage, allBirds, onBirdClick }: { cage: Cage, allBirds: Bird[], onBirdClick: (bird: Bird) => void }) {
    const birdsInCage = allBirds.filter(b => cage.birdIds.includes(b.id));

    return (
        <Card className="h-full">
            <CardHeader className="p-4">
                <CardTitle>{cage.name}</CardTitle>
                <CardDescription>{birdsInCage.length} {birdsInCage.length === 1 ? 'bird' : 'birds'} in this cage</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
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
        </Card>
    );
}
