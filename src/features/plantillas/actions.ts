"use server";

import { db } from "@/db";
import { templates, cases, clients, users, casePartes, tasks, casesToUsers } from "@/db/schema";
import { eq, desc, and, or, ilike } from "drizzle-orm";
import { auth } from "@/features/auth";
import { Template, NewTemplate, TemplateVariable, CaseWithRelations, ExcelCaseData } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { logActivity } from "@/features/movimientos/actions";

// =================================================================
// FUNCIONES AUXILIARES
// =================================================================

async function getCurrentUserAndSession() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('No autenticado. Se requiere iniciar sesión para realizar esta acción.');
  }

  const userDetails = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });

  if (!userDetails) {
    throw new Error('El usuario de la sesión no existe en la base de datos.');
  }

  return { session, user: userDetails };
}

// =================================================================
// FUNCIONES DE PLANTILLAS
// =================================================================

export async function getTemplates(): Promise<Template[]> {
  try {
    const templatesData = await db
      .select()
      .from(templates)
      .orderBy(desc(templates.createdAt));

    return templatesData;
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
}

export async function getTemplateById(id: string): Promise<Template | null> {
  try {
    const template = await db
      .select()
      .from(templates)
      .where(eq(templates.id, id))
      .limit(1);

    return template[0] || null;
  } catch (error) {
    console.error("Error fetching template:", error);
    return null;
  }
}

export async function createTemplate(data: {
  templateName: string;
  description?: string;
  content: string;
}): Promise<{ success: boolean; error?: string; templateId?: string }> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "Usuario no autenticado" };
    }

    const newTemplate: NewTemplate = {
      templateName: data.templateName,
      description: data.description || null,
      content: data.content,
      createdBy: session.user.id,
      status: 'ACTIVE'
    };

    const result = await db
      .insert(templates)
      .values(newTemplate)
      .returning({ id: templates.id });

    await logActivity(
      'CASE_CREATED',
      `Nueva plantilla creada: "${data.templateName}"`,
      `Se creó una nueva plantilla legal: ${data.templateName}`,
      session.user.id,
      {
        entityId: result[0].id,
        entityType: 'template',
        newValue: { templateName: data.templateName }
      }
    );

    revalidatePath('/plantillas');
    return { 
      success: true, 
      templateId: result[0].id 
    };
  } catch (error) {
    console.error("Error creating template:", error);
    return { 
      success: false, 
      error: "Error al crear la plantilla" 
    };
  }
}

export async function updateTemplate(
  id: string, 
  data: {
    templateName?: string;
    description?: string;
    content?: string;
    status?: 'ACTIVE' | 'INACTIVE';
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "Usuario no autenticado" };
    }

    const originalTemplate = await db.query.templates.findFirst({ where: eq(templates.id, id) });

    await db
      .update(templates)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(templates.id, id));

    await logActivity(
      'CASE_UPDATED',
      `Plantilla actualizada: "${data.templateName || originalTemplate?.templateName}"`,
      `Se actualizó la plantilla: ${data.templateName || originalTemplate?.templateName}`,
      session.user.id,
      {
        entityId: id,
        entityType: 'template',
        previousValue: originalTemplate,
        newValue: data
      }
    );

    revalidatePath('/plantillas');
    return { success: true };
  } catch (error) {
    console.error("Error updating template:", error);
    return { 
      success: false, 
      error: "Error al actualizar la plantilla" 
    };
  }
}

export async function deleteTemplate(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: "Usuario no autenticado" };
    }

    const templateToDelete = await db.query.templates.findFirst({ where: eq(templates.id, id) });

    if (!templateToDelete) {
      return { success: false, error: "Plantilla no encontrada" };
    }

    await db
      .delete(templates)
      .where(eq(templates.id, id));

    await logActivity(
      'CASE_CLOSED',
      `Plantilla eliminada: "${templateToDelete?.templateName}"`,
      `Se eliminó la plantilla: ${templateToDelete?.templateName}`,
      session.user.id,
      {
        entityId: id,
        entityType: 'template',
        previousValue: templateToDelete
      }
    );

    revalidatePath('/plantillas');
    return { success: true };
  } catch (error) {
    console.error("Error deleting template:", error);
    return { 
      success: false, 
      error: "Error al eliminar la plantilla" 
    };
  }
}

