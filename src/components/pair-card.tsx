
'use client';

import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users2, Pencil, Trash2 } from 'lucide-react';
import { Bird, Pair, getBirdIdentifier } from '@/lib/data';

export function PairCard({ pair, allBirds, onBirdClick, onImageClick, onEditClick, onDeleteClick }: { pair: Pair, allBirds: Bird[], onBirdClick: (bird: Bird) => void, onImageClick: (imageUrl: string) => void, onEditClick: (pair: Pair) => void, onDeleteClick: (pairId: string) => void }) {
    const male = allBirds.find(b => b.id === pair.maleId);
    const female = allBirds.find(b => b.id === pair.femaleId);
    
    // Use pair image first, then fall back to male or female image
    const displayImage = pair.imageUrl || male?.imageUrl || female?.imageUrl;

    const BirdLink = ({ bird }: { bird: Bird | undefined }) => {
        if (!bird) return <span className="text-muted-foreground">Bird not found</span>;
        return (
            <Button variant="link" className="p-0 h-auto font-normal text-base text-left" onClick={() => onBirdClick(bird)}>
                {getBirdIdentifier(bird)}
            </Button>
        );
    }
    
    return (
        <Card className="h-full overflow-hidden flex flex-col">
             {displayImage && (
                <div className="aspect-video w-full relative cursor-pointer" onClick={() => onImageClick(displayImage)}>
                    <Image src={displayImage} alt="Breeding Pair" fill className="object-cover" />
                </div>
            )}
            <CardHeader className="p-4">
                <CardTitle>Breeding Pair</CardTitle>
                <CardDescription>
                  {male ? male.species : 'Pair'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 pt-0 flex-grow">
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
            <CardFooter className="p-4 pt-0 mt-auto flex justify-end gap-2">
                 <Button variant="outline" size="sm" onClick={() => onEditClick(pair)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                 </Button>
                 <Button variant="destructive" size="icon" onClick={() => onDeleteClick(pair.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                 </Button>
            </CardFooter>
        </Card>
    );
}
