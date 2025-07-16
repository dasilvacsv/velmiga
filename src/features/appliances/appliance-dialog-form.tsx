"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription, useDialog } from "@/components/ui/dialog"
import { Loader2, Laptop, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BrandSelect } from "@/features/marcas/brand-select"
import { ApplianceTypeSelect } from "@/features/appliance-types/appliance-type-select"
import { createAppliance, updateAppliance } from "./actions"
import { motion } from "framer-motion"

// Define el esquema de validación con Zod
const applianceFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  brandId: z.string().uuid({
    message: "Debe seleccionar una marca",
  }),
  applianceTypeId: z.string().uuid({
    message: "Debe seleccionar un tipo de electrodoméstico",
  }),
})

export type ApplianceFormData = z.infer<typeof applianceFormSchema>

interface ApplianceDialogFormProps {
  initialData?: any
  mode?: "create" | "edit"
  userId: string
  initialBrands?: any[]
  initialApplianceTypes?: any[]
}

export function ApplianceDialogForm({
  initialData,
  mode = "create",
  userId,
  initialBrands = [],
  initialApplianceTypes = [],
}: ApplianceDialogFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { setOpen } = useDialog()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [selectedApplianceType, setSelectedApplianceType] = useState<any>(null)

  const form = useForm<ApplianceFormData>({
    resolver: zodResolver(applianceFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      model: initialData?.model || "",
      serialNumber: initialData?.serialNumber || "",
      brandId: initialData?.brandId || "",
      applianceTypeId: initialData?.applianceTypeId || "",
    },
  })

  const handleBrandSelect = (brandId: string, brand: any) => {
    form.setValue("brandId", brandId)
    setSelectedBrand(brand)
  }

  const handleApplianceTypeSelect = (applianceTypeId: string, applianceType: any) => {
    form.setValue("applianceTypeId", applianceTypeId)
    setSelectedApplianceType(applianceType)
  }

  async function handleSubmit(data: ApplianceFormData) {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      let result

      if (mode === "create") {
        result = await createAppliance(data, userId)
      } else {
        result = await updateAppliance(initialData.id, data, userId)
      }

      if (result.success) {
        toast({
          title: "Éxito",
          description: `Electrodoméstico ${mode === "create" ? "creado" : "actualizado"} correctamente`,
        })

        form.reset()
        setOpen(false)
        router.refresh()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || `Error al ${mode === "create" ? "crear" : "actualizar"} el electrodoméstico`,
        })
      }
    } catch (error) {
      console.error("Error submitting form:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="sm:max-w-[425px] md:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
        <DialogTitle className="text-xl flex items-center gap-2">
          <Laptop className="w-5 h-5 text-primary" />
          {mode === "create" ? "Nuevo Electrodoméstico" : "Editar Electrodoméstico"}
        </DialogTitle>
        <DialogDescription className="text-sm mt-1">
          Complete la información del electrodoméstico. Los campos con * son obligatorios.
        </DialogDescription>
      </DialogHeader>

      <div className="overflow-y-auto flex-1 px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-6">
            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Nombre *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Lavadora, Nevera, etc."
                          {...field}
                          className="bg-background transition-all focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Modelo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="XYZ-123"
                          {...field}
                          value={field.value || ""}
                          className="bg-background transition-all focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Número de Serie</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="SN12345678"
                          {...field}
                          value={field.value || ""}
                          className="bg-background transition-all focus-visible:ring-2 focus-visible:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Marca *</FormLabel>
                      <FormControl>
                        <BrandSelect
                          initialBrands={initialBrands}
                          selectedBrandId={field.value}
                          onBrandSelect={handleBrandSelect}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
              >
                <FormField
                  control={form.control}
                  name="applianceTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Tipo de Electrodoméstico *</FormLabel>
                      <FormControl>
                        <ApplianceTypeSelect
                          initialApplianceTypes={initialApplianceTypes}
                          selectedApplianceTypeId={field.value}
                          onApplianceTypeSelect={handleApplianceTypeSelect}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.4 }}
                className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 p-4 mt-6"
              >
                <div className="flex gap-2 text-blue-800 dark:text-blue-300">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">
                    La información del electrodoméstico se utilizará en todas las órdenes de servicio asociadas.
                    Verifique que los datos sean correctos.
                  </p>
                </div>
              </motion.div>
            </div>
          </form>
        </Form>
      </div>

      <DialogFooter className="flex space-x-2 mt-1 px-6 py-4 border-t flex-shrink-0">
        <Button
          variant="outline"
          onClick={() => setOpen(false)}
          disabled={isSubmitting}
          className="flex-1 text-sm transition-all"
        >
          Cancelar
        </Button>
        <Button
          onClick={form.handleSubmit(handleSubmit)}
          disabled={isSubmitting}
          className="flex-1 text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creando..." : "Actualizando..."}
            </>
          ) : mode === "create" ? (
            "Crear Electrodoméstico"
          ) : (
            "Actualizar Electrodoméstico"
          )}
        </Button>
      </DialogFooter>
    </div>
  )
}