// =================================================================
// FUNCIONES DE VARIABLES DE PLANTILLAS
// =================================================================

export async function getTemplateVariables(): Promise<TemplateVariable[]> {
  const variables: TemplateVariable[] = [
    // ===== VARIABLES DE CLIENTE =====
    {
      name: "client.name",
      label: "Nombre del Cliente",
      type: "text",
      source: "client",
      description: "Nombre completo o razón social del cliente"
    },
    {
      name: "client.email",
      label: "Email del Cliente",
      type: "text",
      source: "client",
      description: "Correo electrónico del cliente"
    },
    {
      name: "client.phone",
      label: "Teléfono del Cliente",
      type: "text",
      source: "client",
      description: "Número de teléfono del cliente"
    },
    {
      name: "client.address",
      label: "Dirección del Cliente",
      type: "text",
      source: "client",
      description: "Dirección completa del cliente"
    },
    {
      name: "client.dni",
      label: "Documento de Identidad del Cliente",
      type: "text",
      source: "client",
      description: "DNI, RIF o documento de identificación del cliente"
    },
    {
      name: "client.type",
      label: "Tipo de Cliente",
      type: "text",
      source: "client",
      description: "Persona Natural o Empresa"
    },

    // ===== VARIABLES DE CASO =====
    {
      name: "case.name",
      label: "Nombre del Caso",
      type: "text",
      source: "case",
      description: "Título o nombre descriptivo del caso"
    },
    {
      name: "case.number",
      label: "Número de Proceso",
      type: "text",
      source: "case",
      description: "Número oficial del expediente o proceso"
    },
    {
      name: "case.description",
      label: "Descripción del Caso",
      type: "text",
      source: "case",
      description: "Descripción detallada del caso"
    },
    {
      name: "case.status",
      label: "Estado del Caso",
      type: "text",
      source: "case",
      description: "Estado oficial del caso (ACTIVO, EN_ESPERA, CERRADO, ARCHIVADO)"
    },
    {
      name: "case.internalStatus",
      label: "Estado Interno",
      type: "text",
      source: "case",
      description: "Estado interno personalizado del despacho"
    },
    {
      name: "case.authorities",
      label: "Autoridades Competentes",
      type: "text",
      source: "case",
      description: "Autoridades o juzgados competentes del caso"
    },
    {
      name: "case.openingDate",
      label: "Fecha de Apertura",
      type: "date",
      source: "case",
      description: "Fecha de inicio o apertura del caso"
    },
    {
      name: "case.closingDate",
      label: "Fecha de Cierre",
      type: "date",
      source: "case",
      description: "Fecha de cierre del caso (si aplica)"
    },

    // ===== VARIABLES DE PARTES ACTIVAS =====
    {
      name: "parteActiva.firstName",
      label: "Nombre de la Parte Activa",
      type: "text",
      source: "case",
      description: "Nombre de la parte activa principal"
    },
    {
      name: "parteActiva.lastName",
      label: "Apellido de la Parte Activa",
      type: "text",
      source: "case",
      description: "Apellido de la parte activa principal"
    },
    {
      name: "parteActiva.fullName",
      label: "Nombre Completo de la Parte Activa",
      type: "text",
      source: "case",
      description: "Nombre completo de la parte activa principal"
    },
    {
      name: "parteActiva.cedula",
      label: "Cédula de la Parte Activa",
      type: "text",
      source: "case",
      description: "Número de cédula o documento de identidad de la parte activa"
    },
    {
      name: "parteActiva.phone",
      label: "Teléfono de la Parte Activa",
      type: "text",
      source: "case",
      description: "Número de teléfono de la parte activa"
    },
    {
      name: "parteActiva.email",
      label: "Email de la Parte Activa",
      type: "text",
      source: "case",
      description: "Correo electrónico de la parte activa"
    },
    {
      name: "parteActiva.bienes",
      label: "Bienes de la Parte Activa",
      type: "text",
      source: "case",
      description: "Descripción de bienes de la parte activa"
    },

    // ===== VARIABLES DE PARTES DEMANDADAS =====
    {
      name: "parteDemandada.firstName",
      label: "Nombre de la Parte Demandada",
      type: "text",
      source: "case",
      description: "Nombre de la parte demandada principal"
    },
    {
      name: "parteDemandada.lastName",
      label: "Apellido de la Parte Demandada",
      type: "text",
      source: "case",
      description: "Apellido de la parte demandada principal"
    },
    {
      name: "parteDemandada.fullName",
      label: "Nombre Completo de la Parte Demandada",
      type: "text",
      source: "case",
      description: "Nombre completo de la parte demandada principal"
    },
    {
      name: "parteDemandada.cedula",
      label: "Cédula de la Parte Demandada",
      type: "text",
      source: "case",
      description: "Número de cédula o documento de identidad de la parte demandada"
    },
    {
      name: "parteDemandada.phone",
      label: "Teléfono de la Parte Demandada",
      type: "text",
      source: "case",
      description: "Número de teléfono de la parte demandada"
    },
    {
      name: "parteDemandada.email",
      label: "Email de la Parte Demandada",
      type: "text",
      source: "case",
      description: "Correo electrónico de la parte demandada"
    },
    {
      name: "parteDemandada.bienes",
      label: "Bienes de la Parte Demandada",
      type: "text",
      source: "case",
      description: "Descripción de bienes de la parte demandada"
    },

    // ===== VARIABLES DE TODAS LAS PARTES =====
    {
      name: "partes.todas.nombres",
      label: "Nombres de Todas las Partes",
      type: "text",
      source: "case",
      description: "Lista completa de nombres de todas las partes involucradas"
    },
    {
      name: "partes.todas.cedulas",
      label: "Cédulas de Todas las Partes",
      type: "text",
      source: "case",
      description: "Lista completa de cédulas de todas las partes involucradas"
    },
    {
      name: "partes.activas.lista",
      label: "Lista de Partes Activas",
      type: "text",
      source: "case",
      description: "Lista completa de todas las partes activas"
    },
    {
      name: "partes.demandadas.lista",
      label: "Lista de Partes Demandadas",
      type: "text",
      source: "case",
      description: "Lista completa de todas las partes demandadas"
    },

    // ===== VARIABLES DEL ABOGADO/USUARIO =====
    {
      name: "lawyer.firstName",
      label: "Nombre del Abogado",
      type: "text",
      source: "user",
      description: "Nombre del abogado responsable"
    },
    {
      name: "lawyer.lastName",
      label: "Apellido del Abogado",
      type: "text",
      source: "user",
      description: "Apellido del abogado responsable"
    },
    {
      name: "lawyer.fullName",
      label: "Nombre Completo del Abogado",
      type: "text",
      source: "user",
      description: "Nombre completo del abogado responsable"
    },
    {
      name: "lawyer.email",
      label: "Email del Abogado",
      type: "text",
      source: "user",
      description: "Correo electrónico del abogado"
    },
    {
      name: "lawyer.role",
      label: "Rol del Abogado",
      type: "text",
      source: "user",
      description: "Rol dentro del despacho (SOCIO, ABOGADO, ASISTENTE, ADMIN)"
    },

    // ===== VARIABLES DEL DESPACHO =====
    {
      name: "firm.name",
      label: "Nombre del Despacho",
      type: "text",
      source: "custom",
      description: "Nombre oficial del despacho jurídico"
    },
    {
      name: "firm.address",
      label: "Dirección del Despacho",
      type: "text",
      source: "custom",
      description: "Dirección completa del despacho"
    },
    {
      name: "firm.phone",
      label: "Teléfono del Despacho",
      type: "text",
      source: "custom",
      description: "Teléfono principal del despacho"
    },
    {
      name: "firm.email",
      label: "Email del Despacho",
      type: "text",
      source: "custom",
      description: "Correo electrónico principal del despacho"
    },

    // ===== VARIABLES DE FECHA Y TIEMPO =====
    {
      name: "date.today",
      label: "Fecha Actual",
      type: "date",
      source: "custom",
      description: "Fecha actual del sistema (formato largo)"
    },
    {
      name: "date.todayShort",
      label: "Fecha Actual (Corta)",
      type: "date",
      source: "custom",
      description: "Fecha actual del sistema (formato corto)"
    },
    {
      name: "date.current",
      label: "Fecha y Hora Actual",
      type: "date",
      source: "custom",
      description: "Fecha y hora actual completa"
    },
    {
      name: "date.currentYear",
      label: "Año Actual",
      type: "text",
      source: "custom",
      description: "Año actual"
    },
    {
      name: "date.currentMonth",
      label: "Mes Actual",
      type: "text",
      source: "custom",
      description: "Mes actual (nombre)"
    },
    {
      name: "date.currentDay",
      label: "Día Actual",
      type: "text",
      source: "custom",
      description: "Día actual del mes"
    },
  ];

  return variables;
}

