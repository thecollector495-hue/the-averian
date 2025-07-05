
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, PlusCircle, ChevronsUpDown, Users2, Egg, Pencil, Landmark, StickyNote, Trash2, Calendar as CalendarIcon, Check } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, ControllerRenderProps, useFieldArray, Controller } from "react-hook-form";
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
import { useCurrency } from '@/context/CurrencyContext';
import { Bird, Cage, Pair, BreedingRecord, CollectionItem, speciesData, mutationOptions, getBirdIdentifier, initialItems, Egg as EggType, Transaction } from '@/lib/data';
import { format } from 'date-fns';
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { BirdDetailsDialog } from '@/components/bird-details-dialog';


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
  cageId: z.string().optional(),
  newCageName: z.string().optional(),
  visualMutations: z.array(z.string()).default([]),
  splitMutations: z.array(z.string()).default([]),
  fatherId: z.string().optional(),
  motherId: z.string().optional(),
  mateId: z.string().optional(),
  offspringIds: z.array(z.string()).default([]),
  paidPrice: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number({ invalid_type_error: "Price must be a number."}).min(0, "Price can't be negative.").optional()
  ),
  estimatedValue: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number({ invalid_type_error: "Value must be a number."}).min(0, "Value can't be negative.").optional()
  ),
  addToExpenses: z.boolean().default(false),
}).refine(data => !data.cageId || !data.newCageName, {
    message: "Cannot select a cage and create a new one.",
    path: ["cageId"],
});

type BirdFormValues = z.infer<typeof birdFormSchema>;


function MultiSelectCombobox({ field, options, placeholder }: { field: ControllerRenderProps<any, any>, options: { value: string; label: string }[], placeholder: string }) {
    const [open, setOpen] = useState(false);
    const selectedValues = new Set(field.value || []);

    const handleSelect = (value: string) => {
        const newSelectedValues = new Set(selectedValues);
        if (newSelectedValues.has(value)) {
            newSelectedValues.delete(value);
        } else {
            newSelectedValues.add(value);
        }
        field.onChange(Array.from(newSelectedValues));
    };
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start h-auto min-h-10">
                    <div className="flex gap-1 flex-wrap">
                        {selectedValues.size > 0 ? (
                            Array.from(selectedValues).map(val => (
                                <Badge variant="secondary" key={val} >
                                    {options.find(o => o.value === val)?.label || val}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => handleSelect(option.value)}
                                >
                                     <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedValues.has(option.value)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

function BirdCombobox({ field, options, placeholder }: { field: ControllerRenderProps<any, any>; options: { value: string; label:string }[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between",
              !field.value && "text-muted-foreground"
            )}
          >
            {field.value
              ? options.find(
                  (option) => option.value === field.value
                )?.label
              : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search bird..." />
          <CommandList>
            <CommandEmpty>No bird found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  value={option.label}
                  key={option.value}
                  onSelect={() => {
                    field.onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      option.value === field.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function CageCombobox({ field, allCages }: { field: ControllerRenderProps<BirdFormValues, 'cageId'>; allCages: Cage[]; }) {
  const [open, setOpen] = useState(false);
  const selectedCageName = allCages.find(cage => cage.id === field.value)?.name || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {field.value
              ? selectedCageName
              : "Select cage..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput 
            placeholder="Search cage..." 
          />
          <CommandList>
            <CommandEmpty>No cage found.</CommandEmpty>
            <CommandGroup>
              {allCages.map((cage) => (
                <CommandItem
                  key={cage.id}
                  value={cage.name}
                  onSelect={() => {
                    field.onChange(cage.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      field.value === cage.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {cage.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


function BirdFormDialog({ isOpen, onOpenChange, onSave, initialData, allBirds, allCages, handleCreateCage }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: BirdFormValues) => void, initialData: Bird | null, allBirds: Bird[], allCages: Cage[], handleCreateCage: (name: string) => string }) {
  const [isCreatingCage, setIsCreatingCage] = useState(false);
  
  const form = useForm<BirdFormValues>({
    resolver: zodResolver(birdFormSchema),
    defaultValues: {
      ringNumber: "",
      unbanded: false,
      visualMutations: [],
      splitMutations: [],
      offspringIds: [],
      cageId: undefined,
      newCageName: "",
      addToExpenses: true,
    },
  });
  
  useEffect(() => {
    setIsCreatingCage(false); // Always reset on open
    if (initialData) {
      const currentCage = allCages.find(cage => cage.birdIds.includes(initialData.id));
      form.reset({
        ...initialData,
        cageId: currentCage?.id,
        newCageName: "",
        addToExpenses: !initialData.paidPrice,
      });
    } else {
      form.reset({
        species: undefined,
        subspecies: undefined,
        sex: undefined,
        ringNumber: "",
        unbanded: false,
        age: undefined,
        cageId: undefined,
        newCageName: "",
        visualMutations: [],
        splitMutations: [],
        fatherId: undefined,
        motherId: undefined,
        mateId: undefined,
        offspringIds: [],
        paidPrice: undefined,
        estimatedValue: undefined,
        addToExpenses: true,
      });
    }
  }, [initialData, form, isOpen, allCages]);


  const watchedSpecies = form.watch("species");
  const unbanded = form.watch("unbanded");
  const paidPrice = form.watch("paidPrice");
  const subspeciesOptions = watchedSpecies ? speciesData[watchedSpecies as keyof typeof speciesData]?.subspecies : [];
  
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
    onSave(data);
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
             <p className="text-base font-medium">Core Details</p>
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
              <p className="text-base font-medium">Housing</p>
                {isCreatingCage ? (
                  <FormField
                    control={form.control}
                    name="newCageName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Cage Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter name for the new cage" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="cageId"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Cage</FormLabel>
                        <CageCombobox
                          field={field}
                          allCages={allCages}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="create-cage"
                    checked={isCreatingCage}
                    onCheckedChange={(checked) => {
                      const isChecked = !!checked;
                      setIsCreatingCage(isChecked);
                      if (isChecked) {
                        form.setValue('cageId', undefined, { shouldValidate: true });
                      } else {
                        form.setValue('newCageName', '', { shouldValidate: true });
                      }
                    }}
                  />
                  <label
                    htmlFor="create-cage"
                    className="text-sm font-medium leading-none"
                  >
                    Create a new cage
                  </label>
                </div>
             <Separator />
             <p className="text-base font-medium">Genetics</p>
             <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="visualMutations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Visual Mutations</FormLabel>
                       <MultiSelectCombobox field={field} options={mutationOptions.map(m => ({value:m, label:m}))} placeholder="Select visual mutations" />
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
                       <MultiSelectCombobox field={field} options={mutationOptions.map(m => ({value:m, label:m}))} placeholder="Select split mutations" />
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
                      <BirdCombobox
                        field={field}
                        options={relationshipOptions.father}
                        placeholder={watchedSpecies ? "Select father" : "Select species first"}
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="motherId" render={({field}) => (
                    <FormItem>
                      <FormLabel>Mother</FormLabel>
                      <BirdCombobox
                        field={field}
                        options={relationshipOptions.mother}
                        placeholder={watchedSpecies ? "Select mother" : "Select species first"}
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
                   <FormField control={form.control} name="mateId" render={({field}) => (
                    <FormItem>
                      <FormLabel>Mate</FormLabel>
                       <BirdCombobox
                        field={field}
                        options={relationshipOptions.mate}
                        placeholder={watchedSpecies ? "Select mate" : "Select species first"}
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="offspringIds" render={({field}) => (
                    <FormItem>
                      <FormLabel>Offspring</FormLabel>
                      <MultiSelectCombobox
                        field={field}
                        options={relationshipOptions.offspring}
                        placeholder={watchedSpecies ? "Select offspring" : "Select species first"}
                      />
                      <FormMessage />
                    </FormItem>
                  )} />
               </div>
                <Separator />
                <p className="text-base font-medium">Financials</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="paidPrice" render={({field}) => (
                        <FormItem>
                            <FormLabel>Paid Price</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 100" {...field} onChange={event => field.onChange(event.target.valueAsNumber)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="estimatedValue" render={({field}) => (
                        <FormItem>
                            <FormLabel>Estimated Value</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 150" {...field} onChange={event => field.onChange(event.target.valueAsNumber)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                 {paidPrice !== undefined && paidPrice > 0 && !isEditMode && (
                  <FormField
                    control={form.control}
                    name="addToExpenses"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Add purchase to expenses
                          </FormLabel>
                          <FormDescription>
                            This will create an expense entry for this bird's purchase price.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
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

const cageFormSchema = z.object({
  name: z.string().min(1, { message: "Cage name is required." }),
});
type CageFormValues = z.infer<typeof cageFormSchema>;

function AddCageDialog({ isOpen, onOpenChange, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: CageFormValues) => void }) {
  const form = useForm<CageFormValues>({
    resolver: zodResolver(cageFormSchema),
    defaultValues: {
      name: "",
    },
  });

  function onSubmit(data: CageFormValues) {
    onSave(data);
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Cage</DialogTitle>
          <DialogDescription>
            Enter a name for the new cage.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cage Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Flight Cage 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Cage</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function BreedingRecordDetailsDialog({ record, allBirds, allPairs, onClose, onBirdClick }: { record: BreedingRecord | null, allBirds: Bird[], allPairs: Pair[], onClose: () => void, onBirdClick: (bird: Bird) => void }) {
    if (!record) return null;

    const pair = allPairs.find(p => p.id === record.pairId);
    if (!pair) return null;

    const male = allBirds.find(b => b.id === pair.maleId);
    const female = allBirds.find(b => b.id === pair.femaleId);

    return (
        <Dialog open={!!record} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Breeding Record Details</DialogTitle>
                    <DialogDescription>Started on {format(new Date(record.startDate), 'PPP')}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 text-sm max-h-[60vh] overflow-y-auto pr-2">
                    {male && female && (
                       <div className="space-y-2 rounded-lg border p-3">
                            <h4 className="font-medium text-base">Breeding Pair</h4>
                            <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
                                <span className="text-muted-foreground">Male:</span>
                                <Button variant="link" onClick={() => onBirdClick(male)} className="p-0 h-auto justify-start font-semibold">{getBirdIdentifier(male)}</Button>
                                <span className="text-muted-foreground">Female:</span>
                                <Button variant="link" onClick={() => onBirdClick(female)} className="p-0 h-auto justify-start font-semibold">{getBirdIdentifier(female)}</Button>
                            </div>
                        </div>
                    )}
                    <div className="space-y-2 rounded-lg border p-3">
                         <h4 className="font-medium text-base">Egg Log</h4>
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
                    </div>

                    {record.notes && (
                         <div className="space-y-2 rounded-lg border p-3">
                            <h4 className="font-medium text-base">Notes</h4>
                            <p className="text-sm text-muted-foreground">{record.notes}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function BirdCard({ bird, allBirds, allCages, allPairs, allBreedingRecords, handleEditClick, onBirdClick, onViewBreedingRecord }: { bird: Bird; allBirds: Bird[]; allCages: Cage[]; allPairs: Pair[], allBreedingRecords: BreedingRecord[], handleEditClick: (bird: Bird) => void; onBirdClick: (bird: Bird) => void; onViewBreedingRecord: (record: BreedingRecord) => void; }) {
  const { formatCurrency } = useCurrency();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };
  
  const cage = allCages.find(c => c.birdIds.includes(bird.id));

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

  return (
    <Card key={bird.id} className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
        <Badge variant={bird.sex === 'male' ? 'default' : bird.sex === 'female' ? 'destructive' : 'secondary'} className="capitalize">{bird.sex}</Badge>
        <span className="text-sm text-muted-foreground text-right">{cage?.name || 'No Cage'}</span>
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
             {bird.age ? `${new Date().getFullYear() - bird.age} (${bird.age} yrs)` : 'N/A'}
           </span></span>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 p-4 pt-0 mt-auto">
        <div className="w-full pt-2 flex justify-between items-center gap-2">
            <div className="flex gap-2">
                <Button size="sm" variant={expandedSection === 'family' ? 'default' : 'secondary'} onClick={() => toggleSection('family')}>
                    <Users2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant={expandedSection === 'breeding' ? 'default' : 'secondary'} onClick={() => toggleSection('breeding')}>
                    <Egg className="h-4 w-4" />
                </Button>
                <Button size="sm" variant={expandedSection === 'financials' ? 'default' : 'secondary'} onClick={() => toggleSection('financials')}>
                    <Landmark className="h-4 w-4" />
                </Button>
            </div>
             <Button variant="outline" size="sm" onClick={() => handleEditClick(bird)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
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
                     <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pl-4">
                        <div className="font-medium text-muted-foreground">Paid Price</div>
                        <div>{formatCurrency(bird.paidPrice)}</div>
                        <div className="font-medium text-muted-foreground">Est. Value</div>
                        <div>{formatCurrency(bird.estimatedValue)}</div>
                    </div>
                )}
            </div>
        )}
      </CardFooter>
    </Card>
  )
}

function CageCard({ cage, allBirds, onBirdClick }: { cage: Cage, allBirds: Bird[], onBirdClick: (bird: Bird) => void }) {
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

function PairCard({ pair, allBirds, onBirdClick }: { pair: Pair, allBirds: Bird[], onBirdClick: (bird: Bird) => void }) {
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

export default function BirdsPage() {
  const [items, setItems] = useState<CollectionItem[]>(initialItems);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Bird');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBird, setEditingBird] = useState<Bird | null>(null);
  const [viewingBird, setViewingBird] = useState<Bird | null>(null);
  const [viewingBreedingRecord, setViewingBreedingRecord] = useState<BreedingRecord | null>(null);
  const [isAddCageDialogOpen, setIsAddCageDialogOpen] = useState(false);
  
  const allBirds = items.filter((item): item is Bird => item.category === 'Bird');
  const allCages = items.filter((item): item is Cage => item.category === 'Cage');
  const allPairs = items.filter((item): item is Pair => item.category === 'Pair');
  const allBreedingRecords = items.filter((item): item is BreedingRecord => item.category === 'BreedingRecord');

  const handleAddClick = () => {
    setEditingBird(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (bird: Bird) => {
    setEditingBird(bird);
    setIsFormOpen(true);
  };

  const handleViewBirdClick = (bird: Bird) => {
    setViewingBird(bird);
  };

  const handleViewBreedingRecord = (record: BreedingRecord) => {
    setViewingBreedingRecord(record);
  }

  const handleCreateCage = (cageName: string): string => {
    const newCage: Cage = {
        id: `c${Date.now()}`,
        name: cageName,
        category: 'Cage',
        birdIds: []
    };
    setItems(prev => [newCage, ...prev]);
    return newCage.id;
  };


  const handleSaveBird = (formData: BirdFormValues & { addToExpenses?: boolean }) => {
    let finalCageId = formData.cageId;
    if (formData.newCageName && formData.newCageName.trim() !== "") {
      finalCageId = handleCreateCage(formData.newCageName);
    }

    const birdId = editingBird?.id || `b${Date.now()}`;
    const birdToSave: Bird = {
      species: formData.species,
      subspecies: formData.subspecies,
      sex: formData.sex,
      ringNumber: formData.ringNumber,
      unbanded: formData.unbanded,
      age: formData.age,
      visualMutations: formData.visualMutations,
      splitMutations: formData.splitMutations,
      fatherId: formData.fatherId,
      motherId: formData.motherId,
      mateId: formData.mateId,
      offspringIds: formData.offspringIds,
      paidPrice: formData.paidPrice,
      estimatedValue: formData.estimatedValue,
      id: birdId,
      category: 'Bird',
    };

    setItems(prevItems => {
      let newItems: CollectionItem[] = [...prevItems];
      const newCageId = finalCageId;

      // Find old cage ID before updating the bird
      const oldCage = prevItems.find(item => item.category === 'Cage' && (item as Cage).birdIds.includes(birdToSave.id)) as Cage | undefined;
      const oldCageId = oldCage?.id;
      
      // Add or update the bird
      const birdIndex = newItems.findIndex(i => i.id === birdToSave.id && i.category === 'Bird');
      if (birdIndex > -1) {
        newItems[birdIndex] = birdToSave;
      } else {
        newItems.unshift(birdToSave);
      }

      // Update cage memberships
      if (newCageId !== oldCageId) {
        // Remove from old cage
        if (oldCageId) {
          const oldCageIndex = newItems.findIndex(i => i.id === oldCageId);
          if (oldCageIndex > -1) {
            const currentOldCage = newItems[oldCageIndex] as Cage;
            (newItems[oldCageIndex] as Cage).birdIds = currentOldCage.birdIds.filter(id => id !== birdToSave.id);
          }
        }
        // Add to new cage
        if (newCageId) {
           const newCageIndex = newItems.findIndex(i => i.id === newCageId);
            if (newCageIndex > -1) {
              const currentNewCage = newItems[newCageIndex] as Cage;
              if (!currentNewCage.birdIds.includes(birdToSave.id)) {
                  (newItems[newCageIndex] as Cage).birdIds.push(birdToSave.id);
              }
            }
        }
      }
      
      // Add transaction if needed
      if (formData.addToExpenses && formData.paidPrice && formData.paidPrice > 0 && !editingBird) {
        const newTransaction: Transaction = {
          id: `t${Date.now()}`,
          category: 'Transaction',
          type: 'expense',
          date: format(new Date(), 'yyyy-MM-dd'),
          description: `Purchase of ${getBirdIdentifier(birdToSave)}`,
          amount: formData.paidPrice,
          relatedBirdId: birdId,
        };
        newItems.unshift(newTransaction);
      }
      
      return newItems;
    });
  };

  const filteredItems = items.filter(item => {
    if (item.category !== filterCategory) return false;

    if (filterCategory !== 'Bird' || !search) {
        return true;
    }

    const bird = item as Bird;
    const birdIdentifier = `${bird.species} ${speciesData[bird.species as keyof typeof speciesData]?.name || ''} ${bird.subspecies || ''} ${bird.ringNumber || ''} ${bird.age || ''} ${(bird.visualMutations || []).join(' ')} ${(bird.splitMutations || []).join(' ')}`.toLowerCase();
    return birdIdentifier.includes(search.toLowerCase());
  });

  const categories = ['Bird', 'Cage', 'Pair'];

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <AddCageDialog
        isOpen={isAddCageDialogOpen}
        onOpenChange={setIsAddCageDialogOpen}
        onSave={(data) => handleCreateCage(data.name)}
       />
      <BirdFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveBird}
        initialData={editingBird}
        allBirds={allBirds}
        allCages={allCages}
        handleCreateCage={handleCreateCage}
      />
      <BirdDetailsDialog
        bird={viewingBird}
        allBirds={allBirds}
        allCages={allCages}
        onClose={() => setViewingBird(null)}
        onBirdClick={(bird) => {
            setViewingBird(bird);
        }}
      />
      <BreedingRecordDetailsDialog
        record={viewingBreedingRecord}
        allBirds={allBirds}
        allPairs={allPairs}
        onClose={() => setViewingBreedingRecord(null)}
        onBirdClick={handleViewBirdClick}
      />
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-center">Bird Watcher</h1>
        <p className="text-lg text-muted-foreground text-center">Explore the world of birds.</p>
        <div className="max-w-3xl mx-auto w-full flex flex-col sm:flex-row items-center gap-4">
          <div className="flex gap-2">
            <Button onClick={handleAddClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Bird
            </Button>
            {filterCategory === 'Cage' && (
              <Button onClick={() => setIsAddCageDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Cage
              </Button>
            )}
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={filterCategory === 'Bird' ? "Search for birds..." : `Cannot search in ${filterCategory}s`}
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={filterCategory !== 'Bird'}
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
      
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            if (item.category === 'Bird') {
              return <BirdCard key={item.id} bird={item} allBirds={allBirds} allCages={allCages} allPairs={allPairs} allBreedingRecords={allBreedingRecords} handleEditClick={handleEditClick} onBirdClick={handleViewBirdClick} onViewBreedingRecord={handleViewBreedingRecord} />
            }
            if (item.category === 'Cage') {
                return <CageCard key={item.id} cage={item} allBirds={allBirds} onBirdClick={handleViewBirdClick} />
            }
            if (item.category === 'Pair') {
                return <PairCard key={item.id} pair={item} allBirds={allBirds} onBirdClick={handleViewBirdClick} />
            }
            return null;
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No {filterCategory.toLowerCase()}s found. Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
