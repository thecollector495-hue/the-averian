
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import type { Cage } from '@/lib/data';

const cageFormSchema = z.object({
  name: z.string().min(1, { message: "Cage name is required." }),
  cost: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number({ invalid_type_error: "Cost must be a number."}).min(0, "Cost can't be negative.").optional()
  ),
  addToExpenses: z.boolean().default(false),
});

export type CageFormValues = z.infer<typeof cageFormSchema>;

export function AddCageDialog({ 
    isOpen, 
    onOpenChange, 
    onSave, 
    initialData 
}: { 
    isOpen: boolean, 
    onOpenChange: (open: boolean) => void, 
    onSave: (data: CageFormValues & { id?: string }) => void, 
    initialData: Cage | null 
}) {
  const form = useForm<CageFormValues>({
    resolver: zodResolver(cageFormSchema),
    defaultValues: {
      name: "",
      cost: undefined,
      addToExpenses: true,
    },
  });

  useEffect(() => {
    if (initialData) {
        form.reset({
            name: initialData.name,
            cost: initialData.cost,
            addToExpenses: !initialData.cost,
        });
    } else {
        form.reset({
            name: "",
            cost: undefined,
            addToExpenses: true,
        });
    }
  }, [initialData, form, isOpen]);

  function onSubmit(data: CageFormValues) {
    onSave({ ...data, id: initialData?.id });
    onOpenChange(false);
  }

  const isEditMode = initialData !== null;
  const cost = form.watch("cost");

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Cage' : 'Add New Cage'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update the details for this cage.' : 'Enter a name for the new cage and optionally track its cost.'}
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
            <FormField
              control={form.control}
              name="cost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost (Optional)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 150.00" {...field} value={field.value ?? ''} onChange={event => field.onChange(event.target.value === '' ? undefined : event.target.valueAsNumber)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {cost !== undefined && cost > 0 && !isEditMode && (
              <FormField
                control={form.control}
                name="addToExpenses"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Add to expenses
                      </FormLabel>
                      <FormDescription>
                        This will create a transaction for the cage cost.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Add Cage'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
