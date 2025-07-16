/**
 * Helper functions for PDF document generation
 */

import { formatOrderCode } from "@/lib/utils";

/**
 * Gets the appropriate logo based on the client's branch/sucursal
 */
export function getLogoForDocument(order: any, isDeliveryNote = false, isPresupuesto = false) {
  // Try to get logo from the client's branch
  if (order.client?.sucursal?.logo) {
    return order.client.sucursal.logo;
  }
  
  // Fallback to the user's branch
  if (order.user?.sucursal?.logo) {
    return order.user.sucursal.logo;
  }
  
  // Default logo based on document type
  if (isDeliveryNote || isPresupuesto) {
    return "/logos/multiservice.png"; // Default for delivery notes/quotes
  }
  
  return "/logos/multiservice.png"; // Default for service orders
}

/**
 * Formats the order number with proper formatting
 */
export function getFormattedOrderCode(order: any) {
  return order.orderCode ? formatOrderCode(order.orderCode) : order.orderNumber;
}

/**
 * Gets the formatted status text for display
 */
export function getStatusText(status: string, isPresupuesto = false) {
  switch (status) {
    case "PREORDER": return "Pre-orden";
    case "PENDING": return "Pendiente";
    case "ASSIGNED": return "Asignada";
    case "IN_PROGRESS": return "En Progreso";
    case "COMPLETED": return "Completada";
    case "DELIVERED": return "Entregada";
    case "CANCELLED": return "Cancelada";
    case "APROBADO": return "Aprobada";
    case "NO_APROBADO": return "No Aprobada";
    case "PENDIENTE_AVISAR": return "Pendiente Avisar";
    case "FACTURADO": return isPresupuesto ? "Presupuestado" : "Facturada";
    case "ENTREGA_GENERADA": return "Entrega Generada";
    case "GARANTIA_APLICADA": return "Garantía Aplicada";
    case "REPARANDO": return "Reparando";
    default: return status;
  }
}

/**
 * Ensures a phone number is properly formatted with country code
 */
export function formatPhoneNumber(phone: string | undefined): string {
  if (!phone) return '';
  
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  
  // Add Venezuela country code if not present
  if (!cleaned.startsWith('58') && !cleaned.startsWith('+58')) {
    // If it starts with 0, remove the leading 0 before adding country code
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    cleaned = '58' + cleaned;
  }
  
  // Ensure it has a plus sign at the beginning
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Parse concept order JSON data
 */
export function parseConceptoOrden(conceptoOrden: any) {
  let conceptHeader = "";
  let conceptText = "";
  let conceptAmount = null;
  let conceptIncludeIVA = false;
  let conceptTotalAmount = null;

  if (conceptoOrden) {
    try {
      const concept = typeof conceptoOrden === 'string' 
        ? JSON.parse(conceptoOrden) 
        : conceptoOrden;
      conceptHeader = concept.Header || "";
      conceptText = concept.Text || "";
      conceptAmount = concept.amount ? Number(concept.amount) : null;
      conceptIncludeIVA = concept.includeIVA === true;
      conceptTotalAmount = concept.totalAmount ? Number(concept.totalAmount) : null;
    } catch (e) {
      conceptText = String(conceptoOrden);
    }
  }

  return {
    header: conceptHeader,
    text: conceptText,
    amount: conceptAmount,
    includeIVA: conceptIncludeIVA,
    totalAmount: conceptTotalAmount
  };
}