import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  ThumbsDown,
  ThumbsUp,
  Calendar,
  CalendarClock,
  XCircle,
  RefreshCw,
  Shield,
  Check,
  UserCheck,
  Wrench,
  Truck,
  BookOpen,
  FileText,
  CreditCard
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateServiceOrder } from "./actions"
import { formatCurrency } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { GarantiaForm } from "./garantia-form"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WarrantyDialog } from "./warranty-dialog"

// Form schema for status changes
const statusFormSchema = z.object({
  status: z.enum([
    "PREORDER",
    "PENDING",
    "ASSIGNED",
    "IN_PROGRESS",
    "COMPLETED",
    "DELIVERED",
    "CANCELLED",
    "APROBADO",
    "NO_APROBADO",
    "PENDIENTE_AVISAR",
    "FACTURADO",
    "ENTREGA_GENERADA",
    "GARANTIA_APLICADA",
    "GARANTIA_RESUELTA",
    "REPARANDO"
  ]),
  presupuestoAmount: z.string().optional(),
  fechaReparacion: z.date().optional().nullable(),
  fechaSeguimiento: z.date().optional().nullable(),
  fechaAgendado: z.date().optional().nullable(),
  razonNoAprobado: z.string().optional(),
  razonResolucionGarantia: z.string().optional(),
  visitAmount: z.string().optional(),
});

// Form schema for cancellations
const cancelFormSchema = z.object({
  cancellationNotes: z.string().min(10, "Debe incluir al menos 10 caracteres"),
  cancellationType: z.enum(["permanent", "reschedule", "revert"]),
  fechaAgendado: z.date().optional().nullable(),
});

const warrantyResolutionSchema = z.object({
  razonResolucionGarantia: z.string().min(10, "Debe incluir al menos 10 caracteres"),
})

type StatusFormValues = z.infer<typeof statusFormSchema>
type CancelFormValues = z.infer<typeof cancelFormSchema>
type WarrantyResolutionValues = z.infer<typeof warrantyResolutionSchema>

interface OrdenStatusManagerProps {
  order: any
  userId: string
}

