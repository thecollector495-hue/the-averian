
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, PlusCircle, ChevronsUpDown } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, ControllerRenderProps } from "react-hook-form";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';


const speciesData = {
  'Turdus migratorius': { name: 'American Robin', subspecies: ['T. m. migratorius', 'T. m. achrusterus'] },
  'Cyanocitta cristata': { name: 'Blue Jay', subspecies: ['C. c. cristata', 'C. c. bromia'] },
  'Cardinalis cardinalis': { name: 'Northern Cardinal', subspecies: ['C. c. cardinalis', 'C. c. floridanus'] },
  'Erithacus rubecula': { name: 'European Robin', subspecies: ['E. r. rubecula', 'E. r. melophilus'] },
  'Falco tinnunculus': { name: 'Common Kestrel', subspecies: [] },
  'Eolophus roseicapilla': { name: 'Galah', subspecies: ['E. r. roseicapilla', 'E. r. assimilis'] },
  'Serinus canaria domestica': { name: 'Domestic Canary', subspecies: [] },
};

const mutationOptions = ['Opaline', 'Cinnamon', 'Lutino', 'Albino', 'Fallow', 'Spangle'] as const;

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
  age: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.coerce.number({ invalid_type_error: "Age must be a number."}).int().min(0, "Age can't be negative.").optional()
  ),
  visualMutations: z.array(z.string()).default([]),
  splitMutations: z.array(z.string()).default([]),
});

type BirdFormValues = z.infer<typeof birdFormSchema>;

