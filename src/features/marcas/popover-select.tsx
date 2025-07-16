"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export interface Option {
  value: string
  label: string
  icon?: React.ReactNode
  disabled?: boolean
}

interface PopoverSelectProps {
  options: Option[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  emptyMessage?: string
  showSearch?: boolean
  searchPlaceholder?: string
  onSearch?: (search: string) => void
  searchIcon?: React.ReactNode
  className?: string
}

export function PopoverSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  emptyMessage = "No results found",
  showSearch = false,
  searchPlaceholder = "Search...",
  onSearch,
  searchIcon,
  className,
}: PopoverSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  // Find the selected option
  const selectedOption = React.useMemo(() => 
    options.find(option => option.value === value), 
    [options, value]
  )

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    if (onSearch) {
      onSearch(value)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between h-10 font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          {selectedOption ? (
            <span className="flex items-center truncate">
              {selectedOption.icon && selectedOption.icon}
              {selectedOption.label}
            </span>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[200px] max-h-[300px]">
        <Command className="w-full">
          {showSearch && (
            <div className="flex items-center border-b px-3">
              {searchIcon || <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />}
              <CommandInput 
                placeholder={searchPlaceholder} 
                value={searchValue}
                onValueChange={handleSearchChange}
                className="h-9 flex-1 border-0 focus:ring-0"
              />
            </div>
          )}
          <CommandList className="max-h-[210px] overflow-auto">
            <CommandEmpty className="py-3 text-center text-sm">{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                  onSelect={() => {
                    onValueChange(option.value)
                    setOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    option.disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  {option.icon && option.icon}
                  <span>{option.label}</span>
                  {value === option.value && (
                    <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}