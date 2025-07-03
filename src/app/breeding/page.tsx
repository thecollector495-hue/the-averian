
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Calendar, Egg, StickyNote, Trash2, Pencil } from "lucide-react";
import { initialBirds, initialPairs, initialBreedingRecords, getBirdIdentifier, Bird, Pair, BreedingRecord, Egg as EggType, speciesData } from '@/lib/data';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useCurrency } from '@/context/CurrencyContext';

const eggSchema = z.object({
  laidDate: z.date({ required_error: "Laid date is required." }),
  status: z.enum(['Laid', 'Hatched', 'Infertile', 'Broken']),
});

const breedingRecordSchema = z.object({
  pairId: z.string({ required_error: "Please select a pair." }),
  startDate: z.date({ required_error: "Start date is required." }),
  notes: z.string().optional(),
  eggs: z.array(eggSchema).default([]),
});

type BreedingRecordFormValues = z.infer<typeof breedingRecordSchema>;

function AddBreedingRecordDialog({ isOpen, onOpenChange, pairs, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, pairs: Pair[], onSave: (data: any) => void }) {
  const form = useForm<BreedingRecordFormValues>({
    resolver: zodResolver(breedingRecordSchema),
    defaultValues: {
      eggs: [],
      notes: ""
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "eggs",
  });

  function onSubmit(data: BreedingRecordFormValues) {
    onSave({
      ...data,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      eggs: data.eggs.map(e => ({ ...e, laidDate: format(e.laidDate, 'yyyy-MM-dd'), id: `e${Date.now()}${Math.random()}` }))
    });
    onOpenChange(false);
    form.reset();
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Breeding Record</DialogTitle>
          <DialogDescription>Log a new breeding attempt for a pair.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6 pl-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pairId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Breeding Pair</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a pair" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pairs.map(p => {
                          const male = initialBirds.find(b => b.id === p.maleId);
                          const female = initialBirds.find(b => b.id === p.femaleId);
                          if (!male || !female) return null;
                          return <SelectItem key={p.id} value={p.id}>{getBirdIdentifier(male)} & {getBirdIdentifier(female)}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
             <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Any observations about the pair..." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
               />

            <Separator />
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Eggs</h4>
                <Button type="button" size="sm" variant="outline" onClick={() => append({ laidDate: new Date(), status: 'Laid' })}>
                  <PlusCircle className="mr-2 h-4 w-4"/> Add Egg
                </Button>
              </div>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-2 border rounded-md">
                     <FormField
                        control={form.control}
                        name={`eggs.${index}.laidDate`}
                        render={({ field: dateField }) => (
                           <FormItem className="flex-grow">
                             <FormLabel>Laid Date</FormLabel>
                             <Popover>
                                <PopoverTrigger asChild><FormControl><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4"/>{dateField.value ? format(dateField.value, "PPP") : ""}</Button></FormControl></PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={dateField.value} onSelect={dateField.onChange} /></PopoverContent>
                             </Popover>
                             <FormMessage />
                           </FormItem>
                        )}
                      />
                     <FormField
                        control={form.control}
                        name={`eggs.${index}.status`}
                        render={({ field: statusField }) => (
                          <FormItem className="flex-grow">
                             <FormLabel>Status</FormLabel>
                             <Select onValueChange={statusField.onChange} defaultValue={statusField.value}>
                               <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                               <SelectContent>
                                 {['Laid', 'Hatched', 'Infertile', 'Broken'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                               </SelectContent>
                             </Select>
                          </FormItem>
                        )}
                      />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4"/></Button>
                  </div>
                ))}
                {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No eggs added yet.</p>}
              </div>
            </div>

            <DialogFooter className="pt-4">
               <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
               <Button type="submit">Save Record</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BirdDetailsDialog({ bird, allBirds, allCages, onClose, onBirdClick }: { bird: Bird | null; allBirds: Bird[]; allCages: Cage[]; onClose: () => void; onBirdClick: (bird: Bird) => void; }) {
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
  
  const BirdLink = ({ bird }: { bird: Bird | undefined }) => {
        if (!bird) return <span className="font-semibold">N/A</span>;
        return (
            <Button variant="link" className="p-0 h-auto font-normal text-base text-left justify-start" onClick={() => onBirdClick(bird)}>
                <span className="font-semibold">{getBirdIdentifier(bird)}</span>
            </Button>
        );
    }

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
            <p className="flex items-center gap-2"><span className="text-muted-foreground">Father:</span> <BirdLink bird={father} /></p>
            <p className="flex items-center gap-2"><span className="text-muted-foreground">Mother:</span> <BirdLink bird={mother} /></p>
            <p className="flex items-center gap-2"><span className="text-muted-foreground">Mate:</span> <BirdLink bird={mate} /></p>
             <div>
                <span className="text-muted-foreground">Offspring:</span>
                {offspring.length > 0 ? (
                    <ul className="list-disc pl-5 mt-1">
                        {offspring.map(o => <li key={o.id}><BirdLink bird={o}/></li>)}
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


function BreedingRecordCard({ record, allBirds, allPairs, onBirdClick }: { record: BreedingRecord, allBirds: Bird[], allPairs: Pair[], onBirdClick: (bird: Bird) => void; }) {
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
                <div className="w-full pt-2 flex justify-between items-center gap-2">
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


export default function BreedingPage() {
    const [records, setRecords] = useState<BreedingRecord[]>(initialBreedingRecords);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [viewingBird, setViewingBird] = useState<Bird | null>(null);

    const handleViewBirdClick = (bird: Bird) => {
      setViewingBird(bird);
    };

    const handleSaveRecord = (data: Omit<BreedingRecord, 'id' | 'category'>) => {
        console.log("New Breeding Record:", data);
        const newRecord: BreedingRecord = {
            ...data,
            id: `br${Date.now()}`,
            category: 'BreedingRecord',
        };
        setRecords(prev => [newRecord, ...prev]);
    }

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <AddBreedingRecordDialog 
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                pairs={initialPairs}
                onSave={handleSaveRecord}
            />
             <BirdDetailsDialog
              bird={viewingBird}
              allBirds={initialBirds}
              allCages={[]}
              onClose={() => setViewingBird(null)}
              onBirdClick={(bird) => setViewingBird(bird)}
            />

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Breeding Records</h1>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add Record
                </Button>
            </div>
            
            {records.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                   {records.map(record => (
                       <BreedingRecordCard key={record.id} record={record} allBirds={initialBirds} allPairs={initialPairs} onBirdClick={handleViewBirdClick} />
                   ))}
                </div>
            ) : (
                <div className="text-center py-16 rounded-lg border border-dashed">
                    <h2 className="text-xl font-semibold">No Breeding Records Yet</h2>
                    <p className="text-muted-foreground mt-2">Click "Add Record" to start logging a new breeding attempt.</p>
                </div>
            )}
        </div>
    );
}
