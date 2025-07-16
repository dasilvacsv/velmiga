"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, XCircle, Calendar, ArrowLeft, Info, RefreshCw, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTheme } from "next-themes"
import { deactivateTechnicianAssignment, sendWhatsappMessage, updateServiceOrder } from "./actions"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { formatDate } from "date-fns"

// Import components
import { HeaderSection } from "@/features/orden/service-order/header-section"
import { ClientInfoCard } from "@/features/orden/service-order/client-info-card"
import { NotificationToggleCard } from "@/features/orden/service-order/notification-toggle-card"
import { ApplianceInfoCard } from "@/features/orden/service-order/appliance-info-card"
import { DateManagementCard } from "@/features/orden/service-order/date-management-card"
import { WarrantyInfoCard } from "@/features/orden/service-order/warranty-info-card"
import { QRCodeCard } from "@/components/QrCodeCard"
import { OrderDetailsCard } from "@/features/orden/service-order/order-details-card"
import { TechnicianCard } from "@/features/orden/service-order/technician-card"
import { PaymentInfoCard } from "@/features/orden/service-order/payment-info-card"
import { ActionsCard } from "@/features/orden/service-order/actions-card"
import { TabsSection } from "@/features/orden/service-order/tabs-section"
import { OrdenStatusManager } from "./orden-status-manager"
import { EditPresupuestoDialog } from "./edit-presupuesto-dialog"

// Import dialogs
import { TechnicianAssignmentDialog } from "./technician-assignment-dialog"
import { PaymentDialog } from "./payment-dialog"
import { ConceptoOrdenDialog } from "./concepto-orden-dialog"
import { TechnicianActionsDialog } from "./technician-actions-dialog"
import { WarrantyPeriodDialog } from "./warranty-period-dialog"
import { WarrantyDamageDialog } from "./warranty-damage-dialog"
import { DeliveryNoteDialog } from "./delivery-note-dialog"
import { SetRepairDateDialog } from "./set-repair-date-dialog"
import { CancellationDialog } from "./cancellation-dialog"

interface ServiceOrderDetailProps {
  order: any
  userId: string
}

