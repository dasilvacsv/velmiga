'use server';

import { createMovement } from '@/features/movimientos/actions';
import { Movement } from '@/lib/types';

export interface ActivityLogOptions {
  type: Movement['type'];
  title: string;
  description: string;
  entityId?: string;
  entityType?: string;
  previousValue?: string;
  newValue?: string;
  userId: string;
}

/**
 * Central logging function for all system activities
 */
export async function logActivity(options: ActivityLogOptions): Promise<void> {
  try {
    await createMovement({
      title: options.title,
      description: options.description,
      type: options.type,
      entityId: options.entityId,
      entityType: options.entityType,
      previousValue: options.previousValue,
      newValue: options.newValue,
      createdBy: options.userId,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to avoid breaking main operations
  }
}

/**
 * Pre-configured logging functions for common activities
 */
export const ActivityLogger = {
  // Case-related activities
  caseCreated: (caseId: string, caseName: string, userId: string) =>
    logActivity({
      type: 'CASE_CREATED',
      title: 'Nuevo caso creado',
      description: `Se creó el caso "${caseName}"`,
      entityId: caseId,
      entityType: 'case',
      userId,
    }),

  caseUpdated: (caseId: string, caseName: string, previousData: string, newData: string, userId: string) =>
    logActivity({
      type: 'CASE_UPDATED',
      title: 'Caso actualizado',
      description: `Se actualizó el caso "${caseName}"`,
      entityId: caseId,
      entityType: 'case',
      previousValue: previousData,
      newValue: newData,
      userId,
    }),

  caseClosed: (caseId: string, caseName: string, userId: string) =>
    logActivity({
      type: 'CASE_CLOSED',
      title: 'Caso cerrado',
      description: `Se cerró el caso "${caseName}"`,
      entityId: caseId,
      entityType: 'case',
      userId,
    }),

  // Task-related activities
  taskAssigned: (taskId: string, taskDescription: string, assignedToName: string, userId: string) =>
    logActivity({
      type: 'TASK_ASSIGNED',
      title: 'Tarea asignada',
      description: `Se asignó la tarea "${taskDescription}" a ${assignedToName}`,
      entityId: taskId,
      entityType: 'task',
      userId,
    }),

  // Document-related activities
  documentUploaded: (documentId: string, fileName: string, caseId: string, userId: string) =>
    logActivity({
      type: 'DOCUMENT_UPLOADED',
      title: 'Documento subido',
      description: `Se subió el documento "${fileName}"`,
      entityId: documentId,
      entityType: 'document',
      userId,
    }),

  // Client-related activities
  clientAdded: (clientId: string, clientName: string, userId: string) =>
    logActivity({
      type: 'CLIENT_ADDED',
      title: 'Cliente agregado',
      description: `Se agregó el cliente "${clientName}"`,
      entityId: clientId,
      entityType: 'client',
      userId,
    }),

  // User-related activities
  userAssigned: (targetUserId: string, userName: string, role: string, entityId: string, entityType: string, currentUserId: string) =>
    logActivity({
      type: 'USER_ASSIGNED',
      title: 'Usuario asignado',
      description: `Se asignó ${userName} como ${role}`,
      entityId: entityId,
      entityType: entityType,
      userId: currentUserId,
    }),
};