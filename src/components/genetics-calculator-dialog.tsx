
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { MultiSelectCombobox } from "./multi-select-combobox";
import { CustomMutation } from "@/lib/data";

const geneticsCalculatorSchema = z.object({
  maleVisual: z.array(z.string()).default([]),
  maleSplit: z.array(z.string()).default([]),
  femaleVisual: z.array(z.string()).default([]),
  femaleSplit: z.array(z.string()).default([]),
});

type GeneticsCalculatorFormValues = z.infer<typeof geneticsCalculatorSchema>;

interface GeneticsCalculatorDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCalculate: (query: string) => void;
  customMutations: CustomMutation[];
}

export function GeneticsCalculatorDialog({ isOpen, onOpenChange, onCalculate, customMutations }: GeneticsCalculatorDialogProps) {
  const form = useForm<GeneticsCalculatorFormValues>({
    resolver: zodResolver(geneticsCalculatorSchema),
    defaultValues: {
      maleVisual: [],
      maleSplit: [],
      femaleVisual: [],
      femaleSplit: [],
    },
  });

  const allMutationOptions = customMutations.map(m => ({ value: m.name, label: m.name })).sort((a,b) => a.label.localeCompare(b.label));

  function onSubmit(data: GeneticsCalculatorFormValues) {
    const buildBirdString = (sex: 'male' | 'female', visual: string[], split: string[]) => {
        if (visual.length === 0 && split.length === 0) {
            return `a normal ${sex}`;
        }
        let parts = [];
        if (visual.length > 0) {
            parts.push(`visual ${visual.join(' ')}`);
        }
        if (split.length > 0) {
            parts.push(`split for ${split.join(' ')}`);
        }
        return `a ${sex} that is ${parts.join(' and ')}`;
    }

    const maleString = buildBirdString('male', data.maleVisual, data.maleSplit);
    const femaleString = buildBirdString('female', data.femaleVisual, data.femaleSplit);

    const query = `Calculate the genetic outcome from a pairing between ${maleString} and ${femaleString}.`;
    onCalculate(query);
    onOpenChange(false);
    form.reset();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Genetics Calculator</DialogTitle>
          <DialogDescription>
            Select the mutations for a theoretical pair to calculate the expected offspring.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto pr-6 pl-1 pt-2">
            <div>
                <h3 className="font-semibold mb-2">Male Parent</h3>
                <div className="space-y-4 p-4 border rounded-lg">
                    <FormField
                      control={form.control}
                      name="maleVisual"
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
                      name="maleSplit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Split-to Mutations</FormLabel>
                           <MultiSelectCombobox field={field} options={allMutationOptions} placeholder="Select split mutations" />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            </div>
             <div>
                <h3 className="font-semibold mb-2">Female Parent</h3>
                <div className="space-y-4 p-4 border rounded-lg">
                     <FormField
                      control={form.control}
                      name="femaleVisual"
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
                      name="femaleSplit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Split-to Mutations</FormLabel>
                           <MultiSelectCombobox field={field} options={allMutationOptions} placeholder="Select split mutations" />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Calculate Genetics</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

    