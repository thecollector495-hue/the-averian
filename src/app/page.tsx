'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from 'lucide-react';

const allBirds = [
  {
    id: 1,
    name: 'Robin',
    species: 'Turdus migratorius',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'robin bird',
    region: 'North America',
    category: 'Bird'
  },
  {
    id: 2,
    name: 'Blue Jay',
    species: 'Cyanocitta cristata',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'blue jay',
    region: 'North America',
    category: 'Bird'
  },
  {
    id: 3,
    name: 'Cardinal',
    species: 'Cardinalis cardinalis',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'cardinal bird',
    region: 'North America',
    category: 'Pair'
  },
  {
    id: 4,
    name: 'European Robin',
    species: 'Erithacus rubecula',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'european robin',
    region: 'Europe',
    category: 'Bird'
  },
    {
    id: 5,
    name: 'Common Kestrel',
    species: 'Falco tinnunculus',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'kestrel bird',
    region: 'Europe',
    category: 'Bird'
  },
  {
    id: 6,
    name: 'Galah',
    species: 'Eolophus roseicapilla',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'galah bird',
    region: 'Australia',
    category: 'Pair'
  },
  {
    id: 7,
    name: 'Canary',
    species: 'Serinus canaria domestica',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'canary bird',
    region: 'Domestic',
    category: 'Cage'
  }
];

export default function BirdsPage() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredBirds = allBirds.filter(bird => {
    const matchesSearch = bird.name.toLowerCase().includes(search.toLowerCase()) || bird.species.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === 'all' || bird.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'Bird', 'Cage', 'Pair'];

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-center">Bird Watcher</h1>
        <p className="text-lg text-muted-foreground text-center">Explore the world of birds.</p>
        <div className="max-w-2xl mx-auto w-full flex flex-col sm:flex-row gap-4">
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
                  {category === 'all' ? 'All Types' : category}
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
