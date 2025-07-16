"use server"
import { db } from "@/db";
import { and, eq, sql, count, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { technicians, technicianAssignments, users, serviceOrders } from "@/db/schema";

export interface TechnicianFormData {
  name: string;
  phone: string | null;
  is_active: boolean;
}

export async function getTechnicians() {
  try {
    // Using explicit column selection to ensure all fields are retrieved
    const data = await db.select({
      id: technicians.id,
      name: technicians.name,
      phone: technicians.phone,
      is_active: technicians.is_active,
      createdAt: technicians.createdAt,
      updatedAt: technicians.updatedAt,
    })
    .from(technicians)
    .orderBy(technicians.name);
    
    return { data };
  } catch (error) {
    console.error("Error fetching technicians:", error);
    return { error: "Failed to fetch technicians" };
  }
}

export async function getTechnicianById(id: string) {
  try {
    // Using explicit column selection to ensure all fields are retrieved
    const technicianData = await db.select({
      id: technicians.id,
      name: technicians.name,
      phone: technicians.phone,
      is_active: technicians.is_active,
      createdAt: technicians.createdAt,
      updatedAt: technicians.updatedAt,
    })
    .from(technicians)
    .where(eq(technicians.id, id));
    
    if (!technicianData.length) {
      return { 
        success: false, 
        error: "Técnico no encontrado" 
      };
    }
    
    // Get assignments for this technician
    const assignments = await db.query.technicianAssignments.findMany({
      where: eq(technicianAssignments.technicianId, id),
      with: {
        serviceOrder: {
          with: {
            client: true,
          }
        },
        createdByUser: {
          columns: {
            id: true,
            fullName: true,
          }
        }
      },
      orderBy: [sql`"assigned_date" DESC`],
    });
    
    // Get warranty orders assigned to this technician
    const warrantyOrders = await db.query.technicianAssignments.findMany({
      where: and(
        eq(technicianAssignments.technicianId, id),
        eq(technicianAssignments.isActive, true)
      ),
      with: {
        serviceOrder: {
          where: eq(serviceOrders.status, "GARANTIA_APLICADA"),
          with: {
            client: true,
            appliances: {
              with: {
                clientAppliance: {
                  with: {
                    brand: true,
                    applianceType: true,
                  }
                }
              }
            }
          }
        }
      }
    });
    
    // Filter out any assignments where the service order is null
    const validWarrantyOrders = warrantyOrders
      .filter(assignment => assignment.serviceOrder)
      .map(assignment => assignment.serviceOrder);
    
    // Log successful data retrieval for debugging
    console.log(`Technician data retrieved for ID ${id}: ${technicianData[0].name}`);
    
    return { 
      success: true, 
      data: {
        technician: technicianData[0],
        assignments,
        warrantyOrders: validWarrantyOrders
      }
    };
  } catch (error) {
    console.error("Error fetching technician details:", error);
    return { 
      success: false, 
      error: "Error al obtener los detalles del técnico" 
    };
  }
}

export async function getTechniciansWithWarrantyStats() {
  try {
    // Get all technicians with explicit column selection
    const allTechnicians = await db.select({
      id: technicians.id,
      name: technicians.name,
      phone: technicians.phone,
      is_active: technicians.is_active,
      createdAt: technicians.createdAt,
      updatedAt: technicians.updatedAt,
    })
    .from(technicians)
    .where(eq(technicians.is_active, true))
    .orderBy(technicians.name);
    
    // For each technician, get their warranty orders
    const techniciansWithStats = await Promise.all(
      allTechnicians.map(async (technician) => {
        const warrantyOrders = await db.query.technicianAssignments.findMany({
          where: and(
            eq(technicianAssignments.technicianId, technician.id),
            eq(technicianAssignments.isActive, true)
          ),
          with: {
            serviceOrder: {
              where: eq(serviceOrders.status, "GARANTIA_APLICADA"),
              with: {
                client: true,
                appliances: {
                  with: {
                    clientAppliance: {
                      with: {
                        brand: true,
                        applianceType: true,
                      }
                    }
                  }
                }
              }
            }
          }
        });
        
        // Filter out any assignments where the service order is null
        const validWarrantyOrders = warrantyOrders
          .filter(assignment => assignment.serviceOrder)
          .map(assignment => assignment.serviceOrder);
        
        // Count orders by priority
        const bajaPriority = validWarrantyOrders.filter(order => order.garantiaPrioridad === "BAJA").length;
        const mediaPriority = validWarrantyOrders.filter(order => order.garantiaPrioridad === "MEDIA").length;
        const altaPriority = validWarrantyOrders.filter(order => order.garantiaPrioridad === "ALTA").length;
        
        return {
          ...technician,
          warrantyOrders: validWarrantyOrders,
          warrantyCount: validWarrantyOrders.length,
          priorityStats: {
            baja: bajaPriority,
            media: mediaPriority,
            alta: altaPriority
          }
        };
      })
    );
    
    // Sort technicians by warranty count (descending)
    const sortedTechnicians = techniciansWithStats.sort((a, b) => b.warrantyCount - a.warrantyCount);
    
    return { 
      success: true, 
      data: sortedTechnicians 
    };
  } catch (error) {
    console.error("Error fetching technicians with warranty stats:", error);
    return { 
      success: false, 
      error: "Error al obtener los técnicos con estadísticas de garantías" 
    };
  }
}

export async function createTechnician(formData: TechnicianFormData) {
  try {
    // Validate required fields
    if (!formData.name || formData.name.trim() === "") {
      return { 
        success: false, 
        error: "El nombre del técnico es obligatorio" 
      };
    }
    
    const newTechnician = await db.insert(technicians).values({
      name: formData.name.trim(),
      phone: formData.phone ? formData.phone.trim() : null,
      is_active: formData.is_active,
    })
    .returning();
    
    // Force cache invalidation
    revalidatePath("/tecnicos");
    return { success: true, data: newTechnician[0] };
  } catch (error) {
    console.error("Error creating technician:", error);
    return { 
      success: false, 
      error: "Error al crear el técnico. Por favor, inténtelo de nuevo."
    };
  }
}

export async function updateTechnician(id: string, formData: TechnicianFormData) {
  try {
    // Validate required fields
    if (!formData.name || formData.name.trim() === "") {
      return { 
        success: false, 
        error: "El nombre del técnico es obligatorio" 
      };
    }
    
    const updatedTechnician = await db.update(technicians)
      .set({
        name: formData.name.trim(),
        phone: formData.phone ? formData.phone.trim() : null,
        is_active: formData.is_active,
      })
      .where(eq(technicians.id, id))
      .returning();
    
    if (!updatedTechnician.length) {
      return { 
        success: false, 
        error: "Técnico no encontrado" 
      };
    }
    
    // Force cache invalidation for both list and detail pages
    revalidatePath("/tecnicos");
    revalidatePath(`/tecnicos/${id}`);
    return { success: true, data: updatedTechnician[0] };
  } catch (error) {
    console.error("Error updating technician:", error);
    return { 
      success: false, 
      error: "Error al actualizar el técnico. Por favor, inténtelo de nuevo."
    };
  }
}

export async function deleteTechnician(id: string) {
  try {
    await db.delete(technicians).where(eq(technicians.id, id));
    revalidatePath("/tecnicos");
    return { success: true };
  } catch (error) {
    console.error("Error deleting technician:", error);
    return { 
      success: false, 
      error: "Error al eliminar el técnico. Por favor, inténtelo de nuevo."
    };
  }
}

export async function getActiveTechnicians() {
  try {
    // Using explicit column selection to ensure all fields are retrieved
    const data = await db.select({
      id: technicians.id,
      name: technicians.name,
      phone: technicians.phone,
      is_active: technicians.is_active,
      createdAt: technicians.createdAt,
      updatedAt: technicians.updatedAt,
    })
    .from(technicians)
    .where(eq(technicians.is_active, true))
    .orderBy(technicians.name);
    
    return { success: true, data };
  } catch (error) {
    console.error("Error fetching active technicians:", error);
    return { 
      success: false, 
      error: "Error al obtener los técnicos activos" 
    };
  }
}