export function ServiceOrderDetail({ order, userId }: ServiceOrderDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { theme } = useTheme()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false)
  const [showWarrantyPeriodDialog, setShowWarrantyPeriodDialog] = useState(false)
  const [showWarrantyDamageDialog, setShowWarrantyDamageDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("payments")
  const [showTechnicianActionsDialog, setShowTechnicianActionsDialog] = useState(false)
  const [showConceptoOrdenDialog, setShowConceptoOrdenDialog] = useState(false)
  const [clientNotificationsEnabled, setClientNotificationsEnabled] = useState(
    order.clientNotificationsEnabled !== false
  )
  const [showSetRepairDateDialog, setShowSetRepairDateDialog] = useState(false)
  const [showEditPresupuestoDialog, setShowEditPresupuestoDialog] = useState(false)
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(order)
  const paymentRef = useRef<HTMLDivElement>(null)
  const [baseUrl, setBaseUrl] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL
      setBaseUrl(envBaseUrl || window.location.origin)
    }
  }, [])

  useEffect(() => {
    setCurrentOrder(order)
    setClientNotificationsEnabled(order.clientNotificationsEnabled !== false)
  }, [order])

  const handleDeactivateTechnician = async (technicianId: string): Promise<void> => {
    try {
      const result = await deactivateTechnicianAssignment(currentOrder.id, technicianId, userId)
      if (!result.success) {
        throw new Error(result.error || "Error al desactivar el técnico")
      }

      setCurrentOrder((prevOrder) => {
        const updatedAssignments = prevOrder.technicianAssignments.map((assignment: any) =>
          assignment.technician.id === technicianId
            ? { ...assignment, isActive: false, updatedAt: new Date().toISOString() }
            : assignment
        )

        return {
          ...prevOrder,
          technicianAssignments: updatedAssignments,
        }
      })

      router.refresh()
    } catch (error) {
      console.error("Error deactivating technician:", error)
      throw error
    }
  }

  const handleTechnicianAssignmentUpdate = (updatedAssignments: any[]) => {
    setCurrentOrder((prevOrder) => ({
      ...prevOrder,
      technicianAssignments: updatedAssignments,
    }))
  }

  const handleToggleNotifications = async (enabled: boolean): Promise<void> => {
    try {
      const result = await updateServiceOrder(currentOrder.id, { clientNotificationsEnabled: enabled }, userId)

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar las notificaciones")
      }

      setClientNotificationsEnabled(enabled)
      setCurrentOrder((prev) => ({
        ...prev,
        clientNotificationsEnabled: enabled,
      }))

      return Promise.resolve()
    } catch (error) {
      console.error("Error updating notification settings:", error)
      return Promise.reject(error)
    }
  }

  const handleCancellationUpdate = async (values: any) => {
    setIsUpdating(true)

    try {
      const updateData: any = {
        cancellationNotes: values.cancellationNotes,
        cancellationType: values.cancellationType,
        cancellationDate: new Date()
      }
      
      if (values.cancellationType === "permanent") {
        updateData.status = "CANCELLED"
      } else if (values.cancellationType === "reschedule") {
        if (!values.fechaAgendado) {
          toast({
            title: "Error",
            description: "Debe seleccionar una nueva fecha de agenda",
            variant: "destructive",
          })
          setIsUpdating(false)
          return
        }
        updateData.status = "PENDING"
        updateData.fechaAgendado = values.fechaAgendado
        updateData.rescheduledFromCancellation = true
      } else if (values.cancellationType === "revert") {
        updateData.status = "PENDING"
        updateData.cancellationNotes = null
        updateData.cancellationType = null
        updateData.cancellationDate = null
        updateData.rescheduledFromCancellation = false
      }

      const result = await updateServiceOrder(currentOrder.id, updateData, userId)

      if (result.success) {
        toast({
          title: "Éxito",
          description: values.cancellationType === "reschedule" 
            ? "Orden reprogramada correctamente" 
            : values.cancellationType === "revert"
            ? "Orden reactivada correctamente"
            : "Orden cancelada correctamente",
          variant: "success",
        })
        setShowCancellationDialog(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al procesar la orden",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const multipleAppliances = currentOrder.multipleAppliances
    ? typeof currentOrder.multipleAppliances === "string"
      ? JSON.parse(currentOrder.multipleAppliances)
      : currentOrder.multipleAppliances
    : null

  const hasMultipleAppliances = multipleAppliances && Array.isArray(multipleAppliances) && multipleAppliances.length > 0

  useEffect(() => {
    if (window.location.hash === "#payment" && paymentRef.current) {
      paymentRef.current.scrollIntoView({ behavior: "smooth" })
      setShowPaymentDialog(true)
    }
  }, [])

  const handleMarkAsCompleted = async () => {
    setIsUpdating(true)

    try {
      const result = await updateServiceOrder(
        currentOrder.id,
        {
          status: "COMPLETED",
          completedDate: new Date(),
        },
        userId
      )

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Orden marcada como completada",
          variant: "default",
        })

        setCurrentOrder((prevOrder) => ({
          ...prevOrder,
          status: "COMPLETED",
          completedDate: new Date().toISOString(),
        }))

        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar la orden",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleWarrantySuccess = () => {
    router.refresh()
    toast({
      title: "Éxito",
      description: "Garantía actualizada correctamente",
      variant: "default",
    })
  }

  const handleDateUpdate = async (fieldName: string, date: Date | null) => {
    try {
      const updateParams = {
        [fieldName]: date 
      };

      const updateResult = await updateServiceOrder(currentOrder.id, updateParams, userId);

      if (!updateResult.success) {
        throw new Error(updateResult.error || `Error al actualizar ${fieldName}`);
      }

      setCurrentOrder((prevOrder) => ({
        ...prevOrder,
        [fieldName]: date,
      }));

      if (fieldName === "fechaReparacion" && currentOrder.status === "APROBADO") {
        const statusUpdateResult = await updateServiceOrder(currentOrder.id, { status: "REPARANDO" }, userId);
        if (statusUpdateResult.success) {
          setCurrentOrder((prevOrder) => ({
            ...prevOrder,
            status: "REPARANDO",
          }));
        }
      }

      router.refresh();
    } catch (error) {
      console.error(`Error updating ${fieldName}:`, error);
      throw error;
    }
  };

  const handleShowStatusDialog = () => {
    // Send the event to the OrdenStatusManager component
    const statusManagerEvent = new CustomEvent('showStatusDialog');
    document.dispatchEvent(statusManagerEvent);
  };

  const handleSendWhatsAppMessage = async () => {
    try {
      setIsSendingWhatsApp(true)

      let applianceDetails = ""
      for (const appliance of currentOrder.appliances) {
        applianceDetails += `\n🔹 *${appliance.clientAppliance.name}* (${appliance.clientAppliance.brand.name} ${appliance.clientAppliance.applianceType.name})`
        if (appliance.clientAppliance.model) {
          applianceDetails += `\n  📝 *Modelo:* _${appliance.clientAppliance.model}_`
        }
        if (appliance.clientAppliance.serialNumber) {
          applianceDetails += `\n  🔢 *Serial:* _${appliance.clientAppliance.serialNumber}_`
        }
        if (appliance.clientAppliance.notes) {
          applianceDetails += `\n  📋 *Notas:* _${appliance.clientAppliance.notes}_`
        }
        if (appliance.falla) {
          applianceDetails += `\n  ⚠️ *Falla:* _${appliance.falla}_`
        }
        if (appliance.solucion) {
          applianceDetails += `\n  ✅ *Solución:* _${appliance.solucion}_`
        }
      }

      let technicianInfo = ""
      const activeTechnicians = currentOrder.technicianAssignments.filter((a: any) => a.isActive)
      if (activeTechnicians.length > 0) {
        technicianInfo = "\n\n👨‍🔧 *TÉCNICO(S) ASIGNADO(S):*"
        for (const assignment of activeTechnicians) {
          technicianInfo += `\n🔹 *${assignment.technician.name}*`
          if (assignment.technician.phone) {
            technicianInfo += ` (📱 ${assignment.technician.phone})`
          }
          technicianInfo += `\n  📅 Asignado: _${formatDate(new Date(assignment.assignedDate), "dd/MM/yyyy")}_`
          if (assignment.notes) {
            technicianInfo += `\n  📝 Notas: _${assignment.notes}_`
          }
        }
      }

      let paymentInfo = "\n\n💰 *INFORMACIÓN DE PAGO:*"
      if (currentOrder.presupuestoAmount) {
        paymentInfo += `\n💼 *Presupuesto:* ${formatCurrency(Number(currentOrder.presupuestoAmount))}`

        if (currentOrder.includeIVA) {
          const ivaAmount = Number(currentOrder.presupuestoAmount) * 0.16
          paymentInfo += `\n🧾 *IVA (16%):* ${formatCurrency(ivaAmount)}`
          paymentInfo += `\n💲 *Total con IVA:* ${formatCurrency(
            Number(currentOrder.presupuestoAmount) + ivaAmount
          )}`
        }
      }

      paymentInfo += `\n💵 *Monto total:* ${formatCurrency(Number(currentOrder.totalAmount) || 0)}`
      paymentInfo += `\n✅ *Monto pagado:* ${formatCurrency(Number(currentOrder.paidAmount) || 0)}`

      if (Number(currentOrder.totalAmount) > Number(currentOrder.paidAmount)) {
        paymentInfo += `\n⚠️ *Saldo pendiente:* ${formatCurrency(
          Number(currentOrder.totalAmount) - Number(currentOrder.paidAmount)
        )}`
      }

      paymentInfo += `\n🏷️ *Estado de pago:* ${getPaymentStatusText(currentOrder.paymentStatus)}`

      if (currentOrder.payments && currentOrder.payments.length > 0) {
        paymentInfo += "\n\n📋 *HISTORIAL DE PAGOS:*"
        for (const payment of currentOrder.payments) {
          paymentInfo += `\n🔹 ${formatDate(payment.paymentDate, "dd/MM/yyyy")} - ${formatCurrency(
            Number(payment.amount)
          )} - ${getPaymentMethodText(payment.paymentMethod)}`
          if (payment.reference) {
            paymentInfo += ` - Ref: ${payment.reference}`
          }
        }
      }

      let deliveryInfo = ""
      if (currentOrder.deliveryNotes && currentOrder.deliveryNotes.length > 0) {
        deliveryInfo = "\n\n🚚 *NOTAS DE ENTREGA:*"
        for (const note of currentOrder.deliveryNotes) {
          deliveryInfo += `\n🔹 *#${note.noteNumber}* - ${formatDate(note.deliveryDate, "dd/MM/yyyy")}`
          deliveryInfo += `\n  👤 Recibido por: _${note.receivedBy}_`
          if (note.notes) {
            deliveryInfo += `\n  📝 Notas: _${note.notes}_`
          }
          if (note.amount) {
            deliveryInfo += `\n  💰 Monto: _${formatCurrency(Number(note.amount))}_`
            if (note.includeIVA) {
              const ivaAmount = Number(note.amount) * 0.16
              deliveryInfo += `\n  🧾 IVA (16%): _${formatCurrency(ivaAmount)}_`
              deliveryInfo += `\n  💲 Total: _${formatCurrency(Number(note.amount) + ivaAmount)}_`
            }
          }
        }
      }

      let datesInfo = "\n\n📅 *FECHAS IMPORTANTES:*"
      datesInfo += `\n📥 *Recepción:* ${formatDate(new Date(currentOrder.receivedDate), "dd/MM/yyyy")}`

      if (currentOrder.fechaCaptacion) {
        datesInfo += `\n📋 *Captación:* ${formatDate(new Date(currentOrder.fechaCaptacion), "dd/MM/yyyy")}`
      }

      if (currentOrder.fechaAgendado) {
        datesInfo += `\n🗓️ *Agendado:* ${formatDate(new Date(currentOrder.fechaAgendado), "dd/MM/yyyy")}`
      }

      if (currentOrder.fechaSeguimiento) {
        datesInfo += `\n🔔 *Seguimiento:* ${formatDate(new Date(currentOrder.fechaSeguimiento), "dd/MM/yyyy")}`
      }

      if (currentOrder.fechaReparacion) {
        datesInfo += `\n🔧 *Reparación:* ${formatDate(new Date(currentOrder.fechaReparacion), "dd/MM/yyyy")}`
      }

      if (currentOrder.completedDate) {
        datesInfo += `\n✅ *Completado:* ${formatDate(new Date(currentOrder.completedDate), "dd/MM/yyyy")}`
      }

      if (currentOrder.deliveredDate) {
        datesInfo += `\n🚚 *Entregado:* ${formatDate(new Date(currentOrder.deliveredDate), "dd/MM/yyyy")}`
      }

      let warrantyInfo = ""
      if (currentOrder.garantiaStartDate || currentOrder.garantiaEndDate || currentOrder.garantiaIlimitada) {
        warrantyInfo = "\n\n🛡️ *INFORMACIÓN DE GARANTÍA:*"

        if (currentOrder.garantiaIlimitada) {
          warrantyInfo += "\n✨ *Garantía Ilimitada*"
        } else if (currentOrder.garantiaStartDate && currentOrder.garantiaEndDate) {
          warrantyInfo += `\n📅 *Desde:* ${formatDate(currentOrder.garantiaStartDate, "dd/MM/yyyy")}`
          warrantyInfo += `\n📅 *Hasta:* ${formatDate(currentOrder.garantiaEndDate, "dd/MM/yyyy")}`
        }

        if (currentOrder.garantiaPrioridad) {
          let prioridadText = ""
          switch (currentOrder.garantiaPrioridad) {
            case "ALTA": prioridadText = "⚠️ ALTA"; break;
            case "MEDIA": prioridadText = "⚡ MEDIA"; break;
            case "BAJA": prioridadText = "✓ BAJA"; break;
            default: prioridadText = currentOrder.garantiaPrioridad;
          }
          warrantyInfo += `\n🔄 *Prioridad:* ${prioridadText}`
        }

        if (currentOrder.razonGarantia) {
          warrantyInfo += `\n📝 *Razón:* _${currentOrder.razonGarantia}_`
        }
      }

      let statusHistory = ""
      if (currentOrder.statusHistory && currentOrder.statusHistory.length > 0) {
        statusHistory = "\n\n📊 *HISTORIAL DE ESTADOS:*"
        const limitedHistory = currentOrder.statusHistory.slice(0, 5)
        for (const status of limitedHistory) {
          statusHistory += `\n🔹 ${formatDate(new Date(status.timestamp), "dd/MM/yyyy")} - *${getStatusText(status.status)}*`
          if (status.notes) {
            const notes = status.notes.length > 50 ? status.notes.substring(0, 50) + "..." : status.notes
            statusHistory += ` - _${notes}_`
          }
        }
        if (currentOrder.statusHistory.length > 5) {
          statusHistory += "\n_...y más cambios de estado_"
        }
      }

      let additionalDetails = "\n\n📋 *DETALLES ADICIONALES:*"

      if (currentOrder.reference) {
        additionalDetails += `\n📌 *Referencia:* ${currentOrder.reference}`
      }

      if (currentOrder.description) {
        additionalDetails += `\n📝 *Descripción:* _${currentOrder.description}_`
      }

      if (currentOrder.diagnostics) {
        const diagnostics =
          currentOrder.diagnostics.length > 200
            ? currentOrder.diagnostics.substring(0, 200) + "..."
            : currentOrder.diagnostics
        additionalDetails += `\n🔍 *Diagnóstico:* _${diagnostics}_`
      }

      let conceptoInfo = ""
      if (currentOrder.conceptoOrden) {
        try {
          const concepto =
            typeof currentOrder.conceptoOrden === "string"
              ? JSON.parse(currentOrder.conceptoOrden)
              : currentOrder.conceptoOrden

          conceptoInfo = "\n\n📄 *CONCEPTO DE ORDEN:*"
          if (concepto.Header) {
            conceptoInfo += `\n📑 *${concepto.Header}*`
          }
          if (concepto.Text) {
            const text = concepto.Text.length > 200 ? concepto.Text.substring(0, 200) + "..." : concepto.Text
            conceptoInfo += `\n_${text}_`
          }
        } catch (e) {
          const text =
            currentOrder.conceptoOrden.length > 200
              ? currentOrder.conceptoOrden.substring(0, 200) + "..."
              : currentOrder.conceptoOrden
          conceptoInfo = `\n\n📄 *CONCEPTO DE ORDEN:*\n_${text}_`
        }
      }

      let ivaInfo = ""
      if (currentOrder.includeIVA) {
        ivaInfo = "\n📊 *IVA:* Aplicado (16%)"
      }

      const qrLink = `\n\n🔗 *Ver detalles online:* ${baseUrl}/ordenes/${currentOrder.id}`

      const message =
        `🔧 *ORDEN DE SERVICIO #${currentOrder.orderNumber}* 🔧\n\n` +
        `👤 *Cliente:* ${currentOrder.client.name}\n` +
        `📱 *Teléfono:* ${currentOrder.client.phone || "No disponible"}\n` +
        (currentOrder.client.email ? `📧 *Email:* ${currentOrder.client.email}\n` : "") +
        (currentOrder.client.document ? `📄 *Documento:* ${currentOrder.client.document}\n` : "") +
        (currentOrder.client.address ? `🏠 *Dirección:* ${currentOrder.client.address}\n` : "") +
        `🏷️ *Estado:* ${getStatusText(currentOrder.status)}\n` +
        `📅 *Fecha:* ${formatDate(currentOrder.receivedDate, "dd/MM/yyyy")}` +
        `${ivaInfo}\n\n` +
        `🔌 *ELECTRODOMÉSTICO(S):*${applianceDetails}` +
        `${technicianInfo}` +
        `${paymentInfo}` +
        `${deliveryInfo}` +
        `${datesInfo}` +
        `${warrantyInfo}` +
        `${statusHistory}` +
        `${conceptoInfo}` +
        `${additionalDetails}` +
        `${qrLink}\n\n` +
        `🙏 ¡Gracias por confiar en nuestros servicios!\n` +
        `📞 Para cualquier consulta, contáctenos.`

      await sendWhatsappMessage("+584167435109", message)

      toast({
        title: "Mensaje enviado",
        description: "El mensaje de WhatsApp ha sido enviado correctamente",
        variant: "default",
      })
    } catch (error) {
      console.error("Error sending WhatsApp message:", error)
      toast({
        title: "Error",
        description: "Error al enviar el mensaje de WhatsApp",
        variant: "destructive",
      })
    } finally {
      setIsSendingWhatsApp(false)
    }
  }

  const activeTechnicians = currentOrder.technicianAssignments
    .filter((assignment: any) => assignment.isActive)
    .map((assignment: any) => ({
      name: assignment.technician.name,
      phone: assignment.technician.phone,
    }))

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case "PAID": return "Pagado"
      case "PARTIAL": return "Parcial"
      case "PENDING": return "Pendiente"
      case "CANCELLED": return "Cancelado"
      default: return status
    }
  }

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case "CASH": return "Efectivo"
      case "CARD": return "Tarjeta"
      case "TRANSFER": return "Transferencia"
      case "MOBILE_PAYMENT": return "Pago Móvil"
      case "OTHER": return "Otro"
      default: return method
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PREORDER": return "Pre-orden"
      case "PENDING": return "Pendiente"
      case "ASSIGNED": return "Asignada"
      case "IN_PROGRESS": return "En Progreso"
      case "COMPLETED": return "Completada"
      case "DELIVERED": return "Entregada"
      case "CANCELLED": return "Cancelada"
      case "APROBADO": return "Aprobada"
      case "NO_APROBADO": return "No Aprobada"
      case "PENDIENTE_AVISAR": return "Pendiente Avisar"
      case "FACTURADO": return "Presupuestado"
      case "ENTREGA_GENERADA": return "Entrega Generada"
      case "GARANTIA_APLICADA": return "Garantía Aplicada"
      case "REPARANDO": return "Reparando"
      default: return status
    }
  }

  // Check if the order is canceled
  const isCancelled = currentOrder.status === "CANCELLED";
  
  // Check if it was rescheduled
  const isRescheduled = currentOrder.rescheduledFromCancellation && currentOrder.fechaAgendado;

  const getCancellationReasonOrDates = () => {
    const parts = [];
    
    if (currentOrder.cancellationNotes) {
      parts.push(
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">Motivo de cancelación:</p>
          <p className="text-red-600 dark:text-red-300 mt-1 italic">{currentOrder.cancellationNotes}</p>
        </div>
      );
    }
    
    if (currentOrder.cancellationDate) {
      parts.push(
        <p className="text-red-600 dark:text-red-400 text-sm flex items-center gap-1 mb-3">
          <Clock className="h-3.5 w-3.5" />
          <span>Cancelada el {new Date(currentOrder.cancellationDate).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</span>
        </p>
      );
    }
    
    if (isRescheduled) {
      parts.push(
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <span className="font-medium">Reprogramada para:</span>
          </p>
          <p className="text-amber-700 dark:text-amber-300 mt-2 font-semibold">
            {new Date(currentOrder.fechaAgendado).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            })}
          </p>
        </div>
      );
    }
    
    return parts;
  };

  return (
    <>
      {isCancelled && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="bg-white dark:bg-gray-900 rounded-xl p-8 max-w-lg w-full text-center space-y-6 shadow-xl"
          >
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-3">
                <XCircle className="h-16 w-16 text-red-500 dark:text-red-400" />
              </div>
              
              <h2 className="text-3xl font-bold text-red-600 dark:text-red-400">
                Orden Cancelada
              </h2>
              
              <div className="w-full">
                {getCancellationReasonOrDates()}
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800 w-full">
                <p className="flex items-center gap-2 text-red-700 dark:text-red-300">
                  <Info className="h-4 w-4 flex-shrink-0" />
                  <span>Esta orden ha sido cancelada y no puede ser modificada en su estado actual.</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button
                className="w-full sm:w-1/2 bg-slate-600 hover:bg-slate-700"
                onClick={() => router.push("/ordenes")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Órdenes
              </Button>
              
              <Button
                className="w-full sm:w-1/2 bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowCancellationDialog(true)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reactivar Orden
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      <HeaderSection 
        order={currentOrder} 
        onShowStatusDialog={handleShowStatusDialog} 
      />
      
      <div className={isCancelled ? "opacity-40 pointer-events-none" : ""}>
        {isRescheduled && !isCancelled && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium">Esta orden fue cancelada pero reprogramada para:</span>
            </p>
            <p className="text-amber-700 dark:text-amber-300 mt-1 ml-7 font-medium">
              {new Date(currentOrder.fechaAgendado).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </p>
            {currentOrder.cancellationNotes && (
              <div className="mt-2 ml-7">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Motivo original:</p>
                <p className="text-sm text-amber-600 dark:text-amber-300 italic">{currentOrder.cancellationNotes}</p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <ClientInfoCard client={currentOrder.client} />
            <NotificationToggleCard
              order={currentOrder}
              userId={userId}
              clientNotificationsEnabled={clientNotificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
            />
            <ApplianceInfoCard
              appliances={currentOrder.appliances}
              onViewDetails={hasMultipleAppliances ? () => setActiveTab("appliances") : undefined}
            />
            <DateManagementCard 
              order={currentOrder} 
              userId={userId} 
              onDateUpdate={handleDateUpdate}
            />
            <WarrantyInfoCard
              order={currentOrder}
              onSetWarrantyPeriod={() => setShowWarrantyPeriodDialog(true)}
              onReportDamage={
                currentOrder.status === "DELIVERED" &&
                ((currentOrder.garantiaEndDate && new Date(currentOrder.garantiaEndDate) > new Date()) ||
                currentOrder.garantiaIlimitada)
                  ? () => setShowWarrantyDamageDialog(true)
                  : undefined
              }
            />
            <QRCodeCard
              serviceOrderId={currentOrder.id}
              orderNumber={currentOrder.orderNumber}
              baseUrl={baseUrl}
              clientPhone={currentOrder.client.whatsapp || currentOrder.client.phone}
              technicians={activeTechnicians}
            />
          </div>

          <div className="space-y-6">
            <OrderDetailsCard order={currentOrder} />
            <TechnicianCard
              order={currentOrder}
              userId={userId}
              onDeactivateTechnician={handleDeactivateTechnician}
              onShowAssignDialog={() => setShowAssignDialog(true)}
            />
            <OrdenStatusManager order={currentOrder} userId={userId} />
          </div>

          <div className="space-y-6">
            <div ref={paymentRef}>
              <PaymentInfoCard
                order={currentOrder}
                onRegisterPayment={() => setShowPaymentDialog(true)}
                onViewAllPayments={
                  currentOrder.payments && currentOrder.payments.length > 3 ? () => setActiveTab("payments") : undefined
                }
              />
            </div>
            <ActionsCard
              order={currentOrder}
              isUpdating={isUpdating}
              onMarkAsCompleted={handleMarkAsCompleted}
              onShowStatusDialog={handleShowStatusDialog}
              onShowAssignDialog={() => setShowAssignDialog(true)}
              onShowTechnicianActionsDialog={() => setShowTechnicianActionsDialog(true)}
              onShowConceptoOrdenDialog={() => setShowConceptoOrdenDialog(true)}
              onShowDeliveryDialog={() => setShowDeliveryDialog(true)}
              onShowWarrantyPeriodDialog={() => setShowWarrantyPeriodDialog(true)}
              onShowWarrantyDamageDialog={() => setShowWarrantyDamageDialog(true)}
              onShowSetRepairDateDialog={() => setShowSetRepairDateDialog(true)}
              onShowCancellationDialog={() => setShowCancellationDialog(true)}
              onShowEditPresupuestoDialog={() => setShowEditPresupuestoDialog(true)}
              onSendWhatsAppMessage={handleSendWhatsAppMessage}
              isSendingWhatsApp={isSendingWhatsApp}
            />
          </div>
        </div>

        <TabsSection
          order={currentOrder}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          hasMultipleAppliances={hasMultipleAppliances}
          onShowPaymentDialog={() => setShowPaymentDialog(true)}
        />
      </div>

      {/* Dialogs */}
      <TechnicianAssignmentDialog
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        serviceOrderId={currentOrder.id}
        currentTechnicianIds={currentOrder.technicianAssignments
          .filter((a: any) => a.isActive)
          .map((a: any) => a.technician.id)}
        userId={userId}
        onAssignmentSuccess={handleTechnicianAssignmentUpdate}
      />

      <EditPresupuestoDialog
        open={showEditPresupuestoDialog}
        onOpenChange={setShowEditPresupuestoDialog}
        serviceOrderId={currentOrder.id}
        currentPresupuesto={currentOrder.conceptoOrden}
        currentStatus={currentOrder.status}
        userId={userId}
        diagnostics={currentOrder.diagnostics}
      />

      <PaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        serviceOrderId={currentOrder.id}
        totalAmount={Number(currentOrder.totalAmount) || 0}
        paidAmount={Number(currentOrder.paidAmount) || 0}
        userId={userId}
      />

      <DeliveryNoteDialog
        open={showDeliveryDialog}
        onOpenChange={setShowDeliveryDialog}
        serviceOrderId={currentOrder.id}
        clientName={currentOrder.client.name}
        userId={userId}
        garantiaStartDate={currentOrder.garantiaStartDate}
        garantiaEndDate={currentOrder.garantiaEndDate}
        garantiaIlimitada={currentOrder.garantiaIlimitada}
        conceptoOrden={currentOrder.conceptoOrden}
        presupuestoAmount={currentOrder.presupuestoAmount}
      />

      <WarrantyPeriodDialog
        open={showWarrantyPeriodDialog}
        onOpenChange={setShowWarrantyPeriodDialog}
        serviceOrderId={currentOrder.id}
        userId={userId}
        onSuccess={handleWarrantySuccess}
        initialWarranty={{
          startDate: currentOrder.garantiaStartDate ? new Date(currentOrder.garantiaStartDate) : new Date(),
          endDate: currentOrder.garantiaEndDate ? new Date(currentOrder.garantiaEndDate) : null,
          isUnlimited: currentOrder.garantiaIlimitada,
        }}
      />

      <WarrantyDamageDialog
        open={showWarrantyDamageDialog}
        onOpenChange={setShowWarrantyDamageDialog}
        serviceOrderId={currentOrder.id}
        userId={userId}
        onSuccess={handleWarrantySuccess}
      />

      <TechnicianActionsDialog
        open={showTechnicianActionsDialog}
        onOpenChange={setShowTechnicianActionsDialog}
        serviceOrderId={currentOrder.id}
        userId={userId}
        currentStatus={currentOrder.status}
      />

      <ConceptoOrdenDialog
        open={showConceptoOrdenDialog}
        onOpenChange={setShowConceptoOrdenDialog}
        serviceOrderId={currentOrder.id}
        presupuestoAmount={currentOrder.presupuestoAmount}
        currentStatus={currentOrder.status}
        userId={userId}
        diagnostics={currentOrder.diagnostics}
      />

      <SetRepairDateDialog
        open={showSetRepairDateDialog}
        onOpenChange={setShowSetRepairDateDialog}
        serviceOrderId={currentOrder.id}
        userId={userId}
        currentStatus={currentOrder.status}
      />

      <CancellationDialog
        open={showCancellationDialog}
        onOpenChange={setShowCancellationDialog}
        serviceOrderId={currentOrder.id}
        userId={userId}
        isCancelled={isCancelled}
        onSubmit={handleCancellationUpdate}
        isLoading={isUpdating}
      />
    </>
  )
}