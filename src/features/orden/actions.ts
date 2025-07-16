'use server'

import { db } from "@/db"
import {
  serviceOrders,
  technicianAssignments,
  payments,
  deliveryNotes,
  serviceOrderAppliances,
  ORDER_STATUS_ENUM,
  type PAYMENT_STATUS_ENUM,
  serviceOrderStatusHistory,
  WARRANTY_PRIORITY_ENUM,
  applianceTypes,
  clients,
  clientAppliances,
  technicians,
} from "@/db/schema"
import { eq, and, desc, ne } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { OrdenFormValues } from "./schema"
import { formatPhoneNumber, generateOrderCode } from "@/lib/utils"
import type { SelectedAppliance } from "../appliances/multi-appliance-selector"
import { sendWhatsappMessage } from "@/features/whatsapp/actions"

type OrderStatus = (typeof ORDER_STATUS_ENUM.enumValues)[number]
type PaymentStatus = (typeof PAYMENT_STATUS_ENUM.enumValues)[number]
type WarrantyPriority = (typeof WARRANTY_PRIORITY_ENUM.enumValues)[number]

// Helper functions for message formatting
function formatTechniciansList(technicians: { name: string; phone: string }[]) {
  return technicians.map((t, index) => 
    `${index + 1}. 👨‍🔧 *${t.name}* - 📞 ${formatPhoneNumber(t.phone)}`
  ).join('\n');
}

const BOSS_PHONE = process.env.BOSS_PHONE

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    "PREORDER": "Pre-orden",
    "PENDING": "Pendiente",
    "ASSIGNED": "Asignada",
    "IN_PROGRESS": "En Progreso",
    "COMPLETED": "Completada",
    "DELIVERED": "Entregada",
    "CANCELLED": "Cancelada",
    "APROBADO": "Aprobada",
    "NO_APROBADO": "No Aprobada",
    "PENDIENTE_AVISAR": "Pendiente Avisar",
    "FACTURADO": "Facturada",
    "ENTREGA_GENERADA": "Entrega Generada",
    "GARANTIA_APLICADA": "Garantía Aplicada"
  };
  
  return statusMap[status] || status;
}

function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(numAmount);
}

