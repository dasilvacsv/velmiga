import React from 'react';
import { 
  Calendar, User, Eye, Trash2, Activity, 
  FileText, UserPlus, CheckCircle, Upload,
  Building, UserCheck, Clock, Hash
} from 'lucide-react';
import { MovementWithRelations } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MovementCardProps {
  movement: MovementWithRelations;
  onView: (movement: MovementWithRelations) => void;
  onDelete: (movement: MovementWithRelations) => void;
}

export function MovementCard({ movement, onView, onDelete }: MovementCardProps) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'CASE_CREATED': 
        return { 
          color: 'bg-emerald-500', 
          bgColor: 'bg-emerald-50 border-emerald-200', 
          textColor: 'text-emerald-700',
          icon: FileText,
          label: 'Caso Creado' 
        };
      case 'CASE_UPDATED': 
        return { 
          color: 'bg-blue-500', 
          bgColor: 'bg-blue-50 border-blue-200', 
          textColor: 'text-blue-700',
          icon: Activity,
          label: 'Caso Actualizado' 
        };
      case 'CASE_CLOSED': 
        return { 
          color: 'bg-slate-500', 
          bgColor: 'bg-slate-50 border-slate-200', 
          textColor: 'text-slate-700',
          icon: CheckCircle,
          label: 'Caso Cerrado' 
        };
      case 'TASK_ASSIGNED': 
        return { 
          color: 'bg-purple-500', 
          bgColor: 'bg-purple-50 border-purple-200', 
          textColor: 'text-purple-700',
          icon: UserCheck,
          label: 'Tarea Asignada' 
        };
      case 'DOCUMENT_UPLOADED': 
        return { 
          color: 'bg-orange-500', 
          bgColor: 'bg-orange-50 border-orange-200', 
          textColor: 'text-orange-700',
          icon: Upload,
          label: 'Documento Subido' 
        };
      case 'CLIENT_ADDED': 
        return { 
          color: 'bg-pink-500', 
          bgColor: 'bg-pink-50 border-pink-200', 
          textColor: 'text-pink-700',
          icon: Building,
          label: 'Cliente Agregado' 
        };
      case 'USER_ASSIGNED': 
        return { 
          color: 'bg-cyan-500', 
          bgColor: 'bg-cyan-50 border-cyan-200', 
          textColor: 'text-cyan-700',
          icon: UserPlus,
          label: 'Usuario Asignado' 
        };
      default: 
        return { 
          color: 'bg-gray-500', 
          bgColor: 'bg-gray-50 border-gray-200', 
          textColor: 'text-gray-700',
          icon: Activity,
          label: type 
        };
    }
  };

  const typeConfig = getTypeConfig(movement.type);
  const IconComponent = typeConfig.icon;

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return diffMinutes === 0 ? 'Hace un momento' : `Hace ${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays}d`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evita que el evento de clic se propague al div principal
    onDelete(movement);
  };

  return (
    <div 
      className="group relative bg-white rounded-xl border-2 border-gray-100 hover:border-orange-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={() => onView(movement)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 via-transparent to-amber-50/0 group-hover:from-orange-50/30 group-hover:to-amber-50/30 transition-all duration-500" />
      
      <div className={cn("absolute top-0 left-0 w-1 h-full", typeConfig.color)} />
      
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-2.5 rounded-xl border-2 transition-all duration-300 group-hover:scale-110",
              typeConfig.bgColor
            )}>
              <IconComponent className={cn("h-5 w-5", typeConfig.textColor)} />
            </div>
            <div>
              <Badge 
                variant="secondary" 
                className={cn(
                  "px-3 py-1 text-xs font-semibold border-2 transition-colors duration-300",
                  typeConfig.bgColor,
                  typeConfig.textColor
                )}
              >
                {typeConfig.label}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span title={formatFullDate(new Date(movement.createdAt))}>
              {formatRelativeTime(new Date(movement.createdAt))}
            </span>
          </div>
        </div>

        <h3 
          className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors duration-300"
        >
          {movement.title}
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
          {movement.description}
        </p>

        {movement.entityType && movement.entityId && (
          <div className="mb-4">
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
              <Hash className="h-3 w-3 mr-1.5" />
              <span className="capitalize">{movement.entityType}</span>
              <span className="mx-1">•</span>
              <span className="font-mono text-gray-500">
                {movement.entityId.slice(0, 8)}...
              </span>
            </div>
          </div>
        )}

        {(movement.previousValue || movement.newValue) && (
          <div className="mb-4">
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              <Activity className="h-3 w-3 mr-1.5" />
              Incluye cambios de datos
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate max-w-[120px]">
              {movement.createdByUser 
                ? `${movement.createdByUser.firstName} ${movement.createdByUser.lastName}` 
                : 'Sistema'
              }
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 group-hover:shadow-sm"
            >
              <Eye className="h-3 w-3 mr-1.5" />
              Ver
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              className="h-8 px-3 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
            >
              <Trash2 className="h-3 w-3 mr-1.5" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 rounded-xl ring-1 ring-black/5 group-hover:ring-orange-200 transition-all duration-300 pointer-events-none" />
    </div>
  );
}