'use client';

import React, { useState } from 'react';
import { Calendar, User, Clock, MoreVertical, CheckSquare } from 'lucide-react';
import { TaskWithRelations } from '@/lib/types';
import { formatDate, getPriorityColor, getStatusColor } from '@/lib/utils';
import { updateTaskStatus } from '@/features/gestion/actions';

interface TaskCardProps {
  task: TaskWithRelations;
}

export function TaskCard({ task }: TaskCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: 'PENDIENTE' | 'EN_PROGRESO' | 'COMPLETADA') => {
    setIsUpdating(true);
    try {
      await updateTaskStatus(task.id, newStatus);
      // Optionally refresh the page or update local state
      window.location.reload();
    } catch (error) {
      console.error('Error updating task status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => {
              const nextStatus = task.status === 'PENDIENTE' ? 'EN_PROGRESO' : 
                               task.status === 'EN_PROGRESO' ? 'COMPLETADA' : 'PENDIENTE';
              handleStatusChange(nextStatus);
            }}
            disabled={isUpdating}
            className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors disabled:opacity-50"
          >
            <CheckSquare className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 leading-snug">
              {task.description}
            </p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 transition-colors">
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>

      {/* Case Info */}
      {task.case && (
        <div className="text-xs text-slate-600 mb-3 font-medium">
          Caso: {task.case.caseName}
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-2">
        {task.dueDate && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="h-3 w-3" />
            <span>Vence: {formatDate(task.dueDate)}</span>
          </div>
        )}
        
        {task.assignedTo && (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <User className="h-3 w-3" />
            <span>{task.assignedTo.firstName} {task.assignedTo.lastName}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
        
        {task.dueDate && (
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
          </div>
        )}
      </div>
    </div>
  );
}