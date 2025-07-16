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
import { Loader2, CalendarIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateServiceOrder } from "./actions"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { revalidatePath } from "next/cache"

const formSchema = z.object({
  fechaReparacion: z.date({
    required_error: "La fecha de reparación es requerida",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface SetRepairDateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceOrderId: string
  userId: string
  currentStatus: string
}

export async function handleDateUpdate(
  serviceOrderId: string,
  fechaReparacion: Date,
  userId: string
): Promise<void> {
  try {
    const updateData = {
      status: "REPARANDO",
      fechaReparacion: fechaReparacion
    }

    const result = await updateServiceOrder(serviceOrderId, updateData, userId)

    if (!result.success) {
      throw new Error(result.error || "Error actualizando fecha de reparación")
    }

    revalidatePath(`/ordenes/${serviceOrderId}`)
    return Promise.resolve()
  } catch (error) {
    console.error("Error actualizando fecha de reparación:", error)
    return Promise.reject(error)
  }
}

export function SetRepairDateDialog({
  open,
  onOpenChange,
  serviceOrderId,
  userId,
  currentStatus,
}: SetRepairDateDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fechaReparacion: undefined,
    },
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)

    try {
      await handleDateUpdate(serviceOrderId, values.fechaReparacion, userId)

      toast({
        title: "Éxito",
        description: "Fecha de reparación establecida correctamente",
        variant: "default",
      })
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error estableciendo fecha de reparación:", error)
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <CalendarIcon className="h-5 w-5 text-primary" />
            </motion.div>
            Establecer Fecha y Hora de Reparación
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
            <div className="p-4 rounded-lg border-2 bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                  <CalendarIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-300">
                    Establecer Fecha y Hora de Reparación
                  </h3>
                  <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                    La orden pasará al estado Reparando
                  </p>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
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
                    Seleccione la fecha y hora en que se realizará la reparación
                  </FormDescription>
                  <FormMessage />
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
              <Button
                type="submit"
                disabled={isSubmitting || !form.getValues("fechaReparacion")}
                className="transition-all bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span>Establecer Fecha y Hora</span>
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