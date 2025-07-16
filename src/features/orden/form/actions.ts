'use server'

import { db } from "@/db"
import { 
  serviceOrders, 
  technicianAssignments, 
  payments, 
  deliveryNotes, 
  serviceOrderAppliances,
  ORDER_STATUS_ENUM,
  PAYMENT_STATUS_ENUM,
  serviceOrderStatusHistory,
  WARRANTY_PRIORITY_ENUM,
  clients,
  clientAppliances,
  brands,
  applianceTypes
} from "@/db/schema"
import { eq, and, desc, asc, or, isNotNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { OrdenFormValues } from "./schema"
import { formatCurrency, formatMultilineText, formatOrderCode, formatPhoneNumber, generateOrderCode, getStatusEmoji } from "@/lib/utils"
import { unstable_noStore as noStore } from "next/cache"
import { sendWhatsappMessage } from "@/features/whatsapp/actions"
import type { SelectedAppliance } from "@/features/appliances/multi-appliance-selector"
import { NeonDbError } from "@neondatabase/serverless"

type OrderStatus = typeof ORDER_STATUS_ENUM.enumValues[number]
type PaymentStatus = typeof PAYMENT_STATUS_ENUM.enumValues[number]
type WarrantyPriority = typeof WARRANTY_PRIORITY_ENUM.enumValues[number]

const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    PREORDER: "Pre-orden",
    PENDING: "Pendiente",
    ASSIGNED: "Asignada",
    IN_PROGRESS: "En Progreso",
    COMPLETED: "Completada",
    DELIVERED: "Entregada",
    CANCELLED: "Cancelada",
    APROBADO: "Aprobada",
    NO_APROBADO: "No Aprobada",
    PENDIENTE_AVISAR: "Pendiente Avisar",
    FACTURADO: "Facturada",
    ENTREGA_GENERADA: "Entrega Generada",
    GARANTIA_APLICADA: "Garantía Aplicada",
    REPARANDO: "Reparando"
  }
  return statusMap[status] || status
}

export async function getClientsWithAppliances() {
  noStore()
  try {
    const clientsList = await db.query.clients.findMany({
      orderBy: asc(clients.name),
      with: {
        appliances: {
          with: {
            brand: { columns: { name: true } },
            applianceType: { columns: { name: true } }
          },
          orderBy: desc(clientAppliances.createdAt),
        }
      }
    })

    return { 
      success: true, 
      data: clientsList.map(client => ({
        ...client,
        appliances: client.appliances.map(a => ({
          ...a,
          brandName: a.brand?.name || 'Sin marca',
          applianceTypeName: a.applianceType?.name || 'Sin tipo'
        }))
      }))
    }
  } catch (error) {
    console.error("Error obteniendo clientes:", error)
    return { success: false, error: "Error al cargar clientes" }
  }
}

export async function getClientWithAppliances(clientId: string) {
  noStore()
  try {
    const client = await db.query.clients.findFirst({
      where: eq(clients.id, clientId),
      with: {
        appliances: {
          with: {
            brand: { columns: { name: true } },
            applianceType: { columns: { name: true } }
          },
          orderBy: desc(clientAppliances.createdAt),
        }
      }
    })

    if (!client) return { success: false, error: "Cliente no encontrado" }

    return { 
      success: true, 
      data: {
        ...client,
        appliances: client.appliances.map(a => ({
          ...a,
          brandName: a.brand?.name || 'Sin marca',
          applianceTypeName: a.applianceType?.name || 'Sin tipo'
        }))
      }
    }
  } catch (error) {
    console.error("Error obteniendo cliente:", error)
    return { success: false, error: "Error al cargar cliente" }
  }
}

