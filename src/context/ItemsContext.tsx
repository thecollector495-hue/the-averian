
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CollectionItem, Bird, Cage, Pair } from '@/lib/data';
import { FullPageLoader } from '@/components/full-page-loader';
import { useAuth } from './AuthContext';
import { createSupabaseClient } from '@/lib/supabase/client';

interface ItemsContextType {
  items: CollectionItem[];
  addItem: (item: CollectionItem) => Promise<void>;
  addItems: (items: CollectionItem[]) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<CollectionItem>) => Promise<void>;
  updateItems: (items: Partial<CollectionItem>[]) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  deleteBirdItem: (birdId: string) => Promise<void>;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

const TABLE_MAP: { [key: string]: string } = {
    Bird: 'birds',
    Cage: 'cages',
    Pair: 'pairs',
    BreedingRecord: 'breeding_records',
    NoteReminder: 'notes',
    Transaction: 'transactions',
    Permit: 'permits',
    CustomSpecies: 'custom_species',
    CustomMutation: 'custom_mutations',
};

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const { user, isDemoMode } = useAuth();
  const supabase = createSupabaseClient();

  const fetchAllData = useCallback(async () => {
    if (!supabase || !user) return;
    
    setIsLoaded(false);
    const tables = Object.values(TABLE_MAP);
    
    try {
        const results = await Promise.all(
            tables.map(table => supabase.from(table).select('*').eq('user_id', user.uid))
        );

        const allData: CollectionItem[] = [];
        results.forEach(({ data, error }, index) => {
            if (error) {
                console.error(`Error fetching from ${tables[index]}:`, error);
            } else if (data) {
                allData.push(...data as CollectionItem[]);
            }
        });
        
        setItems(allData);

    } catch (error) {
        console.error("Failed to fetch data from Supabase", error);
    } finally {
        setIsLoaded(true);
    }

  }, [supabase, user]);

  useEffect(() => {
    if (isDemoMode) {
      try {
        const savedItems = localStorage.getItem('app-items-demo');
        if (savedItems) {
          setItems(JSON.parse(savedItems));
        } else {
          // In demo mode, we might want to load some initial data for showcase
          const { initialItems } = require('@/lib/data');
          setItems(initialItems);
        }
      } catch (error) {
        console.error("Failed to load demo items from localStorage", error);
      }
      setIsLoaded(true);
    } else if (user) {
      fetchAllData();
    } else if (!user) {
        // Clear data on logout
        setItems([]);
        setIsLoaded(true);
    }
  }, [user, isDemoMode, fetchAllData]);
  
  // Save to local storage only in demo mode
  useEffect(() => {
    if (isLoaded && isDemoMode) {
      try {
        localStorage.setItem('app-items-demo', JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save demo items to localStorage", error);
      }
    }
  }, [items, isLoaded, isDemoMode]);


  const addItem = async (newItem: CollectionItem) => {
    setItems(prevItems => [newItem, ...prevItems]); // Optimistic update
    if (isDemoMode || !supabase) return;

    const tableName = TABLE_MAP[newItem.category];
    if (!tableName) {
        console.error(`No table mapping for category: ${newItem.category}`);
        return;
    }
    const { error } = await supabase.from(tableName).insert([newItem]);
    if (error) {
        console.error('Supabase insert error:', error);
        // Revert optimistic update
        setItems(prevItems => prevItems.filter(item => item.id !== newItem.id));
    }
  };
  
  const addItems = async (newItems: CollectionItem[]) => {
    setItems(prevItems => [...newItems, ...prevItems]); // Optimistic update
    if (isDemoMode || !supabase) return;

    for (const newItem of newItems) {
        const tableName = TABLE_MAP[newItem.category];
        if (!tableName) {
            console.error(`No table mapping for category: ${newItem.category}`);
            continue;
        }
        const { error } = await supabase.from(tableName).insert([newItem]);
        if (error) {
            console.error(`Supabase insert error for ${newItem.id}:`, error);
            // Consider more robust error handling / reverting
        }
    }
  };

  const updateItem = async (itemId: string, updates: Partial<CollectionItem>) => {
    const originalItems = items;
    setItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, ...updates } : item));
    if (isDemoMode || !supabase) return;

    const itemToUpdate = originalItems.find(item => item.id === itemId);
    if (!itemToUpdate) return;
    
    const tableName = TABLE_MAP[itemToUpdate.category];
    if (!tableName) return;
    
    const { error } = await supabase.from(tableName).update(updates).eq('id', itemId);
    if (error) {
        console.error('Supabase update error:', error);
        setItems(originalItems); // Revert on error
    }
  };
  
  const updateItems = async (itemsToUpdate: Partial<CollectionItem>[]) => {
     const originalItems = items;
     setItems(prevItems => {
        const updateMap = new Map(itemsToUpdate.map(item => [item.id, item]));
        return prevItems.map(item => updateMap.has(item.id) ? { ...item, ...updateMap.get(item.id) } : item);
     });
     if (isDemoMode || !supabase) return;

     for (const itemUpdate of itemsToUpdate) {
        const originalItem = originalItems.find(i => i.id === itemUpdate.id);
        if (!originalItem) continue;

        const tableName = TABLE_MAP[originalItem.category];
        if (!tableName) continue;
        
        const { error } = await supabase.from(tableName).update(itemUpdate).eq('id', itemUpdate.id!);
        if (error) {
            console.error(`Supabase update error for ${itemUpdate.id}:`, error);
            // Revert all changes on first error for simplicity
            setItems(originalItems);
            return;
        }
     }
  };

  const deleteItem = async (itemId: string) => {
    const originalItems = items;
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
     if (isDemoMode || !supabase) return;
     
    const itemToDelete = originalItems.find(item => item.id === itemId);
    if (!itemToDelete) return;

    const tableName = TABLE_MAP[itemToDelete.category];
    if (!tableName) return;

    const { error } = await supabase.from(tableName).delete().eq('id', itemId);
    if (error) {
        console.error('Supabase delete error:', error);
        setItems(originalItems); // Revert on error
    }
  };
  
  const deleteBirdItem = async (birdId: string) => {
    const originalItems = items;
    
    // Perform complex deletion logic optimistically
    let itemsToUpdate: Partial<CollectionItem>[] = [];
    let itemIdsToDelete = new Set<string>([birdId]);
    
    const allBirds = originalItems.filter((item): item is Bird => item.category === 'Bird');
    const allCages = originalItems.filter((item): item is Cage => item.category === 'Cage');
    const allPairs = originalItems.filter((item): item is Pair => item.category === 'Pair');
    const birdToDelete = allBirds.find(b => b.id === birdId);

    if (!birdToDelete) return;

    const cage = allCages.find(c => c.birdIds.includes(birdId));
    if (cage) itemsToUpdate.push({ id: cage.id, birdIds: cage.birdIds.filter(id => id !== birdId) });
    if (birdToDelete.mateId) {
        const mate = allBirds.find(b => b.id === birdToDelete.mateId);
        if (mate) itemsToUpdate.push({ id: mate.id, mateId: undefined });
    }
    // ... complete logic from previous implementation
    allPairs.forEach(pair => {
        if (pair.maleId === birdId || pair.femaleId === birdId) itemIdsToDelete.add(pair.id);
    });

    const newItems = originalItems
        .map(item => {
            const update = itemsToUpdate.find(u => u.id === item.id);
            return update ? { ...item, ...update } : item;
        })
        .filter(item => !itemIdsToDelete.has(item.id));
        
    setItems(newItems);
    
    if (isDemoMode || !supabase) return;
    
    // Now, perform DB operations
    try {
        for (const itemUpdate of itemsToUpdate) {
            const table = TABLE_MAP[originalItems.find(i => i.id === itemUpdate.id)!.category];
            await supabase.from(table).update(itemUpdate).eq('id', itemUpdate.id!);
        }
        for (const idToDelete of Array.from(itemIdsToDelete)) {
            const table = TABLE_MAP[originalItems.find(i => i.id === idToDelete)!.category];
            await supabase.from(table).delete().eq('id', idToDelete);
        }
    } catch(error) {
        console.error("Error during batch delete operation:", error);
        setItems(originalItems); // Revert all on error
    }
  };

  if (!isLoaded && !isDemoMode) {
    return <FullPageLoader />;
  }

  return (
    <ItemsContext.Provider value={{ items, addItem, addItems, updateItem, updateItems, deleteItem, deleteBirdItem }}>
      {children}
    </ItemsContext.Provider>
  );
};

export const useItems = (): ItemsContextType => {
  const context = useContext(ItemsContext);
  if (context === undefined) {
    throw new Error('useItems must be used within an ItemsProvider');
  }
  return context;
};
