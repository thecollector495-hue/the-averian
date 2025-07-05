'use client';

import * as React from 'react';
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Command as CommandPrimitive } from "cmdk";
import { ControllerRenderProps } from 'react-hook-form';
import { cn } from '@/lib/utils';

export function MultiSelectCombobox({ field, options, placeholder }: { field: ControllerRenderProps<any, any>, options: { value: string; label: string }[], placeholder: string }) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<string[]>(field.value || []);
    const [inputValue, setInputValue] = React.useState("");

    React.useEffect(() => {
        field.onChange(selected);
    }, [selected, field]);
    
    // This effect synchronizes the component's internal state with the form's state.
    // This is crucial for when the form is reset or initialized with data.
    React.useEffect(() => {
        setSelected(Array.isArray(field.value) ? field.value : []);
    }, [field.value]);

    const handleUnselect = React.useCallback((val: string) => {
        setSelected(prev => prev.filter(s => s !== val));
    }, []);

    const handleKeyDown = React.useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        const input = inputRef.current
        if (input) {
            if (e.key === "Delete" || e.key === "Backspace") {
                if (input.value === "" && selected.length > 0) {
                    const newSelected = [...selected];
                    newSelected.pop();
                    setSelected(newSelected);
                }
            }
            if (e.key === "Escape") {
                input.blur();
            }
        }
    }, [selected]);

    const selectables = options.filter(option => !selected.includes(option.value));
    
    const getLabel = (value: string) => options.find(o => o.value === value)?.label || value;

    return (
        <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent p-0">
            <div className="group border border-input px-3 py-2 text-sm ring-offset-background rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <div className="flex gap-1 flex-wrap">
                    {selected.map((val) => (
                        <Badge key={val} variant="secondary">
                            {getLabel(val)}
                            <button
                                className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }}
                                onClick={() => handleUnselect(val)}
                            >
                                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                        </Badge>
                    ))}
                    <CommandPrimitive.Input
                        ref={inputRef}
                        value={inputValue}
                        onValueChange={setInputValue}
                        onBlur={() => setOpen(false)}
                        onFocus={() => setOpen(true)}
                        placeholder={selected.length > 0 ? "" : placeholder}
                        className={cn("ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1", selected.length > 0 ? 'w-auto' : 'w-full')}
                        style={{ width: selected.length > 0 ? 'auto' : '100%' }}
                    />
                </div>
            </div>
            <div className="relative mt-2">
                {open && selectables.length > 0 ?
                    <div className="absolute w-full z-50 top-0 rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                        <CommandList>
                            <CommandGroup className="h-full overflow-auto">
                                {selectables.map((option) => (
                                    <CommandItem
                                        key={option.value}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onSelect={() => {
                                            setInputValue("")
                                            setSelected(prev => [...prev, option.value])
                                        }}
                                        className={"cursor-pointer"}
                                    >
                                        {option.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </div>
                    : null}
            </div>
        </Command>
    );
}
