"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Building, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateSucursalWithRevalidation } from "../sucursales"
import { LogoSelect } from "./logo-select"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  header: z.string().optional(),
  logo: z.string().optional(),
  bottom: z.string().optional(),
})

interface SucursalEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sucursal: any
  userId: string
  onSuccess?: (sucursal: any) => void
}

export function SucursalEditDialog({ 
  open, 
  onOpenChange, 
  sucursal, 
  userId, 
  onSuccess 
}: SucursalEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: sucursal?.name || "",
      header: sucursal?.header || "",
      logo: sucursal?.logo || "",
      bottom: sucursal?.bottom || "",
    },
  })
  
  // Update form values when sucursal changes
  useEffect(() => {
    if (sucursal && open) {
      form.reset({
        name: sucursal.name || "",
        header: sucursal.header || "",
        logo: sucursal.logo || "",
        bottom: sucursal.bottom || "",
      })
    }
  }, [sucursal, form, open])
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const result = await updateSucursalWithRevalidation(sucursal.id, values, userId)
      if (result.success) {
        setSuccessMessage(true)
        setTimeout(() => {
          setSuccessMessage(false)
          if (onSuccess) onSuccess(result.data)
          onOpenChange(false)
        }, 1500)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al actualizar la sucursal",
        })
      }
    } catch (error) {
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
    <Dialog open={open} onOpenChange={(newOpenState) => {
      if (isSubmitting || successMessage) return; // Prevent closing during operations
      onOpenChange(newOpenState);
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <DialogTitle>Editar Sucursal</DialogTitle>
          </div>
          <DialogDescription>
            Actualice la información de la sucursal
          </DialogDescription>
        </DialogHeader>
        
        {successMessage ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-center">¡Sucursal actualizada!</h3>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Los cambios han sido guardados correctamente
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre de la sucursal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="header"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Encabezado</FormLabel>
                    <FormControl>
                      <Input placeholder="Texto de encabezado" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Se mostrará en la parte superior de la tarjeta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl>
                      <LogoSelect 
                        value={field.value || ''} 
                        onValueChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Seleccione un logo de la galería
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bottom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pie de página</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Texto del pie de página" 
                        {...field} 
                        value={field.value || ''}
                        className="resize-none"
                        rows={2}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Se mostrará en la parte inferior de la tarjeta
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    "Actualizar Sucursal"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}