
'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Calendar, StickyNote, Trash2, Pencil, Check, ChevronsUpDown, AlertTriangle } from "lucide-react";
import { initialItems, getBirdIdentifier, Bird, Cage, NoteReminder, SubTask, speciesData } from '@/lib/data';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useForm, useFieldArray, Controller, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { BirdDetailsDialog } from '@/components/bird-details-dialog';

const subTaskSchema = z.object({
  text: z.string().min(1, "Task text cannot be empty."),
  completed: z.boolean().default(false),
  associatedBirdIds: z.array(z.string()).default([]),
});

const noteReminderSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  content: z.string().optional(),
  isReminder: z.boolean().default(false),
  reminderDate: z.date().optional(),
  isRecurring: z.boolean().default(false),
  recurrencePattern: z.enum(['daily', 'weekly', 'monthly', 'none']).default('none'),
  associatedBirdIds: z.array(z.string()).default([]),
  subTasks: z.array(subTaskSchema).default([]),
}).refine(data => {
    if (data.isReminder && !data.reminderDate) return false;
    return true;
}, { message: "Reminder date is required for reminders.", path: ["reminderDate"] })
.refine(data => {
    if (data.isRecurring && data.recurrencePattern === 'none') return false;
    return true;
}, { message: "Please select a recurrence pattern.", path: ["recurrencePattern"] });


type NoteFormValues = z.infer<typeof noteReminderSchema>;

