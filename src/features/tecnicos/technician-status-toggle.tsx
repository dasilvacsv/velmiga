"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { AlertCircle } from "lucide-react"
import { updateTechnician } from "./technicians"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TechnicianStatusToggleProps {
  technicianId: string
  isActive: boolean
  inCard?: boolean
}

export function TechnicianStatusToggle({ technicianId, isActive, inCard = false }: TechnicianStatusToggleProps) {
  const [status, setStatus] = useState(isActive)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleStatusChange = async (checked: boolean) => {
    setIsUpdating(true)
    
    try {
      const result = await updateTechnician(technicianId, {
        // We only update the is_active field, but we need to pass a valid object
        name: "", // These values will be ignored by the server
        phone: null,
        is_active: checked
      })
      
      if (result.success) {
        setStatus(checked)
        toast({
          title: checked ? "Técnico activado" : "Técnico desactivado",
          description: `El técnico ha sido ${checked ? "activado" : "desactivado"} correctamente.`,
          variant: checked ? "default" : "destructive",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar el estado del técnico",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating technician status:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al actualizar el estado del técnico",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (inCard) {
    return (
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor={`tech-status-${technicianId}`} className="text-base">Estado</Label>
          <p className="text-sm text-muted-foreground">
            {status ? "Técnico activo en el sistema" : "Técnico inactivo en el sistema"}
          </p>
        </div>
        <Switch
          id={`tech-status-${technicianId}`}
          checked={status}
          onCheckedChange={handleStatusChange}
          disabled={isUpdating}
          className={status ? "bg-green-500" : "bg-red-500"}
        />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center space-x-2">
            {isUpdating && <AlertCircle className="h-4 w-4 text-muted-foreground animate-pulse" />}
            <Switch
              id={`tech-status-${technicianId}`}
              checked={status}
              onCheckedChange={handleStatusChange}
              disabled={isUpdating}
              className={status ? "bg-green-500" : "bg-red-500"}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{status ? "Técnico activo" : "Técnico inactivo"}</p>
          <p className="text-xs text-muted-foreground">Click para cambiar</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}