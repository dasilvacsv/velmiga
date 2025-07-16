import { z } from "zod"

// Define form schema
export const ordenFormSchema = z.object({
  clientId: z.string().uuid({
    message: "Debe seleccionar un cliente",
  }),
  brandId: z
    .string()
    .uuid({
      message: "Debe seleccionar una marca",
    })
    .optional(),
  applianceTypeId: z
    .string()
    .uuid({
      message: "Debe seleccionar un tipo de electrodoméstico",
    })
    .optional(),
  applianceId: z
    .string()
    .uuid({
      message: "Debe seleccionar un electrodoméstico",
    })
    .optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  technicianId: z.string().optional(),
  diagnostics: z.string().optional(),
  solution: z.string().optional(),
  totalAmount: z.string().optional(),
  falla: z.string().min(1, {
    message: "Debe ingresar la descripción de la falla",
  }).optional(),
  fechaAgendado: z.date().optional(),
  fechaCaptacion: z.date().optional(),
  fechaSeguimiento: z.date().optional(),
  fechaReparacion: z.date().optional(),
  razonNoAprobado: z.string().optional(),
  isPreOrder: z.boolean().optional().default(false),
})
.refine((data) => {
  // If applianceId is provided, falla should be required
  if (data.applianceId && !data.falla) {
    return false;
  }
  return true;
}, {
  message: "Debe ingresar la descripción de la falla",
  path: ["falla"]
});

export type OrdenFormValues = z.infer<typeof ordenFormSchema>

export const serviceOrderSchema = z.object({
  id: z.string().uuid().optional(),
  orderNumber: z.string(),
  clientId: z.string().uuid(),
  applianceId: z.string().uuid().optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  status: z.enum([
    "PENDING", 
    "ASSIGNED", 
    "IN_PROGRESS", 
    "COMPLETED", 
    "DELIVERED", 
    "CANCELLED", 
    "PREORDER", 
    "APROBADO", 
    "NO_APROBADO", 
    "PENDIENTE_AVISAR", 
    "FACTURADO", 
    "ENTREGA_GENERADA", 
    "GARANTIA_APLICADA",
    "REPARANDO"
  ]),
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
  fechaSeguimiento: z.date().optional(),
  fechaReparacion: z.date().optional(),
  razonNoAprobado: z.string().optional(),
})

export type ServiceOrderValues = z.infer<typeof serviceOrderSchema>