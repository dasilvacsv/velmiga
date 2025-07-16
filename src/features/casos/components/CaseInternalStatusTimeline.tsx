"use client"

import React, { useState } from 'react';
import {
  History, Clock, User, Calendar, Edit, Save, X, Plus, Trash2, Check, ChevronRight, CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDateTimeEcuador, getInitials, getEcuadorDate } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale'; // Importación clave para el idioma
import {
  addInternalStatusToHistory,
  updateInternalStatusHistoryEntry,
  deleteInternalStatusHistoryEntry
} from '@/features/casos/actions';

interface CaseInternalStatusTimelineProps {
  caseId: string;
  history: any[];
  onHistoryUpdate: () => void;
  mode?: 'full' | 'add-only';
}

interface StatusEntry {
  id?: string;
  status: string;
  statusDate: Date;
  notes?: string;
  isManualDate?: boolean;
  createdByUser?: any;
}

export const CaseInternalStatusTimeline: React.FC<CaseInternalStatusTimelineProps> = ({
  caseId,
  history,
  onHistoryUpdate,
  mode = 'full'
}) => {
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState({
    status: '',
    statusDate: getEcuadorDate(),
    notes: ''
  });
  const [editingData, setEditingData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddStatus = async () => {
    if (!newStatus.status.trim()) {
      toast({
        title: "Error",
        description: "El estado es obligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await addInternalStatusToHistory(
        caseId,
        newStatus.status,
        newStatus.statusDate,
        newStatus.notes || undefined
      );
      
      setNewStatus({
        status: '',
        statusDate: getEcuadorDate(),
        notes: ''
      });
      setIsAddingStatus(false);
      onHistoryUpdate();
      
      toast({
        title: "Estado agregado",
        description: "El estado interno ha sido registrado en el historial",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el estado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditEntry = (entry: any) => {
    setEditingEntry(entry.id);
    setEditingData({
      status: entry.status,
      statusDate: new Date(entry.statusDate),
      notes: entry.notes || ''
    });
  };

  const handleUpdateEntry = async () => {
    if (!editingData.status.trim()) {
      toast({
        title: "Error",
        description: "El estado es obligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await updateInternalStatusHistoryEntry(editingEntry!, {
        status: editingData.status,
        statusDate: editingData.statusDate,
        notes: editingData.notes || undefined
      });
      
      setEditingEntry(null);
      setEditingData({});
      onHistoryUpdate();
      
      toast({
        title: "Estado actualizado",
        description: "El registro ha sido actualizado",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('¿Está seguro de eliminar este registro del historial?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteInternalStatusHistoryEntry(entryId);
      onHistoryUpdate();
      
      toast({
        title: "Registro eliminado",
        description: "El registro ha sido eliminado del historial",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Si es modo add-only, solo mostrar el botón para agregar
  if (mode === 'add-only') {
    return (
      <>
        <Button
          onClick={() => setIsAddingStatus(true)}
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar Estado
        </Button>

        {/* Modal para agregar nuevo estado */}
        {isAddingStatus && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agregar Nuevo Estado Interno</h3>
                  <Button variant="ghost" size="icon" onClick={() => setIsAddingStatus(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={newStatus.status}
                    onChange={(e) => setNewStatus(prev => ({ ...prev, status: e.target.value }))}
                    placeholder="Ej: Sacamos las copias, Hay que denunciarlo"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha y Hora
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newStatus.statusDate ? format(newStatus.statusDate, "PPP 'a las' HH:mm", { locale: es }) : <span>Selecciona fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    {/* 👇 CAMBIO: Popover más pequeño y con padding ajustado */}
                    <PopoverContent className="w-auto p-0 scale-95 origin-top-left" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={newStatus.statusDate}
                        onSelect={(date) => {
                          if (date) {
                            const currentTime = newStatus.statusDate;
                            const newDate = new Date(date);
                            newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
                            setNewStatus(prev => ({ ...prev, statusDate: newDate }));
                          }
                        }}
                        initialFocus
                        locale={es} // ✨ CAMBIO: Calendario en español
                      />
                      <div className="p-2 border-t"> {/* 👇 CAMBIO: Padding reducido */}
                        <div className="flex items-center space-x-2">
                          <Input
                            type="time"
                            value={format(newStatus.statusDate, "HH:mm")}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(newStatus.statusDate);
                              newDate.setHours(parseInt(hours), parseInt(minutes));
                              setNewStatus(prev => ({ ...prev, statusDate: newDate }));
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas (opcional)
                  </label>
                  <Textarea
                    value={newStatus.notes}
                    onChange={(e) => setNewStatus(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Información adicional sobre este cambio de estado..."
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-6 pt-0">
                <Button
                  onClick={handleAddStatus}
                  disabled={loading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar Estado'}
                </Button>
                <Button
                  onClick={() => setIsAddingStatus(false)}
                  variant="outline"
                  disabled={loading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Modo completo - mostrar todo el componente
  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900 dark:to-gray-900 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
            <History className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Historial de Estado Interno
          </h3>
          <Badge variant="secondary" className="text-sm bg-blue-100 text-blue-700">
            {history.length} registro{history.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <Button
          onClick={() => setIsAddingStatus(true)}
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Agregar Estado
        </Button>
      </div>

      {/* Formulario para agregar nuevo estado */}
      {isAddingStatus && (
        <div className="mb-6 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Agregar Nuevo Estado</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estado <span className="text-red-500">*</span>
              </label>
              <Input
                value={newStatus.status}
                onChange={(e) => setNewStatus(prev => ({ ...prev, status: e.target.value }))}
                placeholder="Ej: Sacamos las copias, Hay que denunciarlo"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha y Hora
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newStatus.statusDate ? format(newStatus.statusDate, "PPP 'a las' HH:mm", { locale: es }) : <span>Selecciona fecha</span>}
                  </Button>
                </PopoverTrigger>
                 {/* 👇 CAMBIO: Popover más pequeño y con padding ajustado */}
                <PopoverContent className="w-auto p-0 scale-95 origin-top-left" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={newStatus.statusDate}
                    onSelect={(date) => {
                      if (date) {
                        const currentTime = newStatus.statusDate;
                        const newDate = new Date(date);
                        newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
                        setNewStatus(prev => ({ ...prev, statusDate: newDate }));
                      }
                    }}
                    initialFocus
                    locale={es} // ✨ CAMBIO: Calendario en español
                  />
                  <div className="p-2 border-t"> {/* 👇 CAMBIO: Padding reducido */}
                    <div className="flex items-center space-x-2">
                      <Input
                        type="time"
                        value={format(newStatus.statusDate, "HH:mm")}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDate = new Date(newStatus.statusDate);
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                          setNewStatus(prev => ({ ...prev, statusDate: newDate }));
                        }}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas (opcional)
              </label>
              <Textarea
                value={newStatus.notes}
                onChange={(e) => setNewStatus(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Información adicional sobre este cambio de estado..."
                rows={3}
                className="w-full resize-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={handleAddStatus}
              disabled={loading}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              <Save className="h-4 w-4 mr-1" />
              Guardar
            </Button>
            <Button
              onClick={() => setIsAddingStatus(false)}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <History className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="font-medium">Sin historial de estado interno</p>
            <p className="text-sm">Agrega el primer estado para comenzar el seguimiento</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-indigo-300 to-purple-300"></div>
            
            {history.map((entry, index) => (
              <div key={entry.id} className="relative flex items-start gap-4 pb-6">
                <div className="relative z-10 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full"></div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {editingEntry === entry.id ? (
                    /* Modo edición */
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 p-4 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estado <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={editingData.status}
                            onChange={(e) => setEditingData(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fecha y Hora
                          </label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {editingData.statusDate ? format(editingData.statusDate, "PPP 'a las' HH:mm", { locale: es }) : <span>Selecciona fecha</span>}
                              </Button>
                            </PopoverTrigger>
                             {/* 👇 CAMBIO: Popover más pequeño y con padding ajustado */}
                            <PopoverContent className="w-auto p-0 scale-95 origin-top-left" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={editingData.statusDate}
                                onSelect={(date) => {
                                  if (date) {
                                    const currentTime = editingData.statusDate;
                                    const newDate = new Date(date);
                                    newDate.setHours(currentTime.getHours(), currentTime.getMinutes());
                                    setEditingData(prev => ({ ...prev, statusDate: newDate }));
                                  }
                                }}
                                initialFocus
                                locale={es} // ✨ CAMBIO: Calendario en español
                              />
                              <div className="p-2 border-t"> {/* 👇 CAMBIO: Padding reducido */}
                                <div className="flex items-center space-x-2">
                                  <Input
                                    type="time"
                                    value={format(editingData.statusDate, "HH:mm")}
                                    onChange={(e) => {
                                      const [hours, minutes] = e.target.value.split(':');
                                      const newDate = new Date(editingData.statusDate);
                                      newDate.setHours(parseInt(hours), parseInt(minutes));
                                      setEditingData(prev => ({ ...prev, statusDate: newDate }));
                                    }}
                                    className="flex-1"
                                  />
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Notas
                          </label>
                          <Textarea
                            value={editingData.notes}
                            onChange={(e) => setEditingData(prev => ({ ...prev, notes: e.target.value }))}
                            rows={3}
                            className="w-full resize-none"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <Button
                          onClick={handleUpdateEntry}
                          disabled={loading}
                          size="sm"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          onClick={() => setEditingEntry(null)}
                          variant="outline"
                          size="sm"
                          disabled={loading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Modo vista */
                    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {entry.status}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-purple-500" />
                              <span>{formatDateTimeEcuador(entry.statusDate)}</span>
                              {entry.isManualDate && (
                                <Badge variant="outline" className="text-xs ml-1 bg-blue-50 text-blue-700 border-blue-200">
                                  Manual
                                </Badge>
                              )}
                            </div>
                            {entry.createdByUser && (
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                  {getInitials(`${entry.createdByUser.firstName} ${entry.createdByUser.lastName}`)}
                                </div>
                                <span>{entry.createdByUser.firstName} {entry.createdByUser.lastName}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-4">
                          <Button
                            onClick={() => handleEditEntry(entry)}
                            variant="ghost"
                            size="sm"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteEntry(entry.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {entry.notes && (
                        <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {entry.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};