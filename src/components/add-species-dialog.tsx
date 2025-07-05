
'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from 'lucide-react';

const subspeciesSchema = z.object({
  value: z.string().min(1, "Subspecies name cannot be empty."),
});

const speciesSchema = z.object({
  name: z.string().min(1, "Species name is required."),
  incubationPeriod: z.coerce.number().int().min(1, "Incubation period (in days) is required."),
  subspecies: z.array(subspeciesSchema).default([]),
});
export type AddSpeciesFormValues = z.infer<typeof speciesSchema>;

export function AddSpeciesDialog({ isOpen, onOpenChange, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: AddSpeciesFormValues) => void }) {
  const form = useForm<AddSpeciesFormValues>({
    resolver: zodResolver(speciesSchema),
    defaultValues: {
      subspecies: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "subspecies",
  });

  const [newSubspecies, setNewSubspecies] = useState("");

  const handleAddSubspecies = () => {
    if (newSubspecies.trim()) {
      append({ value: newSubspecies.trim() });
      setNewSubspecies("");
    }
  };

  function onSubmit(data: AddSpeciesFormValues) {
    onSave(data);
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Custom Species</DialogTitle>
          <DialogDescription>Define a new species for use in your records.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Species Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cockatiel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="incubationPeriod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Incubation Period (days)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 21" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="space-y-3">
              <FormLabel>Subspecies</FormLabel>
              <FormDescription>
                If this species has subspecies, add them below.
              </FormDescription>
              <div className="space-y-2">
                {fields.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name={`subspecies.${index}.value`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Remove subspecies</span>
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="New subspecies name"
                  value={newSubspecies}
                  onChange={(e) => setNewSubspecies(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubspecies();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddSubspecies}>
                  Add
                </Button>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Species</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
