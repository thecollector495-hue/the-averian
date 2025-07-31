
'use client';

import { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Search, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BirdDetailsDialog } from '@/components/bird-details-dialog';
import { BirdCard } from '@/components/bird-card';
import { CageCard } from '@/components/cage-card';
import { PairCard } from '@/components/pair-card';
import { Bird, Cage, Pair, BreedingRecord, CollectionItem, getBirdIdentifier, Transaction, Permit, BirdFormValues, CustomSpecies, CustomMutation } from '@/lib/data';
import { format, startOfYear } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useItems } from '@/context/ItemsContext';
import { CageFormValues } from '@/components/add-cage-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ImageLightbox } from '@/components/image-lightbox';
import { AddPairFormValues } from '@/components/add-pair-dialog';
import { useAuth } from '@/context/AuthContext';
import { FullPageLoader } from '@/components/full-page-loader';

const AddCageDialog = dynamic(() => import('@/components/add-cage-dialog').then(mod => mod.AddCageDialog), { ssr: false });
const BirdFormDialog = dynamic(() => import('@/components/bird-form-dialog').then(mod => mod.BirdFormDialog), { ssr: false });
const AddPairDialog = dynamic(() => import('@/components/add-pair-dialog').then(mod => mod.AddPairDialog), { ssr: false });
const BreedingRecordDetailsDialog = dynamic(() => import('@/components/breeding-record-details-dialog').then(mod => mod.BreedingRecordDetailsDialog), { ssr: false });

