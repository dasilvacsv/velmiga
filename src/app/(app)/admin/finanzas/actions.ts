"use server";

import { db } from "@/db";
import { lawyerPayments, clientBilling, lawyers, clients, expedientes } from "@/db/schema";
import { eq, desc, sum, count, and, gte, lte } from "drizzle-orm";
import { auth } from "@/features/auth";
import { revalidatePath } from "next/cache";

export async function getFinancialData() {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  // Get lawyer payments
  const lawyerPaymentsData = await db
    .select({
      id: lawyerPayments.id,
      amount: lawyerPayments.amountRequested,
      status: lawyerPayments.paymentStatus,
      createdAt: lawyerPayments.createdAt,
      lawyerName: lawyers.firstName,
      expedienteNumber: expedientes.expedienteNumber
    })
    .from(lawyerPayments)
    .leftJoin(lawyers, eq(lawyerPayments.lawyerId, lawyers.id))
    .leftJoin(expedientes, eq(lawyerPayments.expedienteId, expedientes.id))
    .orderBy(desc(lawyerPayments.createdAt));

  // Get client billing
  const clientBillingData = await db
    .select({
      id: clientBilling.id,
      amount: clientBilling.amountDue,
      status: clientBilling.billingStatus,
      createdAt: clientBilling.createdAt,
      invoiceNumber: clientBilling.invoiceNumber,
      clientName: clients.companyName,
      expedienteNumber: expedientes.expedienteNumber
    })
    .from(clientBilling)
    .leftJoin(clients, eq(clientBilling.clientId, clients.id))
    .leftJoin(expedientes, eq(clientBilling.expedienteId, expedientes.id))
    .orderBy(desc(clientBilling.createdAt));

  // Calculate summary
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const pendingPayments = lawyerPaymentsData
    .filter(p => p.status === "SOLICITADO")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const monthlyBilling = clientBillingData
    .filter(b => new Date(b.createdAt) >= startOfMonth && new Date(b.createdAt) <= endOfMonth)
    .reduce((sum, b) => sum + Number(b.amount), 0);

  const processedPayments = lawyerPaymentsData
    .filter(p => p.status === "PAGADO" && new Date(p.createdAt) >= startOfMonth && new Date(p.createdAt) <= endOfMonth)
    .length;

  const activeLawyers = new Set(lawyerPaymentsData.filter(p => p.status === "SOLICITADO").map(p => p.lawyerName)).size;

  return {
    lawyerPayments: lawyerPaymentsData.map(p => ({
      ...p,
      lawyerName: `${p.lawyerName} ${lawyers.lastName || ''}`
    })),
    clientBilling: clientBillingData,
    summary: {
      pendingPayments,
      pendingPaymentsCount: lawyerPaymentsData.filter(p => p.status === "SOLICITADO").length,
      monthlyBilling,
      processedPayments,
      activeLawyers
    }
  };
}

export async function updatePaymentStatus(paymentId, newStatus, type) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  if (type === "lawyer") {
    await db
      .update(lawyerPayments)
      .set({
        paymentStatus: newStatus,
        paymentDate: newStatus === "PAGADO" ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(lawyerPayments.id, paymentId));
  } else if (type === "client") {
    await db
      .update(clientBilling)
      .set({
        billingStatus: newStatus,
        invoiceDate: newStatus === "FACTURADO" ? new Date() : null,
        paymentDate: newStatus === "PAGADO" ? new Date() : null,
        updatedAt: new Date()
      })
      .where(eq(clientBilling.id, paymentId));
  }

  revalidatePath("/admin/finanzas");
}

export async function createPayment(formData) {
  const session = await auth();
  
  if (!session?.user) {
    throw new Error("No autorizado");
  }

  if (formData.type === "lawyer") {
    const result = await db.insert(lawyerPayments).values({
      expedienteId: formData.expedienteId,
      lawyerId: formData.lawyerId,
      amountRequested: formData.amount,
      paymentStatus: "SOLICITADO",
      requestedByUserId: session.user.id
    }).returning();

    revalidatePath("/admin/finanzas");
    return result[0];
  } else if (formData.type === "client") {
    const result = await db.insert(clientBilling).values({
      expedienteId: formData.expedienteId,
      clientId: formData.clientId,
      amountDue: formData.amount,
      billingStatus: "SOLICITADO"
    }).returning();

    revalidatePath("/admin/finanzas");
    return result[0];
  }
}