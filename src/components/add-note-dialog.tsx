'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from 'date-fns';
import { Bird } from '@/lib/data';
import { getBirdIdentifier } from '@/lib/data';
import { cn } from '@/lib/utils';
import { MultiSelectCombobox } from './multi-select-combobox';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

const subTaskSchema = z.object({
  id: z.string().optional(), // Keep optional for new tasks
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

export function AddNoteDialog({ isOpen, onOpenChange, onSave, allBirds }: { isOpen: boolean, onOpenChange: (open: boolean) => void, onSave: (data: any) => void, allBirds: Bird[] }) {
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
