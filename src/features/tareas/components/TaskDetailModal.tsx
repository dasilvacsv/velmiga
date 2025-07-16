import React, { useState, useEffect } from 'react';
import { 
    TaskWithRelations,
} from '@/lib/types';
import { 
    X, Calendar, User as UserIcon, Clock, Hash,
    Edit, Trash2, Plus, AlertCircle, CheckSquare, MessageSquare,
    Send, Building, Scale, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, getInitials, getPriorityColor, getTaskStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { getTaskById } from '@/features/tareas/actions';

interface TaskDetailModalProps {
  task: TaskWithRelations;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (taskId: string, status: 'ACTIVO' | 'EN_REVISION' | 'APROBADA') => Promise<void>;
  onAddComment: (taskId: string, comment: string) => Promise<void>;
}

const statusConfig = {
  ACTIVO: { 
    label: 'Activo', 
    icon: <CheckSquare className="w-5 h-5" />, 
    className: "bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100",
    gradient: "from-blue-500 to-indigo-500"
  },
  EN_REVISION: { 
    label: 'En Revisión', 
    icon: <Clock className="w-5 h-5" />, 
    className: "bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100",
    gradient: "from-amber-500 to-yellow-500"
  },
  APROBADA: { 
    label: 'Aprobada', 
    icon: <CheckSquare className="w-5 h-5" />, 
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100",
    gradient: "from-emerald-500 to-green-500"
  }
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ 
  task: initialTask, 
  onClose, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onAddComment 
}) => {
  const [task, setTask] = useState(initialTask);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  
  const status = statusConfig[task.status];
  const assignedTo = task.assignedTo;
  const case_ = task.case;
  const comments = task.comments || [];

  // Function to refresh task data
  const refreshTaskData = async () => {
    try {
      const updatedTask = await getTaskById(task.id);
      if (updatedTask) {
        setTask(updatedTask);
      }
    } catch (error) {
      console.error('Error refreshing task data:', error);
    }
  };

  const handleStatusChange = async (newStatus: 'ACTIVO' | 'EN_REVISION' | 'APROBADA') => {
    try {
      setChangingStatus(true);
      await onStatusChange(task.id, newStatus);
      
      // Update local state immediately for instant feedback
      setTask(prev => ({ ...prev, status: newStatus }));
      
      // Refresh data from server
      await refreshTaskData();
    } catch (error) {
      console.error('Error changing status:', error);
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setAddingComment(true);
      await onAddComment(task.id, newComment.trim());
      setNewComment('');
      
      // Refresh data from server to get the new comment
      await refreshTaskData();
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setAddingComment(false);
    }
  };

  const getNextStatus = () => {
    switch (task.status) {
      case 'ACTIVO':
        return 'EN_REVISION';
      case 'EN_REVISION':
        return 'APROBADA';
      case 'APROBADA':
        return 'ACTIVO';
      default:
        return 'ACTIVO';
    }
  };

  const getNextStatusLabel = () => {
    switch (task.status) {
      case 'ACTIVO':
        return 'Marcar En Revisión';
      case 'EN_REVISION':
        return 'Aprobar Tarea';
      case 'APROBADA':
        return 'Reactivar Tarea';
      default:
        return 'Cambiar Estado';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-500">
      <div className="bg-white dark:bg-gray-950 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-200/50 dark:border-gray-800 relative">
        
        {/* Decorative gradient bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${status.gradient}`} />
        
        <header className="relative bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-gray-950 dark:via-emerald-900/10 dark:to-gray-950 p-8 border-b border-gray-200/50 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6 min-w-0 flex-1">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${status.gradient} flex items-center justify-center text-white shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300`}>
                <CheckSquare className="w-8 h-8" />
              </div>
              <div className="min-w-0 flex-1">
                {/* Mostrar título si existe, sino descripción */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight font-raleway">
                  {task.title || task.description}
                </h1>
                
                {/* Si tiene título, mostrar descripción debajo */}
                {task.title && task.description && (
                  <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-4 flex-wrap">
                  <span className={cn(
                    "inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold border-2 shadow-sm",
                    status.className
                  )}>
                    {status.icon}
                    <span className="ml-2">{status.label}</span>
                  </span>
                  <span className={cn(
                    "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2",
                    getPriorityColor(task.priority)
                  )}>
                    {task.priority}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleStatusChange(getNextStatus())}
                disabled={changingStatus}
                className="group hover:border-emerald-300 hover:bg-emerald-50 transition-all duration-300"
              >
                {changingStatus ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Cambiando...
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-2 group-hover:text-emerald-600" /> 
                    {getNextStatusLabel()}
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={onEdit} className="group hover:border-blue-300 hover:bg-blue-50 transition-all duration-300">
                <Edit className="h-4 w-4 mr-2 group-hover:text-blue-600" /> 
                Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete} className="hover:scale-105 transition-transform duration-200">
                <Trash2 className="h-4 w-4 mr-2" /> 
                Eliminar
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            
            {/* Task Information Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Case Information */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-100">
                <h3 className="font-bold text-orange-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Scale className="w-5 h-5" />
                  Caso Asociado
                </h3>
                {case_ ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg">
                        {case_.caseName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">{case_.caseName}</p>
                        {case_.caseNumber && (
                          <p className="text-sm text-gray-600 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                            {case_.caseNumber}
                          </p>
                        )}
                      </div>
                    </div>
                    {case_.client && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {case_.client.clientType === 'EMPRESA' ? (
                          <Building className="w-4 h-4" />
                        ) : (
                          <UserIcon className="w-4 h-4" />
                        )}
                        <span>Cliente: {case_.client.name}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="w-12 h-12 text-orange-300 mx-auto mb-2" />
                    <p className="text-orange-600 font-medium">Sin caso asociado</p>
                  </div>
                )}
              </div>

              {/* Assigned Person */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <h3 className="font-bold text-blue-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Persona Asignada
                </h3>
                {assignedTo ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg">
                        {getInitials(`${assignedTo.firstName} ${assignedTo.lastName}`)}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-gray-900">
                          {assignedTo.firstName} {assignedTo.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{assignedTo.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span>Rol: {assignedTo.role}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="w-12 h-12 text-blue-300 mx-auto mb-2" />
                    <p className="text-blue-600 font-medium">Sin persona asignada</p>
                  </div>
                )}
              </div>
            </section>

            {/* Dates Information */}
            <section className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-6 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-500" />
                Fechas Importantes
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-500 flex items-center justify-center">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Fecha de Asignación</p>
                    <p className="text-base font-medium text-gray-900">{formatDate(task.fechaDeAsignacion)}</p>
                  </div>
                </div>
                
                {task.fechaDeVencimiento && (
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-500 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 mb-1">Fecha de Vencimiento</p>
                      <p className={`text-base font-medium ${
                        new Date(task.fechaDeVencimiento) < new Date() && task.status !== 'APROBADA' 
                          ? 'text-red-600' 
                          : 'text-gray-900'
                      }`}>
                        {formatDate(task.fechaDeVencimiento)}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-500 mb-1">Última Actualización</p>
                    <p className="text-base font-medium text-gray-900">{formatDate(task.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Comments Section */}
            <section className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-500" />
                  Comentarios ({comments.length})
                </h3>
              </div>
              
              {/* Add Comment */}
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Añadir un comentario sobre el progreso de la tarea..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || addingComment}
                    className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white self-end"
                  >
                    {addingComment ? (
                      <Clock className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Comments List */}
              {comments.length > 0 ? (
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {comment.createdByUser ? getInitials(`${comment.createdByUser.firstName} ${comment.createdByUser.lastName}`) : '?'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {comment.createdByUser ? `${comment.createdByUser.firstName} ${comment.createdByUser.lastName}` : 'Usuario desconocido'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">Sin comentarios</p>
                  <p className="text-gray-400 text-sm">Sé el primero en comentar sobre esta tarea</p>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};