// Función mejorada para procesar plantillas y convertir HTML a texto limpio preservando estructura
export async function processTemplate(
  templateContent: string,
  variables: Record<string, any>
): Promise<string> {
  let processedContent = templateContent;

  // Primero, reemplazar todas las variables
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    let value = variables[key];

    // Manejo especial para fechas
    if (key.includes('date') || key.includes('Date')) {
      if (value instanceof Date) {
        if (key.includes('Short')) {
          value = value.toLocaleDateString('es-ES');
        } else if (key.includes('current')) {
          value = value.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } else {
          value = value.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      }
    }

    // Manejo especial para arrays (listas de partes)
    if (Array.isArray(value)) {
      if (key.includes('nombres') || key.includes('lista')) {
        value = value.join(', ');
      } else if (key.includes('cedulas')) {
        value = value.join(', ');
      }
    }

    // Manejo especial para nombres completos
    if (key.includes('fullName') && typeof value === 'object' && value.firstName && value.lastName) {
      value = `${value.firstName} ${value.lastName}`;
    }

    value = value || '';
    processedContent = processedContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
  });

  // Ahora convertir HTML a texto con estructura preservada
  processedContent = processedContent
    // Convertir encabezados a texto con formato
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n$1\n' + '='.repeat(50) + '\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n$1\n' + '-'.repeat(30) + '\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n$1\n' + '-'.repeat(20) + '\n')
    
    // Convertir párrafos
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    
    // Convertir saltos de línea
    .replace(/<br[^>]*>/gi, '\n')
    
    // Convertir texto en negrita a mayúsculas
    .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '$2')
    
    // Convertir listas
    .replace(/<ul[^>]*>/gi, '\n')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<ol[^>]*>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
    
    // Limpiar otros tags HTML
    .replace(/<[^>]*>/g, '')
    
    // Limpiar entidades HTML
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    
    // Limpiar espacios excesivos
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+|\s+$/g, '')
    .trim();

  return processedContent;
}

