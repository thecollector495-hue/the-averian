
'use client';

import * as React from 'react';
import { ControllerRenderProps } from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormControl } from '@/components/ui/form';
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GeneralCombobox({ field, options, placeholder, disabled = false, log = () => {} }: { field: ControllerRenderProps<any, any>; options: { value: string; label:string }[]; placeholder: string; disabled?: boolean; log?: (message: string) => void; }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={(isOpen) => {
        log(`GeneralCombobox Popover onOpenChange. New state: ${isOpen}`);
        setOpen(isOpen);
    }}>
      <PopoverTrigger asChild disabled={disabled}>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            onClick={() => log('GeneralCombobox Trigger onClick')}
            className={cn(
              "w-full justify-between",
              !field.value && "text-muted-foreground"
            )}
          >
            <span className="truncate text-left">
                {field.value
                ? options.find(
                    (option) => option.value === field.value
                    )?.label
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onOpenAutoFocus={(e) => {
            log('GeneralCombobox PopoverContent onOpenAutoFocus fired. Action: Default not prevented.');
        }}
      >
        <Command onFocus={() => log('GeneralCombobox Command onFocus')} onBlur={() => log('GeneralCombobox Command onBlur')}>
          <CommandInput placeholder="Search..." onFocus={() => log('GeneralCombobox CommandInput onFocus')} />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={(currentLabel) => {
                    log(`GeneralCombobox CommandItem onSelect fired for: ${currentLabel}`);
                    const selectedValue = options.find(o => o.label.toLowerCase() === currentLabel.toLowerCase())?.value;
                    field.onChange(selectedValue === field.value ? "" : selectedValue);
                    setOpen(false);
                  }}
                  onClick={() => log(`GeneralCombobox CommandItem onClick fired for: ${option.label}`)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      field.value === option.value
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
