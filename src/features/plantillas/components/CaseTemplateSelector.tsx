"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Search, Filter, Plus, Eye, Download,
  ChevronDown, ChevronRight, Users, Calendar, 
  MapPin, Phone, Mail, Hash, Building, Scale,
  Sparkles, BarChart3, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CaseWithRelations, Template } from '@/lib/types';
import { getCasesWithTemplateUsage, createTemplateFromCase, getTemplates } from '@/features/plantillas/actions';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CaseTemplateSelectorProps {
  onTemplateCreated?: (templateId: string) => void;
}

export function CaseTemplateSelector({ onTemplateCreated }: CaseTemplateSelectorProps) {
  const [cases, setCases] = useState<CaseWithRelations[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedCases, setExpandedCases] = useState<Set<string>>(new Set());
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [casesData, templatesData] = await Promise.all([
        getCasesWithTemplateUsage(),
        getTemplates()
      ]);
      setCases(casesData);
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = caseItem.caseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseItem.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || caseItem.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleToggleCase = (caseId: string) => {
    const newExpanded = new Set(expandedCases);
    if (newExpanded.has(caseId)) {
      newExpanded.delete(caseId);
    } else {
      newExpanded.add(caseId);
    }
    setExpandedCases(newExpanded);
  };

  const handleCreateTemplate = async (caseId: string, caseName: string) => {
    setCreatingTemplate(caseId);
    
    try {
      const templateName = `Plantilla - ${caseName}`;
      const result = await createTemplateFromCase(caseId, {
        templateName,
        description: `Plantilla generada automáticamente desde el caso: ${caseName}`
      });

      if (result.success && result.templateId) {
        toast.success(`✅ Plantilla creada exitosamente: ${templateName}`);
        onTemplateCreated?.(result.templateId);
        // Recargar datos para reflejar cambios
        await loadData();
      } else {
        toast.error(`❌ ${result.error || 'Error al crear la plantilla'}`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      toast.error('❌ Error inesperado al crear la plantilla');
    } finally {
      setCreatingTemplate(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVO': return 'bg-green-100 text-green-800 border-green-200';
      case 'EN_ESPERA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'CERRADO': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'ARCHIVADO': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'ALTA': return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'BAJA': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Cargando casos y plantillas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y Estadísticas */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900 mb-2">
            Casos y Plantillas
          </h2>
          <p className="text-emerald-700">
            Gestiona la relación entre casos y plantillas, crea nuevas plantillas desde casos existentes
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-emerald-200">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-emerald-700">{cases.length}</div>
              <div className="text-xs text-emerald-600">Total Casos</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-amber-700">{templates.length}</div>
              <div className="text-xs text-amber-600">Plantillas</div>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-blue-700">
                {cases.filter(c => c.status === 'ACTIVO').length}
              </div>
              <div className="text-xs text-blue-600">Casos Activos</div>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-purple-700">
                {cases.reduce((sum, c) => sum + (c.tasks?.length || 0), 0)}
              </div>
              <div className="text-xs text-purple-600">Total Tareas</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <Card className="bg-white/80 backdrop-blur-sm border-emerald-200">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-400 h-4 w-4" />
              <Input
                placeholder="Buscar casos por nombre, cliente, número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-emerald-200 focus:border-emerald-500"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 border-emerald-200">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos los estados</SelectItem>
                <SelectItem value="ACTIVO">Activos</SelectItem>
                <SelectItem value="EN_ESPERA">En Espera</SelectItem>
                <SelectItem value="CERRADO">Cerrados</SelectItem>
                <SelectItem value="ARCHIVADO">Archivados</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 px-3 py-1">
              {filteredCases.length} resultados
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Casos */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No se encontraron casos
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'No hay casos disponibles en el sistema'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCases.map((caseItem, index) => (
            <motion.div
              key={caseItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="border-emerald-200 hover:shadow-lg transition-all duration-300">
                <Collapsible
                  open={expandedCases.has(caseItem.id)}
                  onOpenChange={() => handleToggleCase(caseItem.id)}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-emerald-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-emerald-100 rounded-lg">
                            <Scale className="h-5 w-5 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-emerald-900 mb-1">
                              {caseItem.caseName}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {caseItem.client?.name || 'Sin cliente'}
                              </span>
                              {caseItem.caseNumber && (
                                <span className="flex items-center gap-1">
                                  <Hash className="h-3 w-3" />
                                  {caseItem.caseNumber}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(caseItem.openingDate)}
                              </span>
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`text-xs ${getStatusColor(caseItem.status)}`}>
                            {caseItem.status}
                          </Badge>
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCreateTemplate(caseItem.id, caseItem.caseName);
                            }}
                            disabled={creatingTemplate === caseItem.id}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            {creatingTemplate === caseItem.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent mr-2" />
                                Creando...
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3 mr-2" />
                                Crear Plantilla
                              </>
                            )}
                          </Button>
                          {expandedCases.has(caseItem.id) ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Información del Cliente */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                            <Building className="h-4 w-4" />
                            Información del Cliente
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Users className="h-3 w-3 text-gray-400" />
                              <span>{caseItem.client?.name || 'No especificado'}</span>
                            </div>
                            {caseItem.client?.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span>{caseItem.client.email}</span>
                              </div>
                            )}
                            {caseItem.client?.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span>{caseItem.client.phone}</span>
                              </div>
                            )}
                            {caseItem.client?.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="text-xs">{caseItem.client.address}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Partes del Caso */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Partes Involucradas
                          </h4>
                          <div className="space-y-3">
                            {caseItem.partes?.filter(p => p.type === 'ACTIVA').map((parte, idx) => (
                              <div key={idx} className="p-2 bg-green-50 rounded border border-green-200">
                                <div className="text-xs font-medium text-green-800 mb-1">Parte Activa</div>
                                <div className="text-sm">{parte.firstName} {parte.lastName}</div>
                                <div className="text-xs text-green-600">{parte.cedula}</div>
                              </div>
                            ))}
                            {caseItem.partes?.filter(p => p.type === 'DEMANDADA').map((parte, idx) => (
                              <div key={idx} className="p-2 bg-red-50 rounded border border-red-200">
                                <div className="text-xs font-medium text-red-800 mb-1">Parte Demandada</div>
                                <div className="text-sm">{parte.firstName} {parte.lastName}</div>
                                <div className="text-xs text-red-600">{parte.cedula}</div>
                              </div>
                            ))}
                            {(!caseItem.partes || caseItem.partes.length === 0) && (
                              <div className="text-sm text-gray-500 italic">
                                No hay partes registradas
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Tareas del Caso */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-emerald-800 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Tareas y Estado
                          </h4>
                          <div className="space-y-2">
                            {caseItem.tasks?.slice(0, 3).map((task, idx) => (
                              <div key={idx} className="p-2 bg-blue-50 rounded border border-blue-200">
                                <div className="text-sm font-medium text-blue-900 mb-1">
                                  {task.description.substring(0, 50)}...
                                </div>
                                <div className="flex items-center justify-between">
                                  <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </Badge>
                                  <span className="text-xs text-blue-600">
                                    {task.assignedTo?.firstName} {task.assignedTo?.lastName}
                                  </span>
                                </div>
                              </div>
                            ))}
                            {caseItem.tasks && caseItem.tasks.length > 3 && (
                              <div className="text-xs text-gray-500 italic">
                                ... y {caseItem.tasks.length - 3} tareas más
                              </div>
                            )}
                            {(!caseItem.tasks || caseItem.tasks.length === 0) && (
                              <div className="text-sm text-gray-500 italic">
                                No hay tareas asignadas
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Información adicional del caso */}
                      {(caseItem.description || caseItem.authorities || caseItem.internalStatus) && (
                        <div className="mt-6 pt-4 border-t border-emerald-200">
                          <h4 className="font-semibold text-emerald-800 mb-3">Detalles del Caso</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {caseItem.description && (
                              <div>
                                <span className="font-medium text-gray-700">Descripción:</span>
                                <p className="text-gray-600 mt-1">{caseItem.description}</p>
                              </div>
                            )}
                            {caseItem.authorities && (
                              <div>
                                <span className="font-medium text-gray-700">Autoridades:</span>
                                <p className="text-gray-600 mt-1">{caseItem.authorities}</p>
                              </div>
                            )}
                            {caseItem.internalStatus && (
                              <div>
                                <span className="font-medium text-gray-700">Estado Interno:</span>
                                <p className="text-gray-600 mt-1">{caseItem.internalStatus}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}