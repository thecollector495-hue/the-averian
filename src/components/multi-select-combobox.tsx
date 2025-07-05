'use client';

import * as React from 'react';
import { ControllerRenderProps } from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function MultiSelectCombobox({ field, options, placeholder }: { field: ControllerRenderProps<any, any>, options: { value: string; label: string }[], placeholder: string }) {
    const [open, setOpen] = React.useState(false);
    
    const selectedValues = new Set(Array.isArray(field.value) ? field.value : []);

    const handleToggle = (valueToToggle: string) => {
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
                             Array.from(selectedValues).map((value) => (
                                <Badge
                                    variant="secondary"
                                    key={value}
                                    className="mr-1"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleToggle(value);
                                    }}
                                >
                                    {getLabel(value)}
                                    <X className="ml-1 h-3 w-3" />
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground">{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <Command>
                    <CommandInput placeholder="Search..." />
                    <CommandList>
                        <CommandEmpty>No item found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={(currentValue) => {
                                        handleToggle(currentValue);
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
            </PopoverContent>
        </Popover>
    );
}