export async function getTemplateVariablesForCase(caseId: string): Promise<Record<string, any>> {
  try {
    const caseData = await db
      .select()
      .from(cases)
      .where(eq(cases.id, caseId))
      .limit(1);

    if (!caseData[0]) {
      throw new Error('Caso no encontrado');
    }

    const caseInfo = caseData[0];

    const clientData = await db
      .select()
      .from(clients)
      .where(eq(clients.id, caseInfo.clientId))
      .limit(1);

    const partesData = await db
      .select()
      .from(casePartes)
      .where(eq(casePartes.caseId, caseId));

    const userData = await db
      .select()
      .from(users)
      .where(eq(users.id, caseInfo.createdBy || ''))
      .limit(1);

    const partesActivas = partesData.filter(p => p.type === 'ACTIVA');
    const partesDemandadas = partesData.filter(p => p.type === 'DEMANDADA');

    const client = clientData[0];
    const user = userData[0];
    const parteActivaPrincipal = partesActivas[0];
    const parteDemandadaPrincipal = partesDemandadas[0];

    const now = new Date();

    const variables: Record<string, any> = {
      // Variables de cliente
      'client.name': client?.name || '',
      'client.email': client?.email || '',
      'client.phone': client?.phone || '',
      'client.address': client?.address || '',
      'client.dni': client?.dni || '',
      'client.type': client?.clientType || '',

      // Variables de caso
      'case.name': caseInfo.caseName || '',
      'case.number': caseInfo.caseNumber || '',
      'case.description': caseInfo.description || '',
      'case.status': caseInfo.status || '',
      'case.internalStatus': caseInfo.internalStatus || '',
      'case.authorities': caseInfo.authorities || '',
      'case.openingDate': caseInfo.openingDate || '',
      'case.closingDate': caseInfo.closingDate || '',

      // Variables de parte activa principal
      'parteActiva.firstName': parteActivaPrincipal?.firstName || '',
      'parteActiva.lastName': parteActivaPrincipal?.lastName || '',
      'parteActiva.fullName': parteActivaPrincipal ? `${parteActivaPrincipal.firstName} ${parteActivaPrincipal.lastName}` : '',
      'parteActiva.cedula': parteActivaPrincipal?.cedula || '',
      'parteActiva.phone': parteActivaPrincipal?.phone || '',
      'parteActiva.email': parteActivaPrincipal?.email || '',
      'parteActiva.bienes': parteActivaPrincipal?.bienesDescription || '',

      // Variables de parte demandada principal
      'parteDemandada.firstName': parteDemandadaPrincipal?.firstName || '',
      'parteDemandada.lastName': parteDemandadaPrincipal?.lastName || '',
      'parteDemandada.fullName': parteDemandadaPrincipal ? `${parteDemandadaPrincipal.firstName} ${parteDemandadaPrincipal.lastName}` : '',
      'parteDemandada.cedula': parteDemandadaPrincipal?.cedula || '',
      'parteDemandada.phone': parteDemandadaPrincipal?.phone || '',
      'parteDemandada.email': parteDemandadaPrincipal?.email || '',
      'parteDemandada.bienes': parteDemandadaPrincipal?.bienesDescription || '',

      // Variables de todas las partes
      'partes.todas.nombres': partesData.map(p => `${p.firstName} ${p.lastName}`),
      'partes.todas.cedulas': partesData.map(p => p.cedula),
      'partes.activas.lista': partesActivas.map(p => `${p.firstName} ${p.lastName}`),
      'partes.demandadas.lista': partesDemandadas.map(p => `${p.firstName} ${p.lastName}`),

      // Variables del abogado/usuario
      'lawyer.firstName': user?.firstName || '',
      'lawyer.lastName': user?.lastName || '',
      'lawyer.fullName': user ? `${user.firstName} ${user.lastName}` : '',
      'lawyer.email': user?.email || '',
      'lawyer.role': user?.role || '',

      // Variables del despacho
      'firm.name': 'Velmiga - Despacho Jurídico',
      'firm.address': '',
      'firm.phone': '',
      'firm.email': '',

      // Variables de fecha
      'date.today': now,
      'date.todayShort': now,
      'date.current': now,
      'date.currentYear': now.getFullYear().toString(),
      'date.currentMonth': now.toLocaleDateString('es-ES', { month: 'long' }),
      'date.currentDay': now.getDate().toString(),
    };

    return variables;
  } catch (error) {
    console.error("Error getting template variables for case:", error);
    return {};
  }
}

