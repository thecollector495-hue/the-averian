
'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bird, Cage, getBirdIdentifier } from '@/lib/data';
import { useCurrency } from '@/context/CurrencyContext';

// This is a helper component to avoid code duplication.
const BirdLink = ({ bird, onBirdClick }: { bird: Bird | undefined, onBirdClick: (bird: Bird) => void }) => {
    if (!bird) return <span className="font-semibold">N/A</span>;
    return (
        <Button variant="link" className="p-0 h-auto font-normal text-base text-left justify-start" onClick={() => onBirdClick(bird)}>
            <span className="font-semibold">{getBirdIdentifier(bird)}</span>
        </Button>
    );
}

export function BirdDetailsDialog({ bird, allBirds, allCages, onClose, onBirdClick }: { bird: Bird | null; allBirds: Bird[]; allCages: Cage[]; onClose: () => void; onBirdClick: (bird: Bird) => void; }) {
  const { formatCurrency } = useCurrency();
  if (!bird) return null;

  const visualText = bird.visualMutations.join(' ');
  const splitText = bird.splitMutations.length > 0 ? `/(split) ${bird.splitMutations.join(' ')}` : '';
  const mutationDisplay = `${visualText} ${splitText}`.trim();

  const cage = allCages.find(c => c.birdIds.includes(bird.id));
  const father = allBirds.find(b => b.id === bird.fatherId);
  const mother = allBirds.find(b => b.id === bird.motherId);
  const mate = allBirds.find(b => b.id === bird.mateId);
  const offspring = allBirds.filter(b => bird.offspringIds.includes(b.id));

  return (
    <Dialog open={!!bird} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{getBirdIdentifier(bird)}</DialogTitle>
          <DialogDescription>
             {bird.species} {bird.subspecies && `- ${bird.subspecies}`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 text-sm max-h-[60vh] overflow-y-auto">
          <div className="space-y-2 rounded-lg border p-3">
            <h4 className="font-medium text-base">Core Details</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div><span className="text-muted-foreground">Sex:</span> <span className="font-semibold capitalize">{bird.sex}</span></div>
              <div><span className="text-muted-foreground">Age:</span> <span className="font-semibold">{bird.age !== undefined ? `${new Date().getFullYear() - bird.age} (${bird.age} yrs)`: 'N/A'}</span></div>
              <div><span className="text-muted-foreground">Ring:</span> <span className="font-semibold">{bird.ringNumber || 'Unbanded'}</span></div>
              <div><span className="text-muted-foreground">Cage:</span> <span className="font-semibold">{cage?.name || 'N/A'}</span></div>
            </div>
          </div>
          
          <div className="space-y-2 rounded-lg border p-3">
            <h4 className="font-medium text-base">Genetics & Family</h4>
             <p><span className="text-muted-foreground">Mutations:</span> <span className="font-semibold">{mutationDisplay || 'None'}</span></p>
            <p className="flex items-center gap-2"><span className="text-muted-foreground">Father:</span> <BirdLink bird={father} onBirdClick={onBirdClick} /></p>
            <p className="flex items-center gap-2"><span className="text-muted-foreground">Mother:</span> <BirdLink bird={mother} onBirdClick={onBirdClick} /></p>
            <p className="flex items-center gap-2"><span className="text-muted-foreground">Mate:</span> <BirdLink bird={mate} onBirdClick={onBirdClick} /></p>
             <div>
                <span className="text-muted-foreground">Offspring:</span>
                {offspring.length > 0 ? (
                    <ul className="list-disc pl-5 mt-1">
                        {offspring.map(o => <li key={o.id}><BirdLink bird={o} onBirdClick={onBirdClick}/></li>)}
                    </ul>
                ) : <span className="font-semibold ml-2">N/A</span>}
            </div>
          </div>
           
           <div className="space-y-2 rounded-lg border p-3">
            <h4 className="font-medium text-base">Financials</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div><span className="text-muted-foreground">Paid:</span> <span className="font-semibold">{formatCurrency(bird.paidPrice)}</span></div>
                <div><span className="text-muted-foreground">Value:</span> <span className="font-semibold">{formatCurrency(bird.estimatedValue)}</span></div>
            </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
