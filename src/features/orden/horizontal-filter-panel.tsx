import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronUp, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HorizontalFilterPanelProps {
  facetedFilters: any;
  activeFilters: {
    status: string[];
    paymentStatus: string[];
    warranty: string[];
    appliance: string[];
    createdBy: string[];
    technician: string[];
  };
  toggleFilter: (type: keyof typeof activeFilters, value: string) => void;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  setDateRange: React.Dispatch<
    React.SetStateAction<{
      from: Date | undefined;
      to: Date | undefined;
    }>
  >;
  fechaAgendadoRange: {
    from: Date | undefined;
    to: Date | undefined;
  } | undefined;
  setFechaAgendadoRange: React.Dispatch<
    React.SetStateAction<
      | {
          from: Date | undefined;
          to: Date | undefined;
        }
      | undefined
    >
  >;
  fechaCaptacionRange: {
    from: Date | undefined;
    to: Date | undefined;
  } | undefined;
  setFechaCaptacionRange: React.Dispatch<
    React.SetStateAction<
      | {
          from: Date | undefined;
          to: Date | undefined;
        }
      | undefined
    >
  >;
  hasActiveFilters: boolean;
  resetFilters: () => void;
}

export function HorizontalFilterPanel({
  facetedFilters,
  activeFilters,
  toggleFilter,
  dateRange,
  setDateRange,
  fechaAgendadoRange,
  setFechaAgendadoRange,
  fechaCaptacionRange,
  setFechaCaptacionRange,
  hasActiveFilters,
  resetFilters,
}: HorizontalFilterPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(["status"]);
  
  const toggleExpandGroup = (group: string) => {
    setExpandedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group) 
        : [...prev, group]
    );
  };
  
  const resetDateRange = (setter: typeof setDateRange) => {
    setter({ from: undefined, to: undefined });
  };
  
  const formatDate = (date: Date | undefined) => {
    if (!date) return "";
    return format(date, "dd MMM yyyy", { locale: es });
  };
  
  const isExpanded = (group: string) => expandedGroups.includes(group);
  
  const handleCheckboxChange = (group: keyof typeof activeFilters, value: string) => {
    toggleFilter(group, value);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <div 
            className="flex justify-between items-center cursor-pointer" 
            onClick={() => toggleExpandGroup("status")}
          >
            <h4 className="text-sm font-semibold">Estado</h4>
            {isExpanded("status") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {isExpanded("status") && (
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="space-y-1">
                {facetedFilters.status?.map((option: any) => (
                  <div 
                    key={option.value} 
                    className={`flex items-center space-x-2 rounded-md px-2 py-1 ${
                      activeFilters.status.includes(option.value) ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <Checkbox 
                      checked={activeFilters.status.includes(option.value)}
                      onCheckedChange={() => handleCheckboxChange("status", option.value)}
                      className="rounded-sm" 
                      id={`status-${option.value}`}
                    />
                    <label 
                      htmlFor={`status-${option.value}`}
                      className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: option.color }}
                        />
                        <span>{option.label}</span>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {option.count}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Payment Status Filter */}
        <div className="space-y-2">
          <div 
            className="flex justify-between items-center cursor-pointer" 
            onClick={() => toggleExpandGroup("paymentStatus")}
          >
            <h4 className="text-sm font-semibold">Estado de Pago</h4>
            {isExpanded("paymentStatus") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {isExpanded("paymentStatus") && (
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="space-y-1">
                {facetedFilters.paymentStatus?.map((option: any) => (
                  <div 
                    key={option.value} 
                    className={`flex items-center space-x-2 rounded-md px-2 py-1 ${
                      activeFilters.paymentStatus.includes(option.value) ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <Checkbox 
                      checked={activeFilters.paymentStatus.includes(option.value)}
                      onCheckedChange={() => handleCheckboxChange("paymentStatus", option.value)}
                      className="rounded-sm" 
                      id={`paymentStatus-${option.value}`}
                    />
                    <label 
                      htmlFor={`paymentStatus-${option.value}`}
                      className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: option.color }}
                        />
                        <span>{option.label}</span>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        {option.count}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Warranty Filter */}
        <div className="space-y-2">
          <div 
            className="flex justify-between items-center cursor-pointer" 
            onClick={() => toggleExpandGroup("warranty")}
          >
            <h4 className="text-sm font-semibold">Garantía</h4>
            {isExpanded("warranty") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {isExpanded("warranty") && (
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="space-y-1">
                {facetedFilters.warranty?.map((option: any) => (
                  <div 
                    key={option.value} 
                    className={`flex items-center space-x-2 rounded-md px-2 py-1 ${
                      activeFilters.warranty.includes(option.value) ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <Checkbox 
                      checked={activeFilters.warranty.includes(option.value)}
                      onCheckedChange={() => handleCheckboxChange("warranty", option.value)}
                      className="rounded-sm" 
                      id={`warranty-${option.value}`}
                    />
                    <label 
                      htmlFor={`warranty-${option.value}`}
                      className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                    >
                      <span>{option.label}</span>
                      <Badge variant="outline" className="ml-auto">
                        {option.count}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Appliance Type Filter */}
        <div className="space-y-2">
          <div 
            className="flex justify-between items-center cursor-pointer" 
            onClick={() => toggleExpandGroup("appliance")}
          >
            <h4 className="text-sm font-semibold">Tipo de Electrodoméstico</h4>
            {isExpanded("appliance") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {isExpanded("appliance") && (
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="space-y-1">
                {facetedFilters.appliance?.map((option: any) => (
                  <div 
                    key={option.value} 
                    className={`flex items-center space-x-2 rounded-md px-2 py-1 ${
                      activeFilters.appliance.includes(option.value) ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <Checkbox 
                      checked={activeFilters.appliance.includes(option.value)}
                      onCheckedChange={() => handleCheckboxChange("appliance", option.value)}
                      className="rounded-sm" 
                      id={`appliance-${option.value}`}
                    />
                    <label 
                      htmlFor={`appliance-${option.value}`}
                      className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                    >
                      <span>{option.label}</span>
                      <Badge variant="outline" className="ml-auto">
                        {option.count}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Created By Filter */}
        <div className="space-y-2">
          <div 
            className="flex justify-between items-center cursor-pointer" 
            onClick={() => toggleExpandGroup("createdBy")}
          >
            <h4 className="text-sm font-semibold">Creado Por</h4>
            {isExpanded("createdBy") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {isExpanded("createdBy") && (
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="space-y-1">
                {facetedFilters.createdBy?.map((option: any) => (
                  <div 
                    key={option.value} 
                    className={`flex items-center space-x-2 rounded-md px-2 py-1 ${
                      activeFilters.createdBy.includes(option.value) ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <Checkbox 
                      checked={activeFilters.createdBy.includes(option.value)}
                      onCheckedChange={() => handleCheckboxChange("createdBy", option.value)}
                      className="rounded-sm" 
                      id={`createdBy-${option.value}`}
                    />
                    <label 
                      htmlFor={`createdBy-${option.value}`}
                      className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                    >
                      <span>{option.label}</span>
                      <Badge variant="outline" className="ml-auto">
                        {option.count}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Technician Filter */}
        <div className="space-y-2">
          <div 
            className="flex justify-between items-center cursor-pointer" 
            onClick={() => toggleExpandGroup("technician")}
          >
            <h4 className="text-sm font-semibold">Técnico</h4>
            {isExpanded("technician") ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          
          {isExpanded("technician") && (
            <ScrollArea className="h-40 rounded-md border p-2">
              <div className="space-y-1">
                {facetedFilters.technician?.map((option: any) => (
                  <div 
                    key={option.value} 
                    className={`flex items-center space-x-2 rounded-md px-2 py-1 ${
                      activeFilters.technician.includes(option.value) ? "bg-primary/10" : "hover:bg-muted"
                    }`}
                  >
                    <Checkbox 
                      checked={activeFilters.technician.includes(option.value)}
                      onCheckedChange={() => handleCheckboxChange("technician", option.value)}
                      className="rounded-sm" 
                      id={`technician-${option.value}`}
                    />
                    <label 
                      htmlFor={`technician-${option.value}`}
                      className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                    >
                      <span>{option.label}</span>
                      <Badge variant="outline" className="ml-auto">
                        {option.count}
                      </Badge>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Date filters */}
      <div className="border-t pt-4 mt-2">
        <div className="text-sm font-semibold mb-3">Filtros de fecha</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Received Date Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Fecha de recepción</h4>
              {(dateRange.from || dateRange.to) && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => resetDateRange(setDateRange)}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-[120px] justify-start text-left font-normal ${
                      !dateRange.from ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? formatDate(dateRange.from) : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) =>
                      setDateRange({ ...dateRange, from: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-sm text-muted-foreground">a</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-[120px] justify-start text-left font-normal ${
                      !dateRange.to ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.to ? formatDate(dateRange.to) : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) =>
                      setDateRange({ ...dateRange, to: date })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Scheduled Date Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Fecha agendado</h4>
              {(fechaAgendadoRange?.from || fechaAgendadoRange?.to) && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => setFechaAgendadoRange(undefined)}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-[120px] justify-start text-left font-normal ${
                      !fechaAgendadoRange?.from ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaAgendadoRange?.from ? formatDate(fechaAgendadoRange.from) : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaAgendadoRange?.from}
                    onSelect={(date) =>
                      setFechaAgendadoRange({ 
                        from: date, 
                        to: fechaAgendadoRange?.to 
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-sm text-muted-foreground">a</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-[120px] justify-start text-left font-normal ${
                      !fechaAgendadoRange?.to ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaAgendadoRange?.to ? formatDate(fechaAgendadoRange.to) : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaAgendadoRange?.to}
                    onSelect={(date) =>
                      setFechaAgendadoRange({ 
                        from: fechaAgendadoRange?.from, 
                        to: date 
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Captation Date Range */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Fecha captación</h4>
              {(fechaCaptacionRange?.from || fechaCaptacionRange?.to) && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={() => setFechaCaptacionRange(undefined)}
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-[120px] justify-start text-left font-normal ${
                      !fechaCaptacionRange?.from ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaCaptacionRange?.from ? formatDate(fechaCaptacionRange.from) : "Desde"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaCaptacionRange?.from}
                    onSelect={(date) =>
                      setFechaCaptacionRange({ 
                        from: date, 
                        to: fechaCaptacionRange?.to 
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-sm text-muted-foreground">a</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-[120px] justify-start text-left font-normal ${
                      !fechaCaptacionRange?.to ? "text-muted-foreground" : ""
                    }`}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaCaptacionRange?.to ? formatDate(fechaCaptacionRange.to) : "Hasta"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={fechaCaptacionRange?.to}
                    onSelect={(date) =>
                      setFechaCaptacionRange({ 
                        from: fechaCaptacionRange?.from, 
                        to: date 
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end border-t pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={resetFilters}
          disabled={!hasActiveFilters}
          className="ml-auto"
        >
          <RefreshCw className="mr-2 h-3.5 w-3.5" />
          Reiniciar filtros
        </Button>
      </div>
    </div>
  );
}