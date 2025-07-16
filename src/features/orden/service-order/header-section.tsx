import React from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, CreditCard, Edit, Percent, Printer, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getStatusColor, getStatusText } from "@/lib/status-utils"

interface HeaderSectionProps {
  order: any
  onShowStatusDialog: () => void
}

export function HeaderSection({ order, onShowStatusDialog }: HeaderSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild className="h-9 w-9">
          <Link href="/ordenes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 flex-wrap">
            Orden #{order.orderNumber}
            <Badge variant="outline" className={`${getStatusColor(order.status)} ml-1`}>
              {order.status === "PREORDER" ? "Convertir a Orden" : getStatusText(order.status)}
            </Badge>
            {order.garantiaPrioridad && order.status === "GARANTIA_APLICADA" && (
              <Badge
                variant="outline"
                className={`${getWarrantyPriorityColor(order.garantiaPrioridad)} ml-1`}
              >
                Prioridad: {order.garantiaPrioridad}
              </Badge>
            )}
            {order.presupuestoAmount && (
              <Badge
                variant="outline"
                className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800 ml-1"
              >
                <CreditCard className="h-3.5 w-3.5 mr-1" />
                Presupuesto: {formatCurrency(Number(order.presupuestoAmount))}
              </Badge>
            )}
            {order.includeIVA && (
              <Badge
                variant="outline"
                className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800 ml-1"
              >
                <Percent className="h-3.5 w-3.5 mr-1" />
                IVA 16%
              </Badge>
            )}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>Creada el {formatDate(order.receivedDate)}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
        <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
          <Link href={`/ordenes/${order.id}/print`} target="_blank" className="flex items-center">
            <Printer className="h-4 w-4 mr-1" />
            <span>Imprimir</span>
          </Link>
        </Button>


      </div>
    </div>
  )
}

// Helper function for warranty priority color
function getWarrantyPriorityColor(priority: string): string {
  switch (priority) {
    case "BAJA":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    case "MEDIA":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    case "ALTA":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}