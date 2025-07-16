"use client"

import { 
  ArrowUpDown, 
  CalendarIcon, 
  Users
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface SucursalFiltersProps {
  sucursales: any[]
  onSortChange: (field: string) => void
  currentSort: {
    field: string
    direction: string
  }
}

export function SucursalFilters({ 
  sucursales, 
  onSortChange, 
  currentSort 
}: SucursalFiltersProps) {
  const getDirectionIcon = (field: string) => {
    if (currentSort.field !== field) return null
    
    return currentSort.direction === 'asc' ? 
      <span className="ml-2">↑</span> : 
      <span className="ml-2">↓</span>
  }
  
  return (
    <div className="flex items-center gap-2 flex-wrap mb-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Ordenar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={currentSort.field === "name"}
            onCheckedChange={() => onSortChange("name")}
          >
            Nombre {getDirectionIcon("name")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={currentSort.field === "createdAt"}
            onCheckedChange={() => onSortChange("createdAt")}
          >
            Fecha de creación {getDirectionIcon("createdAt")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={currentSort.field === "updatedAt"}
            onCheckedChange={() => onSortChange("updatedAt")}
          >
            Última actualización {getDirectionIcon("updatedAt")}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}