export async function getTemplateStats(): Promise<{
  totalTemplates: number;
  activeTemplates: number;
  recentTemplates: number;
}> {
  try {
    const allTemplates = await db.select().from(templates);
    const activeTemplates = allTemplates.filter(t => t.status === 'ACTIVE');
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentTemplates = allTemplates.filter(t => 
      t.createdAt && new Date(t.createdAt) >= thirtyDaysAgo
    );

    return {
      totalTemplates: allTemplates.length,
      activeTemplates: activeTemplates.length,
      recentTemplates: recentTemplates.length
    };
  } catch (error) {
    console.error("Error getting template stats:", error);
    return {
      totalTemplates: 0,
      activeTemplates: 0,
      recentTemplates: 0
    };
  }
}

// =================================================================
// FUNCIONES DE INTEGRACIÓN CON CASOS
// =================================================================

export async function getCasesWithTemplateUsage(): Promise<CaseWithRelations[]> {
  try {
    const result = await db
      .select({
        case: cases,
        client: clients,
      })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id))
      .orderBy(desc(cases.createdAt));

    const casesWithRelations = await Promise.all(
      result.map(async (row) => {
        const teamMembers = await db
          .select({
            caseTeamMember: casesToUsers,
            user: users,
          })
          .from(casesToUsers)
          .leftJoin(users, eq(casesToUsers.userId, users.id))
          .where(eq(casesToUsers.caseId, row.case.id));

        const partes = await db
          .select()
          .from(casePartes)
          .where(eq(casePartes.caseId, row.case.id));

        const caseTasks = await db
          .select({
            task: tasks,
            assignedTo: users,
          })
          .from(tasks)
          .leftJoin(users, eq(tasks.assignedToId, users.id))
          .where(eq(tasks.caseId, row.case.id));

        return {
          ...row.case,
          client: row.client || undefined,
          teamMembers: teamMembers.map(tm => ({
            ...tm.caseTeamMember,
            user: tm.user || undefined,
          })),
          partes: partes,
          tasks: caseTasks.map(t => ({
            ...t.task,
            assignedTo: t.assignedTo || undefined,
          })),
        };
      })
    );

    return casesWithRelations;
  } catch (error) {
    console.error('Error fetching cases with template usage:', error);
    throw new Error('Failed to fetch cases with templates');
  }
}