export async function createServiceOrder(data: OrdenFormValues, userId: string, appliances?: SelectedAppliance[]) {
  const MAX_RETRIES = 2;
  const RETRY_DELAY_MS = 200;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      console.log(`🔄 Intento de creación de orden #${retries + 1}`);

      if (!data.clientId) {
        return { success: false, error: "El ID del cliente es requerido" };
      }

      const hasMultipleAppliances = appliances?.length > 0;
      const hasSingleAppliance = !!data.applianceId;

      if (!hasMultipleAppliances && !hasSingleAppliance) {
        return { success: false, error: "Se requiere al menos un electrodoméstico" };
      }

      const targetApplianceId = data.applianceId || appliances?.[0]?.id;
      if (!targetApplianceId) {
        return { success: false, error: "No se encontró el electrodoméstico principal" };
      }

      const orderCode = await generateOrderCode();
      console.log("🔢 Código generado:", orderCode);

      const existingOrder = await db.query.serviceOrders.findFirst({
        where: eq(serviceOrders.orderCode, orderCode),
      });

      if (existingOrder) {
        console.warn(`⚠️ ¡Orden duplicada detectada! ${orderCode}`);
        retries++;
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retries));
        continue;
      }

      const orderStatus = data.isPreOrder ? "PREORDER" : (data.technicianId ? "ASSIGNED" : "PENDING");
      
      const [order] = await db.insert(serviceOrders).values({
        orderNumber: formatOrderCode(orderCode),
        orderCode,
        clientId: data.clientId,
        status: orderStatus,
        paymentStatus: "PENDING",
        reference: data.reference?.trim() || null,
        description: data.description?.trim() || null,
        totalAmount: data.totalAmount?.toString() || "0",
        fechaCaptacion: new Date(),
        fechaAgendado: data.fechaAgendado || null,
        createdBy: userId,
        updatedBy: userId,
        includeIVA: false,
        clientNotificationsEnabled: true
      }).returning();

      const applianceIds = appliances?.length ? appliances : [{ id: data.applianceId!, falla: data.falla }];
      for (const appliance of applianceIds) {
        await db.insert(serviceOrderAppliances).values({
          serviceOrderId: order.id,
          clientApplianceId: appliance.id,
          falla: appliance.falla?.trim() || null,
          solucion: null,
          createdBy: userId,
          updatedBy: userId,
        });
      }

      if (data.technicianId && data.technicianId !== "unassigned") {
        await db.insert(technicianAssignments).values({
          serviceOrderId: order.id,
          technicianId: data.technicianId,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        });
      }

      try {
        // Check if messages are enabled
        const messagesEnabled = process.env.MESSAGES_ENABLED === 'true';
        if (!messagesEnabled) {
          console.log('WhatsApp messages are disabled by environment setting');
          return { success: true, data: order };
        }

        const client = await db.query.clients.findFirst({
          where: eq(clients.id, data.clientId),
          columns: { name: true, phone: true, whatsapp: true },
        });

        if (client) {
          const bossPhone = process.env.BOSS_PHONE || '+584167435109';
          const formattedBossPhone = formatPhoneNumber(bossPhone);
          const formattedClientWhatsapp = client.whatsapp ? formatPhoneNumber(client.whatsapp) : null;

          let applianceDetailsBoss = "";
          let applianceDetailsClient = "";
          
          for (const appliance of applianceIds) {
            const applianceData = await db.query.clientAppliances.findFirst({
              where: eq(clientAppliances.id, appliance.id),
              with: { brand: true, applianceType: true },
            });
            
            if (applianceData) {
              const emoji = applianceData.applianceType.name.includes('nevera') ? '❄️' : '⚡';
              
              applianceDetailsBoss += `
▌ ${emoji} *${applianceData.applianceType.name} ${applianceData.brand.name}*
│    Modelo: ${applianceData.name}
│    Falla: ${appliance.falla || 'Sin especificar'}`;
              
              applianceDetailsClient += `
▸ ${emoji} ${applianceData.applianceType.name} ${applianceData.brand.name}
   Modelo: ${applianceData.name}
   Falla reportada: ${appliance.falla || 'En diagnóstico'}`;
            }
          }

          const bossMessage = `
▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜
▌     🛠️ NUEVA ORDEN CREADA      ▐
▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟

📋 *Orden #${order.orderCode}*
📅 ${new Date().toLocaleDateString("es-ES", { weekday: 'long', day: 'numeric', month: 'long' })}
⏰ ${new Date().toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}

▌━━━━━━━━━━━━━━━ CLIENTE ━━━━━━━━━━━━━━▐
👤 *Nombre:* ${client.name}
📞 *Contacto:* ${formatPhoneNumber(client.phone) || 'No disponible'}
📌 *Tipo:* ${data.isPreOrder ? '🟡 PRE-ORDEN' : '🟢 ORDEN REGULAR'}

▌━━━━━━━━━━ ELECTRODOMÉSTICOS ━━━━━━━━━━▐
${applianceDetailsBoss}

▌━━━━━━━━━━━━ DETALLES ━━━━━━━━━━━━━▐
📝 *Descripción:*
${formatMultilineText(data.description || 'Sin detalles adicionales')}

🔧 *Estado inicial:* ${getStatusEmoji(orderStatus)} ${getStatusText(orderStatus)}
👨💻 *Creado por:* Sistema`;

          await sendWhatsappMessage(formattedBossPhone, bossMessage);

          if (formattedClientWhatsapp) {
            const clientMessage = `
▛▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▜
▌     🎉 ORDEN REGISTRADA       ▐
▙▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▟

¡Gracias por confiar en nosotros, ${client.name}!

📋 *Detalles de su orden:*
┌──────────────────────────────
│ 🔖 Número: #${order.orderCode}
│ 📅 Fecha: ${new Date().toLocaleDateString("es-ES", { day: '2-digit', month: 'long' })}
│ 🕒 Hora: ${new Date().toLocaleTimeString("es-ES", { hour: '2-digit', minute: '2-digit' })}
└──────────────────────────────

▌━━━━━━━━ EQUIPOS REGISTRADOS ━━━━━━━━▐
${applianceDetailsClient}

▌━━━━━━━━━━ ESTADO ACTUAL ━━━━━━━━━━━━▐
${getStatusEmoji(orderStatus)} *${getStatusText(orderStatus)}*

▌━━━━━━━━ PRÓXIMOS PASOS ━━━━━━━━▐
1. Validación técnica inicial (24-48 hrs)
2. Contacto para confirmar detalles
3. Programación de servicio

📌 *Soporte:* ${formattedBossPhone}`;

            await sendWhatsappMessage(formattedClientWhatsapp, clientMessage);
          }
        }
      } catch (whatsappError) {
        console.error("⚠️ Error en notificaciones WhatsApp:", whatsappError);
      }

      revalidatePath("/ordenes");
      return { success: true, data: order };

    } catch (error) {
      if (error instanceof NeonDbError && error.code === '23505') {
        console.warn(`🔄 Intento ${retries + 1}/${MAX_RETRIES}: Duplicado detectado`);
        retries++;
        
        if (retries >= MAX_RETRIES) {
          console.error("❌ Máximo de reintentos alcanzado");
          return {
            success: false,
            error: "No se pudo generar un número de orden único después de 3 intentos",
          };
        }
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * retries));
        continue;
      }
      
      console.error("💥 Error crítico:", error);
      return {
        success: false,
        error: "Error al crear la orden",
        details: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  return {
    success: false,
    error: "Error inesperado al procesar la orden",
  };
}

