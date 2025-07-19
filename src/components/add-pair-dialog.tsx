
'use client';

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState, useRef, useMemo } from 'react';
import imageCompression from 'browser-image-compression';
import Image from 'next/image';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GeneralCombobox } from "./general-combobox";
import { Bird, Pair, getBirdIdentifier } from '@/lib/data';
import { Upload, X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const addPairSchema = z.object({
  maleId: z.string().min(1, "Male bird is required."),
  femaleId: z.string().min(1, "Female bird is required."),
  imageUrl: z.string().optional(),
});

export type AddPairFormValues = z.infer<typeof addPairSchema>;

interface AddPairDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: AddPairFormValues & { id?: string }) => void;
  initialData: Pair | null;
  allBirds: Bird[];
}

export function AddPairDialog({ isOpen, onOpenChange, onSave, initialData, allBirds }: AddPairDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const form = useForm<AddPairFormValues>({
    resolver: zodResolver(addPairSchema),
    defaultValues: {
      maleId: '',
      femaleId: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        maleId: initialData.maleId,
        femaleId: initialData.femaleId,
        imageUrl: initialData.imageUrl,
      });
    } else {
      form.reset({
        maleId: '',
        femaleId: '',
        imageUrl: '',
      });
    }
  }, [initialData, form, isOpen]);

  const birdOptions = useMemo(() => {
    const maleOptions = allBirds.filter(b => b.sex === 'male').map(b => ({ value: b.id, label: getBirdIdentifier(b) }));
    const femaleOptions = allBirds.filter(b => b.sex === 'female').map(b => ({ value: b.id, label: getBirdIdentifier(b) }));
    return { maleOptions, femaleOptions };
  }, [allBirds]);
  
  const imageUrl = form.watch("imageUrl");

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

  function onSubmit(data: AddPairFormValues) {
    onSave({ ...data, id: initialData?.id });
    onOpenChange(false);
  }

  const isEditMode = initialData !== null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Pair' : 'Create New Pair'}</DialogTitle>
          <DialogDescription>Select a male and female bird to create a breeding pair.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="maleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Male</FormLabel>
                  <GeneralCombobox field={field} options={birdOptions.maleOptions} placeholder="Select a male bird" />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="femaleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Female</FormLabel>
                  <GeneralCombobox field={field} options={birdOptions.femaleOptions} placeholder="Select a female bird" />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pair Image (Optional)</FormLabel>
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
                          <Image src={imageUrl} alt="Pair preview" fill className="object-cover rounded-md" />
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{isEditMode ? 'Save Changes' : 'Create Pair'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