export async function createServiceOrder(data: OrdenFormValues, userId: string, appliances?: SelectedAppliance[]) {
  console.log("Iniciando createServiceOrder con datos:", {
    clientId: data.clientId,
    multipleAppliances: appliances ? appliances.length : 0,
    isPreOrder: data.isPreOrder,
  })

  try {
    // Validar datos requeridos
    if (!data.clientId) {
      console.error("Error: clientId es requerido")
      return { success: false, error: "El ID del cliente es requerido" }
    }

    // Verificar si hay electrodomésticos seleccionados
    const hasMultipleAppliances = appliances && appliances.length > 0
    const hasSingleAppliance = !!data.applianceId

    if (!hasMultipleAppliances && !hasSingleAppliance) {
      console.error("Error: Se requiere al menos un electrodoméstico")
      return { success: false, error: "Se requiere seleccionar al menos un electrodoméstico" }
    }

    // Generar código de orden basado en el tipo de electrodoméstico
    let applianceCode = "ORD" // Código por defecto

    if (hasSingleAppliance && data.applianceTypeId) {
      // Buscar el tipo de electrodoméstico para obtener el nombre
      const applianceType = await db.query.applianceTypes.findFirst({
        where: eq(applianceTypes.id, data.applianceTypeId),
      })

      if (applianceType) {
        // Tomar las primeras 3 letras del nombre del tipo
        applianceCode = applianceType.name.substring(0, 3).toUpperCase()
      }
    } else if (hasMultipleAppliances && appliances && appliances.length > 0) {
      // Para múltiples electrodomésticos, usar el tipo del primero
      const firstApplianceId = appliances[0].id
      const firstAppliance = await db.query.clientAppliances.findFirst({
        where: eq(clientAppliances.id, firstApplianceId),
        with: {
          applianceType: true,
        },
      })

      if (firstAppliance?.applianceType) {
        applianceCode = firstAppliance.applianceType.name.substring(0, 3).toUpperCase()
      }
    }

    const orderNumber = await generateOrderCode(applianceCode)
    console.log("Número de orden generado:", orderNumber)

    // Preparar datos para la inserción de la orden
    const orderStatus = data.isPreOrder
      ? ("PREORDER" as OrderStatus)
      : ((data.technicianId && data.technicianId !== "unassigned" ? "ASSIGNED" : "PENDING") as OrderStatus)

    // Handle date fields correctly
    const fechaCaptacion = new Date() // Current date

    // Create the order data object with the correct type for fechaAgendado
    const orderData = {
      orderNumber,
      clientId: data.clientId,
      status: orderStatus,
      paymentStatus: "PENDING" as PaymentStatus,
      reference: data.reference || null,
      description: data.description || null,
      totalAmount: data.totalAmount ? data.totalAmount.toString() : "0",
      fechaCaptacion, // Set to current date
      // Only include fechaAgendado if it's not null or undefined
      ...(data.fechaAgendado ? { fechaAgendado: data.fechaAgendado } : {}),
      createdBy: userId,
      updatedBy: userId,
      includeIVA: false, // Default value for new orders
      clientNotificationsEnabled: true, // Default to enabled
      cancellationNotes: null // Field for cancellation notes
    }

    // Crear la orden
    const [order] = await db.insert(serviceOrders).values(orderData).returning()
    console.log("Orden creada con ID:", order.id)

    // Add status history record for initial creation
    await db.insert(serviceOrderStatusHistory).values({
      serviceOrderId: order.id,
      status: orderStatus,
      notes: `${data.isPreOrder ? "Pre-orden" : "Orden"} creada con estado: ${orderStatus}`,
      createdBy: userId,
    })

    // Crear registros en la tabla de unión para cada electrodoméstico
    if (hasMultipleAppliances && appliances) {
      for (const appliance of appliances) {
        await db.insert(serviceOrderAppliances).values({
          serviceOrderId: order.id,
          clientApplianceId: appliance.id,
          falla: appliance.falla || null,
          solucion: null, // Inicialmente vacío
          createdBy: userId,
          updatedBy: userId,
        })
      }
    } else if (hasSingleAppliance && data.applianceId) {
      await db.insert(serviceOrderAppliances).values({
        serviceOrderId: order.id,
        clientApplianceId: data.applianceId,
        falla: data.falla || null,
        solucion: null, // Inicialmente vacío
        createdBy: userId,
        updatedBy: userId,
      })
    }

    // Si se seleccionó un técnico válido, crear la asignación
    if (data.technicianId && data.technicianId !== "unassigned") {
      console.log("Asignando técnico:", data.technicianId)
      await db.insert(technicianAssignments).values({
        serviceOrderId: order.id,
        technicianId: data.technicianId,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      })
    }

    // Fetch necessary data for WhatsApp notifications
    const clientInfo = await db.query.clients.findFirst({
      where: eq(clients.id, data.clientId),
      columns: {
        name: true,
        phone: true,
        whatsapp: true,
      },
    })

    let techniciansInfo = [];
    if (data.technicianId && data.technicianId !== "unassigned") {
      const technicianInfo = await db.query.technicians.findFirst({
        where: eq(technicians.id, data.technicianId),
        columns: {
          name: true,
          phone: true,
        },
      })
      if (technicianInfo) {
        techniciansInfo.push(technicianInfo);
      }
    }
    
    // Get appliance details for messages
    let applianceDetails = "";
    if (hasMultipleAppliances && appliances) {
      for (const appliance of appliances) {
        const applianceData = await db.query.clientAppliances.findFirst({
          where: eq(clientAppliances.id, appliance.id),
          with: {
            brand: true,
            applianceType: true,
          },
        })
        if (applianceData) {
          applianceDetails += `\n🔹 *${applianceData.name}* (${applianceData.brand.name} ${applianceData.applianceType.name})`
          if (appliance.falla) {
            applianceDetails += `\n  ⚠️ *Falla:* _${appliance.falla}_`
          }
        }
      }
    } else if (hasSingleAppliance && data.applianceId) {
      const applianceData = await db.query.clientAppliances.findFirst({
        where: eq(clientAppliances.id, data.applianceId),
        with: {
          brand: true,
          applianceType: true,
        },
      })
      if (applianceData) {
        applianceDetails += `\n🔹 *${applianceData.name}* (${applianceData.brand.name} ${applianceData.applianceType.name})`
        if (data.falla) {
          applianceDetails += `\n  ⚠️ *Falla:* _${data.falla}_`
        }
      }
    }

    // Create messages for both client and boss
    const clientMessage = 
      `╔══════════════════════════╗\n` +
      `║    🔧 NUEVA ORDEN DE SERVICIO    ║\n` +
      `╚══════════════════════════╝\n\n` +
      `🆔 *No. Orden:* #${orderNumber}\n` +
      `👤 *Cliente:* ${clientInfo?.name || "No especificado"}\n` +
      `📱 *Teléfono:* ${formatPhoneNumber(clientInfo?.phone || "")}\n` +
      `📋 *Tipo:* ${data.isPreOrder ? "Pre-orden" : "Orden de servicio"}\n` +
      `🏷️ *Estado:* ${getStatusText(orderStatus)}\n` +
      `📅 *Fecha:* ${new Date().toLocaleDateString("es-ES")}\n` +
      (data.fechaAgendado ? `📆 *Fecha Agendada:* ${new Date(data.fechaAgendado).toLocaleDateString("es-ES")}\n` : "") +
      `\n📌 *ELECTRODOMÉSTICO(S):*${applianceDetails}\n` +
      `\n📝 *DETALLES:*\n${data.description ? `_${data.description}_` : "_No se proporcionaron detalles_"}\n` +
      (techniciansInfo.length > 0 ? `\n👨‍🔧 *TÉCNICO ASIGNADO:*\n${formatTechniciansList(techniciansInfo)}\n` : "") +
      `\n💰 *Monto:* ${data.totalAmount ? formatCurrency(data.totalAmount) : "A determinar"}\n` +
      `\n✅ Su solicitud ha sido registrada exitosamente.` +
      `\n📞 Para consultas llame al ${formatPhoneNumber(BOSS_PHONE)}`

    const bossMessage = 
      `🚨 *NUEVA ORDEN CREADA* 🚨\n\n` +
      `🆔 *Orden:* #${orderNumber}\n` +
      `👤 *Cliente:* ${clientInfo?.name || "No especificado"}\n` +
      `📱 *Contacto:* ${formatPhoneNumber(clientInfo?.phone || "")}\n` +
      `📋 *Tipo:* ${data.isPreOrder ? "Pre-orden" : "Orden de servicio"}\n` +
      `🏷️ *Estado:* ${getStatusText(orderStatus)}\n` +
      `\n📌 *ELECTRODOMÉSTICO(S):*${applianceDetails}\n` +
      `\n📝 *DETALLES:*\n${data.description ? `_${data.description}_` : "_No se proporcionaron detalles_"}\n` +
      (techniciansInfo.length > 0 ? `\n👨‍🔧 *TÉCNICO ASIGNADO:*\n${formatTechniciansList(techniciansInfo)}\n` : "") +
      `\n💰 *Monto:* ${data.totalAmount ? formatCurrency(data.totalAmount) : "A determinar"}`

    // Send messages
    // To client
    if (clientInfo?.whatsapp) {
      await sendWhatsappMessage(formatPhoneNumber(clientInfo.whatsapp), clientMessage);
    }
    
    // To boss
    await sendWhatsappMessage(BOSS_PHONE, bossMessage);

    revalidatePath("/ordenes")
    return { success: true, data: order }
  } catch (error) {
    console.error("Error detallado al crear orden de servicio:", error)
    return {
      success: false,
      error: "Error al crear la orden de servicio",
      details: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function updateServiceOrder(id: string, data: any, userId: string) {
  try {
    // Get current order status before update
    const currentOrder = await db.query.serviceOrders.findFirst({
      where: eq(serviceOrders.id, id),
      columns: {
        status: true,
        presupuestoAmount: true,
        includeIVA: true,
        orderNumber: true,
        clientNotificationsEnabled: true,
        cancellationNotes: true,
      },
      with: {
        client: {
          columns: {
            name: true,
            phone: true,
            whatsapp: true,
          }
        },
        appliances: {
          with: {
            clientAppliance: {
              with: {
                brand: true,
                applianceType: true,
              },
            },
          },
        }
      }
    })

    // Preparar los datos para actualizar la orden
    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    }

    // Actualizar campos si están presentes en los datos
    if (data.clientId) updateData.clientId = data.clientId
    if (data.reference !== undefined) updateData.reference = data.reference || null
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.totalAmount !== undefined) {
      updateData.totalAmount = data.totalAmount ? data.totalAmount.toString() : "0"
    }

    // Handle IVA flag
    if (data.includeIVA !== undefined) {
      updateData.includeIVA = data.includeIVA
    }

    // Handle client notifications toggle
    if (data.clientNotificationsEnabled !== undefined) {
      updateData.clientNotificationsEnabled = data.clientNotificationsEnabled
    }

    // Handle razonNoAprobado field
    if (data.razonNoAprobado !== undefined) {
      updateData.razonNoAprobado = data.razonNoAprobado
    }

    // Handle cancellation notes
    if (data.cancellationNotes !== undefined) {
      updateData.cancellationNotes = data.cancellationNotes
    }

    // Handle rescheduledFromCancellation flag
    if (data.rescheduledFromCancellation !== undefined) {
      updateData.rescheduledFromCancellation = data.rescheduledFromCancellation
    }

    // Handle date fields specifically
    if (data.fechaAgendado !== undefined) {
      updateData.fechaAgendado = new Date(data.fechaAgendado);
    }
    if (data.fechaCaptacion !== undefined) {
      updateData.fechaCaptacion = new Date(data.fechaCaptacion);
    }
    if (data.fechaSeguimiento !== undefined) {
      updateData.fechaSeguimiento = new Date(data.fechaSeguimiento);
    }
    if (data.fechaReparacion !== undefined) {
      updateData.fechaReparacion = new Date(data.fechaReparacion);
    }

    // Track if status is changing
    let statusChanged = false
    let newStatus = currentOrder?.status || null
    let oldStatus = currentOrder?.status || null

    if (data.status) {
      const validStatuses = ORDER_STATUS_ENUM.enumValues
      if (validStatuses.includes(data.status)) {
        if (currentOrder && currentOrder.status !== data.status) {
          statusChanged = true
          newStatus = data.status
        }
        updateData.status = data.status
      } else {
        console.error(`Invalid status value: ${data.status}`)
        return { success: false, error: `Estado inválido: ${data.status}` }
      }
    }

    // Handle presupuestoAmount
    if (data.presupuestoAmount !== undefined) {
      updateData.presupuestoAmount = data.presupuestoAmount
    }

    // Handle diagnostics
    if (data.diagnostics !== undefined) {
      updateData.diagnostics = data.diagnostics
    }

    if (data.conceptoOrden !== undefined) {
  // Asegurar estructura completa con valores por defecto
  const baseConcepto = typeof data.conceptoOrden === 'string' 
    ? JSON.parse(data.conceptoOrden)
    : data.conceptoOrden;

  updateData.conceptoOrden = JSON.stringify({
    Header: baseConcepto.Header || "",
    Text: baseConcepto.Text || "",
    amount: baseConcepto.amount?.toString() || "0",
    includeIVA: data.includeIVA ?? baseConcepto.includeIVA ?? false,
    totalAmount: baseConcepto.totalAmount?.toString() || 
      (baseConcepto.amount && data.includeIVA 
        ? (Number(baseConcepto.amount) * 1.16).toFixed(2)
        : baseConcepto.amount)
  });
}

    // Handle concepto orden with IVA information
    if (data.conceptoOrden !== undefined) {
      if (typeof data.conceptoOrden === 'object') {
        // If it's already an object, add IVA information
        updateData.conceptoOrden = {
          ...data.conceptoOrden,
          includeIVA: data.includeIVA,
        }
      } else {
        // If it's a string, parse it first
        try {
          const parsedConcepto = JSON.parse(data.conceptoOrden)
          updateData.conceptoOrden = {
            ...parsedConcepto,
            includeIVA: data.includeIVA,
          }
        } catch (e) {
          updateData.conceptoOrden = data.conceptoOrden
        }
      }
    }

    // Campos de garantía
    if (data.garantiaStartDate !== undefined) updateData.garantiaStartDate = data.garantiaStartDate
    if (data.garantiaEndDate !== undefined) updateData.garantiaEndDate = data.garantiaEndDate
    if (data.garantiaIlimitada !== undefined) updateData.garantiaIlimitada = data.garantiaIlimitada
    if (data.razonGarantia !== undefined) updateData.razonGarantia = data.razonGarantia
    if (data.garantiaPrioridad !== undefined) {
      if (WARRANTY_PRIORITY_ENUM.enumValues.includes(data.garantiaPrioridad)) {
        updateData.garantiaPrioridad = data.garantiaPrioridad
      } else {
        console.error(`Invalid priority value: ${data.garantiaPrioridad}`)
        return { success: false, error: `Prioridad inválida: ${data.garantiaPrioridad}` }
      }
    }

    // Manejo de fechas según estado
    if (data.status === "COMPLETED" && !data.completedDate) {
      updateData.completedDate = new Date()
    } else if (data.status === "DELIVERED" && !data.deliveredDate) {
      updateData.deliveredDate = new Date()
    }

    // 1. Actualizar la orden de servicio
    const [updated] = await db.update(serviceOrders).set(updateData).where(eq(serviceOrders.id, id)).returning()

    // 2. If status changed, create a status history record
    if (statusChanged && newStatus) {
      const presupuestoAmount =
        data.presupuestoAmount !== undefined ? data.presupuestoAmount : currentOrder?.presupuestoAmount

      let notes = `Changed from ${currentOrder?.status} to ${newStatus}`

      // Add cancellation notes if canceling
      if (newStatus === "CANCELLED" && data.cancellationNotes) {
        notes += `. Razón: ${data.cancellationNotes}`
      }
      
      // Add reschedule info if rescheduling from cancellation
      if (newStatus === "PENDING" && data.rescheduledFromCancellation) {
        notes += `. Reprogramado desde cancelación. Motivo: ${data.cancellationNotes}`
      }

      if (newStatus === "GARANTIA_APLICADA" && data.razonGarantia) {
        notes += `. Razón: ${data.razonGarantia}`
      }

      if (presupuestoAmount) {
        notes += ` with presupuesto amount ${presupuestoAmount}`
        if (data.includeIVA) {
          notes += ` (IVA included)`
        }
      }

      await db.insert(serviceOrderStatusHistory).values({
        serviceOrderId: id,
        status: newStatus,
        presupuestoAmount: presupuestoAmount || null,
        notes,
        createdBy: userId,
      })
    }

    // 2. Si hay actualizaciones de electrodomésticos, manejarlas
    if (data.appliances) {
      for (const appliance of data.appliances) {
        await db
          .update(serviceOrderAppliances)
          .set({
            falla: appliance.falla || null,
            solucion: appliance.solucion || null,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(serviceOrderAppliances.serviceOrderId, id),
              eq(serviceOrderAppliances.clientApplianceId, appliance.id),
            ),
          )
      }
    }

    // 3. Manejar la asignación de técnico si existe
    if (data.technicianId && data.technicianId !== "unassigned") {
      const existingAssignments = await db
        .select()
        .from(technicianAssignments)
        .where(and(eq(technicianAssignments.serviceOrderId, id), eq(technicianAssignments.isActive, true)))

      if (existingAssignments.length > 0) {
        const currentAssignment = existingAssignments[0]
        if (currentAssignment.technicianId !== data.technicianId) {
          // Desactivar asignación existente
          await db
            .update(technicianAssignments)
            .set({
              isActive: false,
              updatedBy: userId,
              updatedAt: new Date(),
            })
            .where(eq(technicianAssignments.id, currentAssignment.id))

          // Crear nueva asignación
          await db.insert(technicianAssignments).values({
            serviceOrderId: id,
            technicianId: data.technicianId,
            isActive: true,
            createdBy: userId,
            updatedBy: userId,
          })

          // Actualizar estado si estaba pendiente
          if (updated.status === "PENDING") {
            await db
              .update(serviceOrders)
              .set({
                status: "ASSIGNED" as OrderStatus,
                updatedBy: userId,
                updatedAt: new Date(),
              })
              .where(eq(serviceOrders.id, id))
          }
        }
      } else {
        // Crear nueva asignación si no existía
        await db.insert(technicianAssignments).values({
          serviceOrderId: id,
          technicianId: data.technicianId,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        })

        // Actualizar estado si estaba pendiente
        if (updated.status === "PENDING") {
          await db
            .update(serviceOrders)
            .set({
              status: "ASSIGNED" as OrderStatus,
              updatedBy: userId,
              updatedAt: new Date(),
            })
            .where(eq(serviceOrders.id, id))
        }
      }
    }

    // Get technician info
    let technicianInfo = null;
    if (data.technicianId && data.technicianId !== "unassigned") {
      technicianInfo = await db.query.technicians.findFirst({
        where: eq(technicians.id, data.technicianId),
        columns: {
          name: true,
          phone: true,
        },
      });
    }

    // Prepare WhatsApp messages for status update
    if (statusChanged && currentOrder) {
      // Get appliance details
      let applianceDetails = "";
      if (currentOrder.appliances && currentOrder.appliances.length > 0) {
        for (const applianceRelation of currentOrder.appliances) {
          const appliance = applianceRelation.clientAppliance;
          if (appliance) {
            applianceDetails += `\n🔹 *${appliance.name}* (${appliance.brand.name} ${appliance.applianceType.name})`;
            if (applianceRelation.falla) {
              applianceDetails += `\n  ⚠️ *Falla:* _${applianceRelation.falla}_`;
            }
            if (applianceRelation.solucion) {
              applianceDetails += `\n  ✅ *Solución:* _${applianceRelation.solucion}_`;
            }
          }
        }
      }

      // Create status update messages
      let statusTitle = "ACTUALIZACIÓN DE ORDEN";
      let statusEmoji = "🔄";
      
      // Customize message based on status
      if (newStatus === "COMPLETED") {
        statusTitle = "SERVICIO COMPLETADO";
        statusEmoji = "✅";
      } else if (newStatus === "DELIVERED") {
        statusTitle = "EQUIPO ENTREGADO";
        statusEmoji = "🚚";
      } else if (newStatus === "APROBADO") {
        statusTitle = "PRESUPUESTO APROBADO";
        statusEmoji = "👍";
      } else if (newStatus === "NO_APROBADO") {
        statusTitle = "PRESUPUESTO RECHAZADO";
        statusEmoji = "👎";
      } else if (newStatus === "IN_PROGRESS") {
        statusTitle = "SERVICIO EN PROGRESO";
        statusEmoji = "🔧";
      } else if (newStatus === "ASSIGNED") {
        statusTitle = "TÉCNICO ASIGNADO";
        statusEmoji = "👨‍🔧";
      } else if (newStatus === "GARANTIA_APLICADA") {
        statusTitle = "GARANTÍA APLICADA";
        statusEmoji = "🛡️";
      } else if (newStatus === "CANCELLED") {
        statusTitle = "ORDEN CANCELADA";
        statusEmoji = "❌";
      } else if (newStatus === "PENDING" && data.rescheduledFromCancellation) {
        statusTitle = "ORDEN REPROGRAMADA";
        statusEmoji = "📅";
      }

      const clientMessage = 
        `╔════════════════════════╗\n` +
        `║    ${statusEmoji} ${statusTitle}    ║\n` +
        `╚════════════════════════╝\n\n` +
        `🆔 *No. Orden:* #${currentOrder.orderNumber}\n` +
        `👤 *Cliente:* ${currentOrder.client?.name || "No especificado"}\n` +
        `📱 *Teléfono:* ${formatPhoneNumber(currentOrder.client?.phone || "")}\n\n` +
        `📊 *Estado Anterior:* ${getStatusText(oldStatus)}\n` +
        `📊 *Nuevo Estado:* ${getStatusText(newStatus)}\n` +
        `📅 *Fecha:* ${new Date().toLocaleDateString("es-ES")}\n` +
        (data.fechaAgendado && data.rescheduledFromCancellation ? 
        `📆 *Nueva Fecha Agendada:* ${new Date(data.fechaAgendado).toLocaleDateString("es-ES")}\n` : "") +
        (data.cancellationNotes && newStatus === "CANCELLED" ? 
        `❌ *Motivo de Cancelación:* _${data.cancellationNotes}_\n` : "") +
        `\n📌 *ELECTRODOMÉSTICO(S):*${applianceDetails}\n` +
        (data.description ? `\n📝 *DETALLES:*\n_${data.description}_\n` : "") +
        (data.presupuestoAmount ? `\n💰 *Presupuesto:* ${formatCurrency(data.presupuestoAmount)}\n` : "") +
        (technicianInfo ? `\n👨‍🔧 *Técnico:* ${technicianInfo.name} - ${formatPhoneNumber(technicianInfo.phone)}\n` : "") +
        (newStatus === "GARANTIA_APLICADA" && data.razonGarantia ? `\n🛡️ *Razón de garantía:* _${data.razonGarantia}_\n` : "") +
        `\n📞 Para consultas llame al ${formatPhoneNumber(BOSS_PHONE)}`

      const bossMessage = 
        `${statusEmoji} *${statusTitle}* ${statusEmoji}\n\n` +
        `🆔 *Orden:* #${currentOrder.orderNumber}\n` +
        `👤 *Cliente:* ${currentOrder.client?.name || "No especificado"}\n` +
        `📱 *Contacto:* ${formatPhoneNumber(currentOrder.client?.phone || "")}\n` +
        `\n📊 *Cambio de estado:* ${getStatusText(oldStatus)} ➡️ ${getStatusText(newStatus)}\n` +
        (data.cancellationNotes && newStatus === "CANCELLED" ? 
        `\n❌ *Motivo de Cancelación:* _${data.cancellationNotes}_\n` : "") +
        (data.fechaAgendado && data.rescheduledFromCancellation ? 
        `\n📆 *Reprogramado para:* ${new Date(data.fechaAgendado).toLocaleDateString("es-ES")}\n` : "") +
        `\n📌 *ELECTRODOMÉSTICO(S):*${applianceDetails}\n` +
        (data.description ? `\n📝 *DETALLES:*\n_${data.description}_\n` : "") +
        (data.presupuestoAmount ? `\n💰 *Presupuesto:* ${formatCurrency(data.presupuestoAmount)}\n` : "") +
        (technicianInfo ? `\n👨‍🔧 *Técnico:* ${technicianInfo.name} - ${formatPhoneNumber(technicianInfo.phone)}\n` : "") +
        (newStatus === "GARANTIA_APLICADA" && data.razonGarantia ? `\n🛡️ *Razón de garantía:* _${data.razonGarantia}_\n` : "")
        
      // Send messages
      // To client - check if notifications are enabled
      if (currentOrder.client?.whatsapp && 
          (currentOrder.clientNotificationsEnabled === undefined || currentOrder.clientNotificationsEnabled)) {
        await sendWhatsappMessage(formatPhoneNumber(currentOrder.client.whatsapp), clientMessage);
      }
      
      // To boss - always send
      await sendWhatsappMessage(BOSS_PHONE, bossMessage);
    }

    revalidatePath("/ordenes")
    revalidatePath(`/ordenes/${id}`)
    revalidatePath("/garantias")
    revalidatePath("/tecnicos")

    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating service order:", error)
    return {
      success: false,
      error: "Error al actualizar la orden de servicio",
      details: error instanceof Error ? error.message : "Error desconocido",
    }
  }
}

export async function getServiceOrders() {
  try {
    const orders = await db.query.serviceOrders.findMany({
      with: {
        client: {
          with: {
            sucursal: true
          }
        },
        appliances: {
          with: {
            clientAppliance: {
              with: {
                brand: true,
                applianceType: true,
              },
            },
          },
          columns: {
            falla: true,
            solucion: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        technicianAssignments: {
          with: {
            technician: true,
          },
          where: (assignments, { eq }) => eq(assignments.isActive, true),
        },
        createdByUser: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
    })

    return { success: true, data: orders }
  } catch (error) {
    console.error("Error fetching service orders:", error)
    return { success: false, error: "Error al obtener las órdenes de servicio" }
  }
}

export async function getServiceOrdersByCaptureDateOrStatus(startDate?: Date, endDate?: Date, status?: string) {
  try {
    let query = db.select().from(serviceOrders);
    
    // Apply date range filter if provided
    if (startDate && endDate) {
      query = query.where(
        and(
          db.sql`DATE(${serviceOrders.fechaCaptacion}) >= DATE(${startDate})`,
          db.sql`DATE(${serviceOrders.fechaCaptacion}) <= DATE(${endDate})`,
          // Exclude cancelled orders when filtering by fechaCaptacion
          ne(serviceOrders.status, "CANCELLED")
        )
      );
    }
    
    // Apply status filter if provided
    if (status && status !== "ALL") {
      query = query.where(eq(serviceOrders.status, status));
    }
    
    // Execute query with relations
    const orders = await query.innerJoin(
      clients, 
      eq(serviceOrders.clientId, clients.id)
    ).orderBy(desc(serviceOrders.createdAt));
    
    return { success: true, data: orders };
  } catch (error) {
    console.error("Error fetching service orders by capture date:", error);
    return { success: false, error: "Error al obtener las órdenes de servicio por fecha de captación" };
  }
}

export async function getServiceOrderById(id: string, include?: Record<string, any>) {
  try {
    const order = await db.query.serviceOrders.findFirst({
      where: (orders, { eq }) => eq(orders.id, id),
      with: {
        client: {
          with: {
            city: true,
            zone: true,
            sucursal: true
          }
        },
        createdByUser: {
          columns: {
            id: true,
            fullName: true,
          },
        },
        updatedByUser: {
          columns: {
            id: true,
            fullName: true,
          },
        },
        appliances: {
          with: {
            clientAppliance: {
              with: {
                brand: true,
                applianceType: true,
              },
            },
          },
          columns: {
            falla: true,
            solucion: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        technicianAssignments: {
          with: {
            technician: true,
          },
        },
        payments: true,
        deliveryNotes: true,
        statusHistory: {
          orderBy: (history, { desc }) => [desc(history.timestamp)],
          with: {
            createdByUser: {
              columns: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, error: "Orden de servicio no encontrada" };
    }

    return { success: true, data: order };
  } catch (error) {
    console.error("Error fetching service order:", error);
    return { success: false, error: "Error al obtener la orden de servicio" };
  }
}

export async function deleteServiceOrder(id: string) {
  try {
    // Get the order before deletion for logging
    const order = await db.query.serviceOrders.findFirst({
      where: eq(serviceOrders.id, id),
      columns: {
        orderNumber: true,
      },
    });

    if (!order) {
      return { success: false, error: "Orden no encontrada" };
    }

    // Perform cascading delete
    // The order matters - we need to delete children first

    // 1. Delete status history
    await db.delete(serviceOrderStatusHistory)
      .where(eq(serviceOrderStatusHistory.serviceOrderId, id));

    // 2. Delete payments
    await db.delete(payments)
      .where(eq(payments.serviceOrderId, id));

    // 3. Delete delivery notes
    await db.delete(deliveryNotes)
      .where(eq(deliveryNotes.serviceOrderId, id));

    // 4. Delete technician assignments
    await db.delete(technicianAssignments)
      .where(eq(technicianAssignments.serviceOrderId, id));

    // 5. Delete service order appliances
    await db.delete(serviceOrderAppliances)
      .where(eq(serviceOrderAppliances.serviceOrderId, id));

    // 6. Finally delete the service order itself
    await db.delete(serviceOrders)
      .where(eq(serviceOrders.id, id));

    console.log(`Service order #${order.orderNumber} deleted successfully with cascade`);

    // Revalidate all paths that might display order data
    revalidatePath("/ordenes");
    revalidatePath("/garantias");
    revalidatePath("/tecnicos");
    
    return { 
      success: true, 
      message: `Orden #${order.orderNumber} eliminada correctamente` 
    };
  } catch (error) {
    console.error("Error deleting service order:", error);
    return { 
      success: false, 
      error: "Error al eliminar la orden de servicio",
      details: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function assignTechnician(
  serviceOrderId: string,
  technicianId: string,
  notes: string | null,
  userId: string,
  oldId: string,
) {
  try {
    const existingAssignment = await db
      .select()
      .from(technicianAssignments)
      .where(
        and(
          eq(technicianAssignments.serviceOrderId, serviceOrderId),
          eq(technicianAssignments.technicianId, technicianId),
          eq(technicianAssignments.isActive, true),
        ),
      );

    if (existingAssignment.length > 0) {
      if (notes) {
        await db
          .update(technicianAssignments)
          .set({ notes, updatedBy: userId, updatedAt: new Date() })
          .where(eq(technicianAssignments.id, existingAssignment[0].id));
      }
      return { success: true, data: existingAssignment[0] };
    }

    const [assignment] = await db
      .insert(technicianAssignments)
      .values({
        serviceOrderId,
        technicianId,
        notes,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning();

    // Obtener técnicos activos actualizados
    const activeTechnicians = await db.query.technicianAssignments.findMany({
      where: and(
        eq(technicianAssignments.serviceOrderId, serviceOrderId),
        eq(technicianAssignments.isActive, true)
      ),
      with: { technician: true }
    });

    // Actualizar estado de la orden
    const order = await db.query.serviceOrders.findFirst({
      where: eq(serviceOrders.id, serviceOrderId),
      columns: { 
        status: true, 
        orderNumber: true,
        clientNotificationsEnabled: true 
      },
      with: { client: true }
    });

    if (order?.status === "PENDING") {
      await db
        .update(serviceOrders)
        .set({ status: "ASSIGNED", updatedBy: userId, updatedAt: new Date() })
        .where(eq(serviceOrders.id, serviceOrderId));

      await db.insert(serviceOrderStatusHistory).values({
        serviceOrderId,
        status: "ASSIGNED",
        notes: "Asignación técnica inicial",
        createdBy: userId,
      });
    }

    // Notificación al cliente y al jefe
    try {
      const technicianInfo = await db.query.technicians.findFirst({
        where: eq(technicians.id, technicianId),
        columns: { name: true, phone: true },
      });

      if (order && technicianInfo) {
        // Mensaje para el cliente
        const clientMessage = 
          `╔═══════════════════════════╗\n` +
          `║    👨‍🔧 TÉCNICO ASIGNADO    ║\n` +
          `╚═══════════════════════════╝\n\n` +
          `🆔 *No. Orden:* #${order.orderNumber}\n` +
          `👤 *Cliente:* ${order.client?.name || "No especificado"}\n\n` +
          `✅ *Técnico asignado:*\n` +
          `👉 *${technicianInfo.name}*\n` +
          `📱 *Teléfono:* ${formatPhoneNumber(technicianInfo.phone)}\n\n` +
          (notes ? `📝 *Notas:* _${notes}_\n\n` : "") +
          `ℹ️ El técnico se pondrá en contacto con usted próximamente para coordinar la visita técnica.\n\n` +
          `📞 *Soporte:* ${formatPhoneNumber("+584167435109")}`

        // Mensaje para el jefe
        const bossMessage = 
          `👨‍🔧 *TÉCNICO ASIGNADO* 👨‍🔧\n\n` +
          `🆔 *Orden:* #${order.orderNumber}\n` +
          `👤 *Cliente:* ${order.client?.name || "No especificado"}\n` +
          `📱 *Contacto Cliente:* ${formatPhoneNumber(order.client?.phone || "")}\n\n` +
          `✅ *Técnico asignado:* ${technicianInfo.name}\n` +
          `📱 *Teléfono Técnico:* ${formatPhoneNumber(technicianInfo.phone)}\n` +
          (notes ? `\n📝 *Notas:* _${notes}_` : "")

        // Enviar mensajes
        if (order.client?.whatsapp && 
           (order.clientNotificationsEnabled === undefined || order.clientNotificationsEnabled)) {
          await sendWhatsappMessage(formatPhoneNumber(order.client.whatsapp), clientMessage);
        }
        
        await sendWhatsappMessage("+584167435109", bossMessage);
        
        // Notificar al técnico sobre la asignación
        const technicianMessage = 
          `🔔 *NUEVA ASIGNACIÓN* 🔔\n\n` +
          `👨‍🔧 *Hola ${technicianInfo.name}*\n\n` +
          `Has sido asignado a la siguiente orden:\n\n` +
          `🆔 *Orden:* #${order.orderNumber}\n` +
          `👤 *Cliente:* ${order.client?.name || "No especificado"}\n` +
          `📱 *Contacto:* ${formatPhoneNumber(order.client?.phone || "")}\n` +
          `📍 *Dirección:* ${order.client?.address || "No especificada"}\n` +
          (notes ? `\n📝 *Notas:* _${notes}_\n` : "") +
          `\nPor favor, contacta al cliente para coordinar la visita técnica.`
          
        await sendWhatsappMessage(formatPhoneNumber(technicianInfo.phone), technicianMessage);
      }
    } catch (whatsappError) {
      console.error("Error en notificación WhatsApp:", whatsappError);
    }

    revalidatePath(`/ordenes/${serviceOrderId}`);
    revalidatePath("/tecnicos");
    return { success: true, data: assignment };
  } catch (error) {
    console.error("Error asignando técnico:", error);
    return {
      success: false,
      error: "Error al asignar técnico",
      details: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

export async function deactivateTechnicianAssignment(
  serviceOrderId: string,
  technicianId: string,
  userId: string,
  replacementTechnicianId?: string,
) {
  try {
    // Obtener información del técnico a desactivar
    const removedTechnician = await db.query.technicians.findFirst({
      where: eq(technicians.id, technicianId),
      columns: { name: true, phone: true },
    });

    // Desactivar la asignación
    await db
      .update(technicianAssignments)
      .set({
        isActive: false,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(technicianAssignments.serviceOrderId, serviceOrderId),
          eq(technicianAssignments.technicianId, technicianId),
          eq(technicianAssignments.isActive, true),
        ),
      );

    // Asignar reemplazo si existe
    if (replacementTechnicianId) {
      await assignTechnician(serviceOrderId, replacementTechnicianId, "Asignado como reemplazo", userId, technicianId);
    }

    // Obtener técnicos activos actualizados
    const activeTechnicians = await db.query.technicianAssignments.findMany({
      where: and(
        eq(technicianAssignments.serviceOrderId, serviceOrderId),
        eq(technicianAssignments.isActive, true)
      ),
      with: { technician: true }
    });

    // Obtener información de la orden
    const orderInfo = await db.query.serviceOrders.findFirst({
      where: eq(serviceOrders.id, serviceOrderId),
      columns: { 
        orderNumber: true,
        clientNotificationsEnabled: true 
      },
      with: { client: true },
    });

    // Mensaje para el cliente
    if (orderInfo?.client?.whatsapp && 
        (orderInfo.clientNotificationsEnabled === undefined || orderInfo.clientNotificationsEnabled) && 
        removedTechnician) {
      const clientMessage = 
        `╔═══════════════════════════╗\n` +
        `║    🚫 CAMBIO DE TÉCNICO    ║\n` +
        `╚═══════════════════════════╝\n\n` +
        `🆔 *No. Orden:* #${orderInfo.orderNumber}\n` +
        `👤 *Cliente:* ${orderInfo.client.name}\n\n` +
        `❌ *Técnico retirado:*\n` +
        `${removedTechnician.name} - ${formatPhoneNumber(removedTechnician.phone)}\n\n` +
        (activeTechnicians.length > 0 
          ? `✅ *Técnicos activos:*\n${activeTechnicians.map(t => 
            `👉 *${t.technician.name}*\n📱 ${formatPhoneNumber(t.technician.phone)}`
          ).join('\n\n')}\n\n` 
          : `⚠️ *No hay técnicos asignados actualmente*\n\n`) +
        `📞 *Soporte:* ${formatPhoneNumber("+584167435109")}`

      await sendWhatsappMessage(formatPhoneNumber(orderInfo.client.whatsapp), clientMessage);
    }

    // Mensaje para el jefe
    const bossMessage = 
      `🚫 *TÉCNICO RETIRADO* 🚫\n\n` +
      `🆔 *Orden:* #${orderInfo?.orderNumber}\n` +
      `👤 *Cliente:* ${orderInfo?.client?.name || "No especificado"}\n\n` +
      `❌ *Técnico retirado:* ${removedTechnician?.name}\n` +
      (activeTechnicians.length > 0 
        ? `\n✅ *Técnicos activos:*\n${activeTechnicians.map(t => 
          `- ${t.technician.name} (${formatPhoneNumber(t.technician.phone)})`
        ).join('\n')}` 
        : `\n⚠️ *No hay técnicos asignados actualmente*`)

    await sendWhatsappMessage("+584167435109", bossMessage);

    // Notificar al técnico que fue removido
    if (removedTechnician) {
      const technicianMessage = 
        `ℹ️ *INFORMACIÓN DE SERVICIO* ℹ️\n\n` +
        `👨‍🔧 *Hola ${removedTechnician.name}*\n\n` +
        `Has sido retirado de la siguiente orden:\n\n` +
        `🆔 *Orden:* #${orderInfo?.orderNumber}\n` +
        `👤 *Cliente:* ${orderInfo?.client?.name || "No especificado"}\n\n` +
        `Si tienes alguna duda, contacta a coordinación.`
        
      await sendWhatsappMessage(formatPhoneNumber(removedTechnician.phone), technicianMessage);
    }

    revalidatePath("/ordenes");
    revalidatePath(`/ordenes/${serviceOrderId}`);
    revalidatePath("/tecnicos");
    return { success: true };
  } catch (error) {
    console.error("Error deactivating technician assignment:", error);
    return { success: false, error: "Error al desactivar la asignación del técnico" };
  }
}

export async function recordPayment(
  serviceOrderId: string,
  amount: number,
  paymentMethod: string,
  reference: string | null,
  notes: string | null,
  userId: string,
) {
  try {
    // Create the payment record
    const [payment] = await db
      .insert(payments)
      .values({
        serviceOrderId,
        amount: amount.toString(),
        paymentMethod,
        reference,
        notes,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()

    // Get the current service order
    const [order] = await db
      .select({
        totalAmount: serviceOrders.totalAmount,
        paidAmount: serviceOrders.paidAmount,
        orderNumber: serviceOrders.orderNumber,
        clientName: clients.name,
        clientPhone: clients.phone,
        clientWhatsapp: clients.whatsapp,
        clientNotificationsEnabled: serviceOrders.clientNotificationsEnabled,
      })
      .from(serviceOrders)
      .where(eq(serviceOrders.id, serviceOrderId))
      .innerJoin(clients, eq(serviceOrders.clientId, clients.id))

    // Calculate new paid amount
    const currentPaidAmount = Number(order.paidAmount) || 0
    const newPaidAmount = currentPaidAmount + amount
    const totalAmount = Number(order.totalAmount) || 0

    // Determine payment status
    let paymentStatus: "PENDING" | "CANCELLED" | "PARTIAL" | "PAID" = "PENDING"
    if (newPaidAmount >= totalAmount) {
      paymentStatus = "PAID"
    } else if (newPaidAmount > 0) {
      paymentStatus = "PARTIAL"
    }

    // Update the service order
    await db
      .update(serviceOrders)
      .set({
        paidAmount: newPaidAmount.toString(),
        paymentStatus,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(serviceOrders.id, serviceOrderId))

    // Create WhatsApp messages
    try {
      const paymentMethods: Record<string, string> = {
        "CASH": "Efectivo",
        "TRANSFER": "Transferencia",
        "ZELLE": "Zelle",
        "CARD": "Tarjeta",
        "PAYPAL": "PayPal",
        "OTHER": "Otro método"
      };

      const paymentMethodText = paymentMethods[paymentMethod] || paymentMethod;
      
      const clientMessage = 
        `╔═════════════════════════╗\n` +
        `║    💰 PAGO REGISTRADO    ║\n` +
        `╚═════════════════════════╝\n\n` +
        `🆔 *No. Orden:* #${order.orderNumber}\n` +
        `👤 *Cliente:* ${order.clientName || "No especificado"}\n\n` +
        `✅ *Pago recibido:* ${formatCurrency(amount)}\n` +
        `💳 *Método:* ${paymentMethodText}\n` +
        (reference ? `🔢 *Referencia:* ${reference}\n` : "") +
        (notes ? `📝 *Notas:* ${notes}\n` : "") +
        `\n📊 *Estado del pago:* ${paymentStatus === "PAID" ? "Completado ✅" : "Parcial ⏳"}\n` +
        `💵 *Total pagado:* ${formatCurrency(newPaidAmount)}\n` +
        `💰 *Monto total:* ${formatCurrency(totalAmount)}\n` +
        (paymentStatus !== "PAID" ? `💸 *Pendiente:* ${formatCurrency(totalAmount - newPaidAmount)}\n` : "") +
        `\n¡Gracias por su pago!\n\n` +
        `📞 *Soporte:* ${formatPhoneNumber("+584167435109")}`

      const bossMessage = 
        `💰 *PAGO REGISTRADO* 💰\n\n` +
        `🆔 *Orden:* #${order.orderNumber}\n` +
        `👤 *Cliente:* ${order.clientName || "No especificado"}\n\n` +
        `✅ *Monto:* ${formatCurrency(amount)}\n` +
        `💳 *Método:* ${paymentMethodText}\n` +
        (reference ? `🔢 *Referencia:* ${reference}\n` : "") +
        (notes ? `📝 *Notas:* ${notes}\n` : "") +
        `\n📊 *Estado:* ${paymentStatus === "PAID" ? "Completado ✅" : "Parcial ⏳"}\n` +
        `💵 *Total pagado:* ${formatCurrency(newPaidAmount)}\n` +
        `💰 *Monto total:* ${formatCurrency(totalAmount)}\n` +
        (paymentStatus !== "PAID" ? `💸 *Pendiente:* ${formatCurrency(totalAmount - newPaidAmount)}` : "")

      // Send messages
      if (order.clientWhatsapp && 
          (order.clientNotificationsEnabled === undefined || order.clientNotificationsEnabled)) {
        await sendWhatsappMessage(formatPhoneNumber(order.clientWhatsapp), clientMessage);
      }
      
      await sendWhatsappMessage("+584167435109", bossMessage);
    } catch (whatsappError) {
      console.error("Error enviando notificación de WhatsApp:", whatsappError);
    }

    revalidatePath("/ordenes")
    revalidatePath(`/ordenes/${serviceOrderId}`)
    return { success: true, data: payment }
  } catch (error) {
    console.error("Error recording payment:", error)
    return { success: false, error: "Error al registrar el pago" }
  }
}

export async function createDeliveryNote(
  serviceOrderId: string,
  receivedBy: string,
  notes: string | null,
  amount: string | null,
  includeIVA: boolean,
  userId: string,
  updatedConceptoOrden: any | null = null
) {
  try {
    // Generate a unique note number
    const noteNumber = `DN-${Date.now()}`

    // Create the delivery note
    const [note] = await db
      .insert(deliveryNotes)
      .values({
        serviceOrderId,
        noteNumber,
        receivedBy,
        notes,
        amount: amount ? parseFloat(amount) : null,
        includeIVA,
        createdBy: userId,
        updatedBy: userId,
      })
      .returning()

    // Get the current status of the order and related information
    const orderInfo = await db.query.serviceOrders.findFirst({
      where: eq(serviceOrders.id, serviceOrderId),
      columns: {
        status: true,
        orderNumber: true,
        clientNotificationsEnabled: true,
      },
      with: {
        client: {
          columns: {
            name: true, 
            phone: true,
            whatsapp: true
          }
        },
        appliances: {
          with: {
            clientAppliance: {
              with: {
                brand: true,
                applianceType: true,
              },
            },
          },
        }
      }
    })

    const currentStatus = orderInfo?.status || null

    // Update the service order status to DELIVERED and set delivered date
    await db
      .update(serviceOrders)
      .set({
        status: "DELIVERED",
        deliveredDate: new Date(),
        updatedBy: userId,
        updatedAt: new Date(),
        conceptoOrden: updatedConceptoOrden ? JSON.stringify(updatedConceptoOrden) : undefined,
      })
      .where(eq(serviceOrders.id, serviceOrderId))

    // Add status history record for the delivery
    await db.insert(serviceOrderStatusHistory).values({
      serviceOrderId,
      status: "DELIVERED",
      notes: `Nota de entrega creada. Recibido por: ${receivedBy}. Estado cambiado de ${currentStatus} a DELIVERED.`,
      createdBy: userId,
    })

    return { success: true, data: note }
  } catch (error) {
    console.error("Error creating delivery note:", error)
    return { success: false, error: "Error al crear la nota de entrega" }
  }
}

export async function getServiceOrdersByApplianceId(applianceId: string) {
  try {
    const orders = await db.query.serviceOrderAppliances.findMany({
      where: (soa, { eq }) => eq(soa.clientApplianceId, applianceId),
      with: {
        serviceOrder: {
          with: {
            client: true,
          },
        },
      },
    })

    const transformedOrders = orders.map((order) => order.serviceOrder)

    return { success: true, data: transformedOrders }
  } catch (error) {
    console.error("Error fetching service orders by appliance:", error)
    return { success: false, error: "Error al obtener las órdenes de servicio" }
  }
}

export async function getServiceOrderForEdit(id: string) {
  try {
    const order = await db.query.serviceOrders.findFirst({
      where: (orders, { eq }) => eq(orders.id, id),
      with: {
        client: true,
        appliances: {
          with: {
            clientAppliance: {
              with: {
                brand: true,
                applianceType: true,
              },
            },
          },
          columns: {
            falla: true,
            solucion: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        technicianAssignments: {
          with: {
            technician: true,
          },
        },
      },
    })

    if (!order) {
      return { success: false, error: "Orden de servicio no encontrada" }
    }

    return { success: true, data: order }
  } catch (error) {
    console.error("Error fetching service order for edit:", error)
    return { success: false, error: "Error al obtener la orden de servicio para edición" }
  }
}

export async function getServiceOrdersWithWarranty() {
  try {
    const orders = await db.query.serviceOrders.findMany({
      where: (orders, { or, isNotNull, eq }) =>
        or(
          isNotNull(orders.garantiaEndDate),
          eq(orders.garantiaIlimitada, true),
          eq(orders.status, "GARANTIA_APLICADA"),
        ),
      with: {
        client: true,
        appliances: {
          with: {
            clientAppliance: {
              with: {
                brand: true,
                applianceType: true,
              },
            },
          },
        },
      },
      orderBy: [
        desc(serviceOrders.garantiaPrioridad),
        desc(serviceOrders.garantiaIlimitada),
        desc(serviceOrders.garantiaEndDate),
      ],
    })

    return { success: true, data: orders }
  } catch (error) {
    console.error("Error fetching warranty orders:", error)
    return { success: false, error: "Error al obtener las órdenes con garantía" }
  }
}

export async function getServiceOrderStatusHistory(id: string) {
  try {
    const statusHistory = await db.query.serviceOrderStatusHistory.findMany({
      where: eq(serviceOrderStatusHistory.serviceOrderId, id),
      orderBy: (history, { desc }) => [desc(history.timestamp)],
      with: {
        createdByUser: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
    })

    return { success: true, data: statusHistory }
  } catch (error) {
    console.error("Error fetching service order status history:", error)
    return {
      success: false,
      error: "Error al obtener el historial de estados de la orden de servicio",
    }
  }
}

export { sendWhatsappMessage }