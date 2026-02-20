import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslation } from "react-i18next";

interface TaxonomyComboboxProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    allowCustom?: boolean;
}

export function TaxonomyCombobox({
    options,
    value,
    onChange,
    placeholder,
    searchPlaceholder,
    emptyMessage,
    allowCustom = true,
}: TaxonomyComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const { t } = useTranslation();

    const filteredOptions = options.filter((option) =>
        option.toLowerCase().includes(search.toLowerCase())
    );

    const showCustom = allowCustom && search.trim() !== "" && !options.some(opt => opt.toLowerCase() === search.toLowerCase().trim());

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between h-11 bg-background/50 border-border/40 hover:bg-background/80 transition-all font-normal"
                >
                    <span className="truncate">
                        {value || placeholder || t('common.select')}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full min-w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput
                        placeholder={searchPlaceholder || t('common.search')}
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {showCustom ? (
                                <div className="py-2 px-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-primary font-medium"
                                        onClick={() => {
                                            onChange(search.trim());
                                            setOpen(false);
                                            setSearch("");
                                        }}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        {t('common.add')} "{search}"
                                    </Button>
                                </div>
                            ) : (
                                emptyMessage || t('common.noResults')
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option}
                                    value={option}
                                    onSelect={(currentValue) => {
                                        onChange(currentValue === value ? "" : currentValue);
                                        setOpen(false);
                                        setSearch("");
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