export async function createTemplateFromCase(caseId: string, templateData: {
  templateName: string;
  description?: string;
}): Promise<{ success: boolean; error?: string; templateId?: string }> {
  try {
    const { user } = await getCurrentUserAndSession();

    // Obtener datos del caso para generar contenido de plantilla
    const variables = await getTemplateVariablesForCase(caseId);
    
    // Crear contenido base de plantilla con variables del caso
    const baseContent = `
<h1>{{case.name}}</h1>

<h2>INFORMACIÓN DEL CLIENTE</h2>
<p><strong>Cliente:</strong> {{client.name}}</p>
<p><strong>Tipo:</strong> {{client.type}}</p>
<p><strong>Documento:</strong> {{client.dni}}</p>
<p><strong>Email:</strong> {{client.email}}</p>
<p><strong>Teléfono:</strong> {{client.phone}}</p>
<p><strong>Dirección:</strong> {{client.address}}</p>

<h2>INFORMACIÓN DEL CASO</h2>
<p><strong>Número de Proceso:</strong> {{case.number}}</p>
<p><strong>Estado:</strong> {{case.status}}</p>
<p><strong>Autoridades Competentes:</strong> {{case.authorities}}</p>
<p><strong>Fecha de Apertura:</strong> {{case.openingDate}}</p>
<p><strong>Descripción:</strong> {{case.description}}</p>

<h2>PARTES INVOLUCRADAS</h2>
<h3>Parte Activa</h3>
<p><strong>Nombre:</strong> {{parteActiva.fullName}}</p>
<p><strong>Cédula:</strong> {{parteActiva.cedula}}</p>
<p><strong>Teléfono:</strong> {{parteActiva.phone}}</p>
<p><strong>Email:</strong> {{parteActiva.email}}</p>

<h3>Parte Demandada</h3>
<p><strong>Nombre:</strong> {{parteDemandada.fullName}}</p>
<p><strong>Cédula:</strong> {{parteDemandada.cedula}}</p>
<p><strong>Teléfono:</strong> {{parteDemandada.phone}}</p>
<p><strong>Email:</strong> {{parteDemandada.email}}</p>

<h2>INFORMACIÓN DEL ABOGADO</h2>
<p><strong>Abogado:</strong> {{lawyer.fullName}}</p>
<p><strong>Email:</strong> {{lawyer.email}}</p>
<p><strong>Rol:</strong> {{lawyer.role}}</p>

<h2>INFORMACIÓN DEL DESPACHO</h2>
<p><strong>Despacho:</strong> {{firm.name}}</p>
<p><strong>Dirección:</strong> {{firm.address}}</p>
<p><strong>Teléfono:</strong> {{firm.phone}}</p>
<p><strong>Email:</strong> {{firm.email}}</p>

<p><strong>Fecha de Generación:</strong> {{date.today}}</p>
    `.trim();

    const newTemplate: NewTemplate = {
      templateName: templateData.templateName,
      description: templateData.description || `Plantilla generada automáticamente desde el caso: ${variables['case.name']}`,
      content: baseContent,
      createdBy: user.id,
      status: 'ACTIVE'
    };

    const result = await db
      .insert(templates)
      .values(newTemplate)
      .returning({ id: templates.id });

    await logActivity(
      'CASE_CREATED',
      `Plantilla creada desde caso: "${templateData.templateName}"`,
      `Se generó una plantilla automáticamente desde el caso: ${variables['case.name']}`,
      user.id,
      {
        entityId: result[0].id,
        entityType: 'template',
        newValue: { templateName: templateData.templateName, caseId }
      }
    );

    revalidatePath('/plantillas');
    revalidatePath(`/casos/${caseId}`);
    
    return { 
      success: true, 
      templateId: result[0].id 
    };
  } catch (error) {
    console.error("Error creating template from case:", error);
    return { 
      success: false, 
      error: "Error al crear plantilla desde el caso" 
    };
  }
}

