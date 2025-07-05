'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users2 } from 'lucide-react';
import { Bird, Pair, speciesData, getBirdIdentifier } from '@/lib/data';

export function PairCard({ pair, allBirds, onBirdClick }: { pair: Pair, allBirds: Bird[], onBirdClick: (bird: Bird) => void }) {
    const male = allBirds.find(b => b.id === pair.maleId);
    const female = allBirds.find(b => b.id === pair.femaleId);

    const BirdLink = ({ bird }: { bird: Bird | undefined }) => {
        if (!bird) return <span className="text-muted-foreground">Bird not found</span>;
        return (
            <Button variant="link" className="p-0 h-auto font-normal text-base text-left" onClick={() => onBirdClick(bird)}>
                {getBirdIdentifier(bird)}
            </Button>
        );
    }
    
    return (
        <Card className="h-full">
            <CardHeader className="p-4">
                <CardTitle>Breeding Pair</CardTitle>
                <CardDescription>
                  {male ? speciesData[male.species as keyof typeof speciesData]?.name || male.species : 'Pair'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0">
                 <div className="flex items-start gap-4">
                    <Users2 className="h-5 w-5 text-primary mt-1" />
                    <div className="grid gap-0.5">
                        <div className="font-semibold text-sm">Male</div>
                        <BirdLink bird={male} />
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <Users2 className="h-5 w-5 text-primary mt-1" />
                     <div className="grid gap-0.5">
                        <div className="font-semibold text-sm">Female</div>
                        <BirdLink bird={female} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
