
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CollectionItem, initialItems, CustomMutation, CustomSpecies } from '@/lib/data';

interface ItemsContextType {
  items: CollectionItem[];
  addItem: (item: CollectionItem) => void;
  addItems: (items: CollectionItem[]) => void;
  updateItem: (itemId: string, updates: Partial<CollectionItem>) => void;
  updateItems: (items: CollectionItem[]) => void;
  deleteItem: (itemId: string) => void;
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
  
  const updateItems = (updatedItems: CollectionItem[]) => {
     setItems(prevItems => {
        const updatedIds = new Set(updatedItems.map(u => u.id));
        const untouchedItems = prevItems.filter(p => !updatedIds.has(p.id));
        return [...updatedItems, ...untouchedItems];
     });
  };

  const deleteItem = (itemId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== itemId));
  };
  
  if (!isLoaded) {
    return null;
  }

  return (
    <ItemsContext.Provider value={{ items, addItem, addItems, updateItem, updateItems, deleteItem }}>
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

export type { CustomSpecies, CustomMutation };