export function OrdenStatusManager({ order, userId }: OrdenStatusManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [presupuestoAmount, setPresupuestoAmount] = useState<string>(order.totalAmount ? String(order.totalAmount) : "")
  const [conceptoOrden, setConceptoOrden] = useState<string>(
    order.conceptoOrden
      ? typeof order.conceptoOrden === "string"
        ? JSON.parse(order.conceptoOrden)?.Text || ""
        : order.conceptoOrden?.Text || ""
      : "",
  )
  const [showGarantiaDialog, setShowGarantiaDialog] = useState(false)
  const [showCancellationDialog, setShowCancellationDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showWarrantyDialog, setShowWarrantyDialog] = useState(false)
  const [showWarrantyResolutionDialog, setShowWarrantyResolutionDialog] = useState(false)
  const [garantiaData, setGarantiaData] = useState({
    startDate: order.garantiaStartDate || new Date(),
    endDate: order.garantiaEndDate || null,
    isUnlimited: order.garantiaIlimitada || false,
  })

  // Add event listener for showing status dialog
  useEffect(() => {
    const handleShowStatusDialog = () => {
      if (order.status === "GARANTIA_APLICADA") {
        setShowWarrantyResolutionDialog(true)
      }
    }

    document.addEventListener('showStatusDialog', handleShowStatusDialog)
    return () => document.removeEventListener('showStatusDialog', handleShowStatusDialog)
  }, [order.status])

  // Determine current status and available actions
  const currentStatus = order.status
  const isAsignado = currentStatus === "ASSIGNED"
  const isAprobado = currentStatus === "APROBADO"
  const isNoAprobado = currentStatus === "NO_APROBADO"
  const isPendienteAvisar = currentStatus === "PENDIENTE_AVISAR"
  const isFacturado = currentStatus === "FACTURADO"
  const isEntregaGenerada = currentStatus === "ENTREGA_GENERADA"
  const isCancelled = currentStatus === "CANCELLED"
  const isGarantiaAplicada = currentStatus === "GARANTIA_APLICADA"
  const isRescheduled = order.rescheduledFromCancellation && order.fechaAgendado
  const isPreOrder = currentStatus === "PREORDER"

  // Status form
  const statusForm = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: {
      status: currentStatus as any,
      presupuestoAmount: "",
      fechaReparacion: null,
      fechaSeguimiento: null,
      fechaAgendado: null,
      razonNoAprobado: "",
      razonResolucionGarantia: "",
      visitAmount: "5",
    },
  })

  // Cancel form
  const cancelForm = useForm<CancelFormValues>({
    resolver: zodResolver(cancelFormSchema),
    defaultValues: {
      cancellationNotes: "",
      cancellationType: isCancelled ? "revert" : "permanent",
      fechaAgendado: null,
    },
  })

  // Warranty resolution form
  const warrantyResolutionForm = useForm<WarrantyResolutionValues>({
    resolver: zodResolver(warrantyResolutionSchema),
    defaultValues: {
      razonResolucionGarantia: "",
    },
  })

  const selectedStatus = statusForm.watch("status")
  const selectedCancellationType = cancelForm.watch("cancellationType")
  
  const needsPresupuestoAmount = selectedStatus === "APROBADO" || 
                              selectedStatus === "PENDIENTE_AVISAR" || 
                              (selectedStatus === "FACTURADO" && currentStatus === "ASSIGNED")
  const needsReparacionDate = selectedStatus === "APROBADO" || selectedStatus === "REPARANDO"
  const needsRazonNoAprobado = selectedStatus === "NO_APROBADO"
  const needsFechaSeguimiento = selectedStatus === "PENDIENTE_AVISAR"
  const needsRazonResolucionGarantia = isGarantiaAplicada && selectedStatus === "GARANTIA_RESUELTA"
  const isCancellationFlow = currentStatus !== "CANCELLED" && selectedStatus === "CANCELLED"

  // Get available statuses based on current status
  const getAvailableStatuses = () => {
    switch (currentStatus) {
      case "PREORDER": return ["PENDING", "CANCELLED"];
      case "PENDING": return ["PENDING", "ASSIGNED", "PREORDER", "CANCELLED"];
      case "ASSIGNED": return ["ASSIGNED", "FACTURADO", "CANCELLED"];
      case "IN_PROGRESS": return ["IN_PROGRESS", "APROBADO", "NO_APROBADO", "PENDIENTE_AVISAR", "CANCELLED"];
      case "APROBADO": return ["APROBADO", "REPARANDO", "CANCELLED"];
      case "NO_APROBADO": return ["NO_APROBADO", "APROBADO", "CANCELLED"];
      case "PENDIENTE_AVISAR": return ["PENDIENTE_AVISAR", "APROBADO", "NO_APROBADO", "CANCELLED"];
      case "FACTURADO": return ["FACTURADO", "APROBADO", "NO_APROBADO", "PENDIENTE_AVISAR", "CANCELLED"];
      case "COMPLETED": return ["COMPLETED", "DELIVERED", "CANCELLED"];
      case "REPARANDO": return ["REPARANDO", "COMPLETED", "CANCELLED"];
      case "ENTREGA_GENERADA": return ["ENTREGA_GENERADA", "DELIVERED", "CANCELLED"];
      case "DELIVERED": return ["CANCELLED"];
      case "GARANTIA_APLICADA": return ["GARANTIA_APLICADA", "GARANTIA_RESUELTA", "CANCELLED"];
      case "GARANTIA_RESUELTA": return ["DELIVERED", "CANCELLED"];
      case "CANCELLED": return ["CANCELLED", "PENDING", "PREORDER"];
      default: return ["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DELIVERED", "CANCELLED"];
    }
  }

  const canApplyWarranty = ["DELIVERED", "ENTREGA_GENERADA"].includes(currentStatus) &&
    ((order.garantiaEndDate && new Date(order.garantiaEndDate) > new Date()) || order.garantiaIlimitada);

  // Handle technician actions
  const handleTechnicianAction = async (action: "APROBADO" | "NO_APROBADO" | "PENDIENTE_AVISAR") => {
    setIsLoading(true)

    try {
      const updateData: any = {
        status: action,
      }

      // If not approved, set default revision amount
      if (action === "NO_APROBADO") {
        updateData.totalAmount = 5
      }

      const result = await updateServiceOrder(order.id, updateData, userId)

      if (result.success) {
        toast({
          title: "Éxito",
          description: `Estado actualizado a ${action}`,
          variant: "success",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar el estado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle presupuesto submission
  const handlePresupuestoSubmit = async () => {
    if (!presupuestoAmount.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar un monto",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const amount = Number.parseFloat(presupuestoAmount.replace(/,/g, "."))

      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "El monto debe ser un número mayor a 0",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      const result = await updateServiceOrder(
        order.id,
        {
          totalAmount: amount,
          status: "APROBADO",
        },
        userId,
      )

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Presupuesto actualizado correctamente",
          variant: "success",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar el presupuesto",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating budget:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle facturado submission
  const handleFacturadoSubmit = async () => {
    if (!presupuestoAmount.trim() || !conceptoOrden.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar un monto y un concepto",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const amount = Number.parseFloat(presupuestoAmount.replace(/,/g, "."))

      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Error",
          description: "El monto debe ser un número mayor a 0",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Create JSON structure for conceptoOrden
      const conceptoJSON = JSON.stringify({
        Header: conceptoOrden.split("\n")[0] || "Reparación",
        Text: conceptoOrden,
      })

      const result = await updateServiceOrder(
        order.id,
        {
          totalAmount: amount,
          conceptoOrden: conceptoJSON,
          status: "FACTURADO",
        },
        userId,
      )

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Orden facturada correctamente",
          variant: "success",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al facturar la orden",
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
      setIsLoading(false)
    }
  }

  // Handle garantia submission
  const handleGarantiaSubmit = async (data: any) => {
    setIsLoading(true)

    try {
      const result = await updateServiceOrder(
        order.id,
        {
          garantiaStartDate: data.startDate,
          garantiaEndDate: data.isUnlimited ? null : data.endDate,
          garantiaIlimitada: data.isUnlimited,
          status: "ENTREGA_GENERADA",
        },
        userId,
      )

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Garantía establecida correctamente",
          variant: "success",
        })
        setShowGarantiaDialog(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al establecer la garantía",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error setting warranty:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle warranty resolution
  const handleWarrantyResolution = async (values: WarrantyResolutionValues) => {
    setIsLoading(true)

    try {
      const result = await updateServiceOrder(
        order.id,
        {
          status: "DELIVERED",
          razonResolucionGarantia: values.razonResolucionGarantia,
        },
        userId
      )

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Garantía resuelta correctamente",
          variant: "default",
        })
        setShowWarrantyResolutionDialog(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al resolver la garantía",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error resolving warranty:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle cancellation submission
  const handleCancellationSubmit = async (values: CancelFormValues) => {
    setIsLoading(true)

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
          setIsLoading(false)
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

      const result = await updateServiceOrder(order.id, updateData, userId)

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
      setIsLoading(false)
    }
  }

  // Handle status form submission
  const handleStatusSubmit = async (values: StatusFormValues) => {
    setIsLoading(true);

    try {
      if (isPreOrder) {
        const updateData: any = { 
          status: "PENDING", 
          fechaAgendado: values.fechaAgendado 
        };

        const result = await updateServiceOrder(order.id, updateData, userId);

        if (result.success) {
          toast({
            title: "Éxito",
            description: "Orden convertida correctamente",
            variant: "default",
          });
          setShowStatusDialog(false);
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: result.error || "Error al actualizar la orden",
            variant: "destructive",
          });
        }
      } else if (isGarantiaAplicada && values.status === "GARANTIA_RESUELTA") {
        const updateData: any = { 
          status: "DELIVERED", 
          razonResolucionGarantia: values.razonResolucionGarantia
        };

        const result = await updateServiceOrder(order.id, updateData, userId);

        if (result.success) {
          toast({
            title: "Éxito",
            description: "Garantía resuelta correctamente",
            variant: "default",
          });
          setShowStatusDialog(false);
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: result.error || "Error al actualizar la orden",
            variant: "destructive",
          });
        }
      } else if (values.status === "CANCELLED") {
        if (!values.cancellationNotes || values.cancellationNotes.length < 10) {
          toast({
            title: "Error",
            description: "Debe incluir una razón de cancelación con al menos 10 caracteres",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        const updateData: any = { 
          status: values.cancellationType === "permanent" ? "CANCELLED" : "PENDING",
          cancellationNotes: values.cancellationNotes,
          cancellationType: values.cancellationType,
        };
        
        if (values.cancellationType === "reschedule") {
          if (!values.fechaAgendado) {
            toast({
              title: "Error",
              description: "Debe seleccionar una nueva fecha de agenda",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          updateData.fechaAgendado = values.fechaAgendado;
          updateData.rescheduledFromCancellation = true;
        }

        const result = await updateServiceOrder(order.id, updateData, userId);

        if (result.success) {
          toast({
            title: "Éxito",
            description: values.cancellationType === "reschedule" 
              ? "Orden reprogramada correctamente" 
              : "Orden cancelada correctamente",
            variant: "default",
          });
          setShowStatusDialog(false);
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: result.error || "Error al procesar la orden",
            variant: "destructive",
          });
        }
      } else {
        const updateData: any = { status: values.status };

        if (values.status === "COMPLETED" && currentStatus !== "COMPLETED") {
          updateData.completedDate = new Date();
        } else if (values.status === "DELIVERED" && currentStatus !== "DELIVERED") {
          updateData.deliveredDate = new Date();
        } else if (values.status === "REPARANDO" && values.fechaReparacion) {
          updateData.fechaReparacion = values.fechaReparacion;
        }

        if (values.status === "FACTURADO" && currentStatus === "ASSIGNED") {
          if (values.presupuestoAmount) {
            updateData.presupuestoAmount = values.presupuestoAmount;
          } else {
            toast({
              title: "Error",
              description: "Debe ingresar un monto de presupuesto",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
        } 
        else if (values.status === "NO_APROBADO") {
          if (values.razonNoAprobado) {
            updateData.razonNoAprobado = values.razonNoAprobado;
          }
          updateData.visitAmount = values.visitAmount || "5";
        }
        else if (values.status === "APROBADO") {
          if (values.fechaReparacion) {
            updateData.fechaReparacion = values.fechaReparacion;
            updateData.status = "REPARANDO";
          }
        } else if (values.status === "PENDIENTE_AVISAR") {
          if (values.fechaSeguimiento) {
            updateData.fechaSeguimiento = values.fechaSeguimiento;
          }
          if (values.presupuestoAmount) {
            updateData.presupuestoAmount = values.presupuestoAmount;
          }
        } else if (values.status === "PENDING" && currentStatus === "PREORDER") {
          updateData.fechaAgendado = values.fechaAgendado || new Date();
        }

        const result = await updateServiceOrder(order.id, updateData, userId);

        if (result.success) {
          toast({
            title: "Éxito",
            description: "Estado actualizado correctamente",
            variant: "default",
          });
          setShowStatusDialog(false);
          router.refresh();
        } else {
          toast({
            title: "Error",
            description: result.error || "Error al actualizar la orden",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle warranty apply
  const handleWarrantyApply = () => {
    setShowStatusDialog(false);
    setTimeout(() => {
      setShowWarrantyDialog(true);
    }, 100);
  };

  // Utility functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PREORDER": return <BookOpen className="h-5 w-5 text-orange-500" />;
      case "PENDING": return <Clock className="h-5 w-5 text-amber-500" />;
      case "ASSIGNED": return <UserCheck className="h-5 w-5 text-blue-500" />;
      case "IN_PROGRESS": return <Wrench className="h-5 w-5 text-violet-500" />;
      case "COMPLETED": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "DELIVERED": return <Truck className="h-5 w-5 text-slate-500" />;
      case "CANCELLED": return <XCircle className="h-5 w-5 text-red-500" />;
      case "APROBADO": return <ThumbsUp className="h-5 w-5 text-green-500" />;
      case "NO_APROBADO": return <ThumbsDown className="h-5 w-5 text-red-500" />;
      case "PENDIENTE_AVISAR": return <AlertCircle className="h-5 w-5 text-amber-500" />;
      case "FACTURADO": return currentStatus === "ASSIGNED" ? 
        <CreditCard className="h-5 w-5 text-blue-500" /> : 
        <FileText className="h-5 w-5 text-purple-500" />;
      case "ENTREGA_GENERADA": return <Shield className="h-5 w-5 text-indigo-500" />;
      case "GARANTIA_APLICADA": return <Shield className="h-5 w-5 text-teal-500" />;
      case "GARANTIA_RESUELTA": return <Check className="h-5 w-5 text-teal-500" />;
      case "REPARANDO": return <Wrench className="h-5 w-5 text-blue-500" />;
      default: return <RefreshCw className="h-5 w-5 text-primary" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PREORDER": return "text-orange-500 border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800";
      case "PENDING": return "text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800";
      case "ASSIGNED": return "text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800";
      case "IN_PROGRESS": return "text-violet-500 border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800";
      case "COMPLETED": return "text-green-500 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800";
      case "DELIVERED": return "text-slate-500 border-slate-200 bg-slate-50 dark:bg-slate-900/20 dark:border-slate-800";
      case "CANCELLED": return "text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800";
      case "APROBADO": return "text-green-500 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800";
      case "NO_APROBADO": return "text-red-500 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800";
      case "PENDIENTE_AVISAR": return "text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800";
      case "FACTURADO": return "text-purple-500 border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800";
      case "ENTREGA_GENERADA": return "text-indigo-500 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800";
      case "GARANTIA_APLICADA": return "text-teal-500 border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800";
      case "GARANTIA_RESUELTA": return "text-teal-500 border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800";
      case "REPARANDO": return "text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800";
      default: return "text-primary border-primary/20 bg-primary/10";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PREORDER": return "Pre-orden";
      case "PENDING": return "Pendiente";
      case "ASSIGNED": return "Asignada a Técnico";
      case "IN_PROGRESS": return "En Progreso";
      case "COMPLETED": return "Completada";
      case "DELIVERED": return "Entregada";
      case "CANCELLED": return "Cancelada";
      case "APROBADO": return "Aprobado";
      case "NO_APROBADO": return "No Aprobado";
      case "PENDIENTE_AVISAR": return "Pendiente por Avisar";
      case "FACTURADO": return currentStatus === "ASSIGNED" ? "Presupuestado" : "Facturado";
      case "ENTREGA_GENERADA": return "Entrega Generada";
      case "GARANTIA_APLICADA": return "Garantía Aplicada";
      case "GARANTIA_RESUELTA": return "Garantía Resuelta";
      case "REPARANDO": return "Reparando";
      default: return status;
    }
  };

  // Render appropriate UI based on current status
  const renderStatusUI = () => {
    if (isAsignado) {
      return null
    }

    if (isAprobado) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Ingresar Monto del Presupuesto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted-foreground">$</span>
              </div>
              <Input
                type="text"
                value={presupuestoAmount}
                onChange={(e) => setPresupuestoAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>

            <Button
              onClick={handlePresupuestoSubmit}
              disabled={isLoading || !presupuestoAmount.trim()}
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Confirmar Presupuesto
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (isNoAprobado) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-600" />
              Reparación No Aprobada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-md border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>El cliente no ha aprobado la reparación.</span>
              </p>
              <p className="text-red-700 dark:text-red-400 mt-2">
                Se ha generado un cargo por revisión de {formatCurrency(5)}.
              </p>
            </div>

            <Button onClick={() => handleFacturadoSubmit()} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DollarSign className="h-4 w-4 mr-2" />}
              Proceder a Facturación
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (isPendienteAvisar) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Pendiente por Avisar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md border border-amber-200 dark:border-amber-800">
              <p className="text-amber-800 dark:text-amber-300 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>El cliente está considerando la reparación.</span>
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-muted-foreground">$</span>
              </div>
              <Input
                type="text"
                value={presupuestoAmount}
                onChange={(e) => setPresupuestoAmount(e.target.value)}
                placeholder="0.00"
                className="pl-7"
              />
            </div>

            <Button
              onClick={handlePresupuestoSubmit}
              disabled={isLoading || !presupuestoAmount.trim()}
              className="w-full"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Actualizar y Aprobar
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (isFacturado || (currentStatus !== "ENTREGA_GENERADA" && (isAprobado || isNoAprobado || isPendienteAvisar))) {
      return null
    }

    if (isEntregaGenerada) {
      // Parse conceptoOrden if it's a JSON string
      let conceptoHeader = ""
      let conceptoText = ""

      try {
        if (order.conceptoOrden) {
          const concepto =
            typeof order.conceptoOrden === "string" ? JSON.parse(order.conceptoOrden) : order.conceptoOrden
          conceptoHeader = concepto.Header || ""
          conceptoText = concepto.Text || ""
        }
      } catch (e) {
        // If parsing fails, use the raw string
        conceptoText = order.conceptoOrden || ""
      }

      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Orden Lista para Entrega
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-md border border-green-200 dark:border-green-800">
              <p className="text-green-800 dark:text-green-300 flex items-center gap-2 font-medium">
                <CheckCircle className="h-5 w-5" />
                <span>La orden ha sido procesada y está lista para entrega.</span>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Monto Total</h3>
                <p className="text-xl font-bold">{formatCurrency(Number(order.totalAmount) || 0)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Concepto</h3>
                <div className="bg-muted p-3 rounded-md mt-1">
                  {conceptoHeader && <p className="font-medium">{conceptoHeader}</p>}
                  <p className="whitespace-pre-line">{conceptoText}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Garantía</h3>
                <div className="flex items-center gap-2 mt-1">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  {order.garantiaIlimitada ? (
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Garantía Ilimitada
                    </Badge>
                  ) : order.garantiaEndDate ? (
                    <span>
                      Desde {new Date(order.garantiaStartDate).toLocaleDateString()}
                      hasta {new Date(order.garantiaEndDate).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-muted-foreground italic">No se ha establecido garantía</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    if (isGarantiaAplicada) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-600" />
              Garantía Aplicada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-teal-50 dark:bg-teal-950/30 p-4 rounded-md border border-teal-200 dark:border-teal-800">
              <p className="text-teal-800 dark:text-teal-300 flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>Se ha aplicado garantía a esta orden.</span>
              </p>
              {order.razonGarantia && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-teal-700 dark:text-teal-400">Motivo:</p>
                  <p className="text-teal-600 dark:text-teal-300 mt-1 italic">{order.razonGarantia}</p>
                </div>
              )}
            </div>

            <Button 
              onClick={() => setShowStatusDialog(true)}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Check className="mr-2 h-4 w-4" />
              Resolver Garantía
            </Button>
          </CardContent>
        </Card>
      )
    }

    if (isCancelled) {
      return (
        <Card className="border-red-300 dark:border-red-800">
          <CardHeader className="bg-red-50 dark:bg-red-950/30 rounded-t-lg border-b border-red-200 dark:border-red-800">
            <CardTitle className="text-lg flex items-center gap-2 text-red-700 dark:text-red-300">
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              Orden Cancelada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-md border border-red-200 dark:border-red-800">
              <p className="text-red-800 dark:text-red-300 flex items-center gap-2 font-medium">
                <AlertCircle className="h-5 w-5" />
                <span>Esta orden ha sido cancelada.</span>
              </p>
              {order.cancellationNotes && (
                <div className="mt-3 border-t border-red-200 dark:border-red-800 pt-3">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">Motivo de cancelación:</p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1 italic bg-red-100 dark:bg-red-900/30 p-2 rounded-md">
                    {order.cancellationNotes}
                  </p>
                </div>
              )}
              {order.cancellationDate && (
                <div className="mt-3">
                  <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Cancelada el {new Date(order.cancellationDate).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</span>
                  </p>
                </div>
              )}
            </div>

            <Button 
              onClick={() => setShowCancellationDialog(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reactivar Orden
            </Button>
          </CardContent>
        </Card>
      )
    }

    // Default state - no specific actions available
    return null
  }

  return (
    <div>
      {renderStatusUI()}

      {/* Status Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <motion.div
                initial={{ rotate: -10, scale: 0.9 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {isPreOrder ? (
                  <Calendar className="h-5 w-5 text-primary" />
                ) : selectedStatus === "CANCELLED" && currentStatus !== "CANCELLED" ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <RefreshCw className="h-5 w-5 text-primary" />
                )}
              </motion.div>
              <span>
                {isPreOrder ? "Convertir a Orden" : 
                 isGarantiaAplicada && selectedStatus === "GARANTIA_RESUELTA" ? "Resolver Garantía" : 
                 selectedStatus === "CANCELLED" && currentStatus !== "CANCELLED" ? "Cancelar Orden" :
                 "Cambiar Estado de la Orden"}
              </span>
            </DialogTitle>
          </DialogHeader>

          <Form {...statusForm}>
            <form onSubmit={statusForm.handleSubmit(handleStatusSubmit)} className="space-y-5">
              {isPreOrder ? (
                <FormField
                  control={statusForm.control}
                  name="fechaAgendado"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha y Hora de Agenda</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          date={field.value || undefined}
                          setDate={(date) => field.onChange(date)}
                        />
                      </FormControl>
                      <FormDescription>
                        Establecer fecha y hora para agendar la visita o reparación
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : isGarantiaAplicada && selectedStatus === "GARANTIA_RESUELTA" ? (
                <FormField
                  control={statusForm.control}
                  name="razonResolucionGarantia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground flex items-center gap-1">
                        Resolución de Garantía
                        <span className="text-destructive text-sm">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describa cómo se resolvió el problema de garantía"
                          {...field}
                          value={field.value ?? ""}
                          className="transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                          rows={4}
                        />
                      </FormControl>
                      <FormDescription>
                        Indique cómo se resolvió el problema reportado por el cliente
                      </FormDescription>
                      <FormMessage className="text-destructive text-sm" />
                    </FormItem>
                  )}
                />
              ) : selectedStatus === "CANCELLED" && currentStatus !== "CANCELLED" ? (
                <div className="space-y-5">
                  <FormField
                    control={statusForm.control}
                    name="cancellationNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-foreground flex items-center gap-1">
                          Razón de Cancelación
                          <span className="text-destructive text-sm">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explique el motivo de la cancelación"
                            {...field}
                            className="transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Es necesario indicar la razón por la que se cancela la orden
                        </FormDescription>
                        <FormMessage className="text-destructive text-sm" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={statusForm.control}
                    name="cancellationType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Tipo de Cancelación</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <div className="flex items-center space-x-2 p-3 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                              <RadioGroupItem value="permanent" id="permanent" />
                              <Label htmlFor="permanent" className="flex items-center cursor-pointer">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50 mr-3">
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-red-800 dark:text-red-300">Cancelación Permanente</p>
                                  <p className="text-sm text-red-600 dark:text-red-400">La orden será cancelada definitivamente</p>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                              <RadioGroupItem value="reschedule" id="reschedule" />
                              <Label htmlFor="reschedule" className="flex items-center cursor-pointer">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 mr-3">
                                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-amber-800 dark:text-amber-300">Cancelar y Reprogramar</p>
                                  <p className="text-sm text-amber-600 dark:text-amber-400">La orden se reprogramará para otra fecha</p>
                                </div>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedCancellationType === "reschedule" && (
                    <FormField
                      control={statusForm.control}
                      name="fechaAgendado"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-foreground flex items-center gap-1">
                            Nueva Fecha de Agenda
                            <span className="text-destructive text-sm">*</span>
                          </FormLabel>
                          <FormControl>
                            <DateTimePicker
                              date={field.value || undefined}
                              setDate={(date) => field.onChange(date)}
                            />
                          </FormControl>
                          <FormDescription>
                            Seleccione la nueva fecha y hora para reprogramar la orden
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              ) : (
                <FormField
                  control={statusForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Estado</FormLabel>
                      <div className="mb-4">
                        <div className={`inline-flex items-center px-3 py-1 rounded-md border ${getStatusColor(currentStatus)}`}>
                          {getStatusIcon(currentStatus)}
                          <span className="ml-2 font-medium">Estado actual: {getStatusText(currentStatus)}</span>
                        </div>
                      </div>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="transition-all focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {getAvailableStatuses().map((status) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center">
                                {getStatusIcon(status)}
                                <span className="ml-2">{getStatusText(status)}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-destructive text-sm" />
                      {selectedStatus && selectedStatus !== currentStatus && (
                        <FormDescription className="mt-2 flex items-center">
                          <div className={`inline-flex items-center px-3 py-1 rounded-md border ${getStatusColor(selectedStatus)}`}>
                            {getStatusIcon(selectedStatus)}
                            <span className="ml-2">Nuevo estado: {getStatusText(selectedStatus)}</span>
                          </div>
                        </FormDescription>
                      )}
                    </FormItem>
                  )}
                />
              )}

              {selectedStatus === "NO_APROBADO" && (
                <FormField
                  control={statusForm.control}
                  name="visitAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground flex items-center gap-1">
                        Monto por Visita Técnica
                        <span className="text-destructive text-sm">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="5.00" 
                            {...field} 
                            className="pl-7" 
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Este monto se cobrará al cliente por la visita técnica
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {needsRazonNoAprobado && !isPreOrder && (
                <FormField
                  control={statusForm.control}
                  name="razonNoAprobado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground flex items-center gap-1">
                        Razón de No Aprobación
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ej: Costo elevado / Cliente decidió no reparar"
                          {...field}
                          className="transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Indique el motivo por el cual no se aprobó el presupuesto
                      </FormDescription>
                      <FormMessage className="text-destructive text-sm" />
                    </FormItem>
                  )}
                />
              )}

              {needsPresupuestoAmount && !isPreOrder && (
                <FormField
                  control={statusForm.control}
                  name="presupuestoAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Monto del Presupuesto</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Ingrese el monto"
                          step="0.01"
                          {...field}
                          className="transition-all focus:ring-2 focus:ring-primary/20"
                        />
                      </FormControl>
                      <FormDescription>
                        {selectedStatus === "APROBADO" 
                          ? "Ingrese el monto del presupuesto aprobado." 
                          : "Ingrese el monto del presupuesto (opcional)."}
                      </FormDescription>
                      <FormMessage className="text-destructive text-sm" />
                    </FormItem>
                  )}
                />
              )}

              {needsReparacionDate && !isPreOrder && (
                <FormField
                  control={statusForm.control}
                  name="fechaReparacion"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha y Hora de Reparación</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          date={field.value || undefined}
                          setDate={(date) => field.onChange(date)}
                        />
                      </FormControl>
                      <FormDescription>
                        {selectedStatus === "APROBADO" 
                          ? "Al establecer esta fecha, la orden pasará automáticamente a estado 'Reparando'." 
                          : "Establezca cuándo está programada la reparación."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {needsFechaSeguimiento && !isPreOrder && (
                <FormField
                  control={statusForm.control}
                  name="fechaSeguimiento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha y Hora de Seguimiento</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          date={field.value || undefined}
                          setDate={(date) => field.onChange(date)}
                        />
                      </FormControl>
                      <FormDescription>
                        Establezca cuándo se debe contactar al cliente para seguimiento
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter className="gap-2 mt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowStatusDialog(false)} 
                  disabled={isLoading}
                  className="transition-all hover:bg-muted"
                >
                  Cancelar
                </Button>
                
                {canApplyWarranty && !isPreOrder && !isCancellationFlow && (
                  <Button 
                    type="button"
                    onClick={handleWarrantyApply} 
                    disabled={isLoading}
                    className="transition-all bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Aplicar Garantía
                  </Button>
                )}
                
                <Button 
                  type="submit" 
                  disabled={isLoading || 
                    (isPreOrder && !statusForm.getValues("fechaAgendado")) ||
                    (isGarantiaAplicada && selectedStatus === "GARANTIA_RESUELTA" && !statusForm.getValues("razonResolucionGarantia")) ||
                    (selectedStatus === "CANCELLED" && currentStatus !== "CANCELLED" && (
                      !cancelForm.getValues("cancellationNotes") || 
                      (selectedCancellationType === "reschedule" && !statusForm.getValues("fechaAgendado"))
                    )) ||
                    (!isPreOrder && !isGarantiaAplicada && !isCancellationFlow && (
                      selectedStatus === currentStatus || 
                      (selectedStatus === "FACTURADO" && currentStatus === "ASSIGNED" && !statusForm.getValues("presupuestoAmount")) ||
                      (selectedStatus === "REPARANDO" && !statusForm.getValues("fechaReparacion"))
                    ))}
                  className={`transition-all ${isCancellationFlow ? (
                    selectedCancellationType === "permanent" ? 
                      "bg-red-600 hover:bg-red-700 text-white" : 
                      "bg-amber-600 hover:bg-amber-700 text-white"
                  ) : ""}`}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Actualizando...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {isPreOrder ? (
                        <>
                          <Clock className="mr-2 h-4 w-4" />
                          <span>Convertir a Orden</span>
                        </>
                      ) : isGarantiaAplicada && selectedStatus === "GARANTIA_RESUELTA" ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          <span>Resolver Garantía</span>
                        </>
                
                      ) : selectedStatus === "FACTURADO" && currentStatus === "ASSIGNED" ? (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          <span>Establecer Presupuesto</span>
                        </>
                      ) : isCancellationFlow ? (
                        selectedCancellationType === "permanent" ? (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            <span>Cancelar Orden</span>
                          </>
                        ) : (
                          <>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Reprogramar Orden</span>
                          </>
                        )
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          <span>Actualizar Estado</span>
                        </>
                      )}
                    </div>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Cancellation Dialog */}
      <Dialog open={showCancellationDialog} onOpenChange={setShowCancellationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-red-600 dark:text-red-400">
              {isCancelled ? (
                <>
                  <RefreshCw className="h-5 w-5" />
                  Reactivar Orden
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  Cancelar Orden
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <Form {...cancelForm}>
            <form onSubmit={cancelForm.handleSubmit(handleCancellationSubmit)} className="space-y-5">
              {!isCancelled && (
                <FormField
                  control={cancelForm.control}
                  name="cancellationNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground flex items-center gap-1">
                        Razón de Cancelación
                        <span className="text-destructive text-sm">*</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explique el motivo de la cancelación"
                          {...field}
                          className="transition-all focus:ring-2 focus:ring-primary/20 resize-none"
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Es necesario indicar la razón por la que se cancela la orden
                      </FormDescription>
                      <FormMessage className="text-destructive text-sm" />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={cancelForm.control}
                name="cancellationType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Tipo de {isCancelled ? "Reactivación" : "Cancelación"}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-2"
                      >
                        {isCancelled ? (
                          <div className="flex items-center space-x-2 p-3 rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                            <RadioGroupItem value="revert" id="revert" className="text-blue-600" />
                            <Label htmlFor="revert" className="flex items-center cursor-pointer w-full">
                              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/50 mr-3">
                                <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <p className="font-medium text-blue-800 dark:text-blue-300">Reactivar Orden</p>
                                <p className="text-sm text-blue-600 dark:text-blue-400">La orden volverá a estar activa con su estado anterior</p>
                              </div>
                            </Label>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center space-x-2 p-3 rounded-md border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                              <RadioGroupItem value="permanent" id="permanent" className="text-red-600" />
                              <Label htmlFor="permanent" className="flex items-center cursor-pointer w-full">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50 mr-3">
                                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-red-800 dark:text-red-300">Cancelación Permanente</p>
                                  <p className="text-sm text-red-600 dark:text-red-400">La orden será cancelada definitivamente</p>
                                </div>
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
                              <RadioGroupItem value="reschedule" id="reschedule" className="text-amber-600" />
                              <Label htmlFor="reschedule" className="flex items-center cursor-pointer w-full">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 mr-3">
                                  <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                  <p className="font-medium text-amber-800 dark:text-amber-300">Cancelar y Reprogramar</p>
                                  <p className="text-sm text-amber-600 dark:text-amber-400">La orden se reprogramará para otra fecha</p>
                                </div>
                              </Label>
                            </div>
                          </>
                        )}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedCancellationType === "reschedule" && (
                <FormField
                  control={cancelForm.control}
                  name="fechaAgendado"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-foreground flex items-center gap-1">
                        Nueva Fecha de Agenda
                        <span className="text-destructive text-sm">*</span>
                      </FormLabel>
                      <FormControl>
                        <DateTimePicker
                          date={field.value || undefined}
                          setDate={(date) => field.onChange(date)}
                          className="w-full"
                        />
                      </FormControl>
                      <FormDescription>
                        Seleccione la nueva fecha y hora para reprogramar la orden
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <DialogFooter className="pt-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCancellationDialog(false)} 
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || 
                    (!isCancelled && !cancelForm.getValues("cancellationNotes")) || 
                    (selectedCancellationType === "reschedule" && !cancelForm.getValues("fechaAgendado"))}
                  className={
                    isCancelled ? "bg-blue-600 hover:bg-blue-700 text-white" :
                    selectedCancellationType === "permanent" ? 
                      "bg-red-600 hover:bg-red-700 text-white" : 
                      "bg-amber-600 hover:bg-amber-700 text-white"
                  }
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isCancelled ? (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  ) : selectedCancellationType === "permanent" ? (
                    <XCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Calendar className="h-4 w-4 mr-2" />
                  )}
                  {isCancelled ? "Reactivar Orden" :
                   selectedCancellationType === "permanent" ? "Cancelar Orden" : "Reprogramar Orden"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Garantia Dialog */}
      <Dialog open={showGarantiaDialog} onOpenChange={setShowGarantiaDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Establecer Garantía
            </DialogTitle>
          </DialogHeader>

          <GarantiaForm initialData={garantiaData} onSubmit={handleGarantiaSubmit} isLoading={isLoading} />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowGarantiaDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Warranty Dialog */}
      <WarrantyDialog
        open={showWarrantyDialog}
        onOpenChange={setShowWarrantyDialog}
        serviceOrderId={order.id}
        userId={userId}
        onSuccess={() => router.refresh()}
      />

      {/* Warranty Resolution Dialog */}
      <Dialog open={showWarrantyResolutionDialog} onOpenChange={setShowWarrantyResolutionDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Resolver Garantía
            </DialogTitle>
          </DialogHeader>

          <Form {...warrantyResolutionForm}>
            <form onSubmit={warrantyResolutionForm.handleSubmit(handleWarrantyResolution)} className="space-y-4">
              <FormField
                control={warrantyResolutionForm.control}
                name="razonResolucionGarantia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razón de Resolución</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describa cómo se resolvió el problema"
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormDescription>
                      Explique detalladamente cómo se resolvió el problema reportado
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowWarrantyResolutionDialog(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      <span>Resolver Garantía</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )}
