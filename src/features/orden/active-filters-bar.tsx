import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FacetedFilters } from "./service-order";
import { OrderTableCell } from "./order-table-cell";

// Define ActiveFilterTypes
type ActiveFilterTypes = {
  status: string[];
  paymentStatus: string[];
  warranty: string[];
  appliance: string[];
  createdBy: string[];
  technician: string[];
};

interface ActiveFiltersBarProps {
  resetFilters: () => void;
  activeFilters: ActiveFilterTypes;
  facetedFilters: FacetedFilters;
  toggleFilter: (type: keyof ActiveFilterTypes, value: string) => void;
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  setDateRange: React.Dispatch<React.SetStateAction<{
    from: Date | undefined;
    to: Date | undefined;
  }>>;
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

// Date formatter utility
function formatDateRange(date: Date) {
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function ActiveFiltersBar({ 
  resetFilters, 
  activeFilters, 
  facetedFilters, 
  toggleFilter,
  dateRange,
  setDateRange,
  fechaAgendadoRange,
  setFechaAgendadoRange,
  fechaCaptacionRange,
  setFechaCaptacionRange
}: ActiveFiltersBarProps) {
  // Get the label for a filter value
  const getFilterLabel = (type: keyof typeof activeFilters, value: string) => {
    switch (type) {
      case "status":
        return facetedFilters.status.find(s => s.value === value)?.label || value;
      case "paymentStatus":
        return facetedFilters.paymentStatus.find(s => s.value === value)?.label || value;
      case "warranty":
        return facetedFilters.warranty.find(s => s.value === value)?.label || value;
      case "appliance":
        return facetedFilters.appliance.find(s => s.value === value)?.label || value;
      case "createdBy":
        return facetedFilters.createdBy.find(s => s.value === value)?.label || value;
      case "technician":
        return facetedFilters.technician.find(s => s.value === value)?.label || value;
      default:
        return value;
    }
  };
  
  // Get color for status badge
  const getFilterColor = (type: keyof typeof activeFilters, value: string) => {
    switch (type) {
      case "status":
        return OrderTableCell.getStatusColor(value);
      case "paymentStatus":
        return OrderTableCell.getPaymentStatusColor(value);
      case "warranty":
        switch (value) {
          case "active":
            return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
          case "unlimited":
            return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
          case "none":
            return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
          case "expiring":
            return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
          default:
            return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
        }
      case "technician":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "createdBy":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
      default:
        return "bg-primary/10 text-primary dark:bg-primary/20";
    }
  };
  
  // Count total active filters
  const totalActiveFilters = Object.values(activeFilters).reduce(
    (sum, filters) => sum + filters.length, 
    0
  ) + (dateRange.from && dateRange.to ? 1 : 0)
    + (fechaAgendadoRange?.from && fechaAgendadoRange?.to ? 1 : 0)
    + (fechaCaptacionRange?.from && fechaCaptacionRange?.to ? 1 : 0);
  
  return (
    <div className="flex flex-wrap items-center gap-2 bg-muted/50 p-3 rounded-md">
      <div className="flex items-center gap-2 mr-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          Filtros activos ({totalActiveFilters})
        </span>
      </div>
      
      <div className="flex flex-wrap gap-2 flex-1">
        <AnimatePresence>
          {/* Status filters */}
          {activeFilters.status.map(value => (
            <motion.div
              key={`status-${value}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className={`${getFilterColor("status", value)} h-6 px-2 flex items-center gap-1`}
              >
                <span>{getFilterLabel("status", value)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-current opacity-70 hover:opacity-100"
                  onClick={() => toggleFilter("status", value)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Quitar filtro</span>
                </Button>
              </Badge>
            </motion.div>
          ))}
          
          {/* Payment status filters */}
          {activeFilters.paymentStatus.map(value => (
            <motion.div
              key={`payment-${value}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className={`${getFilterColor("paymentStatus", value)} h-6 px-2 flex items-center gap-1`}
              >
                <span>Pago: {getFilterLabel("paymentStatus", value)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-current opacity-70 hover:opacity-100"
                  onClick={() => toggleFilter("paymentStatus", value)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Quitar filtro</span>
                </Button>
              </Badge>
            </motion.div>
          ))}
          
          {/* Warranty filters */}
          {activeFilters.warranty.map(value => (
            <motion.div
              key={`warranty-${value}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className={`${getFilterColor("warranty", value)} h-6 px-2 flex items-center gap-1`}
              >
                <span>{getFilterLabel("warranty", value)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-current opacity-70 hover:opacity-100"
                  onClick={() => toggleFilter("warranty", value)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Quitar filtro</span>
                </Button>
              </Badge>
            </motion.div>
          ))}
          
          {/* Technician filters */}
          {activeFilters.technician.map(value => (
            <motion.div
              key={`technician-${value}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className={`${getFilterColor("technician", value)} h-6 px-2 flex items-center gap-1`}
              >
                <span>Técnico: {getFilterLabel("technician", value)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-current opacity-70 hover:opacity-100"
                  onClick={() => toggleFilter("technician", value)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Quitar filtro</span>
                </Button>
              </Badge>
            </motion.div>
          ))}
          
          {/* Appliance filters */}
          {activeFilters.appliance.map(value => (
            <motion.div
              key={`appliance-${value}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className={`${getFilterColor("appliance", value)} h-6 px-2 flex items-center gap-1`}
              >
                <span>Equipo: {getFilterLabel("appliance", value)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-current opacity-70 hover:opacity-100"
                  onClick={() => toggleFilter("appliance", value)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Quitar filtro</span>
                </Button>
              </Badge>
            </motion.div>
          ))}
          
          {/* Creator filters */}
          {activeFilters.createdBy.map(value => (
            <motion.div
              key={`creator-${value}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className={`${getFilterColor("createdBy", value)} h-6 px-2 flex items-center gap-1`}
              >
                <span>Creado por: {getFilterLabel("createdBy", value)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-current opacity-70 hover:opacity-100"
                  onClick={() => toggleFilter("createdBy", value)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Quitar filtro</span>
                </Button>
              </Badge>
            </motion.div>
          ))}
          
          {/* Date range filter */}
          {dateRange.from && dateRange.to && (
            <motion.div
              key="date-range"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 h-6 px-2 flex items-center gap-1"
              >
                <span>Recepción: {formatDateRange(dateRange.from)} - {formatDateRange(dateRange.to)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-current opacity-70 hover:opacity-100"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Quitar filtro</span>
                </Button>
              </Badge>
            </motion.div>
          )}
          
          {/* Fecha Agendado range filter */}
          {fechaAgendadoRange?.from && fechaAgendadoRange?.to && (
            <motion.div
              key="fecha-agendado-range"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 h-6 px-2 flex items-center gap-1"
              >
                <span>Agenda: {formatDateRange(fechaAgendadoRange.from)} - {formatDateRange(fechaAgendadoRange.to)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-current opacity-70 hover:opacity-100"
                  onClick={() => setFechaAgendadoRange(undefined)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Quitar filtro</span>
                </Button>
              </Badge>
            </motion.div>
          )}
          
          {/* Fecha Captacion range filter */}
          {fechaCaptacionRange?.from && fechaCaptacionRange?.to && (
            <motion.div
              key="fecha-captacion-range"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Badge 
                variant="outline" 
                className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 h-6 px-2 flex items-center gap-1"
              >
                <span>Captación: {formatDateRange(fechaCaptacionRange.from)} - {formatDateRange(fechaCaptacionRange.to)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 ml-1 text-current opacity-70 hover:opacity-100"
                  onClick={() => setFechaCaptacionRange(undefined)}
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Quitar filtro</span>
                </Button>
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={resetFilters} 
        className="h-8 ml-auto"
      >
        <X className="mr-2 h-4 w-4" />
        Limpiar todos
      </Button>
    </div>
  );
}