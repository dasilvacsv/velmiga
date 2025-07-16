// filter-panel.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FacetedFilters } from "./service-order";
import { X, CalendarIcon } from "lucide-react";
import { OrderTableCell } from "./order-table-cell";

type ActiveFilterTypes = {
  status: string[];
  paymentStatus: string[];
  warranty: string[];
  appliance: string[];
  createdBy: string[];
  technician: string[];
};

function formatDateRange(date: Date) {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface FilterPanelProps {
  facetedFilters: FacetedFilters;
  activeFilters: ActiveFilterTypes;
  toggleFilter: (type: keyof ActiveFilterTypes, value: string) => void;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  setDateRange: React.Dispatch<React.SetStateAction<{
    from: Date | undefined;
    to: Date | undefined;
  }>>;
  hasActiveFilters: boolean;
  resetFilters: () => void;
  fechaAgendadoRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  setFechaAgendadoRange: React.Dispatch<React.SetStateAction<{
    from: Date | undefined;
    to: Date | undefined;
  } | undefined>>;
  fechaCaptacionRange?: {
    from: Date | undefined;
    to: Date | undefined;
  };
  setFechaCaptacionRange: React.Dispatch<React.SetStateAction<{
    from: Date | undefined;
    to: Date | undefined;
  } | undefined>>;
}

export function FilterPanel({
  facetedFilters,
  activeFilters,
  toggleFilter,
  dateRange,
  setDateRange,
  hasActiveFilters,
  resetFilters,
  fechaAgendadoRange,
  setFechaAgendadoRange,
  fechaCaptacionRange,
  setFechaCaptacionRange
}: FilterPanelProps) {
  return (
    <div className="w-full h-full">
      <Card className="h-full">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Filtros</h3>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters} 
                className="h-8 px-2 text-xs"
              >
                <X className="mr-1 h-3 w-3" />
                Limpiar
              </Button>
            )}
          </div>
          
          <div className="space-y-5 flex-1 overflow-y-auto pr-2">
            {/* Fecha Agendado Filter */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Fecha de Agenda</h4>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
                      !fechaAgendadoRange?.from && !fechaAgendadoRange?.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaAgendadoRange?.from && fechaAgendadoRange?.to ? (
                      <>
                        {formatDateRange(fechaAgendadoRange.from)} - {formatDateRange(fechaAgendadoRange.to)}
                      </>
                    ) : (
                      <span>Seleccionar rango</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={fechaAgendadoRange?.from}
                    selected={{
                      from: fechaAgendadoRange?.from,
                      to: fechaAgendadoRange?.to,
                    }}
                    onSelect={(value) => 
                      setFechaAgendadoRange({ 
                        from: value?.from, 
                        to: value?.to 
                      })
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Fecha Captacion Filter */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Fecha de Captación</h4>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
                      !fechaCaptacionRange?.from && !fechaCaptacionRange?.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fechaCaptacionRange?.from && fechaCaptacionRange?.to ? (
                      <>
                        {formatDateRange(fechaCaptacionRange.from)} - {formatDateRange(fechaCaptacionRange.to)}
                      </>
                    ) : (
                      <span>Seleccionar rango</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={fechaCaptacionRange?.from}
                    selected={{
                      from: fechaCaptacionRange?.from,
                      to: fechaCaptacionRange?.to,
                    }}
                    onSelect={(value) => 
                      setFechaCaptacionRange({ 
                        from: value?.from, 
                        to: value?.to 
                      })
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Status Filters */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Estado</h4>
              <div className="space-y-2">
                {facetedFilters.status.map((status) => 
                  status.count > 0 && (
                    <div 
                      key={status.value}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
                        activeFilters.status.includes(status.value)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleFilter("status", status.value)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${OrderTableCell.getStatusColor(status.value)} h-2 w-2 p-0 rounded-full`} />
                        <span>{status.label}</span>
                      </div>
                      <Badge variant="outline" className="bg-muted">
                        {status.count}
                      </Badge>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Payment Status Filters */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Estado de Pago</h4>
              <div className="space-y-2">
                {facetedFilters.paymentStatus.map((status) => 
                  status.count > 0 && (
                    <div 
                      key={status.value}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
                        activeFilters.paymentStatus.includes(status.value)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleFilter("paymentStatus", status.value)}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${OrderTableCell.getPaymentStatusColor(status.value)} h-2 w-2 p-0 rounded-full`} />
                        <span>{status.label}</span>
                      </div>
                      <Badge variant="outline" className="bg-muted">
                        {status.count}
                      </Badge>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Warranty Filters */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Garantía</h4>
              <div className="space-y-2">
                {facetedFilters.warranty.map((warranty) => 
                  warranty.count > 0 && (
                    <div 
                      key={warranty.value}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
                        activeFilters.warranty.includes(warranty.value)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleFilter("warranty", warranty.value)}
                    >
                      <span>{warranty.label}</span>
                      <Badge variant="outline" className="bg-muted">
                        {warranty.count}
                      </Badge>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Technician Filters */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Técnico</h4>
              <div className="space-y-2 max-h-40 overflow-auto">
                {facetedFilters.technician.map((technician) => (
                  <div 
                    key={technician.value}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
                      activeFilters.technician.includes(technician.value)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                    onClick={() => toggleFilter("technician", technician.value)}
                  >
                    <span>{technician.label}</span>
                    <Badge variant="outline" className="bg-muted">
                      {technician.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Appliance Type Filters */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Tipo de Electrodoméstico</h4>
              <div className="space-y-2 max-h-40 overflow-auto">
                {facetedFilters.appliance.map((appliance) => (
                  <div 
                    key={appliance.value}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
                      activeFilters.appliance.includes(appliance.value)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                    onClick={() => toggleFilter("appliance", appliance.value)}
                  >
                    <span>{appliance.label}</span>
                    <Badge variant="outline" className="bg-muted">
                      {appliance.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Creator Filters */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Creado Por</h4>
              <div className="space-y-2 max-h-40 overflow-auto">
                {facetedFilters.createdBy.map((creator) => (
                  <div 
                    key={creator.value}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 text-sm rounded-md cursor-pointer transition-colors",
                      activeFilters.createdBy.includes(creator.value)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                    onClick={() => toggleFilter("createdBy", creator.value)}
                  >
                    <span>{creator.label}</span>
                    <Badge variant="outline" className="bg-muted">
                      {creator.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <h4 className="text-sm font-semibold mb-2">Fecha de Recepción</h4>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal text-sm",
                      !dateRange.from && !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from && dateRange.to ? (
                      <>
                        {formatDateRange(dateRange.from)} - {formatDateRange(dateRange.to)}
                      </>
                    ) : (
                      <span>Seleccionar rango</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{
                      from: dateRange.from,
                      to: dateRange.to,
                    }}
                    onSelect={(value) => 
                      setDateRange({ 
                        from: value?.from, 
                        to: value?.to 
                      })
                    }
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={resetFilters} 
              className="h-8 px-2 text-xs mt-4"
            >
              <X className="mr-1 h-3 w-3" />
              Limpiar filtros
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}