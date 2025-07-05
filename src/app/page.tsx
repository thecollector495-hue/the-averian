
'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Search, PlusCircle } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BirdDetailsDialog } from '@/components/bird-details-dialog';
import { BirdCard } from '@/components/bird-card';
import { CageCard } from '@/components/cage-card';
import { PairCard } from '@/components/pair-card';
import { Bird, Cage, Pair, BreedingRecord, CollectionItem, getBirdIdentifier, initialItems, Transaction, Permit, BirdFormValues } from '@/lib/data';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const AddCageDialog = dynamic(() => import('@/components/add-cage-dialog').then(mod => mod.AddCageDialog), { ssr: false });
const BirdFormDialog = dynamic(() => import('@/components/bird-form-dialog').then(mod => mod.BirdFormDialog), { ssr: false });
const BreedingRecordDetailsDialog = dynamic(() => import('@/components/breeding-record-details-dialog').then(mod => mod.BreedingRecordDetailsDialog), { ssr: false });

export default function BirdsPage() {
  const [items, setItems] = useState<CollectionItem[]>(initialItems);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Bird');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBird, setEditingBird] = useState<Bird | null>(null);
  const [viewingBird, setViewingBird] = useState<Bird | null>(null);
  const [viewingBreedingRecord, setViewingBreedingRecord] = useState<BreedingRecord | null>(null);
  const [isAddCageDialogOpen, setIsAddCageDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const allBirds = items.filter((item): item is Bird => item.category === 'Bird');
  const allCages = items.filter((item): item is Cage => item.category === 'Cage');
  const allPairs = items.filter((item): item is Pair => item.category === 'Pair');
  const allBreedingRecords = items.filter((item): item is BreedingRecord => item.category === 'BreedingRecord');
  const allPermits = items.filter((item): item is Permit => item.category === 'Permit');

  const handleAddClick = () => {
    setEditingBird(null);
    setIsFormOpen(true);
  };

  const handleEditClick = (bird: Bird) => {
    setEditingBird(bird);
    setIsFormOpen(true);
  };

  const handleViewBirdClick = (bird: Bird) => {
    setViewingBird(bird);
  };

  const handleViewBreedingRecord = (record: BreedingRecord) => {
    setViewingBreedingRecord(record);
  }

  const handleCreateCage = (cageName: string): string | null => {
    const trimmedName = cageName.trim();
    if (!trimmedName) {
        toast({ variant: "destructive", title: "Invalid Name", description: "Cage name cannot be empty." });
        return null;
    }

    const existingCage = allCages.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (existingCage) {
        toast({ variant: "destructive", title: "Cage Exists", description: `A cage named "${trimmedName}" already exists.` });
        return null;
    }
    
    const newCage: Cage = {
        id: `c${Date.now()}`,
        name: trimmedName,
        category: 'Cage',
        birdIds: []
    };
    setItems(prev => [newCage, ...prev]);
    toast({ title: "Cage Created", description: `Cage "${trimmedName}" has been added.` });
    return newCage.id;
  };


  const handleSaveBird = (formData: BirdFormValues & { newCageName?: string }) => {
    let finalCageId = formData.cageId;
    if (formData.newCageName && formData.newCageName.trim() !== "") {
       const newCageId = handleCreateCage(formData.newCageName);
        if (!newCageId) {
            // If cage creation failed (e.g., duplicate name), stop the save process.
            return; 
        }
        finalCageId = newCageId;
    }

    const isEditing = !!editingBird;
    const birdId = editingBird?.id || `b${Date.now()}`;
    const birdToSave: Bird = {
      species: formData.species,
      subspecies: formData.subspecies,
      sex: formData.sex,
      ringNumber: formData.ringNumber,
      unbanded: formData.unbanded,
      birthDate: formData.birthDate ? format(formData.birthDate, 'yyyy-MM-dd') : undefined,
      visualMutations: formData.visualMutations,
      splitMutations: formData.splitMutations,
      fatherId: formData.fatherId,
      motherId: formData.motherId,
      mateId: formData.mateId,
      offspringIds: formData.offspringIds,
      paidPrice: formData.paidPrice,
      estimatedValue: formData.estimatedValue,
      id: birdId,
      category: 'Bird',
      status: formData.status,
      permitId: formData.permitId,
      saleDetails: formData.status === 'Sold' && formData.saleDate && formData.salePrice && formData.buyerInfo ? {
        date: format(formData.saleDate, 'yyyy-MM-dd'),
        price: formData.salePrice,
        buyer: formData.buyerInfo
      } : undefined,
    };

    setItems(prevItems => {
      let newItems: CollectionItem[] = [...prevItems];
      const newCageId = finalCageId;

      const oldCage = prevItems.find(item => item.category === 'Cage' && (item as Cage).birdIds.includes(birdToSave.id)) as Cage | undefined;
      const oldCageId = oldCage?.id;
      
      const birdIndex = newItems.findIndex(i => i.id === birdToSave.id && i.category === 'Bird');
      if (birdIndex > -1) {
        newItems[birdIndex] = birdToSave;
      } else {
        newItems.unshift(birdToSave);
      }

      if (newCageId !== oldCageId) {
        if (oldCageId) {
          const oldCageIndex = newItems.findIndex(i => i.id === oldCageId);
          if (oldCageIndex > -1) {
            const currentOldCage = newItems[oldCageIndex] as Cage;
            (newItems[oldCageIndex] as Cage).birdIds = currentOldCage.birdIds.filter(id => id !== birdToSave.id);
          }
        }
        if (newCageId) {
           const newCageIndex = newItems.findIndex(i => i.id === newCageId);
            if (newCageIndex > -1) {
              const currentNewCage = newItems[newCageIndex] as Cage;
              if (!currentNewCage.birdIds.includes(birdToSave.id)) {
                  (newItems[newCageIndex]as Cage).birdIds.push(birdToSave.id);
              }
            }
        }
      }
      
      if (formData.addToExpenses && formData.paidPrice && formData.paidPrice > 0 && !isEditing) {
        const newTransaction: Transaction = {
          id: `t${Date.now()}`,
          category: 'Transaction',
          type: 'expense',
          date: format(new Date(), 'yyyy-MM-dd'),
          description: `Purchase of ${getBirdIdentifier(birdToSave)}`,
          amount: formData.paidPrice,
          relatedBirdId: birdId,
        };
        newItems.unshift(newTransaction);
        toast({ title: "Expense Added", description: `Purchase of ${getBirdIdentifier(birdToSave)} logged.` });
      }
      
      const wasJustSold = editingBird?.status !== 'Sold' && formData.status === 'Sold';
      if (formData.createSaleTransaction && wasJustSold && birdToSave.saleDetails) {
         const newTransaction: Transaction = {
            id: `t${Date.now()}`,
            category: 'Transaction',
            type: 'income',
            date: birdToSave.saleDetails.date,
            description: `Sale of ${getBirdIdentifier(birdToSave)}`,
            amount: birdToSave.saleDetails.price,
            relatedBirdId: birdId,
        };
        newItems.unshift(newTransaction);
        toast({ title: "Income Added", description: `Sale of ${getBirdIdentifier(birdToSave)} logged.` });
      }
      
      return newItems;
    });

     toast({
        title: isEditing ? "Bird Updated" : "Bird Added",
        description: `${getBirdIdentifier(birdToSave)} has been saved.`,
      });
  };

  const filteredItems = items.filter(item => {
    if (item.category !== filterCategory) return false;

    if (filterCategory !== 'Bird' || !search) {
        return true;
    }

    const bird = item as Bird;
    const birdIdentifier = `${bird.species} ${bird.subspecies || ''} ${bird.ringNumber || ''} ${bird.birthDate || ''} ${(bird.visualMutations || []).join(' ')} ${(bird.splitMutations || []).join(' ')}`.toLowerCase();
    return birdIdentifier.includes(search.toLowerCase());
  });

  const categories = ['Bird', 'Cage', 'Pair'];

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      {isAddCageDialogOpen && <AddCageDialog
        isOpen={isAddCageDialogOpen}
        onOpenChange={setIsAddCageDialogOpen}
        onSave={(data) => handleCreateCage(data.name)}
       />}
      {isFormOpen && <BirdFormDialog
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveBird}
        initialData={editingBird}
        allBirds={allBirds}
        allCages={allCages}
        allPermits={allPermits}
      />}
      <BirdDetailsDialog
        bird={viewingBird}
        allBirds={allBirds}
        allCages={allCages}
        allPermits={allPermits}
        onClose={() => setViewingBird(null)}
        onBirdClick={(bird) => {
            setViewingBird(bird);
        }}
      />
      {viewingBreedingRecord && <BreedingRecordDetailsDialog
        record={viewingBreedingRecord}
        allBirds={allBirds}
        allPairs={allPairs}
        onClose={() => setViewingBreedingRecord(null)}
        onBirdClick={handleViewBirdClick}
      />}
      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-center">Bird Watcher</h1>
        <p className="text-lg text-muted-foreground text-center">Explore the world of birds.</p>
        <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={filterCategory === 'Bird' ? "Search for birds..." : `Cannot search in ${filterCategory}s`}
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={filterCategory !== 'Bird'}
            />
          </div>
          <div className="flex w-full sm:w-auto items-center gap-2">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[120px]">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Bird
            </Button>
            {filterCategory === 'Cage' && (
              <Button onClick={() => setIsAddCageDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Cage
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            if (item.category === 'Bird') {
              return <BirdCard key={item.id} bird={item} allBirds={allBirds} allCages={allCages} allPairs={allPairs} allBreedingRecords={allBreedingRecords} allPermits={allPermits} handleEditClick={handleEditClick} onBirdClick={handleViewBirdClick} onViewBreedingRecord={handleViewBreedingRecord} />
            }
            if (item.category === 'Cage') {
                return <CageCard key={item.id} cage={item} allBirds={allBirds} onBirdClick={handleViewBirdClick} />
            }
            if (item.category === 'Pair') {
                return <PairCard key={item.id} pair={item} allBirds={allBirds} onBirdClick={handleViewBirdClick} />
            }
            return null;
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No {filterCategory.toLowerCase()}s found. Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
