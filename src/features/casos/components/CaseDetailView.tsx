'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Users, Trash2, MessageSquare, Clock, User, Calendar, CheckCircle } from 'lucide-react';
import { CaseWithRelations, Client, User as UserType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { CaseDetailModal } from './CaseDetailModal';
import { CaseForm } from './CaseForm';
import { TeamManagementModal } from './TeamManagementModal';
import { 
  updateCase, 
  deleteCase, 
  assignTeamMember, 
  removeTeamMember 
} from '@/features/casos/actions';
import { useToast } from '@/hooks/use-toast';
import { formatDateTimeEcuador } from '@/lib/utils';

interface CaseDetailViewProps {
  case_: CaseWithRelations;
  clients: Client[];
  users: UserType[];
}

// **FIX: Función para obtener el título de la tarea**
const getTaskTitle = (task: any) => {
  if (task.title && task.title.trim() !== '' && task.title !== 'Tarea sin título') {
    return task.title;
  }
  if (task.description) {
    return task.description.length > 50 
      ? `${task.description.substring(0, 50)}...`
      : task.description;
  }
  return 'Tarea sin título';
};

// **FIX: Función para formatear el contenido de movimientos**
const formatMovementContent = (movement: any) => {
  // Si es un movimiento de tarea y tenemos información relacionada
  if (movement.entityType === 'task' && movement.relatedTask) {
    const task = movement.relatedTask;
    const taskTitle = getTaskTitle(task);
    
    switch (movement.type) {
      case 'TASK_CREATED':
        return {
          title: `Tarea creada: "${taskTitle}"`,
          description: `Descripción: ${task.description || 'Sin descripción'}`
        };
      case 'TASK_STATUS_CHANGED':
        try {
          const previousValue = typeof movement.previousValue === 'string' 
            ? JSON.parse(movement.previousValue) 
            : movement.previousValue;
          const newValue = typeof movement.newValue === 'string' 
            ? JSON.parse(movement.newValue) 
            : movement.newValue;
          
          const statusLabels = {
            'ACTIVO': 'Activo',
            'EN_REVISION': 'En Revisión',
            'APROBADA': 'Aprobada'
          };
          
          return {
            title: `Estado actualizado: "${taskTitle}"`,
            description: `Cambió de "${statusLabels[previousValue?.status] || previousValue?.status}" a "${statusLabels[newValue?.status] || newValue?.status}"`
          };
        } catch (error) {
          return {
            title: `Estado actualizado: "${taskTitle}"`,
            description: movement.description || 'Estado de tarea actualizado'
          };
        }
      case 'TASK_COMMENT_ADDED':
        return {
          title: `Comentario añadido: "${taskTitle}"`,
          description: `Se añadió un comentario a la tarea`
        };
      default:
        return {
          title: movement.title || `Actividad en tarea: "${taskTitle}"`,
          description: movement.description || 'Actividad en tarea'
        };
    }
  }
  
  // Si es un movimiento de evento y tenemos información relacionada
  if (movement.entityType === 'event' && movement.relatedEvent) {
    const event = movement.relatedEvent;
    return {
      title: movement.title || `Evento: "${event.title}"`,
      description: movement.description || `Actividad relacionada con el evento "${event.title}"`
    };
  }
  
  // Para otros tipos de movimientos, usar el formato original
  return {
    title: movement.title,
    description: movement.description
  };
};

export const CaseDetailView: React.FC<CaseDetailViewProps> = ({
  case_: initialCase,
  clients,
  users
}) => {
  const router = useRouter();
  const { toast } = useToast();
  const [case_, setCase] = useState(initialCase);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEdit = () => {
    setShowEditForm(true);
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Está seguro de eliminar el caso "${case_.caseName}"?`)) {
      try {
        setLoading(true);
        await deleteCase(case_.id);
        toast({
          title: "Caso eliminado",
          description: `El caso "${case_.caseName}" ha sido eliminado`,
          variant: "default"
        });
        router.push('/casos');
      } catch (error) {
        console.error('Error deleting case:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el caso",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleManageTeam = () => {
    setShowTeamModal(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setLoading(true);
      await updateCase(case_.id, data);
      
      // Refresh case data
      window.location.reload();
      
      toast({
        title: "Caso actualizado",
        description: "Los cambios han sido guardados correctamente",
        variant: "default"
      });
      setShowEditForm(false);
    } catch (error) {
      console.error('Error updating case:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el caso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeamMember = async (userId: string, role: string) => {
    try {
      await assignTeamMember(case_.id, userId, role);
      window.location.reload();
    } catch (error) {
      throw error;
    }
  };

  const handleRemoveTeamMember = async (userId: string) => {
    try {
      await removeTeamMember(case_.id, userId);
      window.location.reload();
    } catch (error) {
      throw error;
    }
  };

  const handlePartesUpdated = (updatedCase: CaseWithRelations) => {
    setCase(updatedCase);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50">
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        <CaseDetailModal
          case_={case_}
          onClose={() => router.push('/casos')}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onManageTeam={handleManageTeam}
          onPartesUpdated={handlePartesUpdated}
        />

        {showEditForm && (
          <CaseForm
            case_={case_}
            clients={clients}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowEditForm(false)}
            loading={loading}
          />
        )}

        {showTeamModal && (
          <TeamManagementModal
            case_={case_}
            availableUsers={users}
            onClose={() => setShowTeamModal(false)}
            onAddMember={handleAddTeamMember}
            onRemoveMember={handleRemoveTeamMember}
          />
        )}
      </div>
    </div>
  );
};