export async function updateServiceOrder(id: string, data: any, userId: string) {
  try {
    const currentOrder = await db.query.serviceOrders.findFirst({
      where: eq(serviceOrders.id, id),
      columns: { 
        status: true, 
        presupuestoAmount: true, 
        includeIVA: true,
        orderNumber: true,
        clientNotificationsEnabled: true 
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

    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
      ...(data.clientId && { clientId: data.clientId }),
      ...(data.reference !== undefined && { reference: data.reference || null }),
      ...(data.description !== undefined && { description: data.description || null }),
      ...(data.totalAmount !== undefined && { totalAmount: data.totalAmount?.toString() || "0" }),
      ...(data.includeIVA !== undefined && { includeIVA: data.includeIVA }),
      ...(data.fechaAgendado !== undefined && { fechaAgendado: data.fechaAgendado }),
      ...(data.fechaCaptacion !== undefined && { fechaCaptacion: data.fechaCaptacion }),
      ...(data.fechaSeguimiento !== undefined && { fechaSeguimiento: data.fechaSeguimiento }),
      ...(data.fechaReparacion !== undefined && { fechaReparacion: data.fechaReparacion }),
      ...(data.clientNotificationsEnabled !== undefined && { clientNotificationsEnabled: data.clientNotificationsEnabled }),
    }

    let statusChanged = false
    let newStatus = currentOrder?.status
    let oldStatus = currentOrder?.status
    if (data.status && ORDER_STATUS_ENUM.enumValues.includes(data.status)) {
      if (currentOrder?.status !== data.status) {
        statusChanged = true
        newStatus = data.status
      }
      updateData.status = data.status
    }

    // Actualizar campos de garantía
    if (data.garantiaStartDate !== undefined) updateData.garantiaStartDate = data.garantiaStartDate
    if (data.garantiaEndDate !== undefined) updateData.garantiaEndDate = data.garantiaEndDate
    if (data.garantiaIlimitada !== undefined) updateData.garantiaIlimitada = data.garantiaIlimitada
    if (data.razonGarantia !== undefined) updateData.razonGarantia = data.razonGarantia
    if (data.garantiaPrioridad && WARRANTY_PRIORITY_ENUM.enumValues.includes(data.garantiaPrioridad)) {
      updateData.garantiaPrioridad = data.garantiaPrioridad
    }

    const [updated] = await db.update(serviceOrders)
      .set(updateData)
      .where(eq(serviceOrders.id, id))
      .returning()

    if (statusChanged && newStatus) {
      await db.insert(serviceOrderStatusHistory).values({
        serviceOrderId: id,
        status: newStatus,
        notes: `Estado cambiado de ${currentOrder?.status} a ${newStatus}`,
        createdBy: userId,
      })

      // Check if messages are enabled
      const messagesEnabled = process.env.MESSAGES_ENABLED === 'true';
      if (messagesEnabled && currentOrder) {
        const bossPhone = process.env.BOSS_PHONE || '+584167435109';

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
          `\n📌 *ELECTRODOMÉSTICO(S):*${applianceDetails}\n` +
          (data.description ? `\n📝 *DETALLES:*\n_${data.description}_\n` : "") +
          (data.presupuestoAmount ? `\n💰 *Presupuesto:* ${formatCurrency(data.presupuestoAmount)}\n` : "") +
          (newStatus === "GARANTIA_APLICADA" && data.razonGarantia ? `\n🛡️ *Razón de garantía:* _${data.razonGarantia}_\n` : "") +
          `\n📞 Para consultas llame al ${formatPhoneNumber(bossPhone)}`

        const bossMessage = 
          `${statusEmoji} *${statusTitle}* ${statusEmoji}\n\n` +
          `🆔 *Orden:* #${currentOrder.orderNumber}\n` +
          `👤 *Cliente:* ${currentOrder.client?.name || "No especificado"}\n` +
          `📱 *Contacto:* ${formatPhoneNumber(currentOrder.client?.phone || "")}\n` +
          `\n📊 *Cambio de estado:* ${getStatusText(oldStatus)} ➡️ ${getStatusText(newStatus)}\n` +
          `\n📌 *ELECTRODOMÉSTICO(S):*${applianceDetails}\n` +
          (data.description ? `\n📝 *DETALLES:*\n_${data.description}_\n` : "") +
          (data.presupuestoAmount ? `\n💰 *Presupuesto:* ${formatCurrency(data.presupuestoAmount)}\n` : "") +
          (newStatus === "GARANTIA_APLICADA" && data.razonGarantia ? `\n🛡️ *Razón de garantía:* _${data.razonGarantia}_\n` : "")
          
        // Send messages
        // To client - check if notifications are enabled
        if (currentOrder.client?.whatsapp && 
            (currentOrder.clientNotificationsEnabled === undefined || currentOrder.clientNotificationsEnabled)) {
          await sendWhatsappMessage(formatPhoneNumber(currentOrder.client.whatsapp), clientMessage);
        }
        
        // To boss - always send
        await sendWhatsappMessage(bossPhone, bossMessage);
      }
    }

    if (data.appliances) {
      for (const appliance of data.appliances) {
        await db.update(serviceOrderAppliances)
          .set({
            falla: appliance.falla || null,
            solucion: appliance.solucion || null,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(and(
            eq(serviceOrderAppliances.serviceOrderId, id),
            eq(serviceOrderAppliances.clientApplianceId, appliance.id)
          ))
      }
    }

    if (data.technicianId && data.technicianId !== "unassigned") {
      const existing = await db.query.technicianAssignments.findFirst({
        where: and(
          eq(technicianAssignments.serviceOrderId, id),
          eq(technicianAssignments.isActive, true)
        )
      })

      if (existing) {
        if (existing.technicianId !== data.technicianId) {
          await db.update(technicianAssignments)
            .set({ isActive: false })
            .where(eq(technicianAssignments.id, existing.id))
          
          await db.insert(technicianAssignments).values({
            serviceOrderId: id,
            technicianId: data.technicianId,
            isActive: true,
            createdBy: userId,
            updatedBy: userId,
          })
        }
      } else {
        await db.insert(technicianAssignments).values({
          serviceOrderId: id,
          technicianId: data.technicianId,
          isActive: true,
          createdBy: userId,
          updatedBy: userId,
        })
      }
    }

    revalidatePath("/ordenes")
    revalidatePath(`/ordenes/${id}`)
    return { success: true, data: updated }
  } catch (error) {
    console.error("Error updating order:", error)
    return { success: false, error: "Error al actualizar orden" }
  }
}

export async function getServiceOrders() {
  try {
    const orders = await db.query.serviceOrders.findMany({
      with: {
        client: true,
        appliances: {
          with: { clientAppliance: { with: { brand: true, applianceType: true } } }
        },
        technicianAssignments: {
          with: { technician: true },
          where: eq(technicianAssignments.isActive, true)
        },
        createdByUser: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: desc(serviceOrders.createdAt),
    })
    return { success: true, data: orders }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return { success: false, error: "Error al obtener órdenes" }
  }
}

export async function getServiceOrderById(id: string) {
  try {
    const order = await db.query.serviceOrders.findFirst({
      where: eq(serviceOrders.id, id),
      with: {
        client: true,
        appliances: {
          with: { clientAppliance: { with: { brand: true, applianceType: true } } }
        },
        technicianAssignments: {
          with: { technician: true },
          where: eq(technicianAssignments.isActive, true)
        },
        payments: true,
        deliveryNotes: true,
        statusHistory: {
          orderBy: desc(serviceOrderStatusHistory.timestamp),
          with: { createdByUser: { columns: { id: true, fullName: true } } }
        },
        createdByUser: {
          columns: {
            id: true,
            fullName: true,
          },
        },
      }
    })
    return order ? { success: true, data: order } : { success: false, error: "Orden no encontrada" }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { success: false, error: "Error al obtener orden" }
  }
}

export async function assignTechnician(
  serviceOrderId: string,
  technicianId: string,
  userId: string,
  notes?: string
) {
  try {
    await db.insert(technicianAssignments).values({
      serviceOrderId,
      technicianId,
      notes: notes || null,
      isActive: true,
      createdBy: userId,
      updatedBy: userId,
    })

    await db.update(serviceOrders)
      .set({ status: "ASSIGNED" })
      .where(eq(serviceOrders.id, serviceOrderId))

    revalidatePath("/ordenes")
    return { success: true }
  } catch (error) {
    console.error("Error assigning technician:", error)
    return { success: false, error: "Error al asignar técnico" }
  }
}

export async function recordPayment(
  serviceOrderId: string,
  amount: number,
  paymentMethod: string,
  userId: string,
  reference?: string,
  notes?: string
) {
  try {
    const [payment] = await db.insert(payments).values({
      serviceOrderId,
      amount: amount.toString(),
      paymentMethod,
      reference: reference || null,
      notes: notes || null,
      createdBy: userId,
      updatedBy: userId,
    }).returning()

    const order = await db.query.serviceOrders.findFirst({
      where: eq(serviceOrders.id, serviceOrderId),
      columns: { totalAmount: true, paidAmount: true },
    })

    const newPaid = (Number(order?.paidAmount) || 0) + amount
    const total = Number(order?.totalAmount) || 0
    const paymentStatus = newPaid >= total ? "PAID" : newPaid > 0 ? "PARTIAL" : "PENDING"

    await db.update(serviceOrders)
      .set({ 
        paidAmount: newPaid.toString(),
        paymentStatus,
        updatedBy: userId 
      })
      .where(eq(serviceOrders.id, serviceOrderId))

    revalidatePath("/ordenes")
    return { success: true, data: payment }
  } catch (error) {
    console.error("Error recording payment:", error)
    return { success: false, error: "Error al registrar pago" }
  }
}

export async function createDeliveryNote(
  serviceOrderId: string,
  receivedBy: string,
  userId: string,
  notes?: string,
  amount?: number
) {
  try {
    const noteNumber = `DN-${Date.now()}`
    const [note] = await db.insert(deliveryNotes).values({
      serviceOrderId,
      noteNumber,
      receivedBy,
      notes: notes || null,
      amount: amount?.toString() || null,
      createdBy: userId,
      updatedBy: userId,
    }).returning()

    await db.update(serviceOrders)
      .set({ 
        status: "DELIVERED",
        deliveredDate: new Date(),
        updatedBy: userId 
      })
      .where(eq(serviceOrders.id, serviceOrderId))

    revalidatePath("/ordenes")
    return { success: true, data: note }
  } catch (error) {
    console.error("Error creating delivery note:", error)
    return { success: false, error: "Error al crear nota de entrega" }
  }
}

export async function getServiceOrdersByApplianceId(applianceId: string) {
  try {
    const orders = await db.query.serviceOrderAppliances.findMany({
      where: eq(serviceOrderAppliances.clientApplianceId, applianceId),
      with: { serviceOrder: { with: { client: true } } }
    })
    return { success: true, data: orders.map(o => o.serviceOrder) }
  } catch (error) {
    console.error("Error fetching orders by appliance:", error)
    return { success: false, error: "Error al obtener órdenes" }
  }
}

export async function getServiceOrdersWithWarranty() {
  try {
    const orders = await db.query.serviceOrders.findMany({
      where: or(
        isNotNull(serviceOrders.garantiaEndDate),
        eq(serviceOrders.garantiaIlimitada, true),
        eq(serviceOrders.status, "GARANTIA_APLICADA")
      ),
      with: {
        client: true,
        appliances: { with: { clientAppliance: { with: { brand: true, applianceType: true } } } }
      },
      orderBy: [
        desc(serviceOrders.garantiaPrioridad),
        desc(serviceOrders.garantiaIlimitada),
        desc(serviceOrders.garantiaEndDate)
      ]
    })
    return { success: true, data: orders }
  } catch (error) {
    console.error("Error fetching warranty orders:", error)
    return { success: false, error: "Error al obtener órdenes con garantía" }
  }
}

export async function getServiceOrderStatusHistory(id: string) {
  try {
    const history = await db.query.serviceOrderStatusHistory.findMany({
      where: eq(serviceOrderStatusHistory.serviceOrderId, id),
      orderBy: desc(serviceOrderStatusHistory.timestamp),
      with: { createdByUser: { columns: { fullName: true } } }
    })
    return { success: true, data: history }
  } catch (error) {
    console.error("Error fetching status history:", error)
    return { success: false, error: "Error al obtener historial" }
  }
}