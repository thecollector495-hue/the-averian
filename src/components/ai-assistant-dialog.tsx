'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { identifyBird, BirdIdentificationOutput } from '@/ai/flows/identify-bird-flow';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Upload } from 'lucide-react';
import Image from 'next/image';
import { Badge } from './ui/badge';

export function AIAssistantDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BirdIdentificationOutput | null>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!photoFile) {
      toast({
        variant: 'destructive',
        title: 'No Photo Selected',
        description: 'Please upload a photo of the bird to analyze.',
      });
      return;
    }

    setIsLoading(true);
    setResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(photoFile);
    reader.onload = async () => {
      try {
        const photoDataUri = reader.result as string;
        const response = await identifyBird({ photoDataUri, userDescription: description });
        setResult(response);
      } catch (error) {
        console.error('AI analysis failed:', error);
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: 'The AI assistant could not complete the request. Please try again.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.onerror = (error) => {
      console.error('File reading failed:', error);
      toast({
        variant: 'destructive',
        title: 'File Error',
        description: 'Could not read the selected photo.',
      });
      setIsLoading(false);
    };
  };

  const resetDialog = () => {
      setPhotoFile(null);
      setPhotoPreview(null);
      setDescription('');
      setResult(null);
      setIsLoading(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) resetDialog();
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" /> AI Aviary Assistant
          </DialogTitle>
          <DialogDescription>
            Upload a photo to identify a bird's species, mutations, and more.
          </DialogDescription>
        </DialogHeader>
        <div className="grid md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="bird-photo">Bird Photo</Label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                <div className="text-center">
                  {photoPreview ? (
                    <Image src={photoPreview} alt="Bird preview" width={200} height={200} className="mx-auto h-40 w-40 object-cover rounded-md" />
                  ) : (
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  )}
                   <div className="mt-4 flex text-sm justify-center">
                    <Label htmlFor="bird-photo-input" className="relative cursor-pointer rounded-md bg-background font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80">
                      <span>{photoFile ? 'Change photo' : 'Upload a file'}</span>
                      <input id="bird-photo-input" name="bird-photo" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                    </Label>
                  </div>
                   <p className="text-xs leading-5 text-muted-foreground">{photoFile ? photoFile.name : 'PNG, JPG, GIF up to 10MB'}</p>
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Optional Notes</Label>
              <Textarea id="description" placeholder="e.g., 'Unusual feather pattern on the wing', 'Seems lethargic'" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-2" />
            </div>
            <Button onClick={handleAnalyze} disabled={isLoading || !photoFile} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...
                </>
              ) : (
                'Analyze Photo'
              )}
            </Button>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Analysis Results</h3>
            {isLoading && (
                 <div className="space-y-4 p-4 border rounded-lg">
                    <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-muted rounded w-5/6 animate-pulse"></div>
                         <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                    </div>
                </div>
            )}
            {result && (
              <div className="p-4 border rounded-lg space-y-4">
                {!result.isBird ? (
                  <div>
                    <h4 className="font-semibold text-destructive">Not a Bird</h4>
                    <p className="text-sm text-muted-foreground">{result.physicalDescription}</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="font-semibold">{result.commonName}</h4>
                      <p className="text-sm italic text-muted-foreground">{result.latinName}</p>
                      <p className="text-xs text-muted-foreground mt-1">Confidence: {Math.round(result.confidence * 100)}%</p>
                    </div>
                    <div>
                      <h5 className="font-medium text-sm mb-1">Description</h5>
                      <p className="text-sm text-muted-foreground">{result.physicalDescription}</p>
                    </div>
                    {result.potentialMutations && result.potentialMutations.length > 0 && (
                      <div>
                        <h5 className="font-medium text-sm mb-1">Potential Mutations</h5>
                        <div className="flex flex-wrap gap-2">
                          {result.potentialMutations.map((m) => (
                            <Badge key={m} variant="secondary">{m}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h5 className="font-medium text-sm mb-1">Fun Fact</h5>
                      <p className="text-sm text-muted-foreground italic">"{result.interestingFact}"</p>
                    </div>
                  </>
                )}
              </div>
            )}
            {!isLoading && !result && (
              <div className="p-4 border rounded-lg text-center text-sm text-muted-foreground">
                AI analysis will appear here.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
