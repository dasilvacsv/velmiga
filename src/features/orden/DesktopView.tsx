import React, { useRef, useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, ChevronLeft, ChevronRight, X, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { flexRender } from "@tanstack/react-table";
import { FilterPanel } from "./filter-panel";
import { EmptyState } from "./empty-state";
import { OrderRowActions } from "./order-row-actions";
import { getColumnWidth } from "./tableColumns";

interface DesktopViewProps {
  table: any;
  isFilterPanelOpen: boolean;
  toggleFilterPanel: () => void;
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
  initialOrders: any[];
}

export default function DesktopView({
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
}: DesktopViewProps) {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [showScroller, setShowScroller] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [tableWidth, setTableWidth] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    if (!tableContainer) return;
    
    const handleScroll = () => setScrollPosition(tableContainer.scrollLeft);
    
    const updateWidths = () => {
      if (tableContainer) {
        const tableElement = tableContainer.querySelector('table');
        setTableWidth(tableElement?.offsetWidth || 0);
        setContainerWidth(tableContainer.offsetWidth);
        setShowScroller(Boolean(tableElement?.offsetWidth && tableElement.offsetWidth > tableContainer.offsetWidth));
      }
    };
    
    updateWidths();
    
    tableContainer.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', updateWidths);
    
    const resizeObserver = new ResizeObserver(updateWidths);
    if (tableContainer.querySelector('table')) {
      resizeObserver.observe(tableContainer.querySelector('table')!);
    }
    
    return () => {
      tableContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateWidths);
      resizeObserver.disconnect();
    };
  }, []);
  
  const scrollTable = (direction: 'left' | 'right') => {
    if (tableContainerRef.current) {
      const scrollAmount = containerWidth * 0.75;
      const newPosition = direction === 'left' 
        ? Math.max(0, scrollPosition - scrollAmount)
        : Math.min(tableWidth - containerWidth, scrollPosition + scrollAmount);
      
      tableContainerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  const canScrollLeft = scrollPosition > 0;
  const canScrollRight = tableWidth > containerWidth && scrollPosition < tableWidth - containerWidth;

  return (
    <div className="flex h-[calc(100vh-150px)]">
      {/* Filter Panel */}
      <AnimatePresence>
        {isFilterPanelOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-64 min-w-64 pr-4 border-r h-full"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden pl-4">
        <div className="h-full flex flex-col gap-4">
          {/* Header Controls */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={toggleFilterPanel}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              {hasActiveFilters && (
                <span className="flex h-2 w-2 rounded-full bg-primary"/>
              )}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Settings className="h-4 w-4 mr-2" />
                  Columnas
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Mostrar columnas</h4>
                  <div className="max-h-[300px] overflow-y-auto pr-2 -mr-2 grid grid-cols-2 gap-1">
                    {table.getAllColumns()
                      .filter(column => column.getCanHide())
                      .map(column => (
                        <div key={column.id} className="flex items-center py-1">
                          <Checkbox
                            id={`column-${column.id}`}
                            checked={column.getIsVisible()}
                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                          />
                          <label
                            htmlFor={`column-${column.id}`}
                            className="text-sm font-medium ml-2 cursor-pointer"
                          >
                            {column.columnDef.header as string}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Scroll Indicators */}
          {showScroller && (
            <div className="flex justify-between">
              <Button
                variant="ghost"
                size="icon"
                disabled={!canScrollLeft}
                onClick={() => scrollTable('left')}
                className={`h-8 w-8 ${!canScrollLeft ? 'opacity-0' : 'opacity-100'}`}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                disabled={!canScrollRight}
                onClick={() => scrollTable('right')}
                className={`h-8 w-8 ${!canScrollRight ? 'opacity-0' : 'opacity-100'}`}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Table */}
          <Card className="overflow-hidden border bg-card flex-1">
            <CardContent className="p-0 h-full">
              <div 
                className="w-full overflow-x-auto h-full"
                ref={tableContainerRef}
                style={{ scrollBehavior: 'smooth' }}
              >
                <Table className="w-full">
                  <TableHeader className="bg-muted/40 sticky top-0 z-10">
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="hover:bg-transparent border-b">
                        {headerGroup.headers.map((header) => (
                          <TableHead 
                            key={header.id} 
                            className="text-muted-foreground font-medium text-xs py-2 px-3 whitespace-nowrap"
                            style={{ 
                              width: getColumnWidth(header.column.id),
                              minWidth: getColumnWidth(header.column.id)
                            }}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      <AnimatePresence>
                        {table.getRowModel().rows.map((row) => (
                          <motion.tr
                            key={row.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="group hover:bg-muted/50 transition-colors border-b last:border-b-0"
                          >
                            {row.getVisibleCells().map((cell) => (
                              <TableCell 
                                key={cell.id} 
                                className={`py-2 px-3 text-sm align-middle whitespace-nowrap ${
                                  cell.column.id !== "actions" && cell.column.id !== "select" ? "cursor-pointer" : ""
                                }`}
                                style={{ 
                                  width: getColumnWidth(cell.column.id),
                                  minWidth: getColumnWidth(cell.column.id)
                                }}
                                onClick={() => {
                                  if (cell.column.id !== "actions" && cell.column.id !== "select") {
                                    window.location.href = `/ordenes/${row.original.id}`;
                                  }
                                }}
                              >
                                {cell.column.id === "actions" ? (
                                  <OrderRowActions order={row.original} />
                                ) : (
                                  flexRender(cell.column.columnDef.cell, cell.getContext())
                                )}
                              </TableCell>
                            ))}
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    ) : (
                      <TableRow>
                        <TableCell colSpan={table.getAllColumns().length} className="h-24 text-center p-0">
                          <EmptyState 
                            hasActiveFilters={hasActiveFilters}
                            resetFilters={resetFilters}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length > 0 && (
                <>Mostrando {table.getFilteredRowModel().rows.length} de {initialOrders.length} órdenes</>
              )}
            </div>
            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium whitespace-nowrap">Filas por página</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => table.setPageSize(Number(value))}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  Página {table.getState().pagination.pageIndex + 1} de{" "}
                  {table.getPageCount() || 1}
                </p>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Ir a primera página</span>
                    <ChevronLeft className="h-4 w-4" />
                    <ChevronLeft className="h-4 w-4 -ml-[10px]" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Ir a página anterior</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Ir a página siguiente</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Ir a última página</span>
                    <ChevronRight className="h-4 w-4" />
                    <ChevronRight className="h-4 w-4 -ml-[10px]" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}