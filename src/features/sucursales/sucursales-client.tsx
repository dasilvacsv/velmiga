"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { SucursalCard } from "@/features/sucursales/components/sucursal-card"
import { SucursalDialog } from "@/features/sucursales/sucursal-dialog"
import { SucursalFilters } from "@/features/sucursales/components/sucursal-filters"
import { SucursalMetrics } from "@/features/sucursales/components/sucursal-metrics"
import { SucursalEditDialog } from "@/features/sucursales/components/sucursal-edit-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter, usePathname } from "next/navigation"
import { EmptyState } from "@/features/sucursales/components/empty-state"

interface SucursalesClientProps {
  initialSucursales: any[]
  clientsMap: Record<string, any[]>
  userId: string
  initialSort: {
    field: string
    direction: string
  }
  initialFilter: string
}

export function SucursalesClient({
  initialSucursales,
  clientsMap,
  userId,
  initialSort,
  initialFilter
}: SucursalesClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [sucursales, setSucursales] = useState(initialSucursales)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedSucursal, setSelectedSucursal] = useState<any>(null)
  const [sortConfig, setSortConfig] = useState(initialSort)
  const [searchTerm, setSearchTerm] = useState(initialFilter)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialFilter)
  
  // Update URL when sort or filter changes
  useEffect(() => {
    const params = new URLSearchParams()
    
    if (sortConfig.field !== "name") {
      params.set("sort", sortConfig.field)
    }
    
    if (sortConfig.direction !== "asc") {
      params.set("direction", sortConfig.direction)
    }
    
    if (debouncedSearchTerm) {
      params.set("filter", debouncedSearchTerm)
    }
    
    const queryString = params.toString()
    const url = queryString 
      ? `${pathname}?${queryString}` 
      : pathname
    
    router.push(url, { scroll: false })
  }, [sortConfig, debouncedSearchTerm, pathname, router])
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchTerm])
  
  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === "asc" ? "desc" : "asc"
    }))
  }
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }
  
  const handleCreateSuccess = (newSucursal: any) => {
    setSucursales(prev => [...prev, newSucursal])
  }
  
  const handleEdit = (sucursal: any) => {
    setSelectedSucursal(sucursal)
    setIsEditDialogOpen(true)
  }
  
  const handleEditSuccess = (updatedSucursal: any) => {
    setSucursales(prev => 
      prev.map(s => s.id === updatedSucursal.id ? updatedSucursal : s)
    )
  }
  
  const handleDelete = (deletedId: string) => {
    setSucursales(prev => prev.filter(s => s.id !== deletedId))
  }
  
  // Apply filter and sorting
  const filteredSucursales = useMemo(() => {
    let filtered = [...sucursales]
    
    // Apply search filter
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase()
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(searchLower) || 
        (s.header && s.header.toLowerCase().includes(searchLower))
      )
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      const fieldA = a[sortConfig.field]
      const fieldB = b[sortConfig.field]
      
      if (!fieldA && !fieldB) return 0
      if (!fieldA) return 1
      if (!fieldB) return -1
      
      const comparison = String(fieldA).localeCompare(String(fieldB))
      return sortConfig.direction === "asc" ? comparison : -comparison
    })
  }, [sucursales, debouncedSearchTerm, sortConfig])
  
  // Calculate client statistics for metrics
  const clientStats = useMemo(() => {
    let totalClients = 0
    let maxClients = 0
    let sucursalWithMostClients = ""
    
    Object.entries(clientsMap).forEach(([sucursalId, clients]) => {
      const count = clients.length
      totalClients += count
      
      if (count > maxClients) {
        maxClients = count
        sucursalWithMostClients = sucursalId
      }
    })
    
    const avgClientsPerSucursal = sucursales.length 
      ? Math.round(totalClients / sucursales.length * 10) / 10 
      : 0
      
    return {
      totalClients,
      sucursalCount: sucursales.length,
      avgClientsPerSucursal,
      maxClients,
      sucursalWithMostClients
    }
  }, [clientsMap, sucursales])
  
  return (
    <div className="space-y-6">
      <SucursalMetrics 
        stats={clientStats} 
        sucursales={sucursales}
      />
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar sucursales..."
            className="pl-10"
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Sucursal
        </Button>
      </div>
      
      <SucursalFilters 
        sucursales={sucursales}
        onSortChange={handleSort}
        currentSort={sortConfig}
      />
      
      {filteredSucursales.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSucursales.map(sucursal => (
            <SucursalCard
              key={sucursal.id}
              sucursal={sucursal}
              clients={clientsMap[sucursal.id] || []}
              onEdit={() => handleEdit(sucursal)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No se encontraron sucursales"
          description={searchTerm 
            ? "Intenta con otra búsqueda o crea una nueva sucursal" 
            : "Comienza creando tu primera sucursal"}
          action={
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Sucursal
            </Button>
          }
        />
      )}
      
      <SucursalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        userId={userId}
        onSuccess={handleCreateSuccess}
      />
      
      {selectedSucursal && (
        <SucursalEditDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          sucursal={selectedSucursal}
          userId={userId}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}