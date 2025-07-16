import React from 'react';
import { 
  X, Calendar, User, Activity, FileText, UserPlus, 
  CheckCircle, Upload, Building, UserCheck, ArrowRight,
  Clock, Hash, Tag, Edit, Database, AlertTriangle
} from 'lucide-react';
import { MovementWithRelations } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// Componente auxiliar para mostrar JSON formateado de forma segura
const JsonViewer = ({ jsonString }: { jsonString?: string | null }) => {
  if (!jsonString) {
    return null;
  }
  try {
    const parsedJson = JSON.parse(jsonString);
    const formattedJson = JSON.stringify(parsedJson, null, 2); // 2 espacios de indentación
    return (
      <pre className="text-sm whitespace-pre-wrap font-mono overflow-x-auto">
        {formattedJson}
      </pre>
    );
  } catch (error) {
    // Si el string no es un JSON válido, lo mostramos como texto plano para no romper la UI
    return (
      <div className="flex items-center space-x-2 text-yellow-700">
        <AlertTriangle className="h-4 w-4"/>
        <pre className="text-sm whitespace-pre-wrap font-mono overflow-x-auto">
          {jsonString}
        </pre>
      </div>
    );
  }
};


interface MovementDetailModalProps {
  movement: MovementWithRelations;
  onClose: () => void;
  onDelete: () => void;
}

export function MovementDetailModal({ movement, onClose, onDelete }: MovementDetailModalProps) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'CASE_CREATED': 
        return { 
          color: 'bg-emerald-500', 
          bgColor: 'bg-emerald-50 border-emerald-200', 
          textColor: 'text-emerald-700',
          gradientFrom: 'from-emerald-500',
          gradientTo: 'to-emerald-600',
          icon: FileText,
          label: 'Caso Creado' 
        };
      case 'CASE_UPDATED': 
        return { 
          color: 'bg-blue-500', 
          bgColor: 'bg-blue-50 border-blue-200', 
          textColor: 'text-blue-700',
          gradientFrom: 'from-blue-500',
          gradientTo: 'to-blue-600',
          icon: Activity,
          label: 'Caso Actualizado' 
        };
      case 'CASE_CLOSED': 
        return { 
          color: 'bg-slate-500', 
          bgColor: 'bg-slate-50 border-slate-200', 
          textColor: 'text-slate-700',
          gradientFrom: 'from-slate-500',
          gradientTo: 'to-slate-600',
          icon: CheckCircle,
          label: 'Caso Cerrado' 
        };
      case 'TASK_ASSIGNED': 
        return { 
          color: 'bg-purple-500', 
          bgColor: 'bg-purple-50 border-purple-200', 
          textColor: 'text-purple-700',
          gradientFrom: 'from-purple-500',
          gradientTo: 'to-purple-600',
          icon: UserCheck,
          label: 'Tarea Asignada' 
        };
      case 'DOCUMENT_UPLOADED': 
        return { 
          color: 'bg-orange-500', 
          bgColor: 'bg-orange-50 border-orange-200', 
          textColor: 'text-orange-700',
          gradientFrom: 'from-orange-500',
          gradientTo: 'to-orange-600',
          icon: Upload,
          label: 'Documento Subido' 
        };
      case 'CLIENT_ADDED': 
        return { 
          color: 'bg-pink-500', 
          bgColor: 'bg-pink-50 border-pink-200', 
          textColor: 'text-pink-700',
          gradientFrom: 'from-pink-500',
          gradientTo: 'to-pink-600',
          icon: Building,
          label: 'Cliente Agregado' 
        };
      case 'USER_ASSIGNED': 
        return { 
          color: 'bg-cyan-500', 
          bgColor: 'bg-cyan-50 border-cyan-200', 
          textColor: 'text-cyan-700',
          gradientFrom: 'from-cyan-500',
          gradientTo: 'to-cyan-600',
          icon: UserPlus,
          label: 'Usuario Asignado' 
        };
      default: 
        return { 
          color: 'bg-gray-500', 
          bgColor: 'bg-gray-50 border-gray-200', 
          textColor: 'text-gray-700',
          gradientFrom: 'from-gray-500',
          gradientTo: 'to-gray-600',
          icon: Activity,
          label: type 
        };
    }
  };

  const typeConfig = getTypeConfig(movement.type);
  const IconComponent = typeConfig.icon;

  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-300"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-8 duration-300">
        
        <div className={cn(
          "bg-gradient-to-r px-6 py-6 flex items-center justify-between text-white",
          typeConfig.gradientFrom,
          typeConfig.gradientTo
        )}>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <Badge 
                variant="secondary" 
                className="bg-white/20 text-white border-white/30 mb-2"
              >
                {typeConfig.label}
              </Badge>
              <h1 className="text-xl font-bold">
                Detalle del Movimiento
              </h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-10 w-10 p-0 rounded-xl"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
              {movement.title}
            </h2>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span>{formatFullDate(new Date(movement.createdAt))}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>
                  {movement.createdByUser 
                    ? `${movement.createdByUser.firstName} ${movement.createdByUser.lastName}` 
                    : 'Sistema Automático'
                  }
                </span>
              </div>
              {movement.createdByUser?.email && (
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4" />
                  <span className="text-blue-600">{movement.createdByUser.email}</span>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Edit className="h-5 w-5 mr-2 text-gray-500" />
                Descripción
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {movement.description}
                </p>
              </div>
            </div>

            {movement.entityType && movement.entityId && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Database className="h-5 w-5 mr-2 text-gray-500" />
                  Entidad Relacionada
                </h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">Tipo de Entidad</p>
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-900 font-semibold capitalize">
                          {movement.entityType}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700 mb-1">Identificador</p>
                      <div className="font-mono text-sm bg-blue-100 px-3 py-1 rounded-lg text-blue-800 break-all">
                        {movement.entityId}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {(movement.previousValue || movement.newValue) && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-gray-500" />
                  Cambios Realizados
                </h3>
                <div className="space-y-4">
                  {movement.previousValue && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                        Valor Anterior
                      </p>
                      <div className="bg-red-50/50 border-l-4 border-red-400 p-4 rounded-r-xl text-red-800">
                        <JsonViewer jsonString={movement.previousValue} />
                      </div>
                    </div>
                  )}
                  
                  {movement.previousValue && movement.newValue && (
                    <div className="flex justify-center py-2">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <div className="w-8 h-px bg-gray-300"></div>
                        <ArrowRight className="h-5 w-5" />
                        <div className="w-8 h-px bg-gray-300"></div>
                      </div>
                    </div>
                  )}
                  
                  {movement.newValue && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        Valor Nuevo
                      </p>
                      <div className="bg-green-50/50 border-l-4 border-green-400 p-4 rounded-r-xl text-green-800">
                        <JsonViewer jsonString={movement.newValue} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Información Técnica
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">ID del Movimiento:</span>
                    <div className="font-mono text-gray-600 mt-1 break-all">
                      {movement.id}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Fecha de Creación:</span>
                    <div className="text-gray-600 mt-1">
                      {new Date(movement.createdAt).toISOString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-t border-gray-200 mt-auto">
          <div className="text-sm text-gray-500">
            Movimiento registrado automáticamente por el sistema
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="hover:bg-gray-100"
            >
              Cerrar
            </Button>
            <Button
              variant="outline"
              onClick={onDelete}
              className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
            >
              <X className="h-4 w-4 mr-2" />
              Eliminar Movimiento
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}