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
import { Loader2, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createSucursal } from "./sucursales"
import { LogoSelect } from "@/features/sucursales/components/logo-select"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  header: z.string().optional(),
  logo: z.string().optional(),
  bottom: z.string().optional(),
})

interface SucursalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess?: (sucursal: any) => void
}

export function SucursalDialog({ open, onOpenChange, userId, onSuccess }: SucursalDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      header: "",
      logo: "",
      bottom: "",
    },
  })

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        header: "",
        logo: "",
        bottom: "",
      })
    }
  }, [open, form])

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const result = await createSucursal(values, userId)
      if (result.success) {
        toast({
          title: "Sucursal creada",
          description: "La sucursal ha sido creada correctamente",
          variant: "default",
        })
        form.reset()
        if (onSuccess) onSuccess(result.data)
        onOpenChange(false)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al crear la sucursal",
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <DialogTitle>Nueva Sucursal</DialogTitle>
          </div>
          <DialogDescription>
            Complete la información para crear una nueva sucursal
          </DialogDescription>
        </DialogHeader>
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
                    <Input placeholder="Texto de encabezado" {...field} />
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
                    Creando...
                  </>
                ) : (
                  "Crear Sucursal"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}