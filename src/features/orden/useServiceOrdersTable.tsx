import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState
} from "@tanstack/react-table";

import { OrderTableCell } from "./order-table-cell";
import { 
  ServiceOrder, 
  StatusOption, 
  PaymentStatusOption,
  WarrantyOption,
  ApplianceTypeOption,
  FacetedFilters
} from "./service-order";
import { getTableColumns } from "./tableColumns";

export function useServiceOrdersTable(initialOrders: ServiceOrder[]) {
  const router = useRouter();
  
  // State for table management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Default visible columns
    "client.name": true,
    "client.phone": true,
    technicianAssignments: true,
    status: true,
    paymentStatus: false,
    totalAmount: false,
    receivedDate: true,
    fechaAgendado: true,
    fechaCaptacion: false,
    warranty: false,
    "createdByUser.fullName": false,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<string>("all");
  
  // Active filters state
  const [activeFilters, setActiveFilters] = useState<{
    status: string[],
    paymentStatus: string[],
    warranty: string[],
    appliance: string[],
    createdBy: string[],
    technician: string[]
  }>({
    status: [],
    paymentStatus: [],
    warranty: [],
    appliance: [],
    createdBy: [],
    technician: []
  });
  
  // Date range state
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined,
  });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  
  // Date range for fechaAgendado
  const [fechaAgendadoRange, setFechaAgendadoRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  } | undefined>(undefined);
  
  // Date range for fechaCaptacion
  const [fechaCaptacionRange, setFechaCaptacionRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  } | undefined>(undefined);
  
  // Metrics state
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    completed: 0,
    delivered: 0,
    warranty: 0,
  });

  // Faceted filter counts
  const [facetedFilters, setFacetedFilters] = useState<FacetedFilters>({
    status: [] as StatusOption[],
    paymentStatus: [] as PaymentStatusOption[],
    warranty: [] as WarrantyOption[],
    appliance: [] as ApplianceTypeOption[],
    createdBy: [] as ApplianceTypeOption[],
    technician: [] as ApplianceTypeOption[]
  });

  // Get columns for the table
  const columns = useMemo(() => getTableColumns(), []);

  // Initialize table
  const table = useReactTable({
    data: initialOrders,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
    filterFns: {
      custom: (row, columnId, filterValue) => {
        const searchValue = String(filterValue).toLowerCase();
        
        // Search in order number
        if (row.getValue("orderNumber")?.toString().toLowerCase().includes(searchValue)) {
          return true;
        }
        
        // Search in client name
        if (row.original.client?.name?.toLowerCase().includes(searchValue)) {
          return true;
        }
        
        // Search in client phone
        if (row.original.client?.phone?.toLowerCase().includes(searchValue)) {
          return true;
        }
        
        // Search in technician names
        const technicianAssignments = row.original.technicianAssignments || [];
        if (technicianAssignments.some(assignment => 
          assignment.isActive && assignment.technician?.name?.toLowerCase().includes(searchValue)
        )) {
          return true;
        }
        
        return false;
      }
    },
    globalFilterFn: "custom"
  });

  // Apply date filter
  useEffect(() => {
    if (dateRange.from && dateRange.to) {
      table.getColumn("receivedDate")?.setFilterValue([dateRange.from, dateRange.to]);
    } else {
      table.getColumn("receivedDate")?.setFilterValue(undefined);
    }
  }, [dateRange, table]);
  
  // Apply fechaAgendado filter
  useEffect(() => {
    if (fechaAgendadoRange?.from && fechaAgendadoRange?.to) {
      table.getColumn("fechaAgendado")?.setFilterValue([fechaAgendadoRange.from, fechaAgendadoRange.to]);
    } else {
      table.getColumn("fechaAgendado")?.setFilterValue(undefined);
    }
  }, [fechaAgendadoRange, table]);
  
  // Apply fechaCaptacion filter
  useEffect(() => {
    if (fechaCaptacionRange?.from && fechaCaptacionRange?.to) {
      table.getColumn("fechaCaptacion")?.setFilterValue([fechaCaptacionRange.from, fechaCaptacionRange.to]);
    } else {
      table.getColumn("fechaCaptacion")?.setFilterValue(undefined);
    }
  }, [fechaCaptacionRange, table]);
  
  // Apply active filters from facets
  useEffect(() => {
    // Status filters
    if (activeFilters.status.length > 0) {
      table.getColumn("status")?.setFilterValue(activeFilters.status);
    } else {
      table.getColumn("status")?.setFilterValue(undefined);
    }
    
    // Payment status filters
    if (activeFilters.paymentStatus.length > 0) {
      table.getColumn("paymentStatus")?.setFilterValue(activeFilters.paymentStatus);
    } else {
      table.getColumn("paymentStatus")?.setFilterValue(undefined);
    }
    
    // Warranty filters
    if (activeFilters.warranty.length > 0) {
      table.getColumn("warranty")?.setFilterValue(activeFilters.warranty);
    } else {
      table.getColumn("warranty")?.setFilterValue(undefined);
    }
    
    // Appliance filters
    if (activeFilters.appliance.length > 0) {
      table.getColumn("appliances")?.setFilterValue(activeFilters.appliance);
    } else {
      table.getColumn("appliances")?.setFilterValue(undefined);
    }
    
    // Creator filters
   if (activeFilters.createdBy.length > 0) {
  const filterValues = activeFilters.createdBy.map(v => v.toLowerCase());
  table.getColumn("createdByUser.fullName")?.setFilterValue(filterValues);
} else {
  table.getColumn("createdByUser.fullName")?.setFilterValue(undefined);
}
    
    // Technician filters
    if (activeFilters.technician.length > 0) {
      table.getColumn("technicianAssignments")?.setFilterValue(activeFilters.technician);
    } else {
      table.getColumn("technicianAssignments")?.setFilterValue(undefined);
    }
  }, [activeFilters, table]);

  // Calculate metrics based on filtered data
  useEffect(() => {
    const filteredData = table.getFilteredRowModel().rows;
    
    const total = filteredData.length;
    const pending = filteredData.filter(row => 
      ["PREORDER", "PENDING", "ASSIGNED", "PENDIENTE_AVISAR", "REPARANDO"].includes(row.original.status)
    ).length;
    const completed = filteredData.filter(row => 
      ["COMPLETED", "APROBADO", "FACTURADO", "GARANTIA_APLICADA"].includes(row.original.status)
    ).length;
    const delivered = filteredData.filter(row => 
      row.original.status === "DELIVERED"
    ).length;
    
    const warranty = filteredData.filter(row => OrderTableCell.isUnderWarranty(row.original)).length;
    
    setMetrics({
      total,
      pending,
      completed,
      delivered,
      warranty,
    });
  }, [table.getFilteredRowModel().rows]);
  
  // Calculate faceted filter counts
  useEffect(() => {
    // Get all rows before filtering
    const rows = table.getPreFilteredRowModel().rows;
    
    // Status counts
    const statusCounts = new Map<string, number>();
    OrderTableCell.statusOptions.forEach(option => {
      const count = rows.filter(row => row.original.status === option.value).length;
      statusCounts.set(option.value, count);
    });
    
    // Payment status counts
    const paymentStatusCounts = new Map<string, number>();
    OrderTableCell.paymentStatusOptions.forEach(option => {
      const count = rows.filter(row => row.original.paymentStatus === option.value).length;
      paymentStatusCounts.set(option.value, count);
    });
    
    // Warranty counts
    const warrantyCounts = {
      active: rows.filter(row => OrderTableCell.isUnderWarranty(row.original)).length,
      unlimited: rows.filter(row => row.original.garantiaIlimitada).length,
      none: rows.filter(row => !row.original.garantiaEndDate && !row.original.garantiaIlimitada).length,
      expiring: rows.filter(row => {
        if (!row.original.garantiaEndDate || row.original.garantiaIlimitada) return false;
        const daysLeft = OrderTableCell.daysLeftInWarranty(row.original);
        return daysLeft !== null && daysLeft > 0 && daysLeft < 30;
      }).length
    };
    
    // Appliance type counts
    const applianceTypes = new Map<string, number>();
    rows.forEach(row => {
      if (row.original.appliances && row.original.appliances.length > 0) {
        row.original.appliances.forEach(appliance => {
          if (appliance.clientAppliance && appliance.clientAppliance.applianceType) {
            const typeName = appliance.clientAppliance.applianceType.name;
            applianceTypes.set(
              typeName, 
              (applianceTypes.get(typeName) || 0) + 1
            );
          }
        });
      }
    });
    
    // Creator counts
    const creatorCounts = new Map<string, number>();
    rows.forEach(row => {
  if (row.original.createdByUser?.fullName) {
    const name = row.original.createdByUser.fullName.trim().toLowerCase(); // Normalizar
    creatorCounts.set(name, (creatorCounts.get(name) || 0) + 1);
  }
});
    
    // Technician counts
    const technicianCounts = new Map<string, number>();
    rows.forEach(row => {
      const activeAssignments = row.original.technicianAssignments.filter(a => a.isActive);
      activeAssignments.forEach(assignment => {
        if (assignment.technician) {
          const name = assignment.technician.name;
          technicianCounts.set(name, (technicianCounts.get(name) || 0) + 1);
        }
      });
    });
    
    // Update faceted filters state
    setFacetedFilters({
      status: OrderTableCell.statusOptions.map(option => ({
        ...option,
        count: statusCounts.get(option.value) || 0
      })),
      paymentStatus: OrderTableCell.paymentStatusOptions.map(option => ({
        ...option,
        count: paymentStatusCounts.get(option.value) || 0
      })),
      warranty: OrderTableCell.warrantyOptions.map(option => ({
        ...option,
        count: warrantyCounts[option.value as keyof typeof warrantyCounts] || 0
      })),
      appliance: Array.from(applianceTypes.entries()).map(([name, count]) => ({
        value: name,
        label: name,
        count
      })).sort((a, b) => b.count - a.count),
      createdBy: Array.from(creatorCounts.entries()).map(([name, count]) => ({
        value: name,
        label: name,
        count
      })).sort((a, b) => b.count - a.count),
      technician: Array.from(technicianCounts.entries()).map(([name, count]) => ({
        value: name,
        label: name,
        count
      })).sort((a, b) => b.count - a.count)
    });
  }, [initialOrders, table.getPreFilteredRowModel().rows]);

  // Toggle a faceted filter
  const toggleFilter = (type: keyof typeof activeFilters, value: string) => {
    setActiveFilters(prev => {
      const newFilters = {...prev};
      
      if (newFilters[type].includes(value)) {
        // Remove filter if already active
        newFilters[type] = newFilters[type].filter(v => v !== value);
      } else {
        // Add filter
        newFilters[type] = [...newFilters[type], value];
      }
      
      return newFilters;
    });
  };
  
  // Reset all filters
  const resetFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
    setDateRange({ from: undefined, to: undefined });
    setFechaAgendadoRange(undefined);
    setFechaCaptacionRange(undefined);
    setActiveFilters({
      status: [],
      paymentStatus: [],
      warranty: [],
      appliance: [],
      createdBy: [],
      technician: []
    });
    table.resetColumnFilters();
  };
  
  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return globalFilter !== "" || 
           columnFilters.length > 0 || 
           (dateRange.from !== undefined && dateRange.to !== undefined) ||
           (fechaAgendadoRange?.from !== undefined && fechaAgendadoRange?.to !== undefined) ||
           (fechaCaptacionRange?.from !== undefined && fechaCaptacionRange?.to !== undefined) ||
           Object.values(activeFilters).some(arr => arr.length > 0);
  }, [globalFilter, columnFilters, dateRange, fechaAgendadoRange, fechaCaptacionRange, activeFilters]);

  return {
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
    isMobile,
    hasActiveFilters,
    router
  };
}