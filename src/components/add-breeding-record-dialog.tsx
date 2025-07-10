
'use client';

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from 'date-fns';
import { Bird, Pair, getBirdIdentifier, CustomSpecies } from '@/lib/data';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { useItems } from "@/context/ItemsContext";

const eggSchema = z.object({
  laidDate: z.date({ required_error: "Laid date is required." }),
  status: z.enum(['Laid', 'Hatched', 'Infertile', 'Broken']),
  expectedHatchDate: z.date().optional(),
});

const breedingRecordSchema = z.object({
  pairId: z.string({ required_error: "Please select a pair." }),
  startDate: z.date({ required_error: "Start date is required." }),
  notes: z.string().optional(),
  eggs: z.array(eggSchema).default([]),
  createHatchReminders: z.boolean().default(true),
});

type BreedingRecordFormValues = z.infer<typeof breedingRecordSchema>;

export function AddBreedingRecordDialog({ isOpen, onOpenChange, pairs, allBirds, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, pairs: Pair[], allBirds: Bird[], onSave: (data: any) => void }) {
  const { items } = useItems();
  const allCustomSpecies = items.filter((item): item is CustomSpecies => item.category === 'CustomSpecies');

  const form = useForm<BreedingRecordFormValues>({
    resolver: zodResolver(breedingRecordSchema),
    defaultValues: {
      eggs: [],
      notes: "",
      createHatchReminders: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "eggs",
  });
  
  const selectedPairId = form.watch("pairId");

  const getIncubationPeriod = () => {
      if (!selectedPairId) return null;
      const pair = pairs.find(p => p.id === selectedPairId);
      if (!pair) return null;
      const bird = allBirds.find(b => b.id === pair.maleId || b.id === pair.femaleId);
      if (!bird) return null;
      const speciesInfo = allCustomSpecies.find(s => s.name === bird.species);
      return speciesInfo?.incubationPeriod || null;
  };

  function onSubmit(data: BreedingRecordFormValues) {
    onSave({
      ...data,
      startDate: format(data.startDate, 'yyyy-MM-dd'),
      eggs: data.eggs.map(e => ({ 
        ...e, 
        laidDate: format(e.laidDate, 'yyyy-MM-dd'), 
        expectedHatchDate: e.expectedHatchDate ? format(e.expectedHatchDate, 'yyyy-MM-dd') : undefined,
        id: `e${Date.now()}${Math.random()}` 
      }))
    });
    onOpenChange(false);
    form.reset();
  }

  const handleAddEgg = () => {
    const laidDate = new Date();
    let expectedHatchDate: Date | undefined = undefined;
    const incubationPeriod = getIncubationPeriod();
    if (incubationPeriod) {
        expectedHatchDate = addDays(laidDate, incubationPeriod);
    }
    append({ laidDate, status: 'Laid', expectedHatchDate });
  };
  
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
                          const male = allBirds.find(b => b.id === p.maleId);
                          const female = allBirds.find(b => b.id === p.femaleId);
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
                <Button type="button" size="sm" variant="outline" onClick={handleAddEgg}>
                  <PlusCircle className="mr-2 h-4 w-4"/> Add Egg
                </Button>
              </div>
              <div className="space-y-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col gap-2 p-3 border rounded-md">
                    <div className="flex items-end gap-2">
                        <FormField
                            control={form.control}
                            name={`eggs.${index}.laidDate`}
                            render={({ field: dateField }) => (
                            <FormItem className="flex-grow">
                                <FormLabel>Laid Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild><FormControl><Button variant="outline" className="w-full justify-start text-left font-normal"><CalendarIcon className="mr-2 h-4 w-4"/>{dateField.value ? format(dateField.value, "PPP") : ""}</Button></FormControl></PopoverTrigger>
                                    <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={dateField.value} onSelect={(date) => {
                                        dateField.onChange(date);
                                        const incubationPeriod = getIncubationPeriod();
                                        if (incubationPeriod && date) {
                                            form.setValue(`eggs.${index}.expectedHatchDate`, addDays(date, incubationPeriod));
                                        }
                                    }} /></PopoverContent>
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
                     <FormField
                        control={form.control}
                        name={`eggs.${index}.expectedHatchDate`}
                        render={({ field: dateField }) => (
                            <FormItem>
                                <FormLabel className="text-xs text-muted-foreground">Expected Hatch Date</FormLabel>
                                <Input
                                    readOnly
                                    disabled
                                    value={dateField.value ? format(dateField.value, 'PPP') : 'Select pair to calculate'}
                                    className="disabled:opacity-100 disabled:cursor-default"
                                />
                            </FormItem>
                        )}
                      />
                  </div>
                ))}
                {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-2">No eggs added yet.</p>}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="createHatchReminders"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Create hatch reminders
                    </FormLabel>
                    <FormDescription>
                      Automatically add reminders for expected hatch dates to your notes.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

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

    