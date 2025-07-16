"use client"

import { useState } from "react"
import { SucursalDialog } from "@/features/sucursales/sucursal-dialog"
import { Button } from "@/components/ui/button"
import { Plus, Building2 } from "lucide-react"

export function SucursalesHeader({ userId }: { userId: string }) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <Building2 className="mr-3 h-8 w-8 text-primary" />
          Sucursales
        </h1>
        <p className="text-muted-foreground mt-1">
          Administra las sucursales y sus clientes asociados
        </p>
      </div>
      
      <Button 
        size="sm" 
        onClick={() => setIsCreateDialogOpen(true)} 
        className="md:self-start"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nueva Sucursal
      </Button>
      
      <SucursalDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        userId={userId}
      />
    </div>
  )
}