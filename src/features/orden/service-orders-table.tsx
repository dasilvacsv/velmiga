"use client"

import React, { useState, useEffect } from "react";
import DesktopView from "./DesktopView";
import MobileView from "./MobileView"; // Asegúrate de tener este componente
import { useServiceOrdersTable } from "./useServiceOrdersTable";
import { MetricsCards } from "./metrics-cards";
import { ActiveFiltersBar } from "./active-filters-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, RefreshCcw, SlidersHorizontal } from "lucide-react";
import { Toast } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";

interface ServiceOrdersTableProps {
  orders: any[];
}

export function ServiceOrdersTable({ orders: initialOrders }: ServiceOrdersTableProps) {
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Inicializar la lógica de la tabla
  const {
    table,
    activeTab,
    setActiveTab,
    globalFilter,
    setGlobalFilter,
    metrics,
    facetedFilters,
    activeFilters,
    dateRange,
    setDateRange,
    fechaAgendadoRange,
    setFechaAgendadoRange,
    fechaCaptacionRange,
    setFechaCaptacionRange,
    toggleFilter,
    resetFilters,
    hasActiveFilters,
    router,
    isMobile // Añadir desde el hook modificado
  } = useServiceOrdersTable(initialOrders);

  // Manejador de cambio de pestaña
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Actualización manual
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Éxito",
        description: "Datos actualizados correctamente",
        variant: "default",
      });
    }, 800);
  };

  // Alternar panel de filtros
  const toggleFilterPanel = () => {
    setIsFilterPanelOpen(prev => !prev);
  };

  return (
    <div className="space-y-4">
      {/* Navegación por pestañas */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto p-1 justify-start gap-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Todas
          </TabsTrigger>
        </TabsList>
        
        {/* Tarjetas de métricas */}
        <MetricsCards 
          metrics={metrics || { total: 0, pending: 0, completed: 0, delivered: 0, warranty: 0 }} 
          totalOrders={initialOrders.length} 
          hasActiveFilters={hasActiveFilters} 
        />
        
        {/* Búsqueda y filtros */}
        <div className="flex flex-col space-y-3 mb-4">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex flex-1 gap-2">
              {/* Barra de búsqueda */}
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, cliente o técnico..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8 focus:ring-2 focus:ring-primary/20"
                />
              </div>
              
              {/* Botón de filtros */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFilterPanel}
                className="h-9 w-9 shrink-0"
                title="Filtros"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="sr-only">Filtros</span>
              </Button>
              
              {/* Botón de actualizar */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-9 w-9 shrink-0"
                title="Actualizar datos"
              >
                <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="sr-only">Actualizar</span>
              </Button>
            </div>
          </div>
          
          {/* Barra de filtros activos */}
          {hasActiveFilters && (
            <ActiveFiltersBar 
              resetFilters={resetFilters} 
              activeFilters={activeFilters}
              facetedFilters={facetedFilters}
              toggleFilter={toggleFilter}
              dateRange={dateRange}
              setDateRange={setDateRange}
              fechaAgendadoRange={fechaAgendadoRange}
              setFechaAgendadoRange={setFechaAgendadoRange}
              fechaCaptacionRange={fechaCaptacionRange}
              setFechaCaptacionRange={setFechaCaptacionRange}
            />
          )}
        </div>
        
        {/* Vista condicional responsive */}
        {isMobile ? (
          <MobileView
            table={table}
            isFilterPanelOpen={isFilterPanelOpen}
            toggleFilterPanel={toggleFilterPanel}
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
            initialOrders={initialOrders}
          />
        ) : (
          <DesktopView
            table={table}
            isFilterPanelOpen={isFilterPanelOpen}
            toggleFilterPanel={toggleFilterPanel}
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
            initialOrders={initialOrders}
          />
        )}
      </Tabs>
    </div>
  );
}