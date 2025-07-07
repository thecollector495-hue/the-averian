'use client';

import * as React from 'react';
import { ControllerRenderProps } from 'react-hook-form';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormControl } from '@/components/ui/form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GeneralCombobox({ field, options, placeholder, disabled = false }: { field: ControllerRenderProps<any, any>; options: { value: string; label:string }[]; placeholder: string; disabled?: boolean; }) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

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
      <PopoverTrigger asChild disabled={disabled}>
        <FormControl>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
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
                <Button
                    variant="ghost"
                    key={option.value}
                    onClick={() => {
                        field.onChange(option.value === field.value ? "" : option.value);
                        setOpen(false);
                    }}
                    className="w-full justify-start text-left font-normal h-auto py-2"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      field.value === option.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span className="whitespace-normal text-left">{option.label}</span>
                </Button>
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
