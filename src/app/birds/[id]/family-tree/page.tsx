
'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User } from 'lucide-react';
import { useItems } from '@/context/ItemsContext';
import { Bird, getBirdIdentifier } from '@/lib/data';
import { Fragment } from 'react';

type FamilyMemberNodeProps = {
  birdId: string | undefined;
  allBirds: Bird[];
  onBirdClick: (bird: Bird) => void;
  role: string;
  level: number;
};

// Recursive component to display each family member
function FamilyMemberNode({ birdId, allBirds, onBirdClick, role, level }: FamilyMemberNodeProps) {
  if (!birdId) {
    return (
      <div style={{ paddingLeft: `${level * 2}rem` }} className="flex items-center gap-2 text-muted-foreground">
        <User className="h-4 w-4" />
        <span className="italic">{role}: Unknown</span>
      </div>
    );
  }

  const bird = allBirds.find(b => b.id === birdId);

  if (!bird) {
    return (
       <div style={{ paddingLeft: `${level * 2}rem` }} className="flex items-center gap-2 text-muted-foreground">
        <User className="h-4 w-4" />
        <span className="italic">{role}: Not Found</span>
      </div>
    );
  }

  return (
    <>
      <div style={{ paddingLeft: `${level * 2}rem` }} className="flex items-center gap-2">
        <User className="h-4 w-4" />
        <span>{role}: </span>
        <Button variant="link" className="p-0 h-auto" onClick={() => onBirdClick(bird)}>
            {getBirdIdentifier(bird)}
        </Button>
      </div>
      {level < 5 && ( // Prevent infinite loops and excessively deep trees
        <>
            <FamilyMemberNode birdId={bird.fatherId} allBirds={allBirds} onBirdClick={onBirdClick} role="Father" level={level + 1} />
            <FamilyMemberNode birdId={bird.motherId} allBirds={allBirds} onBirdClick={onBirdClick} role="Mother" level={level + 1} />
        </>
      )}
    </>
  );
}


export default function FamilyTreePage({ params }: { params: { id: string } }) {
  const { items } = useItems();
  const allBirds = items.filter((item): item is Bird => item.category === 'Bird');
  const initialBird = allBirds.find(b => b.id === params.id);

  if (!initialBird) {
      return (
        <div className="p-4 sm:p-6 md:p-8">
            <h1 className="text-2xl font-bold text-destructive">Bird not found</h1>
            <p className="text-muted-foreground">The bird with ID #{params.id} could not be located.</p>
             <Button asChild variant="link" className="mt-4">
                <Link href="/birds"><ArrowLeft className="mr-2"/> Back to Birds</Link>
            </Button>
        </div>
      )
  }

  // A simple way to handle clicks without a full dialog, just logging for now
  const handleBirdClick = (bird: Bird) => {
    alert(`Viewing details for: ${getBirdIdentifier(bird)}`);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="flex items-center gap-4 mb-6">
        <Button asChild variant="outline" size="icon">
           <Link href="/birds">
              <ArrowLeft />
              <span className="sr-only">Back to Birds</span>
           </Link>
        </Button>
        <div>
            <h1 className="text-3xl font-bold">Family Tree</h1>
            <p className="text-muted-foreground">For {getBirdIdentifier(initialBird)}</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ancestors</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="space-y-2">
               <FamilyMemberNode birdId={initialBird.id} allBirds={allBirds} onBirdClick={handleBirdClick} role="Subject" level={0} />
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
