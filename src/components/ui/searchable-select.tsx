'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  emoji?: string;
  category?: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  disabled?: boolean;
  clearable?: boolean;
  emptyMessage?: string;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar opción...",
  searchPlaceholder = "Buscar...",
  className,
  disabled = false,
  clearable = false,
  emptyMessage = "No se encontraron opciones"
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement[]>([]);

  const selectedOption = options.find(option => option.value === value);
  
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase()) ||
    option.description?.toLowerCase().includes(search.toLowerCase()) ||
    option.category?.toLowerCase().includes(search.toLowerCase())
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredOptions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredOptions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            onValueChange(filteredOptions[highlightedIndex].value);
            setOpen(false);
            setSearch('');
            setHighlightedIndex(-1);
          }
          break;
        case 'Escape':
          setOpen(false);
          setSearch('');
          setHighlightedIndex(-1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, highlightedIndex, filteredOptions, onValueChange]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsRef.current[highlightedIndex]) {
      optionsRef.current[highlightedIndex].scrollIntoView({
        block: 'nearest'
      });
    }
  }, [highlightedIndex]);

  // Focus search when opened
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: SelectOption) => {
    onValueChange(option.value);
    setOpen(false);
    setSearch('');
    setHighlightedIndex(-1);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onValueChange('');
    setOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className={cn(
          "relative w-full min-h-[40px] px-3 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200",
          disabled && "opacity-50 cursor-not-allowed bg-gray-50",
          open && "ring-2 ring-orange-500 border-transparent"
        )}
      >
        <span className="flex items-center justify-between">
          <span className="flex items-center space-x-2 min-w-0">
            {selectedOption?.emoji && (
              <span className="text-lg flex-shrink-0">{selectedOption.emoji}</span>
            )}
            <span className="block truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
          <span className="flex items-center space-x-1 flex-shrink-0 ml-2">
            {clearable && selectedOption && (
              <X
                className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={handleClear}
              />
            )}
            <ChevronDown
              className={cn(
                "h-4 w-4 text-gray-400 transition-transform duration-200",
                open && "transform rotate-180"
              )}
            />
          </span>
        </span>
      </button>

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl animate-in slide-in-from-top-2 duration-200">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setHighlightedIndex(-1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-gray-500">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option, index) => (
                <div
                  key={option.value}
                  ref={(el) => {
                    if (el) optionsRef.current[index] = el;
                  }}
                  className={cn(
                    "relative cursor-pointer select-none px-3 py-2 transition-colors",
                    index === highlightedIndex 
                      ? "bg-orange-50 text-orange-900" 
                      : "text-gray-900 hover:bg-gray-50",
                    option.value === value && "bg-orange-100 text-orange-900 font-medium"
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0">
                      {option.emoji && (
                        <span className="text-lg flex-shrink-0">{option.emoji}</span>
                      )}
                      <div className="min-w-0">
                        <div className="font-medium truncate">{option.label}</div>
                        {option.description && (
                          <div className="text-sm text-gray-500 truncate">
                            {option.description}
                          </div>
                        )}
                        {option.category && (
                          <div className="text-xs text-gray-400 mt-1">
                            {option.category}
                          </div>
                        )}
                      </div>
                    </div>
                    {option.value === value && (
                      <Check className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}