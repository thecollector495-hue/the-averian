
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users2, Egg, Landmark, Pencil, ShieldCheck, Trash2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Bird, Cage, Pair, BreedingRecord, Permit, getBirdIdentifier } from '@/lib/data';
import { useCurrency } from '@/context/CurrencyContext';
import { cn } from '@/lib/utils';
import { format, parseISO, formatDistanceToNowStrict, getYear } from 'date-fns';

export function BirdCard({ bird, allBirds, allCages, allPairs, allBreedingRecords, allPermits, handleEditClick, handleDeleteClick, onBirdClick, onViewBreedingRecord, onImageClick }: { bird: Bird; allBirds: Bird[]; allCages: Cage[]; allPairs: Pair[], allBreedingRecords: BreedingRecord[], allPermits: Permit[], handleEditClick: (bird: Bird) => void; handleDeleteClick: (birdId: string) => void; onBirdClick: (bird: Bird) => void; onViewBreedingRecord: (record: BreedingRecord) => void; onImageClick: (imageUrl: string) => void; }) {
  const { formatCurrency } = useCurrency();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };
  
  const cage = allCages.find(c => c.birdIds.includes(bird.id));
  const permit = allPermits.find(p => p.id === bird.permitId);

  const visualText = bird.visualMutations.join(' ');
  const splitText = bird.splitMutations.length > 0 ? `/(split) ${bird.splitMutations.join(' ')}` : '';
  const mutationDisplay = `${visualText} ${splitText}`.trim();
  
  const birdBreedingRecords = allBreedingRecords.filter(r => {
    const pair = allPairs.find(p => p.id === r.pairId);
    return pair && (pair.maleId === bird.id || pair.femaleId === bird.id);
  });
  
  const father = allBirds.find(b => b.id === bird.fatherId);
  const mother = allBirds.find(b => b.id === bird.motherId);
  const mate = allBirds.find(b => b.id === bird.mateId);
  const offspring = allBirds.filter(b => bird.offspringIds.includes(b.id));

  const getAgeString = (birthDate: string | undefined): string => {
    if (!birthDate) return 'N/A';
    try {
        const date = parseISO(birthDate);
        // If it's the first of january, assume only year was provided
        if (format(date, 'MM-dd') === '01-01') {
            return `Born ${getYear(date)}`;
        }
        return formatDistanceToNowStrict(date, { addSuffix: false });
    } catch (e) {
        return 'Invalid date';
    }
  }
  
  const getStatusBadgeVariant = () => {
    switch(bird.status) {
        case 'Sold': return 'destructive';
        case 'Deceased': return 'secondary';
        case 'Hand-rearing': return 'outline';
        case 'Available':
        default: return 'default';
    }
  }

  return (
    <Card key={bird.id} className={cn("flex flex-col h-full overflow-hidden", (bird.status === 'Sold' || bird.status === 'Deceased') && "opacity-60")}>
      {bird.imageUrl && (
        <div className="aspect-video w-full relative cursor-pointer" onClick={() => onImageClick(bird.imageUrl!)}>
          <Image src={bird.imageUrl} alt={getBirdIdentifier(bird)} fill className="object-cover" />
        </div>
      )}
      <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
        <div>
            <Badge variant={bird.sex === 'male' ? 'default' : bird.sex === 'female' ? 'destructive' : 'secondary'} className="capitalize">{bird.sex}</Badge>
            <Badge variant={getStatusBadgeVariant()} className="capitalize ml-2">{bird.status}</Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground text-right">
          {permit && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                    <ShieldCheck className="h-5 w-5 text-primary"/>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Permit: {permit.permitNumber}</p>
                    <p>Authority: {permit.issuingAuthority}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span>{cage?.name || 'No Cage'}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 p-4 pt-0">
        <div>
            <p className="font-bold text-lg">{bird.species}</p>
            <p className="text-sm text-muted-foreground">{bird.subspecies || 'No subspecies'}</p>
        </div>
        
        {mutationDisplay && (
             <p className="text-sm font-semibold">{mutationDisplay}</p>
        )}
        
        <div className="flex justify-between items-center text-sm pt-2">
          <span className="text-muted-foreground">Ring: <span className="font-medium text-foreground">{bird.ringNumber || 'Unbanded'}</span></span>
           <span className="text-muted-foreground">Age: <span className="font-medium text-foreground">
             {getAgeString(bird.birthDate)}
           </span></span>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 p-4 pt-0 mt-auto">
        <div className="w-full pt-2 flex justify-between items-center gap-2">
            <div className="flex gap-2">
                <Button size="sm" variant={expandedSection === 'family' ? 'default' : 'secondary'} onClick={() => toggleSection('family')}>
                    <Users2 className="h-4 w-4" /> <span className="hidden sm:inline ml-2">Family</span>
                </Button>
                <Button size="sm" variant={expandedSection === 'breeding' ? 'default' : 'secondary'} onClick={() => toggleSection('breeding')}>
                    <Egg className="h-4 w-4" /> <span className="hidden sm:inline ml-2">Breeding</span>
                </Button>
                <Button size="sm" variant={expandedSection === 'financials' ? 'default' : 'secondary'} onClick={() => toggleSection('financials')}>
                    <Landmark className="h-4 w-4" /> <span className="hidden sm:inline ml-2">Financials</span>
                </Button>
            </div>
            <div className="flex items-center gap-1">
                 <Button variant="outline" size="sm" onClick={() => handleEditClick(bird)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                 </Button>
                 <Button variant="destructive" size="icon" onClick={() => handleDeleteClick(bird.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                 </Button>
            </div>
        </div>
        {expandedSection && (
            <div className="w-full pt-4 mt-2 border-t border-border">
                {expandedSection === 'family' && (
                  <div className="space-y-3 pl-4 text-sm">
                    {[
                      { label: 'Father', bird: father },
                      { label: 'Mother', bird: mother },
                      { label: 'Mate', bird: mate },
                    ].map(({label, bird}) => (
                      <div className="flex items-start gap-2" key={label}>
                          <strong className="w-16 shrink-0 pt-1">{label}:</strong>
                          <span>
                            {bird ? (
                              <Button variant="link" className="p-0 h-auto font-normal text-sm text-left justify-start" onClick={() => onBirdClick(bird)}>{getBirdIdentifier(bird)}</Button>
                            ) : <span className="text-muted-foreground">N/A</span>}
                          </span>
                      </div>
                    ))}
                    <div className="flex flex-col gap-1">
                        <strong>Offspring:</strong>
                        {offspring.length > 0 ? (
                            <ul className="list-disc pl-6 space-y-1 mt-1">
                                {offspring.map(o => <li key={o.id}><Button variant="link" className="p-0 h-auto font-normal text-sm text-left justify-start" onClick={() => onBirdClick(o)}>{getBirdIdentifier(o)}</Button></li>)}
                            </ul>
                        ) : <span className="text-muted-foreground ml-2">N/A</span>}
                    </div>
                  </div>
                )}
                {expandedSection === 'breeding' && (
                  <div className="px-2 py-1 text-sm space-y-2">
                    {birdBreedingRecords.length > 0 ? birdBreedingRecords.map(rec => (
                      <Button key={rec.id} variant="ghost" className="w-full justify-start h-auto" onClick={() => onViewBreedingRecord(rec)}>
                        Breeding Record from {format(new Date(rec.startDate), 'PPP')}
                      </Button>
                    )) : <p className="text-muted-foreground text-center">No breeding records found.</p>}
                  </div>
                )}
                {expandedSection === 'financials' && (
                     <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm pl-4">
                        <div className="font-medium text-muted-foreground">Paid Price</div>
                        <div>{formatCurrency(bird.paidPrice)}</div>
                        <div className="font-medium text-muted-foreground">Est. Value</div>
                        <div>{formatCurrency(bird.estimatedValue)}</div>
                        {bird.status === 'Sold' && bird.saleDetails && (
                            <>
                                <Separator className="col-span-2 my-1" />
                                <div className="font-medium text-muted-foreground">Sale Price</div>
                                <div className="font-bold text-green-500">{formatCurrency(bird.saleDetails.price)}</div>
                                <div className="font-medium text-muted-foreground">Sale Date</div>
                                <div>{format(parseISO(bird.saleDetails.date), 'PPP')}</div>
                                <div className="font-medium text-muted-foreground">Buyer</div>
                                <div>{bird.saleDetails.buyer}</div>
                            </>
                        )}
                    </div>
                )}
            </div>
        )}
      </CardFooter>
    </Card>
  )
}
