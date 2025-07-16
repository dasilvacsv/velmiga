"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Truck, CalendarClock, Shield, CreditCard, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { createDeliveryNote } from "./actions"

const formSchema = z.object({
  receivedBy: z.string().min(2, {
    message: "Debe ingresar quién recibe el electrodoméstico",
  }),
  conceptoEntrega: z.string().optional(),
  notes: z.string().optional(),
  amount: z.string().optional(),
  includeIVA: z.boolean().default(false),
  header: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface DeliveryNoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceOrderId: string
  clientName: string
  userId: string
  garantiaStartDate?: Date | null
  garantiaEndDate?: Date | null
  garantiaIlimitada?: boolean
  conceptoOrden?: string | null
  presupuestoAmount?: string | null
}

export function DeliveryNoteDialog({
  open,
  onOpenChange,
  serviceOrderId,
  clientName,
  userId,
  garantiaStartDate,
  garantiaEndDate,
  garantiaIlimitada,
  conceptoOrden,
  presupuestoAmount,
}: DeliveryNoteDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [documentType, setDocumentType] = useState<"NOTA" | "PRESUPUESTO">("NOTA")

  let parsedConcepto = ""
  let parsedHeader = ""
  let parsedAmount = ""
  let parsedIncludeIVA = false
  let parsedTotalAmount = null

  if (conceptoOrden) {
    try {
      const concepto = typeof conceptoOrden === 'string' 
        ? JSON.parse(conceptoOrden) 
        : conceptoOrden
      parsedConcepto = concepto.Text || ""
      parsedHeader = concepto.Header || ""
      parsedAmount = concepto.amount || presupuestoAmount || ""
      parsedIncludeIVA = concepto.includeIVA === true
      parsedTotalAmount = concepto.totalAmount ? Number(concepto.totalAmount) : null
    } catch (e) {
      parsedConcepto = conceptoOrden
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      receivedBy: clientName,
      conceptoEntrega: parsedConcepto,
      notes: "",
      amount: parsedAmount || presupuestoAmount || "",
      includeIVA: parsedIncludeIVA,
      header: parsedHeader,
    },
  })

  const currentAmount = form.watch("amount") || "0"
  const includeIVA = form.watch("includeIVA")
  const numericAmount = parseFloat(currentAmount) || 0
  const ivaAmount = includeIVA ? (numericAmount * 0.16) : 0
  const totalWithIVA = numericAmount + ivaAmount

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    try {
      let notesText = ""
      let updatedConceptoOrden = null
      
      if (conceptoOrden) {
        try {
          const currentConcepto = typeof conceptoOrden === 'string' ? JSON.parse(conceptoOrden) : conceptoOrden
          updatedConceptoOrden = {
            ...currentConcepto,
            Header: values.header || currentConcepto.Header,
            Text: values.conceptoEntrega || currentConcepto.Text,
            amount: values.amount || currentConcepto.amount,
            includeIVA: values.includeIVA
          }
        } catch (e) {
          console.error("Error parsing conceptoOrden:", e)
        }
      }

      if (values.header) {
        notesText = `${values.header}\n${"=".repeat(values.header.length)}\n`
      }

      if (values.conceptoEntrega) {
        notesText = notesText ? `${notesText}\n${values.conceptoEntrega}` : values.conceptoEntrega
      }

      if (values.notes) {
        notesText = notesText ? `${notesText}\n\n${values.notes}` : values.notes
      }

      if (garantiaIlimitada) {
        notesText = `${notesText}\n\nGarantía: Ilimitada`
      } else if (garantiaStartDate && garantiaEndDate) {
        const startDateStr = format(new Date(garantiaStartDate), "PPP", { locale: es })
        const endDateStr = format(new Date(garantiaEndDate), "PPP", { locale: es })
        notesText = `${notesText}\n\nGarantía: Desde ${startDateStr} hasta ${endDateStr}`
      }

      const result = await createDeliveryNote(
        serviceOrderId,
        values.receivedBy,
        notesText.trim() || null,
        values.amount || null,
        values.includeIVA,
        userId,
        updatedConceptoOrden,
        documentType
      )

      if (result.success) {
        toast({
          title: "Éxito",
          description: documentType === "PRESUPUESTO" 
            ? "Presupuesto creado correctamente" 
            : "Nota de entrega creada correctamente",
          variant: "default",
        })
        onOpenChange(false)
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al crear el documento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating document:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
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
              {documentType === "PRESUPUESTO" ? (
                <FileText className="h-5 w-5 text-blue-600" />
              ) : (
                <Truck className="h-5 w-5 text-primary" />
              )}
            </motion.div>
            <span>{documentType === "PRESUPUESTO" ? "Crear Presupuesto" : "Crear Nota de Entrega"}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-start gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Button
              variant={documentType === "NOTA" ? "default" : "outline"}
              onClick={() => setDocumentType("NOTA")}
              className="relative"
            >
              <Truck className="mr-2 h-4 w-4" />
              Nota de Entrega
              {documentType === "NOTA" && (
                <motion.div
                  layoutId="pill-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </Button>
            <Button
              variant={documentType === "PRESUPUESTO" ? "default" : "outline"}
              onClick={() => setDocumentType("PRESUPUESTO")}
              className="relative"
            >
              <FileText className="mr-2 h-4 w-4" />
              Presupuesto
              {documentType === "PRESUPUESTO" && (
                <motion.div
                  layoutId="pill-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-2">
            <FormField
              control={form.control}
              name="receivedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground flex items-center gap-2">
                    Recibido por
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Nombre de quien recibe"
                      className="transition-all focus:ring-2 focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormDescription className="text-muted-foreground text-sm">
                    Persona que recibe el electrodoméstico
                  </FormDescription>
                  <FormMessage className="text-destructive text-sm" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="header"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground flex items-center gap-2">
                    Título
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Título del concepto" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-card p-6 rounded-lg border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
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
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Monto del Servicio
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Incluir IVA (16%)</FormLabel>
                        <FormDescription>
                          {field.value
                            ? "El monto incluirá IVA del 16%"
                            : "El monto NO incluirá IVA"}
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
                        <span>IVA (16%):</span>
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
              name="conceptoEntrega"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground flex items-center gap-2">
                    Concepto de Entrega
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Ingrese el concepto de entrega"
                      className="min-h-[100px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {(garantiaStartDate || garantiaEndDate || garantiaIlimitada) && (
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-200 dark:border-green-800">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300 flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" />
                  Información de Garantía
                </h3>

                {garantiaIlimitada ? (
                  <p className="text-green-700 dark:text-green-400 text-sm">
                    Este producto cuenta con garantía ilimitada.
                  </p>
                ) : garantiaStartDate && garantiaEndDate ? (
                  <div className="space-y-1 text-sm text-green-700 dark:text-green-400">
                    <p className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      <span>Desde: {format(new Date(garantiaStartDate), "PPP", { locale: es })}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4" />
                      <span>Hasta: {format(new Date(garantiaEndDate), "PPP", { locale: es })}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-green-700 dark:text-green-400 text-sm">
                    La información de garantía se incluirá en la nota de entrega.
                  </p>
                )}
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Notas Adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Notas adicionales (opcional)"
                      {...field}
                      rows={2}
                      className="transition-all resize-none focus:ring-2 focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage className="text-destructive text-sm" />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="transition-all hover:bg-muted"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="transition-all">
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Creando...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    {documentType === "PRESUPUESTO" ? (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Crear Presupuesto</span>
                      </>
                    ) : (
                      <>
                        <Truck className="mr-2 h-4 w-4" />
                        <span>Crear Nota de Entrega</span>
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
  )
}