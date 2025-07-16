"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, PlusCircle, X, Laptop } from "lucide-react"
import { createAppliance } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Brand } from "@/features/marcas/types"
import { ApplianceType } from "@/features/appliance-types/types"
import { motion, AnimatePresence } from "framer-motion"

// Define the schema for appliance creation
const applianceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
});

type ApplianceFormValues = z.infer<typeof applianceSchema>;

interface ApplianceFormProps {
  brandId: string
  applianceTypeId: string
  onApplianceCreated: (applianceId: string) => void
  brand?: Brand | null
  applianceType?: ApplianceType | null
}

export function ApplianceForm({
  brandId,
  applianceTypeId,
  onApplianceCreated,
  brand,
  applianceType
}: ApplianceFormProps) {
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { toast } = useToast()

  // Initialize the form
  const form = useForm<ApplianceFormValues>({
    resolver: zodResolver(applianceSchema),
    defaultValues: {
      name: "",
      model: "",
      serialNumber: "",
    },
  });

  const handleCreateAppliance = async (formData: ApplianceFormValues) => {
    if (!brandId || !applianceTypeId) {
      toast({
        title: "Error",
        description: "Debe seleccionar una marca y un tipo de electrodoméstico",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)

    try {
      const result = await createAppliance({
        ...formData,
        brandId,
        applianceTypeId,
      })

      if (result.success && result.data) {
        toast({
          title: "Éxito",
          description: "Electrodoméstico creado correctamente",
        })
        
        // Reset the form
        form.reset()
        
        // Hide the form
        setShowForm(false)
        
        // Call the callback with the new appliance ID
        onApplianceCreated(result.data.id)
      } else {
        toast({
          title: "Error",
          description: result.error || "Ocurrió un error al crear el electrodoméstico",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating appliance:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Show form only if brandId and applianceTypeId are available
  const canCreateAppliance = !!brandId && !!applianceTypeId

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              type="button" 
              variant="outline" 
              className="w-full group transition-all"
              onClick={() => setShowForm(true)}
              disabled={!canCreateAppliance}
            >
              <PlusCircle className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
              {canCreateAppliance 
                ? "Crear nuevo electrodoméstico" 
                : "Seleccione marca y tipo para crear electrodoméstico"}
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            className="border rounded-md p-5 bg-card shadow-sm"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center gap-2">
                <Laptop className="h-4 w-4 text-primary" />
                Crear electrodoméstico
                {brand && applianceType && (
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    ({brand.name} - {applianceType.name})
                  </span>
                )}
              </h3>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateAppliance)} className="space-y-4">
                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Nombre del electrodoméstico"
                          className="bg-background transition-all focus-visible:ring-2 focus-visible:ring-primary" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Model Field */}
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Modelo</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Modelo (opcional)"
                            className="bg-background transition-all focus-visible:ring-2 focus-visible:ring-primary" 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Ej: WM3500CW, RT29K5030S8
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Serial Number Field */}
                  <FormField
                    control={form.control}
                    name="serialNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Serie</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Número de serie (opcional)"
                            className="bg-background transition-all focus-visible:ring-2 focus-visible:ring-primary" 
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Ej: SN20210635783
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex gap-2 justify-end pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={isCreating}
                    size="sm"
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreating} size="sm">
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Crear
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}