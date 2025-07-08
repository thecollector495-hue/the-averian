
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Send, Bot, User, Mic, Volume2, VolumeX } from 'lucide-react';
import { aviaryAssistant } from '@/ai/flows/assistant-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { useItems } from '@/context/ItemsContext';
import { Bird, NoteReminder, Cage, getBirdIdentifier, CustomMutation } from '@/lib/data';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from './ui/textarea';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export function AIAssistantDialog({ isOpen, onOpenChange }: { isOpen: boolean; onOpenChange: (open: boolean) => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const { toast } = useToast();
  const { items, addItem, addItems, updateItem } = useItems();
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedTtsPref = localStorage.getItem('ai-assistant-tts-enabled');
    if (savedTtsPref !== null) {
      setIsTtsEnabled(JSON.parse(savedTtsPref));
    }
  }, []);

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
    if (!isOpen) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: "destructive", title: "Unsupported", description: "Your browser does not support speech recognition." });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after a pause
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
       if (event.error === 'no-speech') {
        toast({ variant: "destructive", title: "No speech detected", description: "Your microphone didn't pick up any sound." });
      } else if (event.error === 'not-allowed') {
        toast({ variant: "destructive", title: "Permission Denied", description: "Please allow microphone access in your browser settings to use voice commands." });
      } else {
        toast({ variant: "destructive", title: "Voice Error", description: `An error occurred: ${event.error}` });
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognitionRef.current?.stop();
    };
  }, [isOpen, toast]);

  useEffect(() => {
    if (audioSrc && audioRef.current && isTtsEnabled) {
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
  }, [audioSrc, isTtsEnabled]);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleMicClick = () => {
    if (!recognitionRef.current) {
        toast({ variant: 'destructive', title: 'Unsupported', description: 'Your browser does not support speech recognition.' });
        return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      try {
        setInput('');
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Could not start recognition", e);
        toast({ variant: "destructive", title: "Microphone Error", description: "Could not start voice recognition. Please check permissions." });
      }
    }
  };

  const toggleTts = () => {
    const newState = !isTtsEnabled;
    setIsTtsEnabled(newState);
    localStorage.setItem('ai-assistant-tts-enabled', JSON.stringify(newState));
  };


  const handleSend = async () => {
    if (!input.trim()) return;

    const newUserMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: input };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = JSON.stringify(items.filter(i => i.category === 'Bird' || i.category === 'NoteReminder' || i.category === 'Cage'));
      const assistantResponse = await aviaryAssistant({ query: input, context });
      
      const allCages = items.filter((item): item is Cage => item.category === 'Cage');
      
      if (assistantResponse.actions && assistantResponse.actions.length > 0) {
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

              const itemsToAdd: (Bird | Cage)[] = [newBird];
              
              if (birdData.cageName) {
                const existingCage = allCages.find(c => c.name.toLowerCase() === birdData.cageName.toLowerCase());
                if (existingCage) {
                    updateItem(existingCage.id, { birdIds: [...existingCage.birdIds, newBirdId] });
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
              
              addItems(itemsToAdd);
              toast({ title: "AI Action: Bird Added", description: `Successfully added ${getBirdIdentifier(newBird)}.` });
              break;
            }
            case 'updateBird': {
              const updateData = action.data as any;
              updateItem(updateData.id, updateData.updates);
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
              addItem(newNote);
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
                addItems(newCages);
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
                  addItems(newMutations);
                  toast({ title: "AI Action: Mutations Added", description: `Successfully added ${newMutations.length} mutation(s).` });
              }
              break;
            }
          }
        }
      }

      const newAssistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', text: assistantResponse.response };
      setMessages(prev => [...prev, newAssistantMessage]);
      
      if (isTtsEnabled) {
          const ttsResponse = await textToSpeech(assistantResponse.response);
          setAudioSrc(ttsResponse.audio);
      }

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
  
  const resetDialog = () => {
    setMessages([]);
    setInput('');
    setIsLoading(false);
    setAudioSrc(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) resetDialog();
        onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-lg flex flex-col h-[70vh] max-h-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" /> AI Aviary Assistant
          </DialogTitle>
          <DialogDescription>
            Ask me to add birds, create notes, or update records.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 -mr-4" ref={scrollAreaRef as any}>
            <div className="space-y-4">
            {messages.map((message) => (
                <div key={message.id} className={cn("flex items-start gap-3", message.role === 'user' && "justify-end")}>
                     {message.role === 'assistant' && (
                        <div className="bg-primary text-primary-foreground rounded-full p-2">
                            <Bot className="h-5 w-5"/>
                        </div>
                     )}
                     <div className={cn("rounded-lg px-4 py-2 max-w-[80%]", message.role === 'user' ? "bg-muted" : "bg-secondary")}>
                        <p className="text-sm">{message.text}</p>
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
                    <div className="rounded-lg px-4 py-2 bg-secondary flex items-center">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
            )}
            </div>
        </ScrollArea>

        <div className="mt-auto pt-4 flex items-end gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTts} disabled={isLoading} title={isTtsEnabled ? 'Disable voice response' : 'Enable voice response'}>
                {isTtsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5 text-muted-foreground" />}
                <span className="sr-only">Toggle voice response</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleMicClick} disabled={isLoading} title="Use Microphone">
                <Mic className={cn("h-5 w-5", isRecording && "text-destructive animate-pulse")} />
                <span className="sr-only">Use Microphone</span>
            </Button>
            <Textarea
                ref={textareaRef}
                rows={1}
                placeholder="e.g., Add a male cockatiel"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isLoading && !isRecording) handleSend();
                    }
                }}
                disabled={isLoading}
                className="flex-1 resize-none max-h-32"
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="sr-only">Send</span>
            </Button>
        </div>
         {audioSrc && <audio ref={audioRef} src={audioSrc} hidden />}
      </DialogContent>
    </Dialog>
  );
}
