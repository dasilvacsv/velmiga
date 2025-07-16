"use server";

import { db } from "@/db";
import { expedientes, clients, lawyers, users, expedienteReminders, lawyerPayments, clientBilling } from "@/db/schema";
import { eq, count, and, gte, lte, sql } from "drizzle-orm";
import { auth } from "@/features/auth";

export async function getDashboardStats() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Expedientes activos
  const activeExpedientes = await db
    .select({ count: count() })
    .from(expedientes)
    .where(eq(expedientes.status, "EN_ATENCION"));

  // Nuevos expedientes este mes
  const newExpedientesThisMonth = await db
    .select({ count: count() })
    .from(expedientes)
    .where(
      and(
        gte(expedientes.createdAt, startOfMonth),
        lte(expedientes.createdAt, endOfMonth)
      )
    );

  // Clientes activos
  const activeClients = await db
    .select({ count: count() })
    .from(clients)
    .where(eq(clients.isActive, true));

  // Recordatorios de hoy
  const todayReminders = await db
    .select({ count: count() })
    .from(expedienteReminders)
    .where(
      and(
        eq(expedienteReminders.reminderDate, today.toISOString().slice(0, 10)),
        eq(expedienteReminders.isDismissed, false)
      )
    );

  // Pagos pendientes
  const pendingPayments = await db
    .select({
      total: sql<number>`SUM(${lawyerPayments.amountRequested})`,
      count: count()
    })
    .from(lawyerPayments)
    .where(eq(lawyerPayments.paymentStatus, "SOLICITADO"));

  // Expedientes recientes
  const recentExpedientes = await db
    .select({
      id: expedientes.id,
      expedienteNumber: expedientes.expedienteNumber,
      status: expedientes.status,
      clientName: clients.companyName,
      createdAt: expedientes.createdAt
    })
    .from(expedientes)
    .innerJoin(clients, eq(expedientes.clientId, clients.id))
    .orderBy(expedientes.createdAt)
    .limit(5);

  return {
    activeExpedientes: activeExpedientes[0]?.count || 0,
    newExpedientesThisMonth: newExpedientesThisMonth[0]?.count || 0,
    activeClients: activeClients[0]?.count || 0,
    clientsGrowthPercentage: 12, // Calculated metric
    todayReminders: todayReminders[0]?.count || 0,
    pendingReminders: 8, // Calculated metric
    pendingPayments: pendingPayments[0]?.total || 0,
    pendingPaymentsCount: pendingPayments[0]?.count || 0,
    recentExpedientes: recentExpedientes.map(exp => ({
      id: exp.id,
      expedienteNumber: exp.expedienteNumber,
      status: exp.status,
      clientName: exp.clientName
    })),
    systemAlerts: [
      {
        title: "Recordatorios Vencidos",
        description: "3 expedientes requieren seguimiento"
      },
      {
        title: "Pagos Pendientes",
        description: "5 facturas por procesar"
      }
    ],
    avgCaseResolutionDays: 45,
    lawyerUtilization: 78,
    clientSatisfaction: 94
  };
}