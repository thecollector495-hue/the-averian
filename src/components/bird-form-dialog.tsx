
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, ControllerRenderProps } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from 'date-fns';

import { Bird, Cage, Permit, speciesData, mutationOptions, getBirdIdentifier, CustomSpecies, CustomMutation } from '@/lib/data';
import { useItems } from '@/context/ItemsContext';
import { cn } from '@/lib/utils';
import { MultiSelectCombobox } from './multi-select-combobox';
import { GeneralCombobox } from './general-combobox';

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
import { Calendar as CalendarIcon } from 'lucide-react';

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
  birthDate: z.date().optional(),
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
}).refine(data => !data.cageId || !data.newCageName, {
    message: "Cannot select a cage and create a new one.",
    path: ["cageId"],
}).refine(data => {
    if (data.status === 'Sold') {
        return !!data.salePrice && !!data.saleDate && !!data.buyerInfo;
    }
    return true;
}, { message: "Sale details (price, date, buyer) are required when status is 'Sold'.", path: ['salePrice'] });

export type BirdFormValues = z.infer<typeof birdFormSchema>;


export function BirdFormDialog({ isOpen, onOpenChange, onSave, initialData, allBirds, allCages, allPermits }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: BirdFormValues & { newCageName?: string }) => void, initialData: Bird | null, allBirds: Bird[], allCages: Cage[], allPermits: Permit[] }) {
  const [isCreatingCage, setIsCreatingCage] = useState(false);
  const { items } = useItems();
  
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
      status: 'Available',
    },
  });
  
  useEffect(() => {
    setIsCreatingCage(false); // Always reset on open
    if (initialData) {
      const currentCage = allCages.find(cage => cage.birdIds.includes(initialData.id));
      form.reset({
        ...initialData,
        birthDate: initialData.birthDate ? parseISO(initialData.birthDate) : undefined,
        cageId: currentCage?.id,
        newCageName: "",
        addToExpenses: !initialData.paidPrice,
        saleDate: initialData.saleDetails ? parseISO(initialData.saleDetails.date) : undefined,
        salePrice: initialData.saleDetails?.price,
        buyerInfo: initialData.saleDetails?.buyer,
      });
    } else {
      form.reset({
        species: undefined,
        subspecies: undefined,
        sex: undefined,
        ringNumber: "",
        unbanded: false,
        birthDate: undefined,
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
        status: 'Available',
        permitId: undefined,
        salePrice: undefined,
        saleDate: undefined,
        buyerInfo: "",
        createSaleTransaction: true,
      });
    }
  }, [initialData, form, isOpen, allCages]);

  const customSpecies = useMemo(() => items.filter((item): item is CustomSpecies => item.category === 'CustomSpecies'), [items]);
  const customMutations = useMemo(() => items.filter((item): item is CustomMutation => item.category === 'CustomMutation'), [items]);

  const allSpeciesOptions = useMemo(() => {
    const options = [
      ...Object.entries(speciesData).map(([code, { name }]) => ({ value: code, label: name })),
      ...customSpecies.map(s => ({ value: s.id, label: `${s.name} (Custom)` })),
    ];
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [customSpecies]);

  const allMutationOptions = useMemo(() => {
    const combined = [...mutationOptions, ...customMutations.map(m => m.name)];
    return [...new Set(combined)].map(m => ({ value: m, label: m })).sort((a, b) => a.label.localeCompare(b.label));
  }, [customMutations]);

  const watchedSpecies = form.watch("species");
  const unbanded = form.watch("unbanded");
  const paidPrice = form.watch("paidPrice");
  const status = form.watch("status");

  const subspeciesOptions = useMemo(() => {
    if (!watchedSpecies) return [];
    
    // Check built-in data first
    const builtinSpecies = speciesData[watchedSpecies as keyof typeof speciesData];
    if (builtinSpecies && builtinSpecies.subspecies) {
      return builtinSpecies.subspecies.sort((a,b) => a.localeCompare(b));
    }
    
    // Check custom data
    const custom = customSpecies.find(s => s.id === watchedSpecies);
    if (custom && custom.subspecies) {
      return custom.subspecies.sort((a,b) => a.localeCompare(b));
    }

    return [];
  }, [watchedSpecies, customSpecies]);

  
  const potentialRelatives = allBirds
    .filter(bird => bird.id !== initialData?.id && bird.species === watchedSpecies);
  
  const relationshipOptions = {
    father: potentialRelatives.filter(b => b.sex === 'male').map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
    mother: potentialRelatives.filter(b => b.sex === 'female').map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
    mate: potentialRelatives.map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
    offspring: potentialRelatives.map(b => ({ value: b.id, label: getBirdIdentifier(b) })),
  };

  const permitOptions = allPermits.map(p => ({ value: p.id, label: `${p.permitNumber} (${p.issuingAuthority})`}));

  useEffect(() => {
    if (unbanded) {
      form.setValue("ringNumber", "");
    }
  }, [unbanded, form]);

  useEffect(() => {
    if (status !== 'Sold') {
      form.setValue('salePrice', undefined);
      form.setValue('saleDate', undefined);
      form.setValue('buyerInfo', '');
    }
  }, [status, form]);


  function onSubmit(data: BirdFormValues & { newCageName?: string }) {
    onSave(data);
    onOpenChange(false);
  }

  const isEditMode = initialData !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-2xl"
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement;
          // Allow interaction with popovers
          if (target.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
      >
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
                    <GeneralCombobox
                        field={{...field, onChange: (value) => {
                             field.onChange(value);
                             form.setValue('subspecies', undefined);
                        }}}
                        options={allSpeciesOptions}
                        placeholder="Select a species"
                    />
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
                    <GeneralCombobox
                      field={field}
                      options={subspeciesOptions.map((sub) => ({
                        value: sub,
                        label: sub,
                      }))}
                      placeholder="Select subspecies (if any)"
                      disabled={!subspeciesOptions || subspeciesOptions.length === 0}
                    />
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
                    name="birthDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col flex-grow">
                            <FormLabel>Birth Date</FormLabel>
                            <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, "PPP")
                                    ) : (
                                    <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </div>
               <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Available">Available</SelectItem>
                          <SelectItem value="Hand-rearing">Hand-rearing</SelectItem>
                          <SelectItem value="Sold">Sold</SelectItem>
                          <SelectItem value="Deceased">Deceased</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="permitId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permit</FormLabel>
                      <GeneralCombobox field={field} options={permitOptions} placeholder="Assign a permit" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        <GeneralCombobox field={field} options={allCages.map(c => ({value: c.id, label: c.name}))} placeholder="Select a cage" />
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
                       <MultiSelectCombobox field={field} options={allMutationOptions} placeholder="Select visual mutations" />
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
                       <MultiSelectCombobox field={field} options={allMutationOptions} placeholder="Select split mutations" />
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
                      <GeneralCombobox
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
                      <GeneralCombobox
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
                       <GeneralCombobox
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
                {status === 'Sold' && (
                    <>
                        <Separator />
                        <p className="text-base font-medium">Sale Details</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="salePrice" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sale Price</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g., 200" {...field} onChange={event => field.onChange(event.target.valueAsNumber)}/></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="saleDate" render={({ field }) => (
                              <FormItem className="flex flex-col"><FormLabel>Sale Date</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}><> {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="buyerInfo" render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Buyer Info</FormLabel>
                                    <FormControl><Input placeholder="Buyer's name or details" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                         </div>
                        <FormField
                            control={form.control}
                            name="createSaleTransaction"
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
                                    Create income transaction
                                </FormLabel>
                                <FormDescription>
                                    This will create an income entry for this bird's sale price.
                                </FormDescription>
                                </div>
                            </FormItem>
                            )}
                        />
                    </>
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
