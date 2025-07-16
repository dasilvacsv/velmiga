import { z } from "zod"

// Define the schema for order form values
export const ordenFormSchema = z.object({
  clientId: z.string({
    required_error: "Se requiere seleccionar un cliente"
  }),
  applianceId: z.string({
    required_error: "Se requiere seleccionar un electrodoméstico"
  }),
  falla: z.string({
    required_error: "Se requiere describir la falla"
  }).min(3, "La descripción de la falla debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  isPreOrder: z.boolean().default(false),
  reference: z.string().optional(),
  totalAmount: z.number().optional(),
  technicianId: z.string().optional(),
  fechaAgendado: z.date().optional(),
})

// Export the inferred type from the schema
export type OrdenFormValues = z.infer<typeof ordenFormSchema>

export const serviceOrderSchema = z.object({
  id: z.string().uuid().optional(),
  orderNumber: z.string(),
  clientId: z.string().uuid(),
  applianceId: z.string().uuid().optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["PENDING", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DELIVERED", "CANCELLED"]),
  diagnostics: z.string().optional(),
  solution: z.string().optional(),
  totalAmount: z.number().optional(),
  paymentStatus: z.enum(["PENDING", "PARTIAL", "PAID", "CANCELLED"]),
  paidAmount: z.number().optional(),
  receivedDate: z.date().optional(),
  completedDate: z.date().optional(),
  deliveredDate: z.date().optional(),
  // Nuevos campos
  conceptoOrden: z.any().optional(),
  garantiaStartDate: z.date().optional().nullable(),
  garantiaEndDate: z.date().optional().nullable(),
  garantiaIlimitada: z.boolean().optional(),
  multipleAppliances: z.string().optional().nullable(),
  fechaAgendado: z.date().optional(),
  fechaCaptacion: z.date().optional(),
})

export type ServiceOrderValues = z.infer<typeof serviceOrderSchema>
