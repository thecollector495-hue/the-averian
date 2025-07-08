'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Send, Bot, User } from 'lucide-react';
import { aviaryAssistant } from '@/ai/flows/assistant-flow';
import { useItems } from '@/context/ItemsContext';
import { Bird, NoteReminder, Cage, getBirdIdentifier, CustomMutation, CollectionItem, CustomSpecies } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'assistant-init',
      role: 'assistant',
      text: "Hello! How can I help you manage your aviary today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { items, addItems, updateItems } = useItems();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputResize = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    handleInputResize();
  }, [input, handleInputResize]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newUserMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: input };
    setMessages(prev => [...prev, newUserMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    try {
      const context = JSON.stringify(items.filter(i => ['Bird', 'NoteReminder', 'Cage', 'CustomMutation', 'CustomSpecies'].includes(i.category)));
      const assistantResponse = await aviaryAssistant({ query: currentInput, context });
      
      const allCages = items.filter((item): item is Cage => item.category === 'Cage');
      
      if (assistantResponse.actions && assistantResponse.actions.length > 0) {
        let itemsToAdd: CollectionItem[] = [];
        let itemsToUpdate: Partial<CollectionItem>[] = [];

        for (const action of assistantResponse.actions) {
          if (!action.data && action.action !== 'answer') continue;

          switch(action.action) {
            case 'addBird': {
              const birdData = action.data as any;
              const newBirdId = `b${Date.now()}${Math.random()}`;
              const newBird: Bird = {
                species: "",
                sex: "unsexed",
                visualMutations: [],
                splitMutations: [],
                offspringIds: [],
                status: "Available",
                ...birdData,
                id: newBirdId,
                category: 'Bird',
              };
              
              itemsToAdd.push(newBird);
              
              if (birdData.cageName) {
                const existingCage = allCages.find(c => c.name.toLowerCase() === birdData.cageName.toLowerCase());
                if (existingCage) {
                    itemsToUpdate.push({ id: existingCage.id, birdIds: [...existingCage.birdIds, newBirdId] });
                } else {
                    const newCage: Cage = {
                        id: `c${Date.now()}${Math.random()}`,
                        name: birdData.cageName,
                        category: 'Cage',
                        birdIds: [newBirdId]
                    };
                    itemsToAdd.push(newCage);
                }
              }
              
              toast({ title: "AI Action: Bird Added", description: `Successfully added ${getBirdIdentifier(newBird)}.` });
              break;
            }
            case 'updateBird': {
              const updateData = action.data as any;
              itemsToUpdate.push({ id: updateData.id, ...updateData.updates });
              toast({ title: "AI Action: Bird Updated", description: `Successfully updated bird ID ${updateData.id}.` });
              break;
            }
            case 'addNote': {
              const noteData = action.data as any;
              const newNote: NoteReminder = {
                 title: "",
                 isReminder: false,
                 isRecurring: false,
                 recurrencePattern: 'none',
                 associatedBirdIds: [],
                 subTasks: [],
                 completed: false,
                 ...noteData,
                 id: `nr${Date.now()}`,
                 category: 'NoteReminder',
                 reminderDate: noteData.reminderDate ? format(new Date(noteData.reminderDate), 'yyyy-MM-dd') : undefined,
              };
              itemsToAdd.push(newNote);
              toast({ title: "AI Action: Note Added", description: `Successfully added note: "${newNote.title}"` });
              break;
            }
            case 'addCage': {
              const cageData = action.data as any;
              if (cageData.names && cageData.names.length > 0) {
                const newCages: Cage[] = cageData.names.map((name: string) => ({
                  id: `c${Date.now()}${Math.random()}`,
                  category: 'Cage',
                  name: name,
                  birdIds: [],
                }));
                itemsToAdd.push(...newCages);
                toast({ title: "AI Action: Cages Added", description: `Successfully added ${newCages.length} cage(s).` });
              }
              break;
            }
            case 'addMutation': {
              const mutationData = action.data as any;
              if (mutationData.names && mutationData.names.length > 0) {
                  const newMutations: CustomMutation[] = mutationData.names.map((name: string) => ({
                      id: `cm_${Date.now()}${Math.random()}`,
                      category: 'CustomMutation',
                      name: name,
                  }));
                  itemsToAdd.push(...newMutations);
                  toast({ title: "AI Action: Mutations Added", description: `Successfully added ${newMutations.length} mutation(s).` });
              }
              break;
            }
          }
        }
        if (itemsToAdd.length > 0) addItems(itemsToAdd);
        if (itemsToUpdate.length > 0) updateItems(itemsToUpdate as CollectionItem[]);
      }

      const newAssistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', text: assistantResponse.response };
      setMessages(prev => [...prev, newAssistantMessage]);
      
    } catch (error) {
      console.error('AI assistant failed:', error);
      toast({
        variant: 'destructive',
        title: 'Assistant Failed',
        description: 'The AI assistant could not complete the request. Please try again.',
      });
       const errorMessage: Message = { id: `assistant-err-${Date.now()}`, role: 'assistant', text: "Sorry, I encountered an error. Please try again." };
       setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh_-_4rem)]">
        <div className="text-center p-4 border-b">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2"><Sparkles className="text-primary"/> AI Aviary Assistant</h1>
            <p className="text-muted-foreground text-sm mt-1">
            Use AI for multi-tasking, for example: add cage A1 to A100, or for quick status updates, actions, etc.
            </p>
        </div>
        
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef as any}>
            <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
                <div key={message.id} className={cn("flex items-start gap-3", message.role === 'user' && "justify-end")}>
                     {message.role === 'assistant' && (
                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                            <Bot className="h-5 w-5"/>
                        </div>
                     )}
                     <div className={cn("rounded-lg px-4 py-3 max-w-[85%] shadow-sm", message.role === 'user' ? "bg-muted" : "bg-card")}>
                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                     </div>
                     {message.role === 'user' && (
                        <div className="bg-muted rounded-full p-2">
                           <User className="h-5 w-5"/>
                        </div>
                     )}
                </div>
            ))}
             {isLoading && (
                <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <Bot className="h-5 w-5"/>
                    </div>
                    <div className="rounded-lg px-4 py-2 bg-card flex items-center shadow-sm">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
            )}
            </div>
        </ScrollArea>

        <div className="border-t p-4 bg-background">
            <div className="max-w-3xl mx-auto flex items-end gap-2">
                <Textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder="e.g., Add a male cockatiel to a new cage named 'Flight 1'"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!isLoading) handleSend();
                        }
                    }}
                    disabled={isLoading}
                    className="flex-1 resize-none max-h-48 text-base"
                />
                <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="lg">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    <span className="sr-only">Send</span>
                </Button>
            </div>
        </div>
    </div>
  );
}
