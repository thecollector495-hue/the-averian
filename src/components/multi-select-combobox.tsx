'use client';

import * as React from 'react';
import { ControllerRenderProps } from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronsUpDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export function MultiSelectCombobox({ field, options, placeholder }: { field: ControllerRenderProps<any, any>, options: { value: string; label: string }[], placeholder: string }) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    
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
    
    const filteredOptions = React.useMemo(() => 
        options
          .filter(option => 
            option.label.toLowerCase().includes(search.toLowerCase())
          )
          .sort((a, b) => a.label.localeCompare(b.label)),
    [options, search]);
    
    React.useEffect(() => {
        if (!open) {
          setSearch("");
        }
    }, [open]);

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-auto min-h-10"
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
                                        handleSelect(value);
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
            >
                <div className="p-2">
                    <Input 
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full"
                        autoFocus
                    />
                </div>
                <ScrollArea className="h-[200px]">
                    <div className="p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className="flex items-center justify-start gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                    onClick={() => handleSelect(option.value)}
                                >
                                    <Checkbox
                                        checked={selectedValues.has(option.value)}
                                        readOnly
                                        className="pointer-events-none"
                                    />
                                    <span className="flex-grow whitespace-normal text-left">{option.label}</span>
                                </div>
                            ))
                        ) : (
                            <div className="p-2 text-center text-sm text-muted-foreground">
                                No item found.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
