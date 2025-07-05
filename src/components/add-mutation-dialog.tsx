
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const mutationSchema = z.object({
  name: z.string().min(1, { message: "Mutation name is required." }),
});
export type AddMutationFormValues = z.infer<typeof mutationSchema>;

export function AddMutationDialog({ isOpen, onOpenChange, onSave }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: AddMutationFormValues) => void }) {
  const form = useForm<AddMutationFormValues>({
    resolver: zodResolver(mutationSchema),
  });

  function onSubmit(data: AddMutationFormValues) {
    onSave(data);
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Custom Mutation</DialogTitle>
          <DialogDescription>Enter the name of the new mutation.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mutation Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Pearl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Save Mutation</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
