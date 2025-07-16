"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Loader2, Wrench, ThumbsUp, ThumbsDown, AlertCircle, ArrowLeft, Stethoscope, FileText, CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateServiceOrder } from "./actions"

const formSchema = z.object({
  presupuestoAmount: z.string().optional(),
  diagnostics: z.string().min(5, { message: "El diagnóstico debe tener al menos 5 caracteres" }).max(1000, { message: "El diagnóstico no puede exceder los 1000 caracteres" }).optional(),
  includeIVA: z.boolean().default(false),
  fechaReparacion: z.date().optional(),
  razonNoAprobado: z.string().optional(),
  fechaSeguimiento: z.date().optional()
})

type FormValues = z.infer<typeof formSchema>

interface TechnicianActionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceOrderId: string
  userId: string
  currentStatus?: string
}

export function TechnicianActionsDialog({
  open,
  onOpenChange,
  serviceOrderId,
  userId,
  currentStatus,
}: TechnicianActionsDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedAction, setSelectedAction] = useState<"APROBADO" | "NO_APROBADO" | "PENDIENTE_AVISAR" | "SET_REPARACION" | "SET_SEGUIMIENTO" | null>(null)
  const [activeTab, setActiveTab] = useState("presupuesto")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      presupuestoAmount: "",
      diagnostics: "",
      includeIVA: false,
      fechaReparacion: undefined,
      razonNoAprobado: "",
      fechaSeguimiento: undefined
    },
  })

  const handleActionClick = (action: "APROBADO" | "NO_APROBADO" | "PENDIENTE_AVISAR" | "SET_REPARACION" | "SET_SEGUIMIENTO") => {
    setSelectedAction(action)
    
    // Default values for form reset
    const defaultValues = {
      presupuestoAmount: action === "NO_APROBADO" ? "5" : "",
      diagnostics: "",
      includeIVA: false,
      fechaReparacion: undefined,
      razonNoAprobado: "",
      fechaSeguimiento: undefined
    }
    
    // Set specific default values based on action and status
    if (action === "NO_APROBADO" && currentStatus === "FACTURADO") {
      console.log("Initializing form for NO_APROBADO in FACTURADO status")
      // Focus on razonNoAprobado for FACTURADO status
      // We don't need to set presupuestoAmount or diagnostics for this case
      form.reset({
        ...defaultValues,
        razonNoAprobado: "" // Explicitly reset to make sure field is empty
      })
    } else {
      // Regular form reset
      form.reset(defaultValues)
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!selectedAction) return

    console.log("🔄 Form submitted with action:", selectedAction)
    console.log("📊 Current status:", currentStatus)
    console.log("📝 Form values:", values)
    
    setIsSubmitting(true)

    try {
      const updateData: any = {}
      
      // If we're updating from FACTURADO status with specific actions
      if (currentStatus === "FACTURADO") {
        console.log("Processing order with FACTURADO status")
        
        if (selectedAction === "SET_REPARACION") {
          // Just set repair date and move to REPARANDO
          console.log("SET_REPARACION: Updating order with fecha:", values.fechaReparacion)
          updateData.fechaReparacion = values.fechaReparacion
          updateData.status = "REPARANDO"
        } else if (selectedAction === "SET_SEGUIMIENTO") {
          // Set follow-up date for PENDIENTE_AVISAR
          updateData.fechaSeguimiento = values.fechaSeguimiento
          updateData.status = "PENDIENTE_AVISAR" 
        } else if (selectedAction === "NO_APROBADO") {
          // Handle not approved case
          console.log("NO_APROBADO: Setting reason:", values.razonNoAprobado)
          updateData.status = "NO_APROBADO"
          updateData.razonNoAprobado = values.razonNoAprobado || ""
          
          // Debug
          if (!values.razonNoAprobado) {
            console.warn("⚠️ Warning: razonNoAprobado is empty in NO_APROBADO action")
          }
        }
      } else {
        // Normal flow for non-FACTURADO orders
        updateData.status = selectedAction
        updateData.diagnostics = values.diagnostics
        updateData.includeIVA = values.includeIVA

        // Handle specific actions
        if (selectedAction === "APROBADO") {
          if (values.presupuestoAmount) {
            updateData.presupuestoAmount = values.presupuestoAmount
          }
          
          // If repair date is set, move directly to REPARANDO status
          if (values.fechaReparacion) {
            updateData.fechaReparacion = values.fechaReparacion
            updateData.status = "REPARANDO"
          }
        } else if (selectedAction === "NO_APROBADO") {
          updateData.presupuestoAmount = "5"
          if (values.razonNoAprobado) {
            console.log("NO_APROBADO: Setting reason:", values.razonNoAprobado)
            updateData.razonNoAprobado = values.razonNoAprobado
          }
        } else if (selectedAction === "PENDIENTE_AVISAR") {
          if (values.presupuestoAmount) {
            updateData.presupuestoAmount = values.presupuestoAmount
          }
          if (values.fechaSeguimiento) {
            updateData.fechaSeguimiento = values.fechaSeguimiento
          }
        }
      }

      console.log("⬆️ Sending update data to server:", updateData)
      const result = await updateServiceOrder(serviceOrderId, updateData, userId)
      console.log("⬇️ Server response:", result)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Estado actualizado correctamente",
          variant: "default",
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al actualizar el estado",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error updating status:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedAction(null)
      form.reset({
        presupuestoAmount: "",
        diagnostics: "",
        includeIVA: false,
        fechaReparacion: undefined,
        razonNoAprobado: "",
        fechaSeguimiento: undefined
      })
      setActiveTab("presupuesto")
    }
    onOpenChange(open)
  }

  // Check if the form is valid based on the selected action and current status
  const isFormValid = () => {
    if (!selectedAction) return false;
    
    const values = form.getValues();
    console.log("Validating form:", { selectedAction, values, currentStatus });
    
    if (currentStatus === "FACTURADO") {
      if (selectedAction === "SET_REPARACION") {
        return !!values.fechaReparacion;
      } else if (selectedAction === "SET_SEGUIMIENTO") {
        return !!values.fechaSeguimiento;
      } else if (selectedAction === "NO_APROBADO") {
        return !!values.razonNoAprobado; // Require razonNoAprobado for NO_APROBADO action
      }
      return false;
    } else {
      // Normal validation flow
      if (selectedAction === "APROBADO") {
        return !!values.presupuestoAmount && !!values.diagnostics;
      } else if (selectedAction === "NO_APROBADO") {
        return !!values.diagnostics;
      } else if (selectedAction === "PENDIENTE_AVISAR") {
        return !!values.presupuestoAmount && !!values.diagnostics && !!values.fechaSeguimiento;
      }
      return false;
    }
  }

  // Manual submit handler
  const handleSubmit = () => {
    console.log("🔄 Manual form submission triggered")
    const values = form.getValues()
    
    // Special handling for SET_REPARACION and FACTURADO
    if (selectedAction === "SET_REPARACION" && currentStatus === "FACTURADO") {
      console.log("📅 Processing SET_REPARACION with fecha:", values.fechaReparacion)
      if (!values.fechaReparacion) {
        toast({
          title: "Error",
          description: "Es necesario seleccionar una fecha para la reparación",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Special handling for NO_APROBADO and FACTURADO
    if (selectedAction === "NO_APROBADO" && currentStatus === "FACTURADO") {
      console.log("❌ Processing NO_APROBADO with razon:", values.razonNoAprobado)
      if (!values.razonNoAprobado) {
        toast({
          title: "Error",
          description: "Es necesario indicar la razón de no aprobación",
          variant: "destructive",
        });
        return;
      }
    }
    
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Wrench className="h-5 w-5 text-primary" />
            </motion.div>
            {currentStatus === "FACTURADO" ? 
              (selectedAction === "SET_REPARACION" ? "Establecer Fecha de Reparación" : 
              selectedAction === "SET_SEGUIMIENTO" ? "Establecer Fecha de Seguimiento" : 
              selectedAction === "NO_APROBADO" ? "No Aprobado" : 
              "Acciones Post-Presupuesto") 
            : currentStatus === "NO_APROBADO" ? 
              "Acciones Post-Presupuesto" 
            : "Acciones del Técnico"}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {!selectedAction ? (
            <motion.div
              key="options"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 py-4"
            >
              <p className="text-sm text-muted-foreground">
                Seleccione una acción para continuar:
              </p>
              {currentStatus === "FACTURADO" ? (
                // Options for FACTURADO status
                <div className="grid grid-cols-1 gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-start p-4 h-auto border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:border-blue-300 dark:border-blue-800 dark:bg-blue-950/20 dark:hover:bg-blue-900/40 transition-all"
                      onClick={() => handleActionClick("SET_REPARACION")}
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mr-4">
                        <CalendarIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-blue-700 dark:text-blue-300">Establecer Fecha de Reparación</h3>
                        <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                          El cliente aprobó la reparación, establecer fecha
                        </p>
                      </div>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-start p-4 h-auto border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 dark:border-red-800 dark:bg-red-950/20 dark:hover:bg-red-900/40 transition-all"
                      onClick={() => handleActionClick("NO_APROBADO")}
                    >
                      <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mr-4">
                        <ThumbsDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-red-700 dark:text-red-300">No Aprobado</h3>
                        <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                          El cliente no aprobó la reparación
                        </p>
                      </div>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-start p-4 h-auto border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-900/40 transition-all"
                      onClick={() => handleActionClick("SET_SEGUIMIENTO")}
                    >
                      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-4">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-amber-700 dark:text-amber-300">Pendiente por Avisar</h3>
                        <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                          Establecer fecha de seguimiento
                        </p>
                      </div>
                    </Button>
                  </motion.div>
                </div>
              ) : currentStatus === "NO_APROBADO" ? (
                // Options for NO_APROBADO status - similar to FACTURADO but with green colors for SET_REPARACION
                <div className="grid grid-cols-1 gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-start p-4 h-auto border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 dark:border-green-800 dark:bg-green-950/20 dark:hover:bg-green-900/40 transition-all"
                      onClick={() => handleActionClick("SET_REPARACION")}
                    >
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-4">
                        <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-green-700 dark:text-green-300">Establecer Fecha de Reparación</h3>
                        <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                          Establecer fecha para reparación
                        </p>
                      </div>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-start p-4 h-auto border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-900/40 transition-all"
                      onClick={() => handleActionClick("SET_SEGUIMIENTO")}
                    >
                      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-4">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-amber-700 dark:text-amber-300">Pendiente por Avisar</h3>
                        <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                          Establecer fecha de seguimiento
                        </p>
                      </div>
                    </Button>
                  </motion.div>
                </div>
              ) : (
                // Regular options for non-FACTURADO status
                <div className="grid grid-cols-1 gap-3">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-start p-4 h-auto border-2 border-green-200 bg-green-50 hover:bg-green-100 hover:border-green-300 dark:border-green-800 dark:bg-green-950/20 dark:hover:bg-green-900/40 transition-all"
                      onClick={() => handleActionClick("APROBADO")}
                    >
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mr-4">
                        <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-green-700 dark:text-green-300">Aprobado</h3>
                        <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                          El cliente aprobó la reparación
                        </p>
                      </div>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-start p-4 h-auto border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 dark:border-red-800 dark:bg-red-950/20 dark:hover:bg-red-900/40 transition-all"
                      onClick={() => handleActionClick("NO_APROBADO")}
                    >
                      <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center mr-4">
                        <ThumbsDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-red-700 dark:text-red-300">No Aprobado</h3>
                        <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
                          El cliente no aprobó la reparación
                        </p>
                      </div>
                    </Button>
                  </motion.div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full flex items-center justify-start p-4 h-auto border-2 border-amber-200 bg-amber-50 hover:bg-amber-100 hover:border-amber-300 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-900/40 transition-all"
                      onClick={() => handleActionClick("PENDIENTE_AVISAR")}
                    >
                      <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mr-4">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-amber-700 dark:text-amber-300">Pendiente por Avisar</h3>
                        <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                          Pendiente de comunicarse con el cliente
                        </p>
                      </div>
                    </Button>
                  </motion.div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Form {...form}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    console.log("Form native onSubmit triggered");
                    handleSubmit();
                  }}
                  className="space-y-5 py-4"
                >
                  <div className={`p-4 rounded-lg border-2 ${
                    selectedAction === "APROBADO" || selectedAction === "SET_REPARACION"
                      ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
                      : selectedAction === "NO_APROBADO"
                      ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
                      : "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        selectedAction === "APROBADO" || selectedAction === "SET_REPARACION"
                          ? "bg-green-100 dark:bg-green-900/50"
                          : selectedAction === "NO_APROBADO"
                          ? "bg-red-100 dark:bg-red-900/50"
                          : "bg-amber-100 dark:bg-amber-900/50"
                      }`}>
                        {(selectedAction === "APROBADO" || selectedAction === "SET_REPARACION") && 
                          (selectedAction === "SET_REPARACION" ? 
                            <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" /> :
                            <ThumbsUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                          )
                        }
                        {selectedAction === "NO_APROBADO" && <ThumbsDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
                        {(selectedAction === "PENDIENTE_AVISAR" || selectedAction === "SET_SEGUIMIENTO") && 
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        }
                      </div>
                      <div>
                        <h3 className={`font-semibold ${
                          selectedAction === "APROBADO" || selectedAction === "SET_REPARACION"
                            ? "text-green-700 dark:text-green-300"
                            : selectedAction === "NO_APROBADO"
                            ? "text-red-700 dark:text-red-300"
                            : "text-amber-700 dark:text-amber-300"
                        }`}>
                          {selectedAction === "APROBADO" && "Aprobado"}
                          {selectedAction === "SET_REPARACION" && "Establecer Fecha de Reparación"}
                          {selectedAction === "NO_APROBADO" && "No Aprobado"}
                          {selectedAction === "PENDIENTE_AVISAR" && "Pendiente por Avisar"}
                          {selectedAction === "SET_SEGUIMIENTO" && "Establecer Fecha de Seguimiento"}
                        </h3>
                        <p className={`text-sm mt-1 ${
                          selectedAction === "APROBADO" || selectedAction === "SET_REPARACION"
                            ? "text-green-600/80 dark:text-green-400/80"
                            : selectedAction === "NO_APROBADO"
                            ? "text-red-600/80 dark:text-red-400/80"
                            : "text-amber-600/80 dark:text-amber-400/80"
                        }`}>
                          {selectedAction === "APROBADO" && "Ingrese el monto aprobado por el cliente"}
                          {selectedAction === "SET_REPARACION" && "La orden pasará al estado Reparando"}
                          {selectedAction === "NO_APROBADO" && "Se cobrará un cargo por revisión de 5"}
                          {selectedAction === "PENDIENTE_AVISAR" && "Puede establecer un monto estimado"}
                          {selectedAction === "SET_SEGUIMIENTO" && "Elija cuando se debe contactar al cliente"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {currentStatus !== "FACTURADO" && (
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-5">
                      <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="presupuesto" className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Presupuesto</span>
                        </TabsTrigger>
                        <TabsTrigger value="diagnostico" className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4" />
                          <span>Diagnóstico</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="presupuesto" className="pt-4 space-y-4">
                        {(selectedAction === "APROBADO" || selectedAction === "PENDIENTE_AVISAR") && (
                          <FormField
                            control={form.control}
                            name="presupuestoAmount"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-foreground flex items-center gap-1">
                                  Monto del Presupuesto
                                  {selectedAction === "APROBADO" && (
                                    <span className="text-destructive text-sm">*</span>
                                  )}
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                    <Input
                                      type="number"
                                      placeholder="0.00"
                                      step="0.01"
                                      {...field}
                                      className="pl-7 transition-all focus:ring-2 focus:ring-primary/20"
                                    />
                                  </div>
                                </FormControl>
                                <FormDescription>
                                  {selectedAction === "APROBADO"
                                    ? "Ingrese el monto aprobado por el cliente"
                                    : "El monto es opcional en este estado"}
                                </FormDescription>
                                <FormMessage className="text-destructive text-sm" />
                              </FormItem>
                            )}
                          />
                        )}

                        {selectedAction === "APROBADO" && (
                          <FormField
                            control={form.control}
                            name="fechaReparacion"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Fecha de Reparación</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP", { locale: es })
                                        ) : (
                                          <span>Seleccionar fecha</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                      locale={es}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  Al establecer esta fecha, la orden pasará automáticamente a estado "Reparando"
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {selectedAction === "NO_APROBADO" && (
                          <FormField
                            control={form.control}
                            name="razonNoAprobado"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-foreground flex items-center gap-1">
                                  Razón de No Aprobación
                                  <span className="text-destructive text-sm">*</span>
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

                        {selectedAction === "PENDIENTE_AVISAR" && (
                          <FormField
                            control={form.control}
                            name="fechaSeguimiento"
                            render={({ field }) => (
                              <FormItem className="flex flex-col">
                                <FormLabel>Fecha de Seguimiento</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant={"outline"}
                                        className={cn(
                                          "w-full pl-3 text-left font-normal",
                                          !field.value && "text-muted-foreground"
                                        )}
                                      >
                                        {field.value ? (
                                          format(field.value, "PPP", { locale: es })
                                        ) : (
                                          <span>Seleccionar fecha</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      initialFocus
                                      locale={es}
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormDescription>
                                  Establezca cuándo se debe contactar al cliente para seguimiento
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        {(selectedAction === "APROBADO" || selectedAction === "PENDIENTE_AVISAR") && (
                          <FormField
                            control={form.control}
                            name="includeIVA"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base">
                                    Aplicar IVA (16%)
                                  </FormLabel>
                                  <FormDescription>
                                    Al activar esta opción se calculará el IVA (16%) sobre el monto del presupuesto
                                  </FormDescription>
                                </div>
                                <FormControl>
                                  <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}

                        {selectedAction === "NO_APROBADO" && (
                          <div className="p-4 rounded-lg bg-amber-50 border-2 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                              <div>
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                  Cargo por revisión
                                </p>
                                <p className="text-sm text-amber-600/80 dark:text-amber-400/80 mt-1">
                                  Se establecerá automáticamente un cargo de $5 por la revisión realizada.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="diagnostico" className="pt-4 space-y-4">
                        <FormField
                          control={form.control}
                          name="diagnostics"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground flex items-center gap-1">
                                Diagnóstico Técnico
                                <span className="text-destructive text-sm">*</span>
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Ingrese el diagnóstico detallado. Por ejemplo:
Falla detectada: Motor con rodamientos desgastados

Causa: Uso prolongado y desgaste normal

Componentes afectados: Motor principal, bomba de agua

Solución recomendada: Reemplazo de motor y mantenimiento preventivo"
                                  {...field}
                                  rows={8}
                                  className="resize-none transition-all focus:ring-2 focus:ring-primary/20"
                                />
                              </FormControl>
                              <FormDescription>
                                Describa el diagnóstico técnico realizado, incluyendo causas del problema y recomendaciones.
                              </FormDescription>
                              <FormMessage className="text-destructive text-sm" />
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                  )}

                  {/* Special form fields for FACTURADO status */}
                  {currentStatus === "FACTURADO" && (
                    <div className="space-y-4 mt-4">
                      {selectedAction === "SET_REPARACION" && (
                        <FormField
                          control={form.control}
                          name="fechaReparacion"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha de Reparación</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: es })
                                      ) : (
                                        <span>Seleccionar fecha</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    locale={es}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>
                                Al establecer esta fecha, la orden pasará automáticamente a estado "Reparando"
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {selectedAction === "NO_APROBADO" && currentStatus === "FACTURADO" && (
                        <FormField
                          control={form.control}
                          name="razonNoAprobado"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-foreground flex items-center gap-1">
                                Razón de No Aprobación
                                <span className="text-destructive text-sm">*</span>
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

                      {selectedAction === "SET_SEGUIMIENTO" && (
                        <FormField
                          control={form.control}
                          name="fechaSeguimiento"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Fecha de Seguimiento</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP", { locale: es })
                                      ) : (
                                        <span>Seleccionar fecha</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    locale={es}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormDescription>
                                Establezca cuándo se debe contactar al cliente para seguimiento
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}

                  <DialogFooter className="gap-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedAction(null)}
                      disabled={isSubmitting}
                      className="transition-all hover:bg-muted"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        console.log("Form submission triggered");
                        handleSubmit();
                      }}
                      disabled={isSubmitting || !isFormValid()}
                      className={`transition-all ${
                        selectedAction === "APROBADO" || selectedAction === "SET_REPARACION"
                          ? "bg-green-600 hover:bg-green-700"
                          : selectedAction === "NO_APROBADO"
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-amber-600 hover:bg-amber-700"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          {(selectedAction === "APROBADO" || selectedAction === "SET_REPARACION") && 
                            (selectedAction === "SET_REPARACION" ? 
                              <CalendarIcon className="mr-2 h-4 w-4" /> : 
                              <ThumbsUp className="mr-2 h-4 w-4" />
                            )
                          }
                          {selectedAction === "NO_APROBADO" && <ThumbsDown className="mr-2 h-4 w-4" />}
                          {(selectedAction === "PENDIENTE_AVISAR" || selectedAction === "SET_SEGUIMIENTO") && 
                            <AlertCircle className="mr-2 h-4 w-4" />
                          }
                          <span>Confirmar</span>
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}