export default function HomePage() {
  const { items, addItem, addItems, updateItem, updateItems, deleteItem, deleteBirdItem } = useItems();
  const { isReadOnly, user, loading } = useAuth();
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Bird');
  const [isBirdFormOpen, setIsBirdFormOpen] = useState(false);
  const [editingBird, setEditingBird] = useState<Bird | null>(null);
  const [viewingBird, setViewingBird] = useState<Bird | null>(null);
  const [viewingBreedingRecord, setViewingBreedingRecord] = useState<BreedingRecord | null>(null);
  const [isAddCageDialogOpen, setIsAddCageDialogOpen] = useState(false);
  const [editingCage, setEditingCage] = useState<Cage | null>(null);
  const [deletingBirdId, setDeletingBirdId] = useState<string | null>(null);
  const [deletingCageId, setDeletingCageId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isPairFormOpen, setIsPairFormOpen] = useState(false);
  const [editingPair, setEditingPair] = useState<Pair | null>(null);
  const [deletingPairId, setDeletingPairId] = useState<string | null>(null);

  const { toast } = useToast();
  
   useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const {
    allBirds,
    allCages,
    allPairs,
    allBreedingRecords,
    allPermits,
    allCustomSpecies
  } = useMemo(() => {
    const birds = items.filter((item): item is Bird => item.category === 'Bird');
    const cages = items.filter((item): item is Cage => item.category === 'Cage');
    const pairs = items.filter((item): item is Pair => item.category === 'Pair');
    const breedingRecords = items.filter((item): item is BreedingRecord => item.category === 'BreedingRecord');
    const permits = items.filter((item): item is Permit => item.category === 'Permit');
    const customSpecies = items.filter((item): item is CustomSpecies => item.category === 'CustomSpecies');
    return {
      allBirds: birds,
      allCages: cages,
      allPairs: pairs,
      allBreedingRecords: breedingRecords,
      allPermits: permits,
      allCustomSpecies: customSpecies,
    };
  }, [items]);
  
  const birdToDelete = useMemo(() => 
    deletingBirdId ? allBirds.find(b => b.id === deletingBirdId) : null
  , [deletingBirdId, allBirds]);

  const cageToDelete = useMemo(() =>
    deletingCageId ? allCages.find(c => c.id === deletingCageId) : null
  , [deletingCageId, allCages]);
  
  const pairToDelete = useMemo(() =>
    deletingPairId ? allPairs.find(p => p.id === deletingPairId) : null
  , [deletingPairId, allPairs]);


  const handleAddBirdClick = () => {
    setEditingBird(null);
    setIsBirdFormOpen(true);
  };
  
  const handleAddPairClick = () => {
    setEditingPair(null);
    setIsPairFormOpen(true);
  };
  
  const handleEditPairClick = (pair: Pair) => {
    setEditingPair(pair);
    setIsPairFormOpen(true);
  };


  const handleEditClick = (bird: Bird) => {
    setEditingBird(bird);
    setIsBirdFormOpen(true);
  };

  const handleViewBirdClick = (bird: Bird) => {
    setViewingBird(bird);
  };

  const handleViewBreedingRecord = (record: BreedingRecord) => {
    setViewingBreedingRecord(record);
  }

  const handleEditCageClick = (cage: Cage) => {
    setEditingCage(cage);
    setIsAddCageDialogOpen(true);
  };

  const handleAddCageClick = () => {
    setEditingCage(null);
    setIsAddCageDialogOpen(true);
  };
  
  const handleSaveCage = (data: CageFormValues & { id?: string }) => {
    const trimmedName = data.name.trim();
    if (!trimmedName) {
      toast({ variant: 'destructive', title: 'Invalid Name', description: 'Cage name cannot be empty.' });
      return;
    }

    const isEditing = !!data.id;

    const existingCage = allCages.find(c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== data.id);
    if (existingCage) {
      toast({ variant: 'destructive', title: 'Cage Exists', description: `A cage named "${trimmedName}" already exists.` });
      return;
    }

    if (isEditing) {
      const updatedCage = {
        name: trimmedName,
        cost: data.cost,
      };
      updateItem(data.id!, updatedCage);
      toast({ title: 'Cage Updated', description: `Cage "${trimmedName}" has been updated.` });
    } else {
        const newCage: Cage = {
          id: `c${Date.now()}`,
          name: trimmedName,
          category: 'Cage',
          birdIds: [],
          cost: data.cost,
        };

        const itemsToAdd: (Cage | Transaction)[] = [newCage];

        if (data.addToExpenses && data.cost && data.cost > 0) {
          const newTransaction: Transaction = {
            id: `t${Date.now()}`,
            category: 'Transaction',
            type: 'expense',
            date: format(new Date(), 'yyyy-MM-dd'),
            description: `Purchase of cage: ${newCage.name}`,
            amount: data.cost,
          };
          itemsToAdd.push(newTransaction);
          toast({ title: 'Expense Added', description: `Purchase of cage ${newCage.name} logged.` });
        }
        
        addItems(itemsToAdd);
        toast({ title: 'Cage Created', description: `Cage "${trimmedName}" has been added.` });
    }
  };

  const handleSaveBird = (formData: BirdFormValues & { newCageName?: string, newSpeciesName?: string, newSpeciesIncubation?: number, newSubspeciesName?: string }) => {
    const isEditing = !!editingBird;
    const birdId = editingBird?.id || `b${Date.now()}`;
    
    let itemsToAdd: CollectionItem[] = [];
    let itemsToUpdate: Partial<Bird | Cage | CustomSpecies>[] = [];
    
    let finalCageId = formData.cageId;
    let finalSpecies = formData.species;

    // Handle new Species creation
    if (formData.newSpeciesName && formData.newSpeciesIncubation) {
        const newSpeciesId = `cs${Date.now()}`;
        const newSpecies: CustomSpecies = {
            id: newSpeciesId,
            category: 'CustomSpecies',
            name: formData.newSpeciesName,
            incubationPeriod: formData.newSpeciesIncubation,
            subspecies: [],
        };
        itemsToAdd.push(newSpecies);
        finalSpecies = newSpecies.name;
    }
    
    // Handle new Subspecies creation
    if (formData.newSubspeciesName && formData.species) {
        const parentSpecies = allCustomSpecies.find(s => s.name === formData.species);
        if (parentSpecies) {
            const updatedSubspecies = [...parentSpecies.subspecies, formData.newSubspeciesName];
            updateItem(parentSpecies.id, { subspecies: updatedSubspecies });
        }
    }


    // Handle new cage creation
    if (formData.newCageName && formData.newCageName.trim() !== "") {
        const trimmedCageName = formData.newCageName.trim();
        const existingCage = allCages.find(c => c.name.toLowerCase() === trimmedCageName.toLowerCase());
        if (existingCage) {
            toast({ variant: 'destructive', title: 'Cage Exists', description: `A cage named "${trimmedCageName}" already exists.` });
            return; // Stop execution if cage name is a duplicate
        }
        const newCage: Cage = {
          id: `c${Date.now()}`,
          name: trimmedCageName,
          category: 'Cage',
          birdIds: [birdId],
          cost: 0,
        };
        itemsToAdd.push(newCage);
        finalCageId = newCage.id;
    }

    let birthDateToSave: string | undefined;
    if (formData.birthDateType === 'year' && formData.birthYear) {
      birthDateToSave = format(startOfYear(new Date(formData.birthYear, 1, 1)), 'yyyy-MM-dd');
    } else if (formData.birthDateType === 'date' && formData.birthDate) {
      birthDateToSave = format(formData.birthDate, 'yyyy-MM-dd');
    }


    const birdToSave: Bird = {
      species: finalSpecies!,
      subspecies: formData.subspecies,
      sex: formData.sex,
      ringNumber: formData.ringNumber,
      unbanded: formData.unbanded,
      birthDate: birthDateToSave,
      imageUrl: formData.imageUrl,
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
    
     // --- PAIRING LOGIC ---
    const initialMateId = editingBird?.mateId;
    const newMateId = formData.mateId;

    if (initialMateId !== newMateId) {
      if (initialMateId) {
        const oldMate = allBirds.find(b => b.id === initialMateId);
        if (oldMate) {
          itemsToUpdate.push({ id: oldMate.id, mateId: undefined });
        }
        const pairToDelete = allPairs.find(p =>
          (p.maleId === birdId && p.femaleId === initialMateId) ||
          (p.maleId === initialMateId && p.femaleId === birdId)
        );
        if (pairToDelete) {
          deleteItem(pairToDelete.id);
        }
      }

      if (newMateId) {
        const newMate = allBirds.find(b => b.id === newMateId);
        if (newMate) {
          itemsToUpdate.push({ id: newMate.id, mateId: birdId });

          const newPair: Pair = {
            id: `pair${Date.now()}`,
            category: 'Pair',
            maleId: birdToSave.sex === 'male' ? birdId : newMateId,
            femaleId: birdToSave.sex === 'female' ? birdId : newMateId,
          };
          itemsToAdd.push(newPair);
          toast({ title: "Pair Created", description: `${getBirdIdentifier(birdToSave)} and ${getBirdIdentifier(newMate)} are now a pair.` });
        }
      }
    }

    // --- PARENTING LOGIC ---
    const initialFatherId = editingBird?.fatherId;
    const newFatherId = formData.fatherId;
    if (initialFatherId !== newFatherId) {
      if (initialFatherId) {
        const oldFather = allBirds.find(b => b.id === initialFatherId);
        if (oldFather) {
          itemsToUpdate.push({ id: oldFather.id, offspringIds: oldFather.offspringIds.filter(id => id !== birdId) });
        }
      }
      if (newFatherId) {
        const newFather = allBirds.find(b => b.id === newFatherId);
        if (newFather) {
            itemsToUpdate.push({ id: newFather.id, offspringIds: [...new Set([...newFather.offspringIds, birdId])] });
        }
      }
    }

    const initialMotherId = editingBird?.motherId;
    const newMotherId = formData.motherId;
    if (initialMotherId !== newMotherId) {
      if (initialMotherId) {
        const oldMother = allBirds.find(b => b.id === initialMotherId);
        if (oldMother) {
          itemsToUpdate.push({ id: oldMother.id, offspringIds: oldMother.offspringIds.filter(id => id !== birdId) });
        }
      }
      if (newMotherId) {
        const newMother = allBirds.find(b => b.id === newMotherId);
        if (newMother) {
          itemsToUpdate.push({ id: newMother.id, offspringIds: [...new Set([...newMother.offspringIds, birdId])] });
        }
      }
    }

    // --- OFFSPRING LOGIC (Reverse linking) ---
    const initialOffspringIds = editingBird?.offspringIds || [];
    const newOffspringIds = formData.offspringIds || [];
    
    const addedOffspring = newOffspringIds.filter(id => !initialOffspringIds.includes(id));
    const removedOffspring = initialOffspringIds.filter(id => !newOffspringIds.includes(id));

    addedOffspring.forEach(offspringId => {
        const offspring = allBirds.find(b => b.id === offspringId);
        if (offspring) {
            const update: Partial<Bird> = { id: offspringId };
            if (birdToSave.sex === 'male') update.fatherId = birdId;
            else if (birdToSave.sex === 'female') update.motherId = birdId;
            itemsToUpdate.push(update);
        }
    });

    removedOffspring.forEach(offspringId => {
        const offspring = allBirds.find(b => b.id === offspringId);
        if (offspring) {
            const update: Partial<Bird> = { id: offspringId };
            if (birdToSave.sex === 'male' && offspring.fatherId === birdId) update.fatherId = undefined;
            if (birdToSave.sex === 'female' && offspring.motherId === birdId) update.motherId = undefined;
            itemsToUpdate.push(update);
        }
    });

    if (isEditing) {
        itemsToUpdate.push(birdToSave);
    } else {
        itemsToAdd.push(birdToSave);
    }

    // Un-cage from old cage if necessary
    const oldCage = allCages.find(cage => cage.birdIds.includes(birdId));
    if (oldCage && oldCage.id !== finalCageId) {
        itemsToUpdate.push({ id: oldCage.id, birdIds: oldCage.birdIds.filter(id => id !== birdId) });
    }

    // Add to a selected existing cage
    if (finalCageId && !formData.newCageName) {
        const newCage = allCages.find(cage => cage.id === finalCageId);
        if (newCage && !newCage.birdIds.includes(birdId)) {
            itemsToUpdate.push({ id: newCage.id, birdIds: [...newCage.birdIds, birdId] });
        }
    }

    // Transaction logic
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
        itemsToAdd.push(newTransaction);
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
        itemsToAdd.push(newTransaction);
        toast({ title: "Income Added", description: `Sale of ${getBirdIdentifier(birdToSave)} logged.` });
    }
    
    // Batch updates and additions
    if (itemsToUpdate.length > 0) updateItems(itemsToUpdate as CollectionItem[]);
    if (itemsToAdd.length > 0) addItems(itemsToAdd);
    
     toast({
        title: isEditing ? "Bird Updated" : "Bird Added",
        description: `${getBirdIdentifier(birdToSave)} has been saved.`,
      });
  };

  const handleSavePair = (data: AddPairFormValues & { id?: string }) => {
    const isEditing = !!data.id;
    
    if (isEditing) {
        updateItem(data.id!, {
            maleId: data.maleId,
            femaleId: data.femaleId,
            imageUrl: data.imageUrl,
        });
        toast({ title: "Pair updated", description: "The pair details have been saved." });
    } else {
        const newPair: Pair = {
            id: `p${Date.now()}`,
            category: 'Pair',
            maleId: data.maleId,
            femaleId: data.femaleId,
            imageUrl: data.imageUrl,
        }
        addItem(newPair);
        toast({ title: "Pair created", description: "The new pair has been saved." });
    }
  };


  const handleDeleteBird = () => {
    if (!birdToDelete) return;
    deleteBirdItem(birdToDelete.id);
    toast({ title: "Bird Deleted", description: `${getBirdIdentifier(birdToDelete)} has been removed.` });
    setDeletingBirdId(null);
  }
  
  const handleDeleteCage = () => {
    if (!deletingCageId) return;
    deleteItem(deletingCageId);
    toast({ title: 'Cage Deleted', description: 'The cage has been removed.' });
    setDeletingCageId(null);
  };
  
  const handleDeletePair = () => {
    if (!deletingPairId) return;
    deleteItem(deletingPairId);
    toast({ title: 'Pair Deleted', description: 'The pair has been removed.' });
    setDeletingPairId(null);
  };


  const filteredItems = useMemo(() => items.filter(item => {
    if (item.category !== filterCategory) return false;

    if (filterCategory !== 'Bird' || !search) {
        return true;
    }

    const bird = item as Bird;
    const birdIdentifier = `${bird.species} ${bird.subspecies || ''} ${bird.ringNumber || ''} ${bird.birthDate || ''} ${(bird.visualMutations || []).join(' ')} ${(bird.splitMutations || []).join(' ')}`.toLowerCase();
    return birdIdentifier.includes(search.toLowerCase());
  }), [items, filterCategory, search]);

  const categories = ['Bird', 'Cage', 'Pair'];

  if (loading || !user) {
    return <FullPageLoader />;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      {lightboxImage && <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />}
      {isAddCageDialogOpen && <AddCageDialog
        isOpen={isAddCageDialogOpen}
        onOpenChange={setIsAddCageDialogOpen}
        onSave={(data) => handleSaveCage(data)}
        initialData={editingCage}
       />}
      {isBirdFormOpen && <BirdFormDialog
        isOpen={isBirdFormOpen}
        onOpenChange={setIsBirdFormOpen}
        onSave={handleSaveBird}
        initialData={editingBird}
        allBirds={allBirds}
        allCages={allCages}
        allPermits={allPermits}
      />}
       {isPairFormOpen && <AddPairDialog
        isOpen={isPairFormOpen}
        onOpenChange={setIsPairFormOpen}
        onSave={handleSavePair}
        initialData={editingPair}
        allBirds={allBirds}
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
       <AlertDialog open={!!deletingBirdId} onOpenChange={(open) => !open && setDeletingBirdId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {birdToDelete ? getBirdIdentifier(birdToDelete) : 'this bird'}. 
              This also removes the bird from any cage and deletes any breeding pairs it belongs to. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBird}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
       <AlertDialog open={!!deletingCageId} onOpenChange={(open) => !open && setDeletingCageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the cage '{cageToDelete?.name}'.
              {cageToDelete && cageToDelete.birdIds.length > 0 && ` The ${cageToDelete.birdIds.length} bird(s) in this cage will be uncaged.`}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCage}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deletingPairId} onOpenChange={(open) => !open && setDeletingPairId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this pair. This does not delete the individual birds. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePair}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col gap-4 mb-8">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-center">My Aviary</h1>
        <p className="text-lg text-muted-foreground text-center">Your bird collection at a glance.</p>
        <div className="max-w-4xl mx-auto w-full flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-full flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={filterCategory === 'Bird' ? "Search for birds..." : `Cannot search in ${filterCategory.toLowerCase()}s`}
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
            {filterCategory === 'Bird' && (
              <Button onClick={handleAddBirdClick} disabled={isReadOnly}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Bird
              </Button>
            )}
            {filterCategory === 'Cage' && (
              <Button onClick={handleAddCageClick} disabled={isReadOnly}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Cage
              </Button>
            )}
             {filterCategory === 'Pair' && (
              <Button onClick={handleAddPairClick} disabled={isReadOnly}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Pair
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            if (item.category === 'Bird') {
              return <BirdCard key={item.id} bird={item} allBirds={allBirds} allCages={allCages} allPairs={allPairs} allBreedingRecords={allBreedingRecords} allPermits={allPermits} handleEditClick={handleEditClick} handleDeleteClick={setDeletingBirdId} onBirdClick={handleViewBirdClick} onViewBreedingRecord={handleViewBreedingRecord} onImageClick={setLightboxImage} />
            }
            if (item.category === 'Cage') {
                return <CageCard key={item.id} cage={item} allBirds={allBirds} onBirdClick={handleViewBirdClick} onEditClick={handleEditCageClick} onDeleteClick={setDeletingCageId} onImageClick={setLightboxImage} />
            }
            if (item.category === 'Pair') {
                return <PairCard key={item.id} pair={item} allBirds={allBirds} onBirdClick={handleViewBirdClick} onEditClick={handleEditPairClick} onDeleteClick={setDeletingPairId} onImageClick={setLightboxImage} />
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
