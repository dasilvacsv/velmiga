import { useState, useEffect } from "react"
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
import { Loader2, FileText, AlertCircle, Check, X, FileText as FileText2, Percent, CreditCard } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateServiceOrder } from "./actions"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

const formSchema = z.object({
  headerText: z.string().min(2, {
    message: "El título debe tener al menos 2 caracteres",
  }).max(100, {
    message: "El título no puede exceder los 100 caracteres",
  }),
  bodyText: z.string().min(5, {
    message: "La descripción debe tener al menos 5 caracteres",
  }).max(1000, {
    message: "La descripción no puede exceder los 1000 caracteres",
  }),
  presupuestoAmount: z.string().min(1, {
    message: "El monto es requerido",
  }),
  includeIVA: z.boolean().default(false),
  diagnostico: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface EditPresupuestoDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceOrderId: string
  currentPresupuesto: any
  currentStatus: string
  userId: string
  diagnostics?: string
}

export function EditPresupuestoDialog({
  open,
  onOpenChange,
  serviceOrderId,
  currentPresupuesto,
  currentStatus,
  userId,
  diagnostics,
}: EditPresupuestoDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const parseConcepto = () => {
  try {
    let parsed;
    if (typeof currentPresupuesto === 'string') {
      parsed = JSON.parse(currentPresupuesto);
    } else if (currentPresupuesto && typeof currentPresupuesto === 'object') {
      parsed = currentPresupuesto;
    } else {
      parsed = { Header: "", Text: "", amount: "0", includeIVA: false };
    }
    
    // Asegurar que todas las propiedades existan
    return {
      Header: parsed.Header || "",
      Text: parsed.Text || "",
      amount: parsed.amount?.toString() || "0",
      includeIVA: parsed.includeIVA || false,
      totalAmount: parsed.totalAmount?.toString() || "0"
    };
  } catch (e) {
    return { Header: "", Text: "", amount: "0", includeIVA: false };
  }
}

  const initialValues = parseConcepto()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      headerText: initialValues.Header || "",
      bodyText: initialValues.Text || "",
      presupuestoAmount: initialValues.amount || "0",
      includeIVA: initialValues.includeIVA || false,
      diagnostico: diagnostics || "",
    },
  })

  useEffect(() => {
  if (open) {
    const values = parseConcepto();
    form.reset({
      headerText: values.Header,
      bodyText: values.Text,
      presupuestoAmount: values.amount,
      includeIVA: values.includeIVA,
      diagnostico: diagnostics || "",
    });
    setShowConfirmation(false);
  }
}, [open, form, currentPresupuesto, diagnostics]);

  const currentAmount = form.watch("presupuestoAmount") || "0"
  const includeIVA = form.watch("includeIVA")
  const numericAmount = parseFloat(currentAmount) || 0
  const ivaAmount = includeIVA ? numericAmount * 0.16 : 0
  const totalWithIVA = numericAmount + ivaAmount

  const onSubmit = async (values: FormValues) => {
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    setIsSubmitting(true)

    try {
      const conceptoOrden = {
        Header: values.headerText.trim(),
        Text: values.bodyText.trim(),
        amount: values.presupuestoAmount,
        includeIVA: values.includeIVA,
        totalAmount: values.includeIVA ? totalWithIVA.toFixed(2) : numericAmount.toFixed(2),
      }

      const updateData = {
        conceptoOrden,
        presupuestoAmount: values.presupuestoAmount,
        includeIVA: values.includeIVA,
        diagnostics: values.diagnostico,
      }

      const result = await updateServiceOrder(serviceOrderId, updateData, userId)

      if (result.success) {
        toast({
          title: "¡Éxito!",
          description: "Presupuesto actualizado correctamente",
          variant: "default",
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al procesar la solicitud",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error actualizando presupuesto:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
      setShowConfirmation(false)
    }
  }

  const handleCancel = () => {
    if (showConfirmation) {
      setShowConfirmation(false)
    } else {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] w-full max-h-[90vh] overflow-y-auto mx-auto my-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CreditCard className="h-5 w-5 text-blue-500" />
            </motion.div>
            <span>Editar Presupuesto</span>
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {showConfirmation ? (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 py-4 px-2"
            >
              <div className="bg-muted p-6 rounded-lg space-y-4">
                <h3 className="font-medium text-lg flex items-center gap-2">
                  <FileText2 className="h-5 w-5 text-primary" />
                  Resumen del Presupuesto
                </h3>
                
                <div className="space-y-4 divide-y divide-border">
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Título:</h4>
                    <p className="text-base bg-background/50 p-3 rounded-md">{form.getValues("headerText")}</p>
                  </div>

                  <div className="pt-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Descripción Detallada:</h4>
                    <div className="bg-background/50 p-3 rounded-md">
                      <p className="text-base whitespace-pre-line">{form.getValues("bodyText")}</p>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Diagnóstico Técnico:</h4>
                    <div className="bg-background/50 p-3 rounded-md">
                      <p className="text-base whitespace-pre-line">{form.getValues("diagnostico")}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-lg border">
                <h4 className="text-base font-medium flex items-center gap-2 mb-4">
                  <FileText2 className="h-5 w-5 text-primary" />
                  Detalles de Facturación
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Monto base:</span>
                    <span>${numericAmount.toFixed(2)}</span>
                  </div>
                  
                  {includeIVA && (
                    <div className="flex justify-between items-center text-cyan-700 dark:text-cyan-400">
                      <span className="flex items-center">
                        <Percent className="h-4 w-4 mr-1" /> 
                        IVA (16%):
                      </span>
                      <span>${ivaAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center py-2 text-lg border-t">
                    <span className="font-medium">Total:</span>
                    <span className="font-bold">${includeIVA ? totalWithIVA.toFixed(2) : numericAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-2">
                    <Badge 
                      variant="outline" 
                      className={includeIVA 
                        ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" 
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
                      }
                    >
                      {includeIVA ? "IVA Incluido (16%)" : "Sin IVA"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 dark:text-amber-300 font-medium">
                      ¿Confirmar cambios en el presupuesto?
                    </p>
                    <p className="text-amber-700/80 dark:text-amber-300/80 text-sm mt-1">
                      Al confirmar, se actualizará el presupuesto existente con los nuevos valores.
                      <br />Esta acción quedará registrada en el historial.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Volver a Editar
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      Confirmar Cambios
                    </>
                  )}
                </Button>
              </DialogFooter>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 px-2"
            >
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="bg-card p-6 rounded-lg border space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText2 className="h-5 w-5 text-primary" />
                        <h3 className="font-medium text-base">Detalles de Facturación</h3>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={includeIVA 
                          ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300" 
                          : "bg-muted"
                        }
                      >
                        {includeIVA 
                          ? `$${totalWithIVA.toFixed(2)} (con IVA)` 
                          : `$${numericAmount.toFixed(2)}`
                        }
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="presupuestoAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">
                              Monto del Servicio <span className="text-destructive">*</span>
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="0.00" 
                                  {...field} 
                                  className="pl-7" 
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="includeIVA"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-2">
                            <div className="space-y-0.5">
                              <FormLabel>Incluir IVA (16%)</FormLabel>
                              <FormDescription>
                                Agregar el 16% de IVA al total del servicio
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

                      {numericAmount > 0 && (
                        <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span>Monto base:</span>
                            <span>${numericAmount.toFixed(2)}</span>
                          </div>
                          
                          {includeIVA && (
                            <div className="flex justify-between items-center text-cyan-700 dark:text-cyan-400">
                              <span className="flex items-center">
                                <Percent className="h-4 w-4 mr-1" /> 
                                IVA (16%):
                              </span>
                              <span>${ivaAmount.toFixed(2)}</span>
                            </div>
                          )}
                          
                          <div className="flex justify-between items-center font-medium pt-2 border-t">
                            <span>Total:</span>
                            <span>${includeIVA ? totalWithIVA.toFixed(2) : numericAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="diagnostico"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Diagnóstico Técnico
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detalle el diagnóstico técnico y las observaciones relevantes"
                            {...field}
                            rows={5}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormDescription>
                          Detalle del diagnóstico técnico realizado
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="headerText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Título del Presupuesto <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Presupuesto Reparación de Lavadora Samsung"
                            {...field}
                            className="h-10"
                          />
                        </FormControl>
                        <FormDescription>
                          Título breve que describe el servicio
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bodyText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">
                          Descripción del Presupuesto <span className="text-destructive">*</span>
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detalle los trabajos a realizar. Por ejemplo:\n\n- Diagnóstico completo del equipo\n- Reemplazo de motor principal\n- Cambio de rodamientos\n- Limpieza general"
                            {...field}
                            rows={8}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormDescription>
                          Detalle todos los trabajos a realizar. Use guiones (-) para listar los items.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className="gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !form.getValues("presupuestoAmount")}
                      className="gap-2"
                    >
                      <CreditCard className="h-4 w-4" />
                      {isSubmitting ? "Actualizando..." : "Continuar"}
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