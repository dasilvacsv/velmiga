import React from "react"
import { AlertCircle, Shield } from "lucide-react"
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

interface WarrantyInfoCardProps {
  order: any
  onSetWarrantyPeriod: () => void
  onReportDamage?: () => void
}

export function WarrantyInfoCard({ order, onSetWarrantyPeriod, onReportDamage }: WarrantyInfoCardProps) {
  // Check if warranty is available based on garantia dates and status
  const canApplyWarranty =
    order.status === "DELIVERED" &&
    ((order.garantiaEndDate && new Date(order.garantiaEndDate) > new Date()) || order.garantiaIlimitada)

  // Formatear la información de garantía
  const getWarrantyInfo = () => {
    if (order.garantiaIlimitada) {
      return (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Garantía Ilimitada
          </Badge>
          {order.garantiaPrioridad && getWarrantyPriorityBadge()}
        </div>
      )
    } else if (order.garantiaStartDate && order.garantiaEndDate) {
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span>Desde: {formatDate(order.garantiaStartDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            <span>Hasta: {formatDate(order.garantiaEndDate)}</span>
          </div>
        </div>
      )
    } else {
      return <span className="text-muted-foreground italic">No establecida</span>
    }
  }

  // Show warranty priority if available
  const getWarrantyPriorityBadge = () => {
    if (!order.garantiaPrioridad) return null

    let color = ""
    switch (order.garantiaPrioridad) {
      case "BAJA":
        color = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
        break
      case "MEDIA":
        color = "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
        break
      case "ALTA":
        color = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        break
    }

    return (
      <Badge variant="outline" className={`${color} ml-2`}>
        Prioridad: {order.garantiaPrioridad}
      </Badge>
    )
  }

  return (
    <Card className="overflow-hidden border-l-4 border-l-green-500 dark:border-l-green-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500 dark:text-green-400" />
          Información de Garantía
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <h3 className="font-medium text-muted-foreground">Estado</h3>
          <div className="mt-1">{getWarrantyInfo()}</div>
        </div>

        {/* If warranty has been applied, show reason and priority */}
        {order.status === "GARANTIA_APLICADA" && order.razonGarantia && (
          <div>
            <h3 className="font-medium text-muted-foreground">Razón de Garantía</h3>
            <p className="whitespace-pre-line bg-muted p-2 rounded text-xs mt-1">{order.razonGarantia}</p>
            <div className="mt-2 flex items-center">
              <h3 className="font-medium text-muted-foreground mr-2">Prioridad:</h3>
              {getWarrantyPriorityBadge()}
            </div>
          </div>
        )}

        {(order.status === "FACTURADO" ||
          order.status === "APROBADO" ||
          order.status === "NO_APROBADO" ||
          order.status === "PENDIENTE_AVISAR" ||
          order.status === "DELIVERED" ||
          order.status === "ENTREGA_GENERADA") && (
          <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-800">
            <p className="text-green-800 dark:text-green-300 flex items-center gap-2 text-xs">
              <AlertCircle className="h-4 w-4" />
              <span>Puede establecer una garantía para esta orden.</span>
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        {(order.status === "FACTURADO" ||
          order.status === "APROBADO" ||
          order.status === "NO_APROBADO" ||
          order.status === "PENDIENTE_AVISAR" ||
          order.status === "ENTREGA_GENERADA") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSetWarrantyPeriod}
            className="w-full justify-start hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 dark:hover:text-green-400"
          >
            <Shield className="mr-2 h-4 w-4" />
            {order.garantiaStartDate ? "Modificar Plazo" : "Establecer Plazo"}
          </Button>
        )}

        {canApplyWarranty && onReportDamage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReportDamage}
            className="w-full justify-start hover:bg-teal-50 hover:text-teal-600 dark:hover:bg-teal-950/30 dark:hover:text-teal-400"
          >
            <Shield className="mr-2 h-4 w-4" />
            Reportar Daño
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}