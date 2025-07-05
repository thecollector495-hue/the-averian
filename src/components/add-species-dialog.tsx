
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const speciesSchema = z.object({
  name: z.string().min(1, "Species name is required."),
  incubationPeriod: z.coerce.number().int().min(1, "Incubation period (in days) is required."),
  subspecies: z.string().optional(),
});
export type AddSpeciesFormValues = z.infer<typeof speciesSchema>;

export function AddSpeciesDialog({ isOpen, onOpenChange, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: AddSpeciesFormValues) => void }) {
  const form = useForm<AddSpeciesFormValues>({
    resolver: zodResolver(speciesSchema),
  });

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
            <FormField
              control={form.control}
              name="subspecies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subspecies</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter one subspecies per line..." {...field} />
                  </FormControl>
                  <FormDescription>
                    If this species has subspecies, list each one on a new line.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