function MultiSelectCombobox({ field, options, placeholder }: { field: ControllerRenderProps<any, any>, options: { value: string; label: string }[], placeholder: string }) {
    const [open, setOpen] = useState(false);
    const selectedValues = new Set(field.value || []);

    const handleSelect = (value: string) => {
        const newSelectedValues = new Set(selectedValues);
        if (newSelectedValues.has(value)) {
            newSelectedValues.delete(value);
        } else {
            newSelectedValues.add(value);
        }
        field.onChange(Array.from(newSelectedValues));
    };
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start h-auto min-h-10">
                    <div className="flex gap-1 flex-wrap">
                        {selectedValues.size > 0 ? (
                            Array.from(selectedValues).map(val => (
                                <Badge variant="secondary" key={val} >
                                    {options.find(o => o.value === val)?.label || val}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => handleSelect(option.value)}
                                >
                                     <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedValues.has(option.value)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}


function AddNoteDialog({ isOpen, onOpenChange, onSave, allBirds }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: any) => void, allBirds: Bird[] }) {
    const form = useForm<NoteFormValues>({
        resolver: zodResolver(noteReminderSchema),
        defaultValues: {
            title: "",
            content: "",
            isReminder: false,
            isRecurring: false,
            recurrencePattern: 'none',
            associatedBirdIds: [],
            subTasks: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "subTasks",
    });

    const [subTaskText, setSubTaskText] = useState("");
    
    const isReminder = form.watch("isReminder");
    const isRecurring = form.watch("isRecurring");

    function onSubmit(data: NoteFormValues) {
        onSave({ ...data, reminderDate: data.reminderDate ? format(data.reminderDate, 'yyyy-MM-dd') : undefined });
        onOpenChange(false);
        form.reset();
    }
    
    const birdOptions = allBirds.map(b => ({ value: b.id, label: getBirdIdentifier(b) }));
    
    const handleAddSubTask = () => {
        if (subTaskText.trim()) {
            append({ text: subTaskText, completed: false, associatedBirdIds: [] });
            setSubTaskText("");
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Note or Reminder</DialogTitle>
                    <DialogDescription>Fill in the details below.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6 pl-1">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Check nest boxes" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="content" render={({ field }) => (
                            <FormItem><FormLabel>Content</FormLabel><FormControl><Textarea placeholder="Add more details..." {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField
                            control={form.control}
                            name="associatedBirdIds"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Associate Birds with Note (optional)</FormLabel>
                                    <MultiSelectCombobox field={field} options={birdOptions} placeholder="Select birds" />
                                    <FormMessage />
                                </FormItem>
                            )}
                         />
                        <Separator />
                        <div>
                            <h4 className="font-medium mb-2">Sub-tasks</h4>
                            <div className="space-y-3">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="flex flex-col gap-2 p-3 border rounded-md relative">
                                        <div className="flex items-center gap-2">
                                            <FormField control={form.control} name={`subTasks.${index}.completed`} render={({ field: checkboxField }) => (
                                                <FormItem className="mt-1"><FormControl><Checkbox checked={checkboxField.value} onCheckedChange={checkboxField.onChange} /></FormControl></FormItem>
                                            )} />
                                            <FormField control={form.control} name={`subTasks.${index}.text`} render={({ field: textField }) => (
                                                <FormItem className="flex-grow"><FormControl><Input {...textField} /></FormControl></FormItem>
                                            )} />
                                            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name={`subTasks.${index}.associatedBirdIds`}
                                            render={({ field: birdField }) => (
                                                <FormItem>
                                                    <FormLabel className="text-xs text-muted-foreground">Assign birds to this sub-task</FormLabel>
                                                    <MultiSelectCombobox field={birdField} options={birdOptions} placeholder="Select birds" />
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                ))}
                            </div>
                             <div className="flex items-center gap-2 mt-3">
                                <Input value={subTaskText} onChange={e => setSubTaskText(e.target.value)} placeholder="New sub-task..." onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddSubTask(); }}}/>
                                <Button type="button" onClick={handleAddSubTask}>Add Task</Button>
                             </div>
                        </div>

                        <Separator />

                        <FormField control={form.control} name="isReminder" render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5"><FormLabel>Make this a reminder?</FormLabel><FormDescription>Reminders will notify you on the specified date.</FormDescription></div>
                                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            </FormItem>
                        )} />

                        {isReminder && (
                            <div className="space-y-4 pl-2 pt-2 border-l-2">
                                <FormField control={form.control} name="reminderDate" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Reminder Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild><FormControl><Button variant="outline" className={cn("w-full justify-start text-left font-normal", !field.value && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4"/>{field.value ? format(field.value, "PPP") : "Pick a date"}</Button></FormControl></PopoverTrigger>
                                            <PopoverContent className="w-auto p-0"><CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 <FormField control={form.control} name="isRecurring" render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                        <FormLabel className="font-normal">Is this a recurring reminder?</FormLabel>
                                    </FormItem>
                                )}/>
                                {isRecurring && (
                                     <FormField control={form.control} name="recurrencePattern" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Repeats</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="daily">Daily</SelectItem>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                    <SelectItem value="monthly">Monthly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                     )}/>
                                )}
                            </div>
                        )}
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function NoteCard({ note, allBirds, onUpdate, onBirdClick }: { note: NoteReminder, allBirds: Bird[], onUpdate: (updatedNote: NoteReminder) => void, onBirdClick: (bird: Bird) => void }) {

    const handleSubTaskToggle = (taskId: string, completed: boolean) => {
        const updatedSubTasks = note.subTasks.map(task => 
            task.id === taskId ? { ...task, completed } : task
        );
        onUpdate({ ...note, subTasks: updatedSubTasks });
    };
    
    const handleNoteCompletionToggle = (completed: boolean) => {
        onUpdate({ ...note, completed });
    }
    
    const associatedBirds = allBirds.filter(b => note.associatedBirdIds.includes(b.id));

    return (
        <Card className={cn("flex flex-col h-full", note.completed && "bg-muted/50")}>
            <CardHeader>
                <CardTitle className="flex justify-between items-start">
                    <span className={cn(note.completed && "line-through text-muted-foreground")}>{note.title}</span>
                    <Checkbox checked={note.completed} onCheckedChange={handleNoteCompletionToggle} className="h-5 w-5"/>
                </CardTitle>
                 {note.isReminder && note.reminderDate && (
                    <CardDescription className="flex items-center gap-2 pt-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(note.reminderDate), 'PPP')}</span>
                        {note.isRecurring && note.recurrencePattern !== 'none' && <Badge variant="secondary" className="capitalize">{note.recurrencePattern}</Badge>}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                {note.content && <p className="text-sm text-muted-foreground">{note.content}</p>}
                
                {associatedBirds.length > 0 && (
                     <div className="space-y-2">
                        <h4 className="text-sm font-medium">Associated with Note</h4>
                         <div className="flex flex-wrap gap-2">
                            {associatedBirds.map(bird => (
                                <Button key={bird.id} variant="outline" size="sm" className="h-auto" onClick={() => onBirdClick(bird)}>
                                    {getBirdIdentifier(bird)}
                                </Button>
                            ))}
                         </div>
                    </div>
                )}

                {note.subTasks.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="text-sm font-medium">Sub-tasks</h4>
                        {note.subTasks.map(task => {
                             const subTaskBirds = allBirds.filter(b => task.associatedBirdIds.includes(b.id));
                             return (
                                <div key={task.id} className="p-2.5 border rounded-md space-y-2 bg-background/50">
                                    <div className="flex items-center space-x-3">
                                        <Checkbox id={task.id} checked={task.completed} onCheckedChange={(checked) => handleSubTaskToggle(task.id, !!checked)} />
                                        <label htmlFor={task.id} className={cn("text-sm flex-grow", task.completed && "line-through text-muted-foreground")}>{task.text}</label>
                                    </div>
                                    {subTaskBirds.length > 0 && (
                                        <div className="pl-7 flex flex-wrap gap-1">
                                            {subTaskBirds.map(bird => (
                                                <Button key={bird.id} variant="secondary" size="sm" className="h-auto px-1.5 py-0.5 text-xs" onClick={() => onBirdClick(bird)}>
                                                    {getBirdIdentifier(bird)}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

            </CardContent>
            <CardFooter>
                 <Button variant="outline" size="sm" disabled>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function NotesPage() {
    const allItems = initialItems;
    const allBirds = allItems.filter((item): item is Bird => item.category === 'Bird');
    const allCages = allItems.filter((item): item is Cage => item.category === 'Cage');
    const initialNotes = allItems.filter((item): item is NoteReminder => item.category === 'NoteReminder');

    const [notes, setNotes] = useState<NoteReminder[]>(initialNotes);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [viewingBird, setViewingBird] = useState<Bird | null>(null);

    const handleSaveNote = (data: Omit<NoteReminder, 'id' | 'category' | 'completed'>) => {
        const newNote: NoteReminder = {
            ...data,
            id: `nr${Date.now()}`,
            category: 'NoteReminder',
            subTasks: data.subTasks.map(t => ({ ...t, id: `st${Date.now()}${Math.random()}` })),
            completed: false,
        };
        setNotes(prev => [newNote, ...prev]);
    };
    
    const handleUpdateNote = (updatedNote: NoteReminder) => {
        setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    };
    
    const handleViewBirdClick = (bird: Bird) => {
      setViewingBird(bird);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <AddNoteDialog 
                isOpen={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSave={handleSaveNote}
                allBirds={allBirds}
            />
            <BirdDetailsDialog 
                bird={viewingBird}
                allBirds={allBirds}
                allCages={allCages}
                onClose={() => setViewingBird(null)}
                onBirdClick={handleViewBirdClick}
            />

            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Notes & Reminders</h1>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4"/>
                    Add Note
                </Button>
            </div>

            {notes.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map(note => (
                        <NoteCard key={note.id} note={note} allBirds={allBirds} onUpdate={handleUpdateNote} onBirdClick={handleViewBirdClick} />
                    ))}
                 </div>
            ) : (
                <div className="text-center py-16 rounded-lg border border-dashed">
                    <h2 className="text-xl font-semibold">No Notes Yet</h2>
                    <p className="text-muted-foreground mt-2">Click "Add Note" to create your first note or reminder.</p>
                </div>
            )}
        </div>
    );
}