export async function searchTemplatesInCases(searchTerm: string): Promise<{
  cases: CaseWithRelations[];
  templatesUsed: string[];
}> {
  try {
    // Buscar casos que coincidan con el término de búsqueda
    const casesResult = await db
      .select({
        case: cases,
        client: clients,
      })
      .from(cases)
      .leftJoin(clients, eq(cases.clientId, clients.id))
      .where(
        or(
          ilike(cases.caseName, `%${searchTerm}%`),
          ilike(cases.caseNumber, `%${searchTerm}%`),
          ilike(cases.description, `%${searchTerm}%`),
          ilike(clients.name, `%${searchTerm}%`)
        )
      )
      .orderBy(desc(cases.createdAt));

    const casesWithRelations = await Promise.all(
      casesResult.map(async (row) => {
        const partes = await db
          .select()
          .from(casePartes)
          .where(eq(casePartes.caseId, row.case.id));

        const caseTasks = await db
          .select({
            task: tasks,
            assignedTo: users,
          })
          .from(tasks)
          .leftJoin(users, eq(tasks.assignedToId, users.id))
          .where(eq(tasks.caseId, row.case.id));

        return {
          ...row.case,
          client: row.client || undefined,
          partes: partes,
          tasks: caseTasks.map(t => ({
            ...t.task,
            assignedTo: t.assignedTo || undefined,
          })),
        };
      })
    );

    // Buscar plantillas que coincidan con el término de búsqueda
    const templatesResult = await db
      .select()
      .from(templates)
      .where(
        or(
          ilike(templates.templateName, `%${searchTerm}%`),
          ilike(templates.description, `%${searchTerm}%`),
          ilike(templates.content, `%${searchTerm}%`)
        )
      );

    const templatesUsed = templatesResult.map(t => t.templateName);

    return {
      cases: casesWithRelations,
      templatesUsed
    };
  } catch (error) {
    console.error('Error searching templates in cases:', error);
    return {
      cases: [],
      templatesUsed: []
    };
  }
}

// =================================================================
// FUNCIONES DE IMPORTACIÓN DESDE EXCEL
// =================================================================

