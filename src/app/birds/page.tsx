
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Send, Bot, User, RefreshCw, AlertTriangle, Atom } from 'lucide-react';
import { aviaryAssistant } from '@/ai/flows/assistant-flow';
import { useItems } from '@/context/ItemsContext';
import { Bird, NoteReminder, Cage, getBirdIdentifier, CollectionItem, Transaction, Pair, CustomSpecies, CustomMutation, inheritanceTypes } from '@/lib/data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useCurrency } from '@/context/CurrencyContext';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthContext';
import { GeneticsCalculatorDialog } from '@/components/genetics-calculator-dialog';

const AddBreedingRecordDialog = dynamic(() => import('@/components/add-breeding-record-dialog').then(mod => mod.AddBreedingRecordDialog), { ssr: false });

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
  onRetry?: () => void;
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
  const { items, addItems, updateItem, updateItems, deleteItem, deleteBirdItem } = useItems();
  const { isReadOnly } = useAuth();
  const { formatCurrency } = useCurrency();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pendingActions, setPendingActions] = useState<any[] | null>(null);
  const [selectedActionIndices, setSelectedActionIndices] = useState<Set<number>>(new Set());
  const [isGeneticsDialogOpen, setIsGeneticsDialogOpen] = useState(false);

  const customMutations = items.filter((item): item is CustomMutation => item.category === 'CustomMutation');
  
  useEffect(() => {
    if (pendingActions) {
      setSelectedActionIndices(new Set(pendingActions.map((_, i) => i)));
    }
  }, [pendingActions]);

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

  const handleSend = async (options: { query: string; isRetry?: boolean }) => {
    const { query, isRetry } = options;
    if (!query.trim()) return;

    setIsLoading(true);
    setMessages(prev => prev.filter(m => !m.isError));

    if (!isRetry) {
      const newUserMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: query };
      setMessages(prev => [...prev, newUserMessage]);
      setInput('');
    }
    
    const context = JSON.stringify(items.filter(i => ['Bird', 'NoteReminder', 'Cage', 'Transaction', 'Pair', 'CustomSpecies', 'CustomMutation'].includes(i.category)));
    const assistantResponse = await aviaryAssistant({ query: query, context });
    
    setIsLoading(false);

    if (assistantResponse.error || !assistantResponse.response) {
        const errorText = assistantResponse.error || "Received an empty response from the AI model.";
        console.error('AI assistant failed:', errorText);

        const errorMessageText = assistantResponse.response || (errorText.includes('503')
            ? "The AI model is currently overloaded. Please try again in a moment."
            : "Couldn't connect right now. Please try again.");
        
        const newErrorMessage: Message = {
            id: `assistant-err-${Date.now()}`,
            role: 'assistant',
            text: errorMessageText,
            isError: true,
            onRetry: () => handleSend({ query: query, isRetry: true }),
        };
        setMessages(prev => [...prev, newErrorMessage]);
        toast({
            variant: "destructive",
            title: "AI Request Failed",
            description: errorText,
        });
    } else {
        const newAssistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', text: assistantResponse.response };
        setMessages(prev => [...prev, newAssistantMessage]);

        const hasDataActions = assistantResponse.actions && assistantResponse.actions.some(a => a.action !== 'answer');

        if (hasDataActions) {
            setPendingActions(assistantResponse.actions);
        }
    }
  };
  
  const handleConfirmActions = () => {
    if (!pendingActions) return;

    const actionsToExecute = pendingActions.filter((_, index) => selectedActionIndices.has(index));

    const allCages = items.filter((item): item is Cage => item.category === 'Cage');
    let itemsToAdd: CollectionItem[] = [];
    let itemsToUpdate: Partial<CollectionItem>[] = [];
    let idsToDelete: { type: CollectionItem['category'], id: string }[] = [];
    let summary: string[] = [];

    for (const action of actionsToExecute) {
      if (!action.data && !['answer'].includes(action.action) && !action.action.startsWith('delete')) continue;

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
                const newCage: Cage = { id: `c${Date.now()}${Math.random()}`, name: birdData.cageName, category: 'Cage', birdIds: [newBirdId] };
                itemsToAdd.push(newCage);
            }
          }
          summary.push(`Added bird: ${getBirdIdentifier(newBird)}`);
          break;
        }
        case 'updateBird': {
            const updateData = action.data as any;
            const updatesPayload = { ...updateData.updates };

            if (updatesPayload.status === 'Sold' && updatesPayload.salePrice) {
                updatesPayload.saleDetails = {
                    date: format(new Date(updatesPayload.saleDate || new Date()), 'yyyy-MM-dd'),
                    price: updatesPayload.salePrice,
                    buyer: updatesPayload.buyerInfo || 'Unknown',
                };
                delete updatesPayload.salePrice;
                delete updatesPayload.saleDate;
                delete updatesPayload.buyerInfo;
            }
            itemsToUpdate.push({ id: updateData.id, ...updatesPayload });
            summary.push(`Updated bird ID ${updateData.id}`);
            break;
        }
        case 'addNote': {
          const noteData = action.data as any;
          const newNote: NoteReminder = {
             title: "", isReminder: false, isRecurring: false, recurrencePattern: 'none', associatedBirdIds: [], subTasks: [], completed: false,
             ...noteData, id: `nr${Date.now()}`, category: 'NoteReminder',
             reminderDate: noteData.reminderDate ? format(new Date(noteData.reminderDate), 'yyyy-MM-dd') : undefined,
          };
          itemsToAdd.push(newNote);
          summary.push(`Added note: "${newNote.title}"`);
          break;
        }
        case 'updateNote':
        case 'updateCage': {
            const updateData = action.data as any;
            updateItem(updateData.id, updateData.updates);
            summary.push(`Updated ${action.action.includes('Note') ? 'note' : 'cage'}`);
            break;
        }
        case 'addCage': {
          const cageData = action.data as any;
          if (cageData.names && cageData.names.length > 0) {
            const newCages: Cage[] = cageData.names.map((name: string) => ({ id: `c${Date.now()}${Math.random()}`, category: 'Cage', name: name, birdIds: [], cost: cageData.cost }));
            itemsToAdd.push(...newCages);
            if (cageData.cost && cageData.cost > 0) {
              const newTransactions: Transaction[] = newCages.map(cage => ({ id: `t${Date.now()}${Math.random()}`, category: 'Transaction', type: 'expense', date: format(new Date(), 'yyyy-MM-dd'), description: `Purchase of cage: ${cage.name}`, amount: cage.cost! }));
              itemsToAdd.push(...newTransactions);
            }
            summary.push(`Added ${newCages.length} cage(s)`);
          }
          break;
        }
        case 'addTransaction': {
            const transData = action.data as any;
            const newTransaction: Transaction = {
                id: `t${Date.now()}${Math.random()}`,
                category: 'Transaction',
                ...transData,
                date: format(new Date(transData.date || new Date()), 'yyyy-MM-dd'),
            };
            itemsToAdd.push(newTransaction);
            summary.push(`Added ${newTransaction.type} transaction`);
            break;
        }
        case 'addSpecies': {
            const speciesData = action.data as any;
            if (!speciesData.name || !speciesData.incubationPeriod) {
                toast({ variant: 'destructive', title: 'Action Failed', description: 'Cannot add species without a name and incubation period.'});
                continue;
            }
            const newSpecies: CustomSpecies = {
                id: `cs${Date.now()}`,
                category: 'CustomSpecies',
                name: speciesData.name,
                incubationPeriod: speciesData.incubationPeriod,
                subspecies: speciesData.subspecies || [],
            };
            itemsToAdd.push(newSpecies);
            summary.push(`Added species: ${newSpecies.name}`);
            break;
        }
        case 'deleteBird': (action.data.ids || []).forEach((id: string) => idsToDelete.push({ type: 'Bird', id })); break;
        case 'deleteCage': (action.data.ids || []).forEach((id: string) => idsToDelete.push({ type: 'Cage', id })); break;
        case 'deleteNote': (action.data.ids || []).forEach((id: string) => idsToDelete.push({ type: 'NoteReminder', id })); break;
        case 'deleteTransaction': (action.data.ids || []).forEach((id: string) => idsToDelete.push({ type: 'Transaction', id })); break;
        case 'deleteSpecies': (action.data.ids || []).forEach((id: string) => idsToDelete.push({ type: 'CustomSpecies', id })); break;
      }
    }
    if (itemsToAdd.length > 0) addItems(itemsToAdd);
    if (itemsToUpdate.length > 0) updateItems(itemsToUpdate as CollectionItem[]);
    if (idsToDelete.length > 0) {
        summary.push(`Deleted ${idsToDelete.length} item(s)`);
        idsToDelete.forEach(item => {
            if (item.type === 'Bird') deleteBirdItem(item.id);
            else deleteItem(item.id);
        });
    }

    toast({ title: 'AI Actions Completed', description: summary.length > 0 ? summary.join(', ') + '.' : "No actions were taken." });
    setPendingActions(null);
  };

  const generateActionSummary = (actions: any[] | null): string[] => {
    if (!actions) return [];
    return actions.filter(a => a.action !== 'answer').map(action => {
      const { action: type, data } = action;
      switch (type) {
        case 'addBird': return `Add Bird: ${data?.species || 'Unknown'}`;
        case 'updateBird': return `Update Bird (ID: ${data?.id || 'N/A'})`;
        case 'addNote': return `Add Note: "${data?.title || 'Untitled'}"`;
        case 'updateNote': return `Update Note (ID: ${data?.id || 'N/A'})`;
        case 'addCage': return `Add ${data?.names?.length || 1} cage(s): ${data?.names?.join(', ') || data?.name || ''}`;
        case 'updateCage': return `Update Cage (ID: ${data?.id || 'N/A'})`;
        case 'addTransaction': return `Add ${data?.type || ''} transaction for ${formatCurrency(data?.amount)}`;
        case 'addSpecies': {
            if (!data?.name && !data?.incubationPeriod) return "Add Species: Incomplete data from AI";
            if (!data?.name) return `Add Species: missing name (${data.incubationPeriod} days)`;
            if (!data?.incubationPeriod) return `Add Species: ${data.name} (missing incubation period)`;
            return `Add Species: ${data.name} (${data.incubationPeriod} days)`;
        }
        case 'deleteBird': return `Delete ${data?.ids?.length || 0} bird(s)`;
        case 'deleteCage': return `Delete ${data?.ids?.length || 0} cage(s)`;
        case 'deleteNote': return `Delete ${data?.ids?.length || 0} note(s)`;
        case 'deleteTransaction': return `Delete ${data?.ids?.length || 0} transaction(s)`;
        case 'deleteSpecies': return `Delete ${data?.ids?.length || 0} species`;
        default: return `Perform action: ${type}`;
      }
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh_-_4rem)]">
        {isGeneticsDialogOpen && <GeneticsCalculatorDialog
            isOpen={isGeneticsDialogOpen}
            onOpenChange={setIsGeneticsDialogOpen}
            onCalculate={(query) => handleSend({ query })}
            customMutations={customMutations}
        />}
        {pendingActions && (
            <AlertDialog open={!!pendingActions} onOpenChange={(open) => !open && setPendingActions(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm AI Actions</AlertDialogTitle>
                        <AlertDialogDescription>
                          The assistant proposes the following actions. Select the ones you want to perform.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="mt-2 text-sm bg-muted p-3 rounded-md max-h-60 overflow-y-auto space-y-4">
                        {generateActionSummary(pendingActions).map((summary, index) => (
                            <div key={index} className="flex items-start space-x-3">
                                <Checkbox
                                    id={`action-${index}`}
                                    checked={selectedActionIndices.has(index)}
                                    onCheckedChange={(checked) => {
                                        setSelectedActionIndices(current => {
                                            const newSet = new Set(current);
                                            if (checked) {
                                                newSet.add(index);
                                            } else {
                                                newSet.delete(index);
                                            }
                                            return newSet;
                                        });
                                    }}
                                />
                                <label
                                    htmlFor={`action-${index}`}
                                    className="font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    {summary}
                                </label>
                            </div>
                        ))}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingActions(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmActions} disabled={selectedActionIndices.size === 0}>
                            Confirm ({selectedActionIndices.size})
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
        <div className="shrink-0 text-center p-4 border-b">
            <h1 className="text-2xl font-bold flex items-center justify-center gap-2"><Sparkles className="text-primary"/> AI Aviary Assistant</h1>
        </div>
        
        <div className="shrink-0 p-4 border-b">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="experimental-notice" className="border-b-0 rounded-lg bg-muted overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <span className="font-semibold text-base">Experimental Feature</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-0 pb-4 text-sm text-muted-foreground px-4">
                  Please double-check the AI's proposed actions before confirming, as it can make mistakes. This is an experimental feature designed to simplify tasks, not replace your expertise.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
        </div>
        
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((message) => (
                <div key={message.id} className={cn("flex items-start gap-3", message.role === 'user' && "justify-end")}>
                     {message.role === 'assistant' && (
                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                            <Bot className="h-5 w-5"/>
                        </div>
                     )}
                     <div className={cn("rounded-lg px-4 py-3 max-w-[85%] shadow-sm", message.role === 'user' ? "bg-muted" : "bg-card", message.isError && "bg-destructive/10 border border-destructive/20")}>
                        {message.isError ? (
                          <div className="flex flex-col items-start gap-2">
                            <p className="text-sm whitespace-pre-wrap text-destructive">{message.text}</p>
                            {message.onRetry && (
                              <Button variant="outline" size="sm" onClick={message.onRetry}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Retry
                              </Button>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        )}
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

        <div className="shrink-0 border-t p-4 bg-background">
            <div className="max-w-3xl mx-auto flex items-end gap-2">
                <Button variant="outline" size="icon" className="h-12 w-12 flex-shrink-0" onClick={() => setIsGeneticsDialogOpen(true)} disabled={isLoading || isReadOnly}>
                    <Atom className="h-6 w-6" />
                    <span className="sr-only">Genetics Calculator</span>
                </Button>
                <Textarea
                    ref={textareaRef}
                    rows={1}
                    placeholder={isReadOnly ? "Subscribe to use the AI Assistant" : "e.g., Add a male cockatiel to a new cage named 'Flight 1'"}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!isLoading) handleSend({ query: input });
                        }
                    }}
                    disabled={isLoading || isReadOnly}
                    className="flex-1 resize-none max-h-48 text-base"
                />
                <Button onClick={() => handleSend({ query: input })} disabled={isLoading || !input.trim() || isReadOnly} size="lg">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    <span className="sr-only">Send</span>
                </Button>
            </div>
        </div>
    </div>
  );
}

    