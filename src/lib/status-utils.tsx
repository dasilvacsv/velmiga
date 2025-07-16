import { Badge } from "@/components/ui/badge"
import type { ReactNode } from "react"

// Function to get status color class based on status
export function getStatusColor(status: string): string {
  switch (status) {
    case "PREORDER":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    case "IN_PROGRESS":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
    case "COMPLETED":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    case "DELIVERED":
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    case "APROBADO":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    case "NO_APROBADO":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    case "PENDIENTE_AVISAR":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
    case "FACTURADO":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
    case "ENTREGA_GENERADA":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
    case "GARANTIA_APLICADA":
      return "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300"
    case "GARANTIA_RESUELTA":
      return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300"
    case "REPARANDO":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

// Function to get payment status color
export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    case "PARTIAL":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

// Function to get status text based on status code
export function getStatusText(status: string): string {
  switch (status) {
    case "PREORDER":
      return "Pre-orden"
    case "PENDING":
      return "Pendiente"
    case "ASSIGNED":
      return "Asignada"
    case "IN_PROGRESS":
      return "En Progreso"
    case "COMPLETED":
      return "Completada"
    case "DELIVERED":
      return "Entregada"
    case "CANCELLED":
      return "Cancelada"
    case "APROBADO":
      return "Aprobada"
    case "NO_APROBADO":
      return "No Aprobada"
    case "PENDIENTE_AVISAR":
      return "Pendiente Avisar"
    case "FACTURADO":
      return "Presupuestada"
    case "ENTREGA_GENERADA":
      return "Entrega Generada"
    case "GARANTIA_APLICADA":
      return "Garantía Aplicada"
    case "GARANTIA_RESUELTA":
      return "Garantía Resuelta"
    case "REPARANDO":
      return "Reparando"
    default:
      return status
  }
}

// Function to get payment status text
export function getPaymentStatusText(status: string): string {
  switch (status) {
    case "PAID":
      return "Pagado"
    case "PARTIAL":
      return "Parcial"
    case "PENDING":
      return "Pendiente"
    case "CANCELLED":
      return "Cancelado"
    default:
      return status
  }
}

// Function to get payment method text
export function getPaymentMethodText(method: string): string {
  switch (method) {
    case "CASH":
      return "Efectivo"
    case "CARD":
      return "Tarjeta"
    case "TRANSFER":
      return "Transferencia"
    case "MOBILE_PAYMENT":
      return "Pago Móvil"
    case "OTHER":
      return "Otro"
    default:
      return method
  }
}

// Function to get status dot color for history timeline
export function getStatusDotColor(status: string): string {
  switch (status) {
    case "PREORDER":
      return "bg-orange-500"
    case "PENDING":
      return "bg-blue-500"
    case "ASSIGNED":
      return "bg-indigo-500"
    case "IN_PROGRESS":
      return "bg-violet-500"
    case "APROBADO":
      return "bg-green-500"
    case "NO_APROBADO":
      return "bg-red-500"
    case "PENDIENTE_AVISAR":
      return "bg-amber-500"
    case "FACTURADO":
      return "bg-purple-500"
    case "COMPLETED":
      return "bg-green-500"
    case "ENTREGA_GENERADA":
      return "bg-indigo-500"
    case "DELIVERED":
      return "bg-slate-500"
    case "CANCELLED":
      return "bg-red-500"
    case "GARANTIA_APLICADA":
      return "bg-teal-500"
    case "GARANTIA_RESUELTA":
      return "bg-cyan-500"
    case "REPARANDO":
      return "bg-blue-500"
    default:
      return "bg-gray-500"
  }
}

// Helper component to render a status badge
export function StatusBadge({ status }: { status: string }): ReactNode {
  return (
    <Badge variant="outline" className={getStatusColor(status)}>
      {status === "PREORDER" ? "Convertir a Orden" : getStatusText(status)}
    </Badge>
  )
}

// Helper component to render a payment status badge
export function PaymentStatusBadge({ status }: { status: string }): ReactNode {
  return (
    <Badge variant="outline" className={getPaymentStatusColor(status)}>
      {getPaymentStatusText(status)}
    </Badge>
  )
}