export async function createCaseFromExcelData(data: ExcelCaseData): Promise<{ success: boolean; error?: string; caseId?: string }> {
  try {
    const { user } = await getCurrentUserAndSession();

    // 1. Crear o encontrar cliente
    let clientId: string;
    
    const existingClient = await db
      .select()
      .from(clients)
      .where(eq(clients.name, data.clientName))
      .limit(1);

    if (existingClient.length > 0) {
      clientId = existingClient[0].id;
    } else {
      const [newClient] = await db
        .insert(clients)
        .values({
          name: data.clientName,
          clientType: data.clientType,
          email: data.clientEmail || null,
          phone: data.clientPhone || null,
          address: data.clientAddress || null,
          dni: data.clientDni || null,
          status: 'ACTIVE',
          createdBy: user.id,
          updatedBy: user.id,
        })
        .returning({ id: clients.id });
      
      clientId = newClient.id;
    }

    // 2. Crear caso
    const [newCase] = await db
      .insert(cases)
      .values({
        clientId,
        caseName: data.caseName,
        caseNumber: data.caseNumber || null,
        description: data.description || null,
        authorities: data.authorities || null,
        internalStatus: data.internalStatus || null,
        openingDate: data.openingDate ? new Date(data.openingDate) : new Date(),
        status: 'ACTIVO',
        createdBy: user.id,
        updatedBy: user.id,
      })
      .returning({ id: cases.id });

    const caseId = newCase.id;

    // 3. Crear partes activas
    if (data.parteActivaFirstName && data.parteActivaLastName && data.parteActivaCedula) {
      await db.insert(casePartes).values({
        caseId,
        firstName: data.parteActivaFirstName,
        lastName: data.parteActivaLastName,
        cedula: data.parteActivaCedula,
        phone: data.parteActivaPhone || null,
        email: data.parteActivaEmail || null,
        type: 'ACTIVA',
        hasBienes: Boolean(data.parteActivaBienes),
        bienesDescription: data.parteActivaBienes || null,
        createdBy: user.id,
      });
    }

    // 4. Crear partes demandadas
    if (data.parteDemandadaFirstName && data.parteDemandadaLastName && data.parteDemandadaCedula) {
      await db.insert(casePartes).values({
        caseId,
        firstName: data.parteDemandadaFirstName,
        lastName: data.parteDemandadaLastName,
        cedula: data.parteDemandadaCedula,
        phone: data.parteDemandadaPhone || null,
        email: data.parteDemandadaEmail || null,
        type: 'DEMANDADA',
        hasBienes: Boolean(data.parteDemandadaBienes),
        bienesDescription: data.parteDemandadaBienes || null,
        createdBy: user.id,
      });
    }

    // 5. Crear tareas si se especificaron
    if (data.taskDescription) {
      let assignedToId = user.id; // Por defecto asignar al usuario actual
      
      // Si se especificó un email de asignación, buscar el usuario
      if (data.assignedToEmail) {
        const assignedUser = await db
          .select()
          .from(users)
          .where(eq(users.email, data.assignedToEmail))
          .limit(1);
        
        if (assignedUser.length > 0) {
          assignedToId = assignedUser[0].id;
        }
      }

      await db.insert(tasks).values({
        caseId,
        assignedToId,
        description: data.taskDescription,
        fechaDeVencimiento: data.taskDueDate ? new Date(data.taskDueDate) : null,
        priority: data.taskPriority || 'MEDIA',
        status: 'ACTIVO',
        createdBy: user.id,
      });
    }

    // 6. Log de actividad
    await logActivity(
      'CASE_CREATED',
      `Caso creado desde Excel: "${data.caseName}"`,
      `Se importó un nuevo caso desde Excel para el cliente ${data.clientName}`,
      user.id,
      {
        entityId: caseId,
        entityType: 'case',
        newValue: { caseName: data.caseName, source: 'excel_import' }
      }
    );

    revalidatePath('/casos');
    revalidatePath('/plantillas');

    return { 
      success: true, 
      caseId 
    };
  } catch (error) {
    console.error("Error creating case from Excel data:", error);
    return { 
      success: false, 
      error: "Error al crear caso desde datos de Excel" 
    };
  }
}

export async function bulkCreateCasesFromExcel(casesData: ExcelCaseData[]): Promise<{
  success: boolean;
  results: Array<{ success: boolean; error?: string; caseId?: string; caseName: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}> {
  const results: Array<{ success: boolean; error?: string; caseId?: string; caseName: string }> = [];
  
  for (const caseData of casesData) {
    const result = await createCaseFromExcelData(caseData);
    results.push({
      ...result,
      caseName: caseData.caseName
    });
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    success: successful > 0,
    results,
    summary: {
      total: casesData.length,
      successful,
      failed
    }
  };
}