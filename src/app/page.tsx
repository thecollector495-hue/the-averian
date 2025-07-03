
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, PlusCircle } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const birdFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  species: z.string().min(2, {
    message: "Species must be at least 2 characters.",
  }),
  sex: z.enum(["male", "female", "unsexed"], {
    required_error: "You need to select a sex.",
  }),
});

type BirdFormValues = z.infer<typeof birdFormSchema>;

// This could be defined in a separate file, e.g., components/add-bird-dialog.tsx
function AddBirdDialog({ onBirdAdded }: { onBirdAdded: (bird: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<BirdFormValues>({
    resolver: zodResolver(birdFormSchema),
    defaultValues: {
      name: "",
      species: "",
    },
  });

  function onSubmit(data: BirdFormValues) {
    const newBird = {
      id: Date.now(),
      name: data.name,
      species: data.species,
      sex: data.sex,
      imageUrl: 'https://placehold.co/600x400.png',
      aiHint: `${data.name.toLowerCase()} bird`,
      region: 'Unknown',
      category: 'Bird',
    };
    onBirdAdded(newBird);
    form.reset();
    setIsOpen(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Bird
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a new bird</DialogTitle>
          <DialogDescription>
            Enter the details of the new bird you've spotted.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Robin" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Species</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Turdus migratorius" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sex</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
            </div>
            <DialogFooter>
              <Button type="submit">Add Bird</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


const initialBirds = [
  {
    id: 1,
    name: 'Robin',
    species: 'Turdus migratorius',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'robin bird',
    region: 'North America',
    category: 'Bird',
    sex: 'unsexed'
  },
  {
    id: 2,
    name: 'Blue Jay',
    species: 'Cyanocitta cristata',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'blue jay',
    region: 'North America',
    category: 'Bird',
    sex: 'unsexed'
  },
  {
    id: 3,
    name: 'Cardinal',
    species: 'Cardinalis cardinalis',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'cardinal bird',
    region: 'North America',
    category: 'Pair',
    sex: 'unsexed'
  },
  {
    id: 4,
    name: 'European Robin',
    species: 'Erithacus rubecula',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'european robin',
    region: 'Europe',
    category: 'Bird',
    sex: 'unsexed'
  },
    {
    id: 5,
    name: 'Common Kestrel',
    species: 'Falco tinnunculus',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'kestrel bird',
    region: 'Europe',
    category: 'Bird',
    sex: 'unsexed'
  },
  {
    id: 6,
    name: 'Galah',
    species: 'Eolophus roseicapilla',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'galah bird',
    region: 'Australia',
    category: 'Pair',
    sex: 'unsexed'
  },
  {
    id: 7,
    name: 'Canary',
    species: 'Serinus canaria domestica',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'canary bird',
    region: 'Domestic',
    category: 'Cage',
    sex: 'unsexed'
  }
];

export default function BirdsPage() {
  const [birds, setBirds] = useState(initialBirds);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Bird');

  const handleAddBird = (newBird: any) => {
    setBirds(prevBirds => [newBird, ...prevBirds]);
  };

  const filteredBirds = birds.filter(bird => {
    const matchesSearch = bird.name.toLowerCase().includes(search.toLowerCase()) || bird.species.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = bird.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Bird', 'Cage', 'Pair'];

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-center">Bird Watcher</h1>
        <p className="text-lg text-muted-foreground text-center">Explore the world of birds.</p>
        <div className="max-w-3xl mx-auto w-full flex flex-col sm:flex-row items-center gap-4">
          <AddBirdDialog onBirdAdded={handleAddBird} />
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for birds by name or species..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {filteredBirds.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBirds.map((bird) => (
            <Card key={bird.id} className="overflow-hidden group">
              <div className="relative aspect-video">
                <Image 
                  src={bird.imageUrl} 
                  alt={bird.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  data-ai-hint={bird.aiHint}
                />
              </div>
              <CardHeader>
                <CardTitle>{bird.name}</CardTitle>
                <CardDescription>{bird.species}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No birds found. Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
