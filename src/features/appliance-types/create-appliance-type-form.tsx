"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createApplianceType } from "./actions"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres",
  }),
})

type FormValues = z.infer<typeof formSchema>

interface CreateApplianceTypeFormProps {
  userId: string
  onSuccess?: (type: { id: string; name: string }) => void
}

export function CreateApplianceTypeForm({ userId, onSuccess }: CreateApplianceTypeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)
    try {
      const result = await createApplianceType({
        ...values,
        userId,
      })

      if (result.success && result.data) {
        if (onSuccess) onSuccess(result.data)
        form.reset()
      }
    } catch (error) {
      console.error("Error creating appliance type:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Tipo</FormLabel>
              <FormControl>
                <Input placeholder="Nombre del tipo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creando..." : "Crear Tipo"}
        </Button>
      </form>
    </Form>
  )
}
