
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CollectionItem, initialItems, Bird, Cage, Pair } from '@/lib/data';
import { FullPageLoader } from '@/components/full-page-loader';

interface ItemsContextType {
  items: CollectionItem[];
  addItem: (item: CollectionItem) => void;
  addItems: (items: CollectionItem[]) => void;
  updateItem: (itemId: string, updates: Partial<CollectionItem>) => void;
  updateItems: (items: Partial<CollectionItem>[]) => void;
  deleteItem: (itemId: string) => void;
  deleteBirdItem: (birdId: string) => void;
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined);

export const ItemsProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('app-items');
      if (savedItems) {
        setItems(JSON.parse(savedItems));
      } else {
        setItems(initialItems); // Load initial data if nothing is in storage
      }
    } catch (error) {
      console.error("Failed to load items from localStorage", error);
      setItems(initialItems);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('app-items', JSON.stringify(items));
      } catch (error) {
        console.error("Failed to save items to localStorage", error);
      }
    }
  }, [items, isLoaded]);

  const addItem = (newItem: CollectionItem) => {
    setItems(prevItems => [newItem, ...prevItems]);
  };
  
  const addItems = (newItems: CollectionItem[]) => {
    setItems(prevItems => [...newItems, ...prevItems]);
  };

  const updateItem = (itemId: string, updates: Partial<CollectionItem>) => {
    setItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    );
  };
  
  const updateItems = (itemsToUpdate: Partial<CollectionItem>[]) => {
     setItems(prevItems => {
        const updateMap = new Map(itemsToUpdate.map(item => [item.id, item]));
        return prevItems.map(item => {
            if (updateMap.has(item.id)) {
                return { ...item, ...updateMap.get(item.id) };
            }
            return item;
        });
     });
  };

  const deleteItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };
  
  const deleteBirdItem = (birdId: string) => {
    setItems(prevItems => {
        const allBirds = prevItems.filter((item): item is Bird => item.category === 'Bird');
        const allCages = prevItems.filter((item): item is Cage => item.category === 'Cage');
        const allPairs = prevItems.filter((item): item is Pair => item.category === 'Pair');
        const birdToDelete = allBirds.find(b => b.id === birdId);

        if (!birdToDelete) return prevItems;

        let itemsToUpdate: Partial<CollectionItem>[] = [];
        let itemIdsToDelete = new Set<string>([birdId]);

        const cage = allCages.find(c => c.birdIds.includes(birdId));
        if (cage) {
            itemsToUpdate.push({ id: cage.id, birdIds: cage.birdIds.filter(id => id !== birdId) });
        }

        if (birdToDelete.mateId) {
            const mate = allBirds.find(b => b.id === birdToDelete.mateId);
            if (mate) itemsToUpdate.push({ id: mate.id, mateId: undefined });
        }

        if (birdToDelete.fatherId) {
            const father = allBirds.find(b => b.id === birdToDelete.fatherId);
            if (father) itemsToUpdate.push({ id: father.id, offspringIds: father.offspringIds.filter(id => id !== birdId) });
        }
        if (birdToDelete.motherId) {
            const mother = allBirds.find(b => b.id === birdToDelete.motherId);
            if (mother) itemsToUpdate.push({ id: mother.id, offspringIds: mother.offspringIds.filter(id => id !== birdId) });
        }

        birdToDelete.offspringIds.forEach(offspringId => {
            const offspring = allBirds.find(b => b.id === offspringId);
            if (offspring) {
                const updates: Partial<Bird> = { id: offspring.id };
                if (offspring.fatherId === birdId) updates.fatherId = undefined;
                if (offspring.motherId === birdId) updates.motherId = undefined;
                itemsToUpdate.push(updates);
            }
        });

        allPairs.forEach(pair => {
            if (pair.maleId === birdId || pair.femaleId === birdId) {
                itemIdsToDelete.add(pair.id);
            }
        });
        
        let newItems = [...prevItems];
        
        if (itemsToUpdate.length > 0) {
            const updateMap = new Map(itemsToUpdate.map(item => [item.id, item]));
            newItems = newItems.map(item => {
                if (updateMap.has(item.id)) {
                    return { ...item, ...updateMap.get(item.id) };
                }
                return item;
            });
        }
        
        newItems = newItems.filter(item => !itemIdsToDelete.has(item.id));

        return newItems;
    });
  };

  if (!isLoaded) {
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
