'use client';

import * as React from 'react';
import { X, Check, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Command, CommandGroup, CommandItem, CommandList, CommandInput, CommandEmpty } from "@/components/ui/command";
import { ControllerRenderProps } from 'react-hook-form';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';
import { Separator } from "@/components/ui/separator";

export function MultiSelectCombobox({ field, options, placeholder }: { field: ControllerRenderProps<any, any>, options: { value: string; label: string }[], placeholder: string }) {
    const [open, setOpen] = React.useState(false);
    
    const selectedValues = new Set(Array.isArray(field.value) ? field.value : []);

    const handleSelect = (valueToToggle: string) => {
        const newSelectedValues = new Set(selectedValues);
        if (newSelectedValues.has(valueToToggle)) {
            newSelectedValues.delete(valueToToggle);
        } else {
            newSelectedValues.add(valueToToggle);
        }
        field.onChange(Array.from(newSelectedValues));
    };
    
    const getLabel = (value: string) => options.find(o => o.value === value)?.label || value;
    
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto"
                >
                    <div className="flex gap-1 flex-wrap">
                        {selectedValues.size > 0 ? (
                             <span className="text-foreground">{selectedValues.size} selected</span>
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                        handleSelect(option.value);
                                    }}
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
                {selectedValues.size > 0 && (
                    <>
                        <Separator />
                        <div className="p-2 flex gap-1 flex-wrap">
                            {Array.from(selectedValues).map((value) => (
                                <Badge
                                    variant="secondary"
                                    key={value}
                                >
                                    {getLabel(value)}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSelect(value);
                                      }}
                                      className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                     <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                    </>
                )}
            </PopoverContent>
        </Popover>
    );
}
