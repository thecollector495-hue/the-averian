
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Pencil, Trash2 } from "lucide-react";
import { Bird, NoteReminder, getBirdIdentifier } from '@/lib/data';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from "@/context/AuthContext";

export function NoteCard({ note, allBirds, onUpdate, onBirdClick, onDelete, onEdit }: { note: NoteReminder, allBirds: Bird[], onUpdate: (updatedNote: NoteReminder) => void, onBirdClick: (bird: Bird) => void, onDelete: () => void, onEdit: (note: NoteReminder) => void }) {
    const { isReadOnly } = useAuth();
    const handleSubTaskToggle = (taskId: string, completed: boolean) => {
        if (isReadOnly) return;
        const updatedSubTasks = note.subTasks.map(task => 
            task.id === taskId ? { ...task, completed } : task
        );
        onUpdate({ ...note, subTasks: updatedSubTasks });
    };
    
    const handleNoteCompletionToggle = (completed: boolean) => {
        if (isReadOnly) return;
        onUpdate({ ...note, completed });
    }
    
    const associatedBirds = allBirds.filter(b => note.associatedBirdIds.includes(b.id));

    return (
        <Card className={cn("flex flex-col h-full", note.completed && "bg-muted/50")}>
            <CardHeader>
                <CardTitle className="flex justify-between items-start">
                    <span className={cn("flex-grow", note.completed && "line-through text-muted-foreground")}>{note.title}</span>
                    <Checkbox checked={note.completed} onCheckedChange={handleNoteCompletionToggle} className="h-5 w-5 ml-4 flex-shrink-0" disabled={isReadOnly}/>
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
                                        <Checkbox id={task.id} checked={task.completed} onCheckedChange={(checked) => handleSubTaskToggle(task.id, !!checked)} disabled={isReadOnly} />
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
            <CardFooter className="flex justify-between items-center">
                 <Button variant="outline" size="sm" onClick={() => onEdit(note)} disabled={isReadOnly}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={onDelete} disabled={isReadOnly}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                </Button>
            </CardFooter>
        </Card>
    )
}
