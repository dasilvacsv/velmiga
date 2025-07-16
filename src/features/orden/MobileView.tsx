import React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { FilterPanel } from "./filter-panel";
import { EmptyState } from "./empty-state";
import { OrderTableCell } from "./order-table-cell";
import { OrderRowActions } from "./order-row-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ServiceOrder, FacetedFilters } from "./service-order";

interface MobileViewProps {
  table: any;
  isFilterPanelOpen: boolean;
  toggleFilterPanel: () => void;
  facetedFilters: FacetedFilters;
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
  fechaAgendadoRange: { from: Date | undefined; to: Date | undefined; } | undefined;
  setFechaAgendadoRange: React.Dispatch<
    React.SetStateAction<
      | { from: Date | undefined; to: Date | undefined; }
      | undefined
    >
  >;
  fechaCaptacionRange: { from: Date | undefined; to: Date | undefined; } | undefined;
  setFechaCaptacionRange: React.Dispatch<
    React.SetStateAction<
      | { from: Date | undefined; to: Date | undefined; }
      | undefined
    >
  >;
  hasActiveFilters: boolean;
  resetFilters: () => void;
  initialOrders: ServiceOrder[];
}

export default function MobileView({
  table,
  isFilterPanelOpen,
  toggleFilterPanel,
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
  initialOrders,
}: MobileViewProps) {
  const router = useRouter();
  const rows = table.getRowModel().rows;

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile Filter Panel */}
      <div
        className={`
          fixed top-0 left-0 h-full z-40 bg-background w-[85%] max-w-[320px]
          transform transition-transform duration-300 ease-in-out
          ${isFilterPanelOpen ? 'translate-x-0' : '-translate-x-full'}
          shadow-xl overflow-y-auto
        `}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Filtros</h3>
            <Button variant="ghost" size="icon" onClick={toggleFilterPanel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <FilterPanel
            facetedFilters={facetedFilters}
            activeFilters={activeFilters}
            toggleFilter={toggleFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            fechaAgendadoRange={fechaAgendadoRange}
            setFechaAgendadoRange={setFechaAgendadoRange}
            fechaCaptacionRange={fechaCaptacionRange}
            setFechaCaptacionRange={setFechaCaptacionRange}
            hasActiveFilters={hasActiveFilters}
            resetFilters={resetFilters}
          />
        </div>
      </div>

      {isFilterPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 backdrop-blur-sm"
          onClick={toggleFilterPanel}
        />
      )}
      
      {/* Mobile Content */}
      <div className="space-y-4">
        {rows?.length ? (
          <AnimatePresence>
            {rows.map((row) => (
              <motion.div
                key={row.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mb-4"
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Card Header */}
                    <div className="flex items-center justify-between bg-muted/30 p-3 border-b">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={row.getIsSelected()}
                          onChange={(e) => row.toggleSelected(e.target.checked)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                        />
                        <div className="font-medium">
                          <OrderTableCell.OrderNumber order={row.original} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <OrderTableCell.Status status={row.original.status} />
                      </div>
                    </div>
                    
                    {/* Card Content */}
                    <div 
                      className="p-3 space-y-3 cursor-pointer"
                      onClick={() => router.push(`/ordenes/${row.original.id}`)}
                    >
                      {/* Client & Phone */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-muted-foreground">Cliente</p>
                          <p className="font-medium">{row.original.client.name}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-semibold text-muted-foreground">Teléfono</p>
                          <p className="font-medium">{row.original.client.phone || '-'}</p>
                        </div>
                      </div>
                      
                      {/* Appliance & Technician */}
                      <div className="flex justify-between items-start pt-2 border-t">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-muted-foreground">Electrodoméstico</p>
                          <div>
                            <OrderTableCell.Appliances appliances={row.original.appliances} />
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-semibold text-muted-foreground">Técnico</p>
                          <OrderTableCell.Technicians assignments={row.original.technicianAssignments} />
                        </div>
                      </div>
                      
                      {/* Dates */}
                      <div className="flex justify-between items-start pt-2 border-t">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-muted-foreground">Fecha Recepción</p>
                          <p>{formatDate(row.original.receivedDate)}</p>
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-sm font-semibold text-muted-foreground">Fecha Agenda</p>
                          <p>{row.original.fechaAgendado ? formatDate(row.original.fechaAgendado) : '-'}</p>
                        </div>
                      </div>
                      
                      {/* Warranty */}
                      {OrderTableCell.isUnderWarranty(row.original) && (
                        <div className="pt-2 mt-2 border-t">
                          <Badge className="bg-blue-500 hover:bg-blue-600">
                            <OrderTableCell.Warranty order={row.original} />
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="border-t p-3 bg-muted/10">
                      <OrderRowActions order={row.original} />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <Card>
            <CardContent className="p-0">
              <EmptyState 
                hasActiveFilters={hasActiveFilters}
                resetFilters={resetFilters}
              />
            </CardContent>
          </Card>
        )}
        
        {/* Mobile Pagination */}
        {rows.length > 0 && (
          <div className="flex flex-col items-center gap-4 my-4 pb-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {rows.length} de {initialOrders.length} órdenes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                className="h-8 w-8 p-0"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}