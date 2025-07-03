
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, PlusCircle, ChevronsUpDown, Users2, Egg, Pencil } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


const speciesData = {
  'Turdus migratorius': { name: 'American Robin', subspecies: ['T. m. migratorius', 'T. m. achrusterus'] },
  'Cyanocitta cristata': { name: 'Blue Jay', subspecies: ['C. c. cristata', 'C. c. bromia'] },
  'Cardinalis cardinalis': { name: 'Northern Cardinal', subspecies: ['C. c. cardinalis', 'C. c. floridanus'] },
  'Erithacus rubecula': { name: 'European Robin', subspecies: ['E. r. rubecula', 'E. r. melophilus'] },
  'Falco tinnunculus': { name: 'Common Kestrel', subspecies: [] },
  'Eolophus roseicapilla': { name: 'Galah', subspecies: ['E. r. roseicapilla', 'E. r. assimilis'] },
  'Serinus canaria domestica': { name: 'Domestic Canary', subspecies: [] },
};

const mutationOptions = ['Opaline', 'Cinnamon', 'Lutino', 'Albino', 'Fallow', 'Spangle'] as const;

const birdFormSchema = z.object({
  species: z.string({
    required_error: "You need to select a species.",
  }),
  subspecies: z.string().optional(),
  sex: z.enum(["male", "female", "unsexed"], {
    required_error: "You need to select a sex.",
  }),
  ringNumber: z.string().optional(),
  unbanded: z.boolean().default(false),
  age: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number({ invalid_type_error: "Age must be a number."}).int().min(0, "Age can't be negative.").optional()
  ),
  visualMutations: z.array(z.string()).default([]),
  splitMutations: z.array(z.string()).default([]),
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
  mateId: z.string().optional(),
  offspringIds: z.array(z.string()).default([]),
});

type BirdFormValues = z.infer<typeof birdFormSchema>;

type Bird = BirdFormValues & { id: string, category: 'Bird' | 'Cage' | 'Pair' };


