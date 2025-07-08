
'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Send, Bot, User, Mic } from 'lucide-react';
import { aviaryAssistant } from '@/ai/flows/assistant-flow';
import { textToSpeech } from '@/ai/flows/tts-flow';
import { useItems } from '@/context/ItemsContext';
import { Bird, NoteReminder } from '@/lib/data';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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
  const { toast } = useToast();
  const { items, addItem, updateItem } = useItems();
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-ZA'; 

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      toast({ variant: "destructive", title: "Microphone Error", description: `Could not start voice recognition: ${event.error}` });
      setIsRecording(false);
    };
    
    recognition.onend = () => {
        if (isRecording) {
            setIsRecording(false);
        }
    };

    recognitionRef.current = recognition;
  }, [toast, isRecording]);

  useEffect(() => {
    if (audioSrc && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
  }, [audioSrc]);

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
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Could not start recognition", e);
        toast({ variant: "destructive", title: "Microphone Error", description: "Could not start voice recognition. Please check permissions." });
      }
    }
  };


  const handleSend = async () => {
    if (!input.trim()) return;

    const newUserMessage: Message = { id: `user-${Date.now()}`, role: 'user', text: input };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const context = JSON.stringify(items.filter(i => i.category === 'Bird' || i.category === 'NoteReminder'));
      const assistantResponse = await aviaryAssistant({ query: input, context });
      
      if (assistantResponse.data && assistantResponse.action !== 'answer') {
        switch(assistantResponse.action) {
          case 'addBird': {
            const birdData = assistantResponse.data as any;
            const newBird: Bird = {
              ...birdData,
              id: `b${Date.now()}`,
              category: 'Bird',
              offspringIds: [],
            };
            addItem(newBird);
            toast({ title: "AI Action: Bird Added", description: `Successfully added ${newBird.species}.` });
            break;
          }
          case 'updateBird': {
            const updateData = assistantResponse.data as any;
            updateItem(updateData.id, updateData.updates);
            toast({ title: "AI Action: Bird Updated", description: `Successfully updated bird ID ${updateData.id}.` });
            break;
          }
          case 'addNote': {
            const noteData = assistantResponse.data as any;
            const newNote: NoteReminder = {
               ...noteData,
               id: `nr${Date.now()}`,
               category: 'NoteReminder',
               reminderDate: noteData.reminderDate ? format(new Date(noteData.reminderDate), 'yyyy-MM-dd') : undefined,
               isRecurring: false,
               recurrencePattern: 'none',
               associatedBirdIds: [],
               subTasks: [],
               completed: false,
            };
            addItem(newNote);
            toast({ title: "AI Action: Note Added", description: `Successfully added note: "${newNote.title}"` });
            break;
          }
        }
      }

      const newAssistantMessage: Message = { id: `assistant-${Date.now()}`, role: 'assistant', text: assistantResponse.response };
      setMessages(prev => [...prev, newAssistantMessage]);
      
      const ttsResponse = await textToSpeech(assistantResponse.response);
      setAudioSrc(ttsResponse.audio);

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

        <div className="mt-auto pt-4 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleMicClick} disabled={isLoading}>
                <Mic className={cn("h-5 w-5", isRecording && "text-destructive animate-pulse")} />
                <span className="sr-only">Use Microphone</span>
            </Button>
            <Input 
                placeholder="e.g., Add a male cockatiel"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                disabled={isLoading}
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
