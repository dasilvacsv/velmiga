"use client"

import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { createTechnician, updateTechnician, TechnicianFormData } from "./technicians"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertCircle, Loader2, UserPlus } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  phone: z.string().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
})

export type TechnicianFormValues = z.infer<typeof formSchema>

interface TechnicianFormProps {
  closeDialog: () => void
  initialData?: TechnicianFormData & { id: string }
  mode: "create" | "edit"
}

export function TechnicianDialogForm({ closeDialog, initialData, mode }: TechnicianFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<TechnicianFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      phone: initialData.phone || "",
      is_active: initialData.is_active,
    } : {
      name: "",
      phone: "",
      is_active: true,
    },
  })

  async function onSubmit(values: TechnicianFormValues) {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      const formData: TechnicianFormData = {
        name: values.name,
        phone: values.phone || null,
        is_active: values.is_active,
      }

      let result
      
      if (mode === "edit" && initialData) {
        result = await updateTechnician(initialData.id, formData)
      } else {
        result = await createTechnician(formData)
      }

      if (result.success) {
        toast({
          title: mode === "edit" ? "Técnico actualizado" : "Técnico creado",
          description: mode === "edit"
            ? "El técnico ha sido actualizado correctamente."
            : "El técnico ha sido creado correctamente.",
        })
        router.refresh()
        closeDialog()
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error,
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ha ocurrido un error. Por favor, inténtelo de nuevo.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="sm:max-w-[425px] md:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
      <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
        <DialogTitle className="text-xl flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" />
          {mode === "create" ? "Nuevo Técnico" : "Editar Técnico"}
        </DialogTitle>
        <DialogDescription className="text-sm mt-1">
          Complete los datos del técnico. Todos los campos marcados con * son obligatorios.
        </DialogDescription>
      </DialogHeader>

      <div className="overflow-y-auto flex-1 px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium flex items-center gap-1">
                      Nombre *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Juan Pérez" 
                        {...field} 
                        className="bg-background transition-all focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Teléfono</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="+1234567890" 
                        {...field} 
                        className="bg-background transition-all focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 transition-all hover:bg-accent">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Estado</FormLabel>
                      <FormDescription>
                        Indica si el técnico está activo en el sistema.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className={cn(
                          field.value ? "bg-primary" : "bg-input",
                        )}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 p-4 mt-6">
                <div className="flex gap-2 text-blue-800 dark:text-blue-300">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">
                    Al crear un técnico, se generará un perfil único en nuestro sistema. 
                    Asegúrese de que todos los datos sean correctos antes de continuar.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </Form>
      </div>

      <DialogFooter className="flex space-x-2 mt-1 px-6 py-4 border-t flex-shrink-0">
        <Button
          variant="outline"
          onClick={closeDialog}
          disabled={isSubmitting}
          className="flex-1 text-sm transition-all"
        >
          Cancelar
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className="flex-1 text-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === "create" ? "Creando..." : "Actualizando..."}
            </>
          ) : mode === "create" ? (
            "Crear Técnico"
          ) : (
            "Actualizar Técnico"
          )}
        </Button>
      </DialogFooter>
    </div>
  )
}