function MultiSelectPopover({ field, options, placeholder }: { field: ControllerRenderProps<any, any>, options: { value: string; label: string }[], placeholder: string }) {
  const selectedValues = field.value || [];
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between h-10",
              !selectedValues.length && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {selectedValues.length
                ? selectedValues.length === 1
                  ? options.find(o => o.value === selectedValues[0])?.label ?? selectedValues[0]
                  : `${selectedValues.length} selected`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-60 overflow-y-auto p-0">
        <div className="p-2 space-y-1">
          {options.map((option) => (
            <FormField
              key={option.value}
              control={undefined}
              name={field.name}
              render={() => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0 p-1 rounded-md hover:bg-accent">
                  <FormControl>
                    <Checkbox
                      checked={selectedValues.includes(option.value)}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...selectedValues, option.value])
                          : field.onChange(
                              selectedValues.filter(
                                (value) => value !== option.value
                              )
                            );
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal w-full cursor-pointer py-1">{option.label}</FormLabel>
                </FormItem>
              )}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}


function BirdFormDialog({ isOpen, onOpenChange, onSave, initialData, allBirds }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (bird: Bird) => void, initialData: Bird | null, allBirds: Bird[] }) {
  const form = useForm<BirdFormValues>({
    resolver: zodResolver(birdFormSchema),
    defaultValues: {
      ringNumber: "",
      unbanded: false,
      visualMutations: [],
      splitMutations: [],
      offspringIds: [],
    },
  });
  
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    } else {
      form.reset({
        species: undefined,
        subspecies: undefined,
        sex: undefined,
        ringNumber: "",
        unbanded: false,
        age: undefined,
        visualMutations: [],
        splitMutations: [],
        fatherId: undefined,
        motherId: undefined,
        mateId: undefined,
        offspringIds: [],
      });
    }
  }, [initialData, form, isOpen]);


  const watchedSpecies = form.watch("species");
  const unbanded = form.watch("unbanded");
  const subspeciesOptions = watchedSpecies ? speciesData[watchedSpecies as keyof typeof speciesData]?.subspecies : [];

  const getBirdIdentifier = (bird: Bird) => {
    const speciesName = speciesData[bird.species as keyof typeof speciesData]?.name;
    const identifier = bird.ringNumber ? `(${bird.ringNumber})` : '(Unbanded)';
    return `${speciesName} ${identifier}`;
  };
  
  const potentialRelatives = allBirds
    .filter(bird => bird.id !== initialData?.id && bird.species === watchedSpecies);
  
  const relationshipOptions = {
    father: potentialRelatives.filter(b => b.sex === 'male').map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
    mother: potentialRelatives.filter(b => b.sex === 'female').map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
    mate: potentialRelatives.map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
    offspring: potentialRelatives.map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
  };

  useEffect(() => {
    if (unbanded) {
      form.setValue("ringNumber", "");
    }
  }, [unbanded, form]);


  function onSubmit(data: BirdFormValues) {
    const birdToSave: Bird = {
      ...data,
      id: initialData?.id || Date.now().toString(),
      category: initialData?.category || 'Bird',
    };
    onSave(birdToSave);
    onOpenChange(false);
  }

  const isEditMode = initialData !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Bird' : 'Add a New Bird'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this bird.' : 'Enter the details of the new bird.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6 pl-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Species</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('subspecies', undefined);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a species" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(speciesData).map(([code, { name }]) => (
                           <SelectItem key={code} value={code}>
                             {name} <span className="text-muted-foreground ml-2">({code})</span>
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="subspecies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subspecies</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={!subspeciesOptions || subspeciesOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subspecies (if any)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subspeciesOptions.map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ringNumber"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Ring Number</FormLabel>
                      <FormField
                        control={form.control}
                        name="unbanded"
                        render={({ field: unbandedField }) => (
                          <div className="flex flex-row items-center space-x-2">
                             <FormControl>
                                <Checkbox
                                  checked={unbandedField.value}
                                  onCheckedChange={(checked) => {
                                      unbandedField.onChange(checked);
                                      if (checked) {
                                          form.setValue('ringNumber', '', { shouldValidate: true });
                                      }
                                  }}
                                />
                             </FormControl>
                             <Label htmlFor="unbanded" className="font-normal cursor-pointer">Unbanded</Label>
                          </div>
                        )}
                      />
                    </div>
                    <FormControl>
                      <Input placeholder="e.g., USAU-12345" {...field} disabled={unbanded} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-end gap-4">
                 <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Sex</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select sex" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="unsexed">Unsexed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 2" {...field} onChange={event => field.onChange(event.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
             <Separator />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visualMutations"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Visual Mutations</FormLabel>
                        <MultiSelectPopover field={field} options={mutationOptions.map(m => ({value:m, label:m}))} placeholder="Select visual mutations" />
                        <FormMessage />
                    </FormItem>
                )}
               />
               <FormField
                control={form.control}
                name="splitMutations"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Split Mutations</FormLabel>
                        <MultiSelectPopover field={field} options={mutationOptions.map(m => ({value:m, label:m}))} placeholder="Select split mutations" />
                        <FormMessage />
                    </FormItem>
                )}
               />
              </div>
              <Separator />
               <p className="text-base font-medium">Relationships</p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form.control} name="fatherId" render={({field}) => (
                    <FormItem>
                      <FormLabel>Father</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!watchedSpecies}>
                          <FormControl><SelectTrigger><SelectValue placeholder={watchedSpecies ? "Select father" : "Select species first"} /></SelectTrigger></FormControl>
                          <SelectContent>{relationshipOptions.father.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="motherId" render={({field}) => (
                    <FormItem>
                      <FormLabel>Mother</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!watchedSpecies}>
                          <FormControl><SelectTrigger><SelectValue placeholder={watchedSpecies ? "Select mother" : "Select species first"} /></SelectTrigger></FormControl>
                          <SelectContent>{relationshipOptions.mother.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="mateId" render={({field}) => (
                    <FormItem>
                      <FormLabel>Mate</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!watchedSpecies}>
                          <FormControl><SelectTrigger><SelectValue placeholder={watchedSpecies ? "Select mate" : "Select species first"} /></SelectTrigger></FormControl>
                          <SelectContent>{relationshipOptions.mate.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="offspringIds" render={({field}) => (
                    <FormItem>
                      <FormLabel>Offspring</FormLabel>
                      <MultiSelectPopover field={field} options={relationshipOptions.offspring} placeholder={watchedSpecies ? "Select offspring" : "Select species first"} />
                      <FormMessage />
                    </FormItem>
                  )} />
               </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Bird'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const initialBirds: Bird[] = [
  {
    id: '1',
    species: 'Turdus migratorius',
    subspecies: 'T. m. migratorius',
    ringNumber: 'A123',
    unbanded: false,
    category: 'Bird',
    sex: 'male',
    age: 2,
    visualMutations: ['Opaline'],
    splitMutations: ['Cinnamon'],
    fatherId: undefined, motherId: undefined, mateId: '4', offspringIds: ['3'],
  },
  {
    id: '2',
    species: 'Cyanocitta cristata',
    subspecies: undefined,
    ringNumber: 'B456',
    unbanded: false,
    category: 'Bird',
    sex: 'female',
    age: 3,
    visualMutations: [],
    splitMutations: ['Lutino'],
    fatherId: undefined, motherId: undefined, mateId: undefined, offspringIds: [],
  },
  {
    id: '3',
    species: 'Turdus migratorius',
    subspecies: undefined,
    ringNumber: undefined,
    unbanded: true,
    category: 'Pair',
    sex: 'unsexed',
    age: 1,
    visualMutations: [],
    splitMutations: [],
    fatherId: '1', motherId: '4', mateId: undefined, offspringIds: [],
  },
  {
    id: '4',
    species: 'Turdus migratorius',
    subspecies: 'T. m. achrusterus',
    ringNumber: 'C789',
    unbanded: false,
    category: 'Bird',
    sex: 'female',
    age: 2,
    visualMutations: ['Cinnamon'],
    splitMutations: [],
    fatherId: undefined, motherId: undefined, mateId: '1', offspringIds: ['3'],
  },
];


const BirdRelations = ({ bird, allBirds, onViewDetails }: { bird: Bird, allBirds: Bird[], onViewDetails: (bird: Bird) => void }) => {
    const getBirdLabelButton = (targetBird: Bird | undefined) => {
        if (!targetBird) return <span className="text-muted-foreground">N/A</span>;
        const speciesName = speciesData[targetBird.species as keyof typeof speciesData]?.name;
        const identifier = targetBird.ringNumber ? `(${targetBird.ringNumber})` : '(Unbanded)';
        const label = `${speciesName} ${identifier}`;
        return (
            <Button variant="link" className="p-0 h-auto font-normal text-base text-left" onClick={() => onViewDetails(targetBird)}>
                {label}
            </Button>
        );
    };

    const father = allBirds.find(b => b.id === bird.fatherId);
    const mother = allBirds.find(b => b.id === bird.motherId);
    const mate = allBirds.find(b => b.id === bird.mateId);
    const offspring = allBirds.filter(b => bird.offspringIds.includes(b.id));

    return (
        <div className="space-y-3 pl-4 text-sm">
            <div className="flex items-start gap-2">
                <strong className="w-20 shrink-0 pt-1">Father:</strong>
                <span>{getBirdLabelButton(father)}</span>
            </div>
            <div className="flex items-start gap-2">
                <strong className="w-20 shrink-0 pt-1">Mother:</strong>
                <span>{getBirdLabelButton(mother)}</span>
            </div>
            <div className="flex items-start gap-2">
                <strong className="w-20 shrink-0 pt-1">Mate:</strong>
                <span>{getBirdLabelButton(mate)}</span>
            </div>
            <div className="flex flex-col gap-1">
                <strong>Offspring:</strong>
                {offspring.length > 0 ? (
                    <ul className="list-disc pl-6 space-y-1 mt-1">
                        {offspring.map(o => <li key={o.id}>{getBirdLabelButton(o)}</li>)}
                    </ul>
                ) : <span className="text-muted-foreground ml-2">N/A</span>}
            </div>
        </div>
    );
}

function BirdDetailsDialog({ isOpen, onOpenChange, bird, allBirds, onViewDetails, onEdit }: { isOpen: boolean, onOpenChange: (open: boolean) => void, bird: Bird | null, allBirds: Bird[], onViewDetails: (bird: Bird) => void, onEdit: (bird: Bird) => void}) {
    if (!bird) return null;

    const speciesInfo = speciesData[bird.species as keyof typeof speciesData];
    const displayName = speciesInfo ? speciesInfo.name : bird.species;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                 <Card className="flex flex-col border-none shadow-none -m-6">
                    <CardHeader>
                        <CardTitle className="text-xl">{displayName}</CardTitle>
                        <CardDescription>{bird.species}{bird.subspecies && ` (${bird.subspecies})`}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4 max-h-[60vh] overflow-y-auto pr-6">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="font-medium text-muted-foreground">Sex</div>
                            <div className="capitalize">{bird.sex}</div>

                            <div className="font-medium text-muted-foreground">Ring #</div>
                            <div>{bird.ringNumber || 'Unbanded'}</div>

                            <div className="font-medium text-muted-foreground">Age</div>
                            <div>
                                {bird.age !== undefined && bird.age !== null ? (
                                `${new Date().getFullYear() - bird.age} (${bird.age} ${bird.age === 1 ? 'year' : 'years'} old)`
                                ) : (
                                'N/A'
                                )}
                            </div>
                        </div>
                        
                        {(bird.visualMutations?.length > 0 || bird.splitMutations?.length > 0) && <Separator />}
                        
                        <div className="space-y-3">
                            {bird.visualMutations?.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Visual Mutations</p>
                                    <div className="flex flex-wrap gap-1">
                                        {bird.visualMutations.map(m => <Badge key={m} variant="outline">{m}</Badge>)}
                                    </div>
                                </div>
                            )}
                            {bird.splitMutations?.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Split Mutations</p>
                                    <div className="flex flex-wrap gap-1">
                                        {bird.splitMutations.map(m => <Badge key={m} variant="secondary">{m}</Badge>)}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Accordion type="single" collapsible className="w-full pt-2">
                            <AccordionItem value="family-tree">
                                <AccordionTrigger className="py-3 text-sm font-medium">
                                    <div className="flex items-center gap-3">
                                        <Users2 className="h-4 w-4 text-primary" />
                                        Family Tree
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <BirdRelations bird={bird} allBirds={allBirds} onViewDetails={onViewDetails} />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                     <CardFooter className="flex justify-end pt-4 pr-6 pb-6">
                        <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); onEdit(bird); }}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    </CardFooter>
                 </Card>
            </DialogContent>
        </Dialog>
    );
}

export default function BirdsPage() {
  const [birds, setBirds] = useState(initialBirds);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Bird');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBird, setEditingBird] = useState<Bird | null>(null);
  const [detailsBird, setDetailsBird] = useState<Bird | null>(null);

  const handleAddClick = () => {
    setEditingBird(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (bird: Bird) => {
    setEditingBird(bird);
    setIsFormOpen(true);
  };

  const handleViewDetails = (bird: Bird) => {
    setDetailsBird(bird);
  };

  const handleSaveBird = (birdToSave: Bird) => {
    setBirds(prevBirds => {
      const birdExists = prevBirds.some(b => b.id === birdToSave.id);
      if (birdExists) {
        return prevBirds.map(b => b.id === birdToSave.id ? birdToSave : b);
      } else {
        return [birdToSave, ...prevBirds];
      }
    });
  };

  const filteredBirds = birds.filter(bird => {
    const speciesName = speciesData[bird.species as keyof typeof speciesData]?.name || '';
    const birdIdentifier = `${speciesName} ${bird.species} ${bird.subspecies || ''} ${bird.ringNumber || ''} ${bird.age || ''} ${(bird.visualMutations || []).join(' ')} ${(bird.splitMutations || []).join(' ')}`.toLowerCase();
    const matchesSearch = birdIdentifier.includes(search.toLowerCase());
    const matchesCategory = bird.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Bird', 'Cage', 'Pair'];

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <BirdFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveBird}
        initialData={editingBird}
        allBirds={birds}
      />
      <BirdDetailsDialog
        isOpen={!!detailsBird}
        onOpenChange={(open) => !open && setDetailsBird(null)}
        bird={detailsBird}
        allBirds={birds}
        onViewDetails={handleViewDetails}
        onEdit={(bird) => {
            setDetailsBird(null);
            handleEditClick(bird);
        }}
      />
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-center">Bird Watcher</h1>
        <p className="text-lg text-muted-foreground text-center">Explore the world of birds.</p>
        <div className="max-w-3xl mx-auto w-full flex flex-col sm:flex-row items-center gap-4">
          <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Bird
          </Button>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for birds by name, species, ring number, or mutation..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredBirds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBirds.map((bird) => {
            const speciesInfo = speciesData[bird.species as keyof typeof speciesData];
            const displayName = speciesInfo ? speciesInfo.name : bird.species;
            return (
              <Card key={bird.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-xl">{displayName}</CardTitle>
                  <CardDescription>{bird.species}{bird.subspecies && ` (${bird.subspecies})`}</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div className="font-medium text-muted-foreground">Sex</div>
                    <div className="capitalize">{bird.sex}</div>

                    <div className="font-medium text-muted-foreground">Ring #</div>
                    <div>{bird.ringNumber || 'Unbanded'}</div>

                    <div className="font-medium text-muted-foreground">Age</div>
                     <div>
                        {bird.age !== undefined && bird.age !== null ? (
                          `${new Date().getFullYear() - bird.age} (${bird.age} ${bird.age === 1 ? 'year' : 'years'} old)`
                        ) : (
                          'N/A'
                        )}
                      </div>
                  </div>
                  
                  {(bird.visualMutations?.length > 0 || bird.splitMutations?.length > 0) && <Separator />}
                  
                  <div className="space-y-3">
                      {bird.visualMutations?.length > 0 && (
                          <div className="space-y-1">
                              <p className="text-sm font-medium">Visual Mutations</p>
                              <div className="flex flex-wrap gap-1">
                                  {bird.visualMutations.map(m => <Badge key={m} variant="outline">{m}</Badge>)}
                              </div>
                          </div>
                      )}
                      {bird.splitMutations?.length > 0 && (
                          <div className="space-y-1">
                              <p className="text-sm font-medium">Split Mutations</p>
                              <div className="flex flex-wrap gap-1">
                                  {bird.splitMutations.map(m => <Badge key={m} variant="secondary">{m}</Badge>)}
                              </div>
                          </div>
                      )}
                  </div>
                  <Accordion type="single" collapsible className="w-full pt-2">
                    <AccordionItem value="family-tree">
                      <AccordionTrigger className="py-3 text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <Users2 className="h-4 w-4 text-primary" />
                          Family Tree
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <BirdRelations bird={bird} allBirds={birds} onViewDetails={handleViewDetails} />
                      </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="breeding-records">
                       <AccordionTrigger className="py-3 text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <Egg className="h-4 w-4 text-primary" />
                          Breeding Records
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                         <p className="text-muted-foreground px-4 py-2">Breeding records for this bird will be displayed here.</p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
                <CardFooter className="flex justify-end pt-0">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(bird)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                    </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No birds found. Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
