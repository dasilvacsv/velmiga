"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { createServiceOrder } from "./actions"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface SelectedAppliance {
  id: string
  name: string
  brandId: string
  brandName?: string
  applianceTypeId: string
  applianceTypeName?: string
  model?: string
  serialNumber?: string
  falla: string
}

interface OrdenFormActionsProps {
  clientId: string
  applianceId: string
  userId: string
  isValid: boolean
  isPreOrder?: boolean
  falla?: string
  fechaAgendado?: Date | null
}

export function OrdenFormActions({
  clientId,
  applianceId,
  userId,
  isValid,
  isPreOrder = false,
  falla = "",
  fechaAgendado = null
}: OrdenFormActionsProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreateOrder = async () => {
    if (!isValid || !clientId || !applianceId) {
      toast.error("Seleccione un cliente y un electrodoméstico para crear la orden")
      return
    }

    setIsSubmitting(true)
    
    try {
      const result = await createServiceOrder(
        {
          clientId,
          applianceId,
          isPreOrder,
          falla,
          fechaAgendado: fechaAgendado || undefined
        },
        userId
      )

      if (result.success && result.data) {
        toast.success("Orden creada correctamente")
        router.push(`/ordenes/${result.data.id}`)
      } else {
        toast.error(result.error || "Error al crear la orden")
      }
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("Ocurrió un error al crear la orden")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
      <Button 
        variant="outline" 
        onClick={() => router.push("/ordenes")}
        disabled={isSubmitting}
      >
        Cancelar
      </Button>
      <Button
        onClick={handleCreateOrder}
        disabled={!isValid || isSubmitting}
      >
        {isSubmitting ? 'Creando...' : (isPreOrder ? 'Crear Pre-Orden' : 'Crear Orden')}
      </Button>
    </div>
  )
} 