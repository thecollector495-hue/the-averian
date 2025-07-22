
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { format, parseISO, startOfYear, getYear } from 'date-fns';
import imageCompression from 'browser-image-compression';

import { Bird, Cage, Permit, getBirdIdentifier, CustomSpecies, CustomMutation, AddMutationFormValues, MedicalRecord } from '@/lib/data';
import { cn } from '@/lib/utils';
import { MultiSelectCombobox } from './multi-select-combobox';
import { GeneralCombobox } from './general-combobox';
import { useItems } from '@/context/ItemsContext';

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, PlusCircle, Upload, X, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import Image from 'next/image';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const AddMutationDialog = dynamic(() => import('@/components/add-mutation-dialog').then(mod => mod.AddMutationDialog), { ssr: false });

const medicalRecordSchema = z.object({
  id: z.string(),
  date: z.date(),
  type: z.enum(['Vet Visit', 'Medication', 'Health Check', 'Note']),
  details: z.string().min(1, 'Details are required.'),
  cost: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number().optional()
  ),
});

const birdFormSchema = z.object({
  species: z.string().optional(),
  newSpeciesName: z.string().optional(),
  newSpeciesIncubation: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().int().optional()
  ),

  subspecies: z.string().optional(),
  newSubspeciesName: z.string().optional(),

  sex: z.enum(["male", "female", "unsexed"], {
    required_error: "You need to select a sex.",
  }),
  ringNumber: z.string().optional(),
  unbanded: z.boolean().default(false),
  
  birthDateType: z.enum(['date', 'year']).default('date'),
  birthDate: z.date().optional(),
  birthYear: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().int().min(1900, "Year must be after 1900").max(new Date().getFullYear(), "Year cannot be in the future").optional()
  ),
  
  imageUrl: z.string().optional(),

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
  status: z.enum(['Available', 'Sold', 'Deceased', 'Hand-rearing'], { required_error: "Status is required." }),
  permitId: z.string().optional(),
  salePrice: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number({ invalid_type_error: "Sale price must be a number." }).min(0, "Price can't be negative.").optional()
  ),
  saleDate: z.date().optional(),
  buyerInfo: z.string().optional(),
  createSaleTransaction: z.boolean().default(false),
  medicalRecords: z.array(medicalRecordSchema).default([]),
})
.refine(data => data.species || data.newSpeciesName, {
    message: "Please select or create a new species.",
    path: ["species"],
})
.refine(data => !data.newSpeciesName || data.newSpeciesIncubation, {
    message: "Incubation period is required for a new species.",
    path: ["newSpeciesIncubation"],
})
.refine(data => !data.cageId || !data.newCageName, {
    message: "Cannot select a cage and create a new one.",
    path: ["cageId"],
})
.refine(data => {
    if (data.status === 'Sold') {
        return !!data.salePrice && !!data.saleDate && !!data.buyerInfo;
    }
    return true;
}, { message: "Sale details (price, date, buyer) are required when status is 'Sold'.", path: ['salePrice'] })
.refine(data => {
    if(data.birthDateType === 'year') return !!data.birthYear;
    return true;
}, { message: "Birth year is required.", path: ['birthYear'] });


export type BirdFormValues = z.infer<typeof birdFormSchema>;


export function BirdFormDialog({ isOpen, onOpenChange, onSave, initialData, allBirds, allCages, allPermits }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: BirdFormValues & { newCageName?: string }) => void, initialData: Bird | null, allBirds: Bird[], allCages: Cage[], allPermits: Permit[] }) {
  const { toast } = useToast();
  const { items, addItem } = useItems();
  const [isCreatingCage, setIsCreatingCage] = useState(false);
  const [isCreatingSpecies, setIsCreatingSpecies] = useState(false);
  const [isCreatingSubspecies, setIsCreatingSubspecies] = useState(false);
  const [isMutationDialogOpen, setIsMutationDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const customMutations = items.filter((item): item is CustomMutation => item.category === 'CustomMutation');
  const customSpecies = items.filter((item): item is CustomSpecies => item.category === 'CustomSpecies');

  const form = useForm<BirdFormValues>({
    resolver: zodResolver(birdFormSchema),
    defaultValues: {
      ringNumber: "", unbanded: false, visualMutations: [], splitMutations: [], offspringIds: [],
      cageId: undefined, newCageName: "", addToExpenses: true, status: 'Available', birthDateType: 'date', imageUrl: '', medicalRecords: [],
    },
  });

  const { fields: medicalFields, append: appendMedical, remove: removeMedical } = useFieldArray({
    control: form.control,
    name: "medicalRecords",
  });
  
  const resetFormStates = () => {
      setIsCreatingCage(false);
      setIsCreatingSpecies(false);
      setIsCreatingSubspecies(false);
  };

  useEffect(() => {
    resetFormStates();
    if (initialData) {
      const currentCage = allCages.find(cage => cage.birdIds.includes(initialData.id));
      const birthDate = initialData.birthDate ? parseISO(initialData.birthDate) : undefined;
      const isYearOnly = birthDate ? format(birthDate, 'MM-dd') === '01-01' : false;

      form.reset({
        ...initialData,
        birthDate: birthDate,
        birthDateType: isYearOnly ? 'year' : 'date',
        birthYear: birthDate ? getYear(birthDate) : undefined,
        cageId: currentCage?.id,
        newCageName: "", addToExpenses: !initialData.paidPrice,
        saleDate: initialData.saleDetails ? parseISO(initialData.saleDetails.date) : undefined,
        salePrice: initialData.saleDetails?.price, buyerInfo: initialData.saleDetails?.buyer,
        medicalRecords: (initialData.medicalRecords || []).map(r => ({...r, date: parseISO(r.date)})),
      });
    } else {
      form.reset({
        species: undefined, subspecies: undefined, sex: undefined, ringNumber: "",
        unbanded: false, birthDate: undefined, birthYear: undefined, birthDateType: 'date',
        cageId: undefined, newCageName: "", visualMutations: [],
        splitMutations: [], fatherId: undefined, motherId: undefined, mateId: undefined, offspringIds: [],
        paidPrice: undefined, estimatedValue: undefined, addToExpenses: true, status: 'Available',
        permitId: undefined, salePrice: undefined, saleDate: undefined, buyerInfo: "", createSaleTransaction: true,
        imageUrl: "", medicalRecords: []
      });
    }
  }, [initialData, form, isOpen, allCages]);

  const allSpeciesOptions = useMemo(() => {
    return customSpecies
      .map(s => ({ value: s.name, label: s.name }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [customSpecies]);

  const allMutationOptions = useMemo(() => {
    const custom = customMutations.map(m => ({ value: m.name, label: m.name }));
    return [...custom].sort((a, b) => a.label.localeCompare(b.label));
  }, [customMutations]);

  const watchedSpecies = form.watch("species");
  const unbanded = form.watch("unbanded");
  const paidPrice = form.watch("paidPrice");
  const status = form.watch("status");
  const watchedSex = form.watch("sex");
  const birthDateType = form.watch("birthDateType");
  const imageUrl = form.watch("imageUrl");

  const subspeciesOptions = useMemo(() => {
    if (!watchedSpecies) return [];
    const species = customSpecies.find(s => s.name === watchedSpecies);
    if (species?.subspecies) return species.subspecies.map(s => ({ value: s, label: s }));
    return [];
  }, [watchedSpecies, customSpecies]);

  const relationshipOptions = useMemo(() => {
    if (!watchedSpecies && !isCreatingSpecies) return { father: [], mother: [], mate: [], offspring: [] };
    const targetSpecies = isCreatingSpecies ? form.getValues('newSpeciesName') : watchedSpecies;
    const potentialRelatives = allBirds.filter(bird => bird.id !== initialData?.id && bird.species === targetSpecies);
    const potentialMates = potentialRelatives.filter(b => watchedSex !== 'unsexed' && b.sex !== 'unsexed' && b.sex !== watchedSex);
    return {
      father: potentialRelatives.filter(b => b.sex === 'male').map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
      mother: potentialRelatives.filter(b => b.sex === 'female').map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
      mate: potentialMates.map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
      offspring: potentialRelatives.map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
    };
  }, [watchedSpecies, allBirds, initialData, watchedSex, isCreatingSpecies, form]);
  
  const permitOptions = allPermits.map(p => ({ value: p.id, label: `${p.permitNumber} (${p.issuingAuthority})`}));

  useEffect(() => { if (unbanded) form.setValue("ringNumber", ""); }, [unbanded, form]);
  useEffect(() => { if (status !== 'Sold') { form.setValue('salePrice', undefined); form.setValue('saleDate', undefined); form.setValue('buyerInfo', ''); } }, [status, form]);
  useEffect(() => { if (isCreatingSpecies) { form.setValue('species', undefined); form.setValue('subspecies', undefined); setIsCreatingSubspecies(false); } else { form.setValue('newSpeciesName', ''); form.setValue('newSpeciesIncubation', undefined); } }, [isCreatingSpecies, form]);
  useEffect(() => { if (isCreatingSubspecies) form.setValue('subspecies', undefined); else form.setValue('newSubspeciesName', ''); }, [isCreatingSubspecies, form]);
  useEffect(() => { setIsCreatingSubspecies(false); form.setValue('subspecies', undefined); }, [watchedSpecies]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };

    try {
      setIsCompressing(true);
      const compressedFile = await imageCompression(file, options);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        form.setValue('imageUrl', e.target?.result as string);
        setIsCompressing(false);
      };
      reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Error', description: 'Could not read the image file.'});
        setIsCompressing(false);
      };
      reader.readAsDataURL(compressedFile);

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Image Compression Failed',
        description: 'Could not process the image. Please try another one.',
      });
      setIsCompressing(false);
    }
  };

  const handleSaveMutation = (data: AddMutationFormValues) => {
    const newMutation: CustomMutation = { ...data, id: `cm${Date.now()}`, category: 'CustomMutation' };
    addItem(newMutation);
    const currentMuts = form.getValues('visualMutations');
    form.setValue('visualMutations', [...currentMuts, newMutation.name]);
    toast({ title: "Mutation Added", description: `The "${data.name}" mutation has been saved and selected.` });
  };

  function onSubmit(data: BirdFormValues) {
    onSave({
      ...data,
      medicalRecords: data.medicalRecords.map(r => ({...r, date: format(r.date, 'yyyy-MM-dd')})) as any
    });
    onOpenChange(false);
  }

  const isEditMode = initialData !== null;

  return (
    <>
    {isMutationDialogOpen && <AddMutationDialog isOpen={isMutationDialogOpen} onOpenChange={setIsMutationDialogOpen} onSave={handleSaveMutation} />}
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Bird' : 'Add a New Bird'}</DialogTitle>
          <DialogDescription>{isEditMode ? 'Update the details for this bird.' : 'Enter the details of the new bird.'}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="genetics">Genetics</TabsTrigger>
                <TabsTrigger value="relationships">Relationships</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
              </TabsList>
              <div className="max-h-[60vh] overflow-y-auto p-4">
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox id="create-species" checked={isCreatingSpecies} onCheckedChange={(c) => setIsCreatingSpecies(!!c)} />
                            <label htmlFor="create-species" className="text-sm font-medium">Add new species</label>
                          </div>
                          {isCreatingSpecies ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="newSpeciesName" render={({ field }) => (
                                    <FormItem><FormLabel>New Species Name</FormLabel><FormControl><Input placeholder="e.g., Quaker Parrot" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="newSpeciesIncubation" render={({ field }) => (
                                    <FormItem><FormLabel>Incubation Period (days)</FormLabel><FormControl><Input type="number" placeholder="e.g., 24" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                          ) : (
                            <FormField control={form.control} name="species" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Species</FormLabel>
                                    <GeneralCombobox field={field} options={allSpeciesOptions} placeholder="Select a species" disabled={isCreatingSpecies}/>
                                    <FormMessage />
                                </FormItem>
                            )} />
                          )}
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        {watchedSpecies && (
                            <div className="flex items-center space-x-2">
                                <Checkbox id="create-subspecies" checked={isCreatingSubspecies} onCheckedChange={(c) => setIsCreatingSubspecies(!!c)} />
                                <label htmlFor="create-subspecies" className="text-sm font-medium">Add new subspecies</label>
                            </div>
                        )}
                        {isCreatingSubspecies ? (
                            <FormField control={form.control} name="newSubspeciesName" render={({ field }) => (
                                <FormItem><FormLabel>New Subspecies Name</FormLabel><FormControl><Input placeholder="Enter name" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        ) : (
                            <FormField control={form.control} name="subspecies" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subspecies</FormLabel>
                                    <GeneralCombobox field={field} options={subspeciesOptions} placeholder="Select subspecies" disabled={!watchedSpecies || isCreatingSpecies || isCreatingSubspecies} />
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                      </div>

                  <FormField control={form.control} name="ringNumber" render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Ring Number</FormLabel>
                          <FormField control={form.control} name="unbanded" render={({ field: unbandedField }) => (
                              <div className="flex flex-row items-center space-x-2">
                                <FormControl><Checkbox checked={unbandedField.value} onCheckedChange={unbandedField.onChange} /></FormControl>
                                <Label className="font-normal cursor-pointer">Unbanded</Label>
                              </div>
                          )} />
                        </div>
                        <FormControl><Input placeholder="e.g., USAU-12345" {...field} value={field.value ?? ''} disabled={unbanded} /></FormControl>
                        <FormMessage />
                      </FormItem>
                  )} />
                  <div className="flex items-end gap-4">
                    <FormField control={form.control} name="sex" render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormLabel>Sex</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select sex" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="unsexed">Unsexed</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    <div className="flex-grow">
                        <FormField
                            control={form.control}
                            name="birthDateType"
                            render={({ field }) => (
                            <FormItem className="space-y-2">
                                <FormLabel>Age</FormLabel>
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex">
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="date" id="r-date"/></FormControl><FormLabel htmlFor="r-date" className="font-normal">Full Date</FormLabel></FormItem>
                                    <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="year" id="r-year"/></FormControl><FormLabel htmlFor="r-year" className="font-normal">Year Only</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl>
                            </FormItem>
                        )}/>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    {birthDateType === 'date' ? (
                        <FormField control={form.control} name="birthDate" render={({ field }) => (
                            <FormItem className="flex flex-col"><FormLabel>Birth Date</FormLabel>
                              <Popover><PopoverTrigger asChild><FormControl>
                                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl></PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    captionLayout="dropdown-buttons"
                                    fromYear={1980}
                                    toYear={new Date().getFullYear()}
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                    initialFocus />
                                </PopoverContent>
                              </Popover><FormMessage />
                            </FormItem>
                        )} />
                    ) : (
                        <FormField control={form.control} name="birthYear" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Birth Year</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder={`e.g., ${new Date().getFullYear() - 2}`} {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    )}
                  </div>
                  <FormField control={form.control} name="status" render={({ field }) => (
                        <FormItem><FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="Available">Available</SelectItem>
                              <SelectItem value="Hand-rearing">Hand-rearing</SelectItem>
                              <SelectItem value="Sold">Sold</SelectItem>
                              <SelectItem value="Deceased">Deceased</SelectItem>
                            </SelectContent>
                          </Select><FormMessage />
                        </FormItem>
                      )} />
                    <FormField control={form.control} name="permitId" render={({ field }) => (
                        <FormItem><FormLabel>Permit</FormLabel>
                          <GeneralCombobox field={field} options={permitOptions} placeholder="Assign a permit" /><FormMessage />
                        </FormItem>
                      )} />
                    
                    <div className="md:col-span-2 space-y-2">
                       <p className="font-medium">Housing</p>
                        {isCreatingCage ? (
                          <FormField control={form.control} name="newCageName" render={({ field }) => (
                              <FormItem><FormLabel>New Cage Name</FormLabel><FormControl><Input placeholder="Enter name for the new cage" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                          )} />
                        ) : (
                          <FormField control={form.control} name="cageId" render={({ field }) => (
                              <FormItem className="flex flex-col"><FormLabel>Cage</FormLabel>
                                <GeneralCombobox field={field} options={allCages.map(c => ({value: c.id, label: c.name}))} placeholder="Select a cage" />
                                <FormMessage />
                              </FormItem>
                          )} />
                        )}
                        <div className="flex items-center space-x-2">
                          <Checkbox id="create-cage" checked={isCreatingCage} onCheckedChange={(c) => { setIsCreatingCage(!!c); if (c) form.setValue('cageId', undefined); else form.setValue('newCageName', ''); }} />
                          <label htmlFor="create-cage" className="text-sm font-medium leading-none">Create a new cage</label>
                        </div>
                    </div>
                </div>
                 
                <p className="text-base font-medium">Financials</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="paidPrice" render={({field}) => (
                        <FormItem><FormLabel>Paid Price</FormLabel><FormControl><Input type="number" placeholder="e.g., 100" {...field} value={field.value ?? ''} onChange={event => field.onChange(event.target.value === '' ? undefined : event.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="estimatedValue" render={({field}) => (
                        <FormItem><FormLabel>Estimated Value</FormLabel><FormControl><Input type="number" placeholder="e.g., 150" {...field} value={field.value ?? ''} onChange={event => field.onChange(event.target.value === '' ? undefined : event.target.valueAsNumber)} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                  {paidPrice !== undefined && paidPrice > 0 && !isEditMode && (
                  <FormField control={form.control} name="addToExpenses" render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none"><FormLabel>Add purchase to expenses</FormLabel><FormDescription>This will create an expense entry for this bird's purchase price.</FormDescription></div>
                      </FormItem>
                  )} />
                )}
                {status === 'Sold' && (
                    <>
                        <Separator />
                        <p className="text-base font-medium">Sale Details</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="salePrice" render={({ field }) => (
                                <FormItem><FormLabel>Sale Price</FormLabel><FormControl><Input type="number" placeholder="e.g., 200" {...field} value={field.value ?? ''} onChange={event => field.onChange(event.target.value === '' ? undefined : event.target.valueAsNumber)}/></FormControl><FormMessage /></FormItem>
                            )} />
                              <FormField control={form.control} name="saleDate" render={({ field }) => (
                              <FormItem className="flex flex-col"><FormLabel>Sale Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><> {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="buyerInfo" render={({ field }) => (
                                <FormItem className="md:col-span-2"><FormLabel>Buyer Info</FormLabel><FormControl><Input placeholder="Buyer's name or details" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                            )} />
                          </div>
                        <FormField control={form.control} name="createSaleTransaction" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <div className="space-y-1 leading-none"><FormLabel>Create income transaction</FormLabel><FormDescription>This will create an income entry for this bird's sale price.</FormDescription></div>
                            </FormItem>
                        )} />
                    </>
                )}
                </TabsContent>
                
                <TabsContent value="media">
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image</FormLabel>
                        <FormControl>
                          <div>
                            <Input
                              type="file"
                              accept="image/png, image/jpeg, image/gif"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={isCompressing}
                            />
                            {imageUrl ? (
                              <div className="relative w-48 h-48 border rounded-md">
                                <Image src={imageUrl} alt="Bird preview" fill className="object-cover rounded-md" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-7 w-7"
                                  onClick={() => form.setValue('imageUrl', '')}
                                  disabled={isCompressing}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="h-24 w-full border-dashed"
                                disabled={isCompressing}
                              >
                                {isCompressing ? (
                                  <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Compressing...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-5 w-5" />
                                    Upload Image
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
                
                <TabsContent value="genetics" className="space-y-4">
                  <FormField control={form.control} name="visualMutations" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-2"><FormLabel>Visual Mutations</FormLabel><Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsMutationDialogOpen(true)}><PlusCircle className="h-4 w-4" /></Button></div>
                      <MultiSelectCombobox field={field} options={allMutationOptions} placeholder="Select visual mutations" />
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="splitMutations" render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-2"><FormLabel>Split Mutations</FormLabel><Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsMutationDialogOpen(true)}><PlusCircle className="h-4 w-4" /></Button></div>
                      <MultiSelectCombobox field={field} options={allMutationOptions} placeholder="Select split mutations" />
                      <FormMessage />
                    </FormItem>
                  )} />
                </TabsContent>
                
                <TabsContent value="relationships" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="fatherId" render={({field}) => (
                        <FormItem><FormLabel>Father</FormLabel><GeneralCombobox field={field} options={relationshipOptions.father} placeholder={watchedSpecies || isCreatingSpecies ? "Select father" : "Select species first"} /><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="motherId" render={({field}) => (
                        <FormItem><FormLabel>Mother</FormLabel><GeneralCombobox field={field} options={relationshipOptions.mother} placeholder={watchedSpecies || isCreatingSpecies ? "Select mother" : "Select species first"} /><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="mateId" render={({field}) => (
                        <FormItem><FormLabel>Mate</FormLabel><GeneralCombobox field={field} options={relationshipOptions.mate} placeholder={watchedSpecies || isCreatingSpecies ? "Select mate" : "Select species first"} disabled={watchedSex === 'unsexed'} /><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="offspringIds" render={({field}) => (
                        <FormItem><FormLabel>Offspring</FormLabel><MultiSelectCombobox field={field} options={relationshipOptions.offspring} placeholder={watchedSpecies || isCreatingSpecies ? "Select offspring" : "Select species first"} /><FormMessage /></FormItem>
                      )} />
                  </div>
                </TabsContent>

                <TabsContent value="medical" className="space-y-4">
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => appendMedical({ id: `mr_${Date.now()}`, date: new Date(), type: 'Note', details: '' })}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Medical Record
                      </Button>
                    </div>
                    {medicalFields.map((field, index) => (
                      <div key={field.id} className="p-4 border rounded-md space-y-4 relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7"
                          onClick={() => removeMedical(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`medicalRecords.${index}.date`}
                            render={({ field: dateField }) => (
                              <FormItem><FormLabel>Date</FormLabel>
                                <Popover><PopoverTrigger asChild><FormControl>
                                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dateField.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{dateField.value ? format(dateField.value, "PPP") : "Pick a date"}</Button>
                                </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateField.value} onSelect={dateField.onChange} initialFocus /></PopoverContent></Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                           <FormField
                            control={form.control}
                            name={`medicalRecords.${index}.type`}
                            render={({ field: typeField }) => (
                              <FormItem><FormLabel>Type</FormLabel>
                                <Select onValueChange={typeField.onChange} defaultValue={typeField.value}>
                                  <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                  <SelectContent>
                                    <SelectItem value="Vet Visit">Vet Visit</SelectItem>
                                    <SelectItem value="Medication">Medication</SelectItem>
                                    <SelectItem value="Health Check">Health Check</SelectItem>
                                    <SelectItem value="Note">Note</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={form.control}
                          name={`medicalRecords.${index}.details`}
                          render={({ field: detailsField }) => (
                            <FormItem><FormLabel>Details</FormLabel>
                              <FormControl><Textarea placeholder="Enter details..." {...detailsField} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name={`medicalRecords.${index}.cost`}
                          render={({ field: costField }) => (
                            <FormItem><FormLabel>Cost (optional)</FormLabel>
                              <FormControl><Input type="number" step="0.01" placeholder="e.g. 50.00" {...costField} value={costField.value ?? ''} onChange={e => costField.onChange(e.target.valueAsNumber)} /></FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                    {medicalFields.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">No medical records yet.</p>}
                </TabsContent>

              </div>
            </Tabs>
            <DialogFooter className="pt-4 mt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Bird'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
}
