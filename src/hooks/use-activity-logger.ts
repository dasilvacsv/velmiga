'use client';

import { useSession } from 'next-auth/react';
import { ActivityLogger, ActivityLogOptions, logActivity } from '@/lib/activity-logger';
import { useCallback } from 'react';

export function useActivityLogger() {
  const { data: session } = useSession();

  const log = useCallback(async (options: Omit<ActivityLogOptions, 'userId'>) => {
    if (!session?.user?.id) {
      console.warn('Cannot log activity: user not authenticated');
      return;
    }

    return logActivity({
      ...options,
      userId: session.user.id,
    });
  }, [session?.user?.id]);

  return {
    log,
    logger: {
      caseCreated: (caseId: string, caseName: string) =>
        session?.user?.id && ActivityLogger.caseCreated(caseId, caseName, session.user.id),
      
      caseUpdated: (caseId: string, caseName: string, previousData: string, newData: string) =>
        session?.user?.id && ActivityLogger.caseUpdated(caseId, caseName, previousData, newData, session.user.id),
      
      caseClosed: (caseId: string, caseName: string) =>
        session?.user?.id && ActivityLogger.caseClosed(caseId, caseName, session.user.id),
      
      taskAssigned: (taskId: string, taskDescription: string, assignedToName: string) =>
        session?.user?.id && ActivityLogger.taskAssigned(taskId, taskDescription, assignedToName, session.user.id),
      
      documentUploaded: (documentId: string, fileName: string, caseId: string) =>
        session?.user?.id && ActivityLogger.documentUploaded(documentId, fileName, caseId, session.user.id),
      
      clientAdded: (clientId: string, clientName: string) =>
        session?.user?.id && ActivityLogger.clientAdded(clientId, clientName, session.user.id),
      
      userAssigned: (targetUserId: string, userName: string, role: string, entityId: string, entityType: string) =>
        session?.user?.id && ActivityLogger.userAssigned(targetUserId, userName, role, entityId, entityType, session.user.id),
    }
  };
}