function MultiSelectPopover({ field, options, placeholder }: { field: ControllerRenderProps<BirdFormValues, "visualMutations" | "splitMutations">, options: readonly string[], placeholder: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between h-10",
              !field.value?.length && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {field.value?.length
                ? field.value.length === 1
                  ? field.value[0]
                  : `${field.value.length} selected`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-60 overflow-y-auto p-0">
        <div className="p-2 space-y-1">
          {options.map((option) => (
            <FormField
              key={option}
              control={undefined}
              name={field.name}
              render={() => (
                <FormItem className="flex flex-row items-center space-x-2 space-y-0 p-1 rounded-md hover:bg-accent">
                  <FormControl>
                    <Checkbox
                      checked={field.value?.includes(option)}
                      onCheckedChange={(checked) => {
                        return checked
                          ? field.onChange([...(field.value || []), option])
                          : field.onChange(
                              field.value?.filter(
                                (value) => value !== option
                              )
                            );
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal w-full cursor-pointer py-1">{option}</FormLabel>
                </FormItem>
              )}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}


function AddBirdDialog({ onBirdAdded }: { onBirdAdded: (bird: any) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const form = useForm<BirdFormValues>({
    resolver: zodResolver(birdFormSchema),
    defaultValues: {
      ringNumber: "",
      unbanded: false,
      visualMutations: [],
      splitMutations: [],
    },
  });

  const watchedSpecies = form.watch("species");
  const unbanded = form.watch("unbanded");
  const subspeciesOptions = watchedSpecies ? speciesData[watchedSpecies as keyof typeof speciesData]?.subspecies : [];

  useEffect(() => {
    if (unbanded) {
      form.setValue("ringNumber", "");
    }
  }, [unbanded, form]);


  function onSubmit(data: BirdFormValues) {
    const newBird = {
      id: Date.now(),
      species: data.species,
      subspecies: data.subspecies,
      sex: data.sex,
      ringNumber: data.unbanded ? null : data.ringNumber,
      category: 'Bird',
      age: data.age,
      visualMutations: data.visualMutations || [],
      splitMutations: data.splitMutations || [],
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6 pl-1">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="species"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Species</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('subspecies', undefined);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a species" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(speciesData).map(([code, { name }]) => (
                           <SelectItem key={code} value={code}>
                             {name} <span className="text-muted-foreground ml-2">({code})</span>
                           </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!subspeciesOptions || subspeciesOptions.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subspecies (if any)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {subspeciesOptions.map((sub) => (
                          <SelectItem key={sub} value={sub}>
                            {sub}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              <div className="grid grid-cols-2 gap-4">
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
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 2" {...field} onChange={event => field.onChange(event.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="visualMutations"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Visual Mutations</FormLabel>
                        <MultiSelectPopover field={field} options={mutationOptions} placeholder="Select visual mutations" />
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
                        <MultiSelectPopover field={field} options={mutationOptions} placeholder="Select split mutations" />
                        <FormMessage />
                    </FormItem>
                )}
               />
            </div>
            <DialogFooter className="pt-4">
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
    species: 'Turdus migratorius',
    subspecies: null,
    ringNumber: 'A123',
    category: 'Bird',
    sex: 'unsexed',
    age: 2,
    visualMutations: ['Opaline'],
    splitMutations: ['Cinnamon']
  },
  {
    id: 2,
    species: 'Cyanocitta cristata',
    subspecies: null,
    ringNumber: 'B456',
    category: 'Bird',
    sex: 'unsexed',
    age: 3,
    visualMutations: [],
    splitMutations: ['Lutino']
  },
  {
    id: 3,
    species: 'Cardinalis cardinalis',
    subspecies: null,
    ringNumber: null,
    category: 'Pair',
    sex: 'unsexed',
    age: 1,
    visualMutations: [],
    splitMutations: []
  },
  {
    id: 4,
    species: 'Erithacus rubecula',
    subspecies: null,
    ringNumber: 'E789',
    category: 'Bird',
    sex: 'unsexed',
    age: 5,
    visualMutations: ['Cinnamon'],
    splitMutations: []
  },
    {
    id: 5,
    species: 'Falco tinnunculus',
    subspecies: null,
    ringNumber: null,
    category: 'Bird',
    sex: 'unsexed',
    age: 2,
    visualMutations: [],
    splitMutations: []
  },
  {
    id: 6,
    species: 'Eolophus roseicapilla',
    subspecies: null,
    ringNumber: 'G101',
    category: 'Pair',
    sex: 'unsexed',
    age: 4,
    visualMutations: ['Fallow'],
    splitMutations: ['Spangle']
  },
  {
    id: 7,
    species: 'Serinus canaria domestica',
    subspecies: null,
    ringNumber: null,
    category: 'Cage',
    sex: 'unsexed',
    age: 1,
    visualMutations: ['Lutino'],
    splitMutations: []
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
    const speciesName = speciesData[bird.species as keyof typeof speciesData]?.name || '';
    const birdIdentifier = `${speciesName} ${bird.species} ${bird.subspecies || ''} ${bird.ringNumber || ''} ${bird.age || ''} ${(bird.visualMutations || []).join(' ')} ${(bird.splitMutations || []).join(' ')}`.toLowerCase();
    const matchesSearch = birdIdentifier.includes(search.toLowerCase());
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
              placeholder="Search for birds by name, species, ring number, or mutation..."
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
          {filteredBirds.map((bird) => {
            const speciesInfo = speciesData[bird.species as keyof typeof speciesData];
            const displayName = speciesInfo ? speciesInfo.name : bird.species;
            return (
              <Card key={bird.id} className="overflow-hidden group flex flex-col">
                <CardHeader>
                  <CardTitle>{displayName}</CardTitle>
                  <CardDescription>
                    <p>{bird.species}{bird.subspecies && ` (${bird.subspecies})`}</p>
                    <div className="flex justify-between items-center">
                      {bird.ringNumber ? <p className="text-xs text-muted-foreground">Ring: {bird.ringNumber}</p> : <p className="text-xs text-muted-foreground">Unbanded</p>}
                      {bird.age !== undefined && <p className="text-xs text-muted-foreground">Age: {bird.age}</p>}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4 px-6 space-y-2 flex-grow">
                  {bird.visualMutations?.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center">
                          <p className="text-sm font-medium mr-2">Visual:</p>
                          {bird.visualMutations.map(m => <Badge key={m} variant="outline">{m}</Badge>)}
                      </div>
                  )}
                  {bird.splitMutations?.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center">
                          <p className="text-sm font-medium mr-2">Split:</p>
                          {bird.splitMutations.map(m => <Badge key={m} variant="secondary">{m}</Badge>)}
                      </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No birds found. Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
