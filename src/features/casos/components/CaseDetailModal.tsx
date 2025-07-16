"use client"

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  CaseWithRelations,
} from '@/lib/types';
import {
  X, Calendar, User as UserIcon, FileText, Clock, Hash,
  Edit, Trash2, Plus, AlertCircle, Scale, ShieldCheck,
  Mail, MapPin, Phone, CheckCircle, XCircle, Pause, Building,
  UserPlus, Briefcase, History, MessageSquare, Download, Save, Link, ExternalLink,
  MoreHorizontal, Fingerprint,
  Loader2, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDateTimeEcuador, formatDateEcuador, getInitials, generatePDFFilename2 } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { CasePartesModal } from './CasePartesModal';
import { TaskForm } from '@/features/tareas/components/TaskForm';
import { TaskDetailModal } from '@/features/tareas/components/TaskDetailModal';
import { updateCase, getCaseInternalStatusHistory } from '@/features/casos/actions';
import { createTask, getUsers, updateTaskStatus, addTaskComment, deleteTask } from '@/features/gestion/actions';
import { createCalendarEventWithSync } from '@/features/calendario/actions';
import { EnhancedNewEventModal } from '@/features/calendario/components/EnhancedNewEventModal';
import { useToast } from '@/hooks/use-toast';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';
import { MovementsPDF } from '@/components/pdf/MovementsPDF';
import { getTemplates, getTemplateVariablesForCase, processTemplate } from '@/features/plantillas/actions';
import { Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { useSession } from 'next-auth/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CaseInternalStatusTimeline } from './CaseInternalStatusTimeline';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf' },
    { src: '/fonts/Inter-Medium.ttf', fontWeight: 500 },
    { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 600 },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 700 }
  ]
});

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#1a1a1a',
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#6b7280'
  },
  headerLeft: {
    flexDirection: 'column',
    width: '60%'
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    width: '40%'
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: 3
  },
  companyInfo: {
    fontSize: 10,
    marginTop: 2,
    color: '#4b5563'
  },
  content: {
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 15
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  footer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    textAlign: 'center'
  },
  footerText: {
    fontSize: 10,
    color: '#6b7280'
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#9ca3af'
  },
  heading1: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 12,
    color: '#1f2937'
  },
  heading2: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 10,
    color: '#374151'
  },
  heading3: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 8,
    color: '#4b5563'
  },
  paragraph: {
    marginBottom: 10,
    lineHeight: 1.6,
    textAlign: 'justify'
  },
  bold: {
    fontWeight: 700
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    marginLeft: 20
  },
  bullet: {
    width: 20,
    fontSize: 12
  },
  link: {
    color: '#3b82f6',
    textDecoration: 'underline'
  },
  separator: {
    marginVertical: 15,
    height: 1,
    backgroundColor: '#e5e7eb'
  }
});

// Función mejorada para convertir texto plano a componentes de React PDF preservando estructura
const parseCleanTextToPdfComponents = (cleanText: string) => {
  const elements: JSX.Element[] = [];
  let currentIndex = 0;

  // Dividir el texto por líneas
  const lines = cleanText.split('\n');

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      // Línea vacía - espacio
      elements.push(
        <Text key={currentIndex++} style={{ marginBottom: 5 }}> </Text>
      );
      return;
    }

    // Detectar encabezados por separadores
    if (trimmedLine.match(/^=+$/)) {
      // Separador principal - ya procesamos el título antes
      return;
    }

    if (trimmedLine.match(/^-+$/)) {
      // Separador secundario - ya procesamos el título antes
      return;
    }

    // Verificar si la siguiente línea es un separador para determinar el tipo de encabezado
    const nextLine = lines[lineIndex + 1]?.trim();
    const isMainHeading = nextLine?.match(/^=+$/);
    const isSubHeading = nextLine?.match(/^-+$/);

    if (isMainHeading) {
      elements.push(
        <Text key={currentIndex++} style={styles.heading1}>
          {trimmedLine}
        </Text>
      );
      elements.push(
        <View key={currentIndex++} style={styles.separator} />
      );
      return;
    }

    if (isSubHeading) {
      elements.push(
        <Text key={currentIndex++} style={styles.heading2}>
          {trimmedLine}
        </Text>
      );
      elements.push(
        <View key={currentIndex++} style={styles.separator} />
      );
      return;
    }

    // Detectar listas (líneas que empiezan con •)
    if (trimmedLine.startsWith('•')) {
      elements.push(
        <View key={currentIndex++} style={styles.listItem}>
          <Text style={styles.bullet}>•</Text>
          <Text style={{ flex: 1 }}>{trimmedLine.substring(1).trim()}</Text>
        </View>
      );
      return;
    }

    // Párrafo normal
    elements.push(
      <Text key={currentIndex++} style={styles.paragraph}>
        {trimmedLine}
      </Text>
    );
  });

  return elements;
};

// PDF Component for generated documents with clean text processing
const TemplateDocumentPDF = ({ content, caseName, templateName }: {
  content: string,
  caseName: string,
  templateName: string
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{templateName}</Text>
          <Text style={styles.subtitle}>Documento generado para el caso: {caseName}</Text>
          <Text style={styles.companyInfo}>Sistema Legal de Vilmega</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.companyInfo}>Fecha: {formatDateEcuador(new Date())}</Text>
        </View>
      </View>

      <View style={styles.section}>
        {parseCleanTextToPdfComponents(content)}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Documento generado automáticamente por Vilmega
        </Text>
        <Text style={styles.footerText}>
          {formatDateTimeEcuador(new Date())}
        </Text>
      </View>

      <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => 
        `Página ${pageNumber} de ${totalPages}`
      } fixed />
    </Page>
  </Document>
);

// --- INTERFACES Y COMPONENTES EXTERNOS ---

interface CaseDetailModalProps {
  case_: CaseWithRelations;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onManageTeam: () => void;
  onPartesUpdated?: (updatedCase: CaseWithRelations) => void;
}

const statusConfig = {
  ACTIVO: {
    label: 'Activo',
    icon: <CheckCircle className="w-4 h-4" />,
    className: "bg-green-50 text-green-700 border-green-200",
  },
  EN_ESPERA: {
    label: 'En Espera',
    icon: <Pause className="w-4 h-4" />,
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  CERRADO: {
    label: 'Cerrado',
    icon: <XCircle className="w-4 h-4" />,
    className: "bg-gray-50 text-gray-700 border-gray-200",
  },
  ARCHIVADO: {
    label: 'Archivado',
    icon: <AlertCircle className="w-4 h-4" />,
    className: "bg-red-50 text-red-700 border-red-200",
  }
};

// Función para obtener el icono del tipo de evento
const getEventTypeIcon = (type: string) => {
  switch (type) {
    case 'AUDIENCIA':
      return <UserIcon className="h-4 w-4 text-blue-600" />;
    case 'CITA_CON_CLIENTE':
      return <MapPin className="h-4 w-4 text-green-600" />;
    case 'REUNION_INTERNA':
      return <UserIcon className="h-4 w-4 text-purple-600" />;
    case 'VENCIMIENTO_LEGAL':
      return <Clock className="h-4 w-4 text-red-600" />;
    default:
      return <Calendar className="h-4 w-4 text-gray-600" />;
  }
};

// Función para obtener el color del tipo de evento
const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'AUDIENCIA':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'CITA_CON_CLIENTE':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'REUNION_INTERNA':
      return 'bg-purple-50 border-purple-200 text-purple-800';
    case 'VENCIMIENTO_LEGAL':
      return 'bg-red-50 border-red-200 text-red-800';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800';
  }
};

// Interface para las props del componente EditableField
interface EditableFieldProps {
  field: string;
  label: string;
  value: string;
  displayValue: string;
  isEditing: boolean;
  isTextarea?: boolean;
  saving: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onChange: (value: string) => void;
}

// Interface para el modal de selección de plantillas
interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateId: string) => void;
  templates: any[];
}

// 1. COMPONENTE 'EditableField' DEFINIDO FUERA DEL COMPONENTE PRINCIPAL
const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  displayValue,
  isEditing,
  isTextarea = false,
  saving,
  onEdit,
  onSave,
  onCancel,
  onChange,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">{label}:</label>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-6 w-6 p-0 hover:bg-gray-100"
          >
            <Edit className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          {isTextarea ? (
            <Textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full resize-none"
              rows={3}
              placeholder={`Ingrese ${label.toLowerCase()}`}
              autoFocus
            />
          ) : (
            <Input
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full"
              placeholder={`Ingrese ${label.toLowerCase()}`}
              autoFocus
            />
          )}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onSave}
              disabled={saving}
              className="h-7 px-3 bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-3 w-3 mr-1" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              className="h-7 px-3"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="min-h-[32px] p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer" onClick={onEdit}>
          <span className="text-sm text-gray-900">
            {displayValue || 'Haga clic para editar'}
          </span>
        </div>
      )}
    </div>
  );
};

// Componente para el campo de hipervínculo
const HyperlinkField: React.FC<{
  caseId: string;
  initialUrl?: string;
  onUpdate: (url: string) => void;
}> = ({ caseId, initialUrl, onUpdate }) => {
  const defaultUrl = "https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros";
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState(initialUrl || defaultUrl);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCase(caseId, { hyperlinkUrl: url });
      onUpdate(url);
      setIsEditing(false);
      toast({
        title: "Hipervínculo guardado",
        description: "El enlace ha sido guardado correctamente",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el hipervínculo",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpen = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">Hipervínculo:</label>
        {!isEditing && (
          <div className="flex items-center gap-1">
            {url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpen}
                className="h-6 w-6 p-0 hover:bg-blue-100"
                title="Abrir enlace"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full"
            placeholder="https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="h-7 px-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="h-3 w-3 mr-1" />
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setUrl(initialUrl || defaultUrl);
                setIsEditing(false);
              }}
              disabled={saving}
              className="h-7 px-3"
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className={`min-h-[32px] p-3 rounded-lg border transition-colors cursor-pointer flex items-center ${
            url 
              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }`}
          onClick={() => url ? handleOpen() : setIsEditing(true)}
        >
          <span className="text-sm text-gray-900 flex items-center gap-2 w-full">
            <Link className="h-3 w-3 flex-shrink-0" />
            <span className="truncate flex-1" title={url}>
              {url || 'Haga clic para agregar enlace'}
            </span>
            {url && <ExternalLink className="h-3 w-3 ml-2 flex-shrink-0" />}
          </span>
        </div>
      )}
    </div>
  );
};

// Modal de selección de plantillas
const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  templates
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Seleccionar Plantilla</h3>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No hay plantillas disponibles</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onSelectTemplate(template.id)}
                >
                  <h4 className="font-medium text-gray-900 mb-1">{template.templateName}</h4>
                  {template.description && (
                    <p className="text-sm text-gray-600">{template.description}</p>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    Variables: {(template.content.match(/\{\{[\w.]+\}\}/g) || []).length}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  case_: initialCase,
  onClose,
  onEdit,
  onDelete,
  onManageTeam,
  onPartesUpdated
}) => {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [case_, setCase] = useState(initialCase);
  const [showPartesModal, setShowPartesModal] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [showInternalStatusTimeline, setShowInternalStatusTimeline] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [generatingDocument, setGeneratingDocument] = useState(false);
  const [editingStates, setEditingStates] = useState({
    estadoOficial: false,
    codigoInterno: false
  });
  const [tempValues, setTempValues] = useState({
    estadoOficial: case_.estadoOficial || '',
    codigoInterno: case_.codigoInterno || ''
  });
  const [saving, setSaving] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const { toast } = useToast();

  const status = statusConfig[case_.status];
  const client = case_.client;
  const allTasks = case_.tasks || [];
  const pendingTasks = allTasks.filter(task => task.status === 'ACTIVO' || task.status === 'EN_REVISION');
  const movements = case_.movements || [];
  const upcomingEvents = case_.upcomingEvents || [];
  const internalStatusHistory = case_.internalStatusHistory || [];

  // Obtener el último estado interno
  const latestInternalStatus = internalStatusHistory.length > 0 
    ? internalStatusHistory[0] // Ya viene ordenado por fecha desc
    : null;

  const handlePartesUpdated = (updatedCase: CaseWithRelations) => {
    setCase(updatedCase);
    if (onPartesUpdated) {
      onPartesUpdated(updatedCase);
    }
  };

  const handleInternalStatusHistoryUpdate = async () => {
    try {
      const updatedHistory = await getCaseInternalStatusHistory(case_.id);
      setCase(prev => ({
        ...prev,
        internalStatusHistory: updatedHistory
      }));
    } catch (error) {
      console.error('Error updating internal status history:', error);
    }
  };

  // Fetch all users and templates when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [users, templatesData] = await Promise.all([
          getUsers(),
          getTemplates()
        ]);
        setAllUsers(users);
        setTemplates(templatesData.filter(t => t.status === 'ACTIVE'));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleFieldEdit = useCallback((field: keyof typeof editingStates) => {
    setEditingStates(prev => ({ ...prev, [field]: true }));
  }, []);

  const handleFieldSave = useCallback(async (field: keyof typeof editingStates) => {
    try {
      setSaving(true);
      const updateData = { [field]: tempValues[field] };

      await updateCase(case_.id, updateData);
      
      setCase(prev => ({ ...prev, ...updateData }));
      setEditingStates(prev => ({ ...prev, [field]: false }));
      
      toast({
        title: "Campo actualizado",
        description: "El campo ha sido guardado correctamente",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el campo",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [case_.id, tempValues, toast]);

  const handleFieldCancel = useCallback((field: keyof typeof editingStates) => {
    setTempValues(prev => ({
      ...prev,
      [field]: case_[field as keyof CaseWithRelations] as string || ''
    }));
    setEditingStates(prev => ({ ...prev, [field]: false }));
  }, [case_]);

  const handleInputChange = useCallback((field: keyof typeof tempValues, value: string) => {
    setTempValues(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCreateTask = async (taskData: any) => {
    try {
      // FIX: Mapear correctamente la fecha de vencimiento
      const taskPayload = {
        ...taskData,
        caseId: case_.id,
        // Mapear dueDate a fechaDeVencimiento si existe
        fechaDeVencimiento: taskData.dueDate ? new Date(taskData.dueDate) : null
      };

      // Remover dueDate del payload si existe
      if ('dueDate' in taskPayload) {
        delete taskPayload.dueDate;
      }

      const newTask = await createTask(taskPayload);
      
      if (newTask && newTask.task) {
        setCase(prevCase => ({
          ...prevCase,
          tasks: [...(prevCase.tasks || []), newTask.task]
        }));
      }

      setShowTaskForm(false);
      toast({
        title: "Tarea creada",
        description: "La tarea ha sido creada y asignada correctamente.",
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarea.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadMovementsPDF = async () => {
    try {
      setDownloadingPDF(true);

      toast({
        title: "Generando PDF",
        description: "El historial de movimientos se está procesando...",
        variant: "default"
      });

      const blob = await pdf(<MovementsPDF case_={case_} />).toBlob();
      const filename = generatePDFFilename2('Historial_Movimientos', case_.caseName);
      saveAs(blob, filename);
      
      toast({
        title: "PDF Generado",
        description: "El historial de movimientos ha sido descargado exitosamente",
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el PDF. Por favor, intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setDownloadingPDF(false);
    }
  };

  // Task Detail Modal handlers
  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setShowTaskDetailModal(true);
  };

  const handleTaskStatusChange = async (taskId: string, status: 'ACTIVO' | 'EN_REVISION' | 'APROBADA') => {
    try {
      await updateTaskStatus(taskId, status);

      // Update the task in the case's tasks array
      setCase(prevCase => ({
        ...prevCase,
        tasks: prevCase.tasks?.map(task => 
          task.id === taskId ? { ...task, status } : task
        ) || []
      }));

      toast({
        title: "Estado actualizado",
        description: "El estado de la tarea ha sido actualizado correctamente",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la tarea",
        variant: "destructive"
      });
    }
  };

  const handleAddTaskComment = async (taskId: string, comment: string) => {
    try {
      await addTaskComment(taskId, comment);

      toast({
        title: "Comentario añadido",
        description: "El comentario ha sido añadido correctamente",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo añadir el comentario",
        variant: "destructive"
      });
    }
  };

  const handleTaskEdit = () => {
    // TODO: Implement task editing
    toast({
      title: "Funcionalidad pendiente",
      description: "La edición de tareas estará disponible próximamente",
      variant: "default"
    });
  };

  const handleTaskDelete = async (taskId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta tarea?')) {
      try {
        const result = await deleteTask(taskId);
        if (result.success) {
          // Actualizar la lista local de tareas
          setCase(prevCase => ({
            ...prevCase,
            tasks: prevCase.tasks?.filter(task => task.id !== taskId) || []
          }));
          
          // Cerrar el modal si está abierto
          setShowTaskDetailModal(false);
          setSelectedTask(null);
          
          toast({
            title: "Tarea eliminada",
            description: "La tarea ha sido eliminada correctamente",
            variant: "default"
          });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Error deleting task:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar la tarea",
          variant: "destructive"
        });
      }
    }
  };

  const handleCreateDocument = () => {
    setShowTemplateModal(true);
  };

  const handleSelectTemplate = async (templateId: string) => {
    setGeneratingDocument(true);
    setShowTemplateModal(false);

    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) throw new Error('Plantilla no encontrada');

      // Obtener variables del caso
      const variables = await getTemplateVariablesForCase(case_.id);

      // Procesar plantilla
      const processedContent = await processTemplate(template.content, variables);

      // Crear documento DOCX
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            ...processedContent.split('\n').map((text) => {
              return new Paragraph({
                children: [
                  new TextRun({
                    text,
                    size: 22,
                  }),
                ],
              });
            }),
          ],
        }],
      });

      // Generar y descargar DOCX
      const blob = await Packer.toBlob(doc);
      const filename = `${template.templateName.replace(/[^a-zA-Z0-9]/g, '_')}_${case_.caseName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;

      saveAs(blob, filename);

      toast({
        title: "Documento generado",
        description: `El documento "${template.templateName}" ha sido generado exitosamente en formato DOCX`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating document:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el documento",
        variant: "destructive"
      });
    } finally {
      setGeneratingDocument(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-300">
        <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-200/50 relative">
          <div className="h-1.5 w-full bg-gray-600" />

          <header className="bg-gray-50 p-6 border-b border-gray-200">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="w-14 h-14 rounded-xl bg-gray-600 flex-shrink-0 flex items-center justify-center text-white shadow-md">
                  <Scale className="w-7 h-7" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h1 className="text-3xl font-bold text-gray-800 leading-tight truncate" title={case_.caseName}>
                    {case_.caseName}
                  </h1>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                      <Hash className="w-3 h-3 mr-1.5" />
                      Nº Expediente: {case_.caseNumber || 'No asignado'}
                    </span>
                    <span
                      className={cn(
                        'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                        status.className
                      )}
                    >
                      {status.icon}
                      <span className="ml-1.5">{status.label}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                <Button
                  size="sm"
                  onClick={handleCreateDocument}
                  disabled={generatingDocument}
                  className="bg-green-600 text-white hover:bg-green-700 disabled:bg-green-600/60"
                >
                  {generatingDocument ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  Crear Documento (DOCX)
                </Button>

                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 data-[state=open]:bg-gray-100"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Más acciones</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span>Eliminar Caso</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-9 w-9 hover:bg-gray-200 ml-2">
                  <X className="h-5 w-5 text-gray-500" />
                  <span className="sr-only">Cerrar</span>
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
                {/* Sección izquierda - reducida un 30% */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Información del Proceso */}
                  <section className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Hash className="w-4 h-4" />
                      Información del Proceso
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="font-medium text-gray-600 text-sm">Número:</span>
                        <div className="font-mono font-bold text-gray-700 bg-white p-2 rounded text-sm">
                          {case_.caseNumber || 'No asignado'}
                        </div>
                      </div>
                      <div>
                        <EditableField
                          field="codigoInterno"
                          label="Código Interno"
                          isEditing={editingStates.codigoInterno}
                          value={tempValues.codigoInterno}
                          displayValue={case_.codigoInterno}
                          saving={saving}
                          onEdit={() => handleFieldEdit('codigoInterno')}
                          onSave={() => handleFieldSave('codigoInterno')}
                          onCancel={() => handleFieldCancel('codigoInterno')}
                          onChange={(value) => handleInputChange('codigoInterno', value)}
                        />
                      </div>
                      {case_.authorities && (
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600 text-sm">Autoridades:</span>
                          <div className="text-gray-900 bg-white p-2 rounded text-sm">
                            {case_.authorities}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Partes Procesales */}
                  <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                        <UserIcon className="w-5 h-5" />
                        Partes Procesales Involucradas
                      </h3>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowPartesModal(true)}
                        className="text-gray-600 border-gray-200 hover:bg-gray-50"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Gestionar
                      </Button>
                    </div>
                    {case_.partes && case_.partes.length > 0 ? (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {case_.partes.map((parte) => (
                          <div key={parte.id} className="bg-white p-3 rounded border border-gray-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                  parte.type === 'ACTIVA' ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                  {getInitials(`${parte.firstName} ${parte.lastName}`)}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {parte.firstName} {parte.lastName}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {parte.type === 'ACTIVA' ? 'Parte Activa' : 'Parte Demandada'}
                                  </p>
                                </div>
                              </div>
                              {parte.hasBienes && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                                  Bienes
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-2 pl-11">
                              <div className="flex items-center gap-1">
                                <Fingerprint className="w-3 h-3" />
                                <span>{parte.cedula}</span>
                              </div>
                              {parte.phone && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Phone className="w-3 h-3" />
                                  <span>{parte.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600 font-medium mb-2">Sin partes registradas</p>
                        <Button
                          size="sm"
                          onClick={() => setShowPartesModal(true)}
                          className="bg-gray-600 hover:bg-gray-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Añadir
                        </Button>
                      </div>
                    )}
                  </section>

                  {case_.description && (
                    <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-500" />
                        Información del Caso
                      </h3>
                      <div className="prose prose-gray max-w-none">
                        <p className="text-gray-700 leading-relaxed">{case_.description}</p>
                      </div>
                    </section>
                  )}

                  <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                      <UserIcon className="w-5 h-5" />
                      Cliente Principal
                    </h3>
                    {client ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gray-500 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-md">
                            {getInitials(client.name)}
                          </div>
                          <div>
                            <p className="font-bold text-lg text-gray-900">{client.name}</p>
                            <p className="text-sm text-gray-600">
                              {client.clientType === 'PERSONA_NATURAL' ? 'Persona Natural' : 'Empresa'}
                            </p>
                          </div>
                        </div>
                        {(client.email || client.phone) && (
                          <div className="space-y-2">
                            {client.email && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="w-4 h-4" />
                                <a href={`mailto:${client.email}`} className="hover:text-blue-600 transition-colors underline decoration-dotted">
                                  {client.email}
                                </a>
                              </div>
                            )}
                            {client.phone && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4" />
                                <a href={`tel:${client.phone}`} className="hover:text-blue-600 transition-colors underline decoration-dotted">
                                  {client.phone}
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600 font-medium">Cliente no asignado</p>
                      </div>
                    )}
                  </section>
                </div>

                {/* Sección derecha - más ancha */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Estado Oficial */}
                  <section className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                    <h3 className="font-bold text-gray-700 text-base uppercase tracking-wider mb-6 flex items-center gap-2">
                      <ShieldCheck className="w-6 h-6" />
                      Estado Oficial
                    </h3>
                    <EditableField
                      field="estadoOficial"
                      label="Estado"
                      isEditing={editingStates.estadoOficial}
                      value={tempValues.estadoOficial}
                      displayValue={case_.estadoOficial || case_.status}
                      saving={saving}
                      onEdit={() => handleFieldEdit('estadoOficial')}
                      onSave={() => handleFieldSave('estadoOficial')}
                      onCancel={() => handleFieldCancel('estadoOficial')}
                      onChange={(value) => handleInputChange('estadoOficial', value)}
                    />
                    
                    {/* Campo de Hipervínculo */}
                    <div className="mt-6">
                      <HyperlinkField
                        caseId={case_.id}
                        initialUrl={case_.hyperlinkUrl}
                        onUpdate={(url) => setCase(prev => ({ ...prev, hyperlinkUrl: url }))}
                      />
                    </div>
                  </section>

                  {/* Estado Interno - mostrar solo el último estado */}
                  <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                          <History className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Estado Interno Actual
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => setShowInternalStatusTimeline(true)}
                          size="sm"
                          variant="outline"
                          className="text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                          <History className="h-4 w-4 mr-1" />
                          Ver Registro
                        </Button>
                        <CaseInternalStatusTimeline
                          caseId={case_.id}
                          history={internalStatusHistory}
                          onHistoryUpdate={handleInternalStatusHistoryUpdate}
                          mode="add-only"
                        />
                      </div>
                    </div>

                    {/* Mostrar solo el último estado */}
                    {latestInternalStatus ? (
                      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-semibold text-gray-900 mb-1">
                              {latestInternalStatus.status}
                            </h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatDateTimeEcuador(latestInternalStatus.statusDate)}</span>
                                {latestInternalStatus.isManualDate && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-1">
                                    Manual
                                  </span>
                                )}
                              </div>
                              {latestInternalStatus.createdByUser && (
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {getInitials(`${latestInternalStatus.createdByUser.firstName} ${latestInternalStatus.createdByUser.lastName}`)}
                                  </div>
                                  <span>{latestInternalStatus.createdByUser.firstName} {latestInternalStatus.createdByUser.lastName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {latestInternalStatus.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {latestInternalStatus.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p className="font-medium">Sin estado interno registrado</p>
                        <p className="text-sm">Agrega el primer estado para comenzar el seguimiento</p>
                      </div>
                    )}
                  </section>

                  {/* Próximas Actividades */}
                  <section className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Próximas Actividades
                      </h3>
                      <div className="flex items-center gap-2">
                        <EnhancedNewEventModal userId={session?.user?.id} defaultCaseId={case_.id}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-gray-600 border-gray-200 hover:bg-gray-50"
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Evento
                          </Button>
                        </EnhancedNewEventModal>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowTaskForm(true)}
                          className="text-gray-600 border-gray-200 hover:bg-gray-50"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Tarea
                        </Button>
                      </div>
                    </div>

                    {/* Mostrar eventos próximos del calendario */}
                    {upcomingEvents.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Eventos del Calendario
                        </h4>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {upcomingEvents.slice(0, 3).map((event) => (
                            <div 
                              key={event.id} 
                              className="bg-white p-3 rounded border border-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                {getEventTypeIcon(event.type)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                    {event.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                    <Clock className="w-3 w-3" />
                                    <span>{formatDateTimeEcuador(event.startDate)}</span>
                                  </div>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${getEventTypeColor(event.type)}`}>
                                    {event.type.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {upcomingEvents.length > 3 && (
                            <p className="text-sm text-gray-600 text-center">
                              +{upcomingEvents.length - 3} eventos más
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Mostrar tareas pendientes */}
                    {pendingTasks.length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                          <UserIcon className="w-3 h-3" />
                          Tareas Pendientes
                        </h4>
                        <div className="space-y-3 max-h-32 overflow-y-auto">
                          {pendingTasks.slice(0, 3).map((task) => (
                            <div 
                              key={task.id} 
                              className="bg-white p-3 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => handleTaskClick(task)}
                            >
                              <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                                {task.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <UserIcon className="w-3 h-3" />
                                <span>{task.assignedTo?.firstName} {task.assignedTo?.lastName}</span>
                                {task.fechaDeVencimiento && (
                                  <>
                                    <span>•</span>
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDateEcuador(task.fechaDeVencimiento)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                          {pendingTasks.length > 3 && (
                            <p className="text-sm text-gray-600 text-center">
                              +{pendingTasks.length - 3} tareas más
                            </p>
                          )}
                        </div>
                      </div>
                    ) : upcomingEvents.length === 0 ? (
                      <div className="text-center py-6">
                        <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-600 font-medium mb-2">Sin actividades pendientes</p>
                        <div className="flex items-center gap-2 justify-center">
                          <EnhancedNewEventModal userId={session?.user?.id} defaultCaseId={case_.id}>
                            <Button
                              size="sm"
                              className="bg-gray-600 hover:bg-gray-700 text-white"
                            >
                              <Calendar className="w-4 w-4 mr-1" />
                              Crear Evento
                            </Button>
                          </EnhancedNewEventModal>
                          <Button
                            size="sm"
                            onClick={() => setShowTaskForm(true)}
                            className="bg-gray-600 hover:bg-gray-700 text-white"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Crear Tarea
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </section>
                </div>
              </div>

              {movements.length > 0 && (
                <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider flex items-center gap-2">
                      <History className="w-5 h-5 text-gray-500" />
                      Historial de Movimientos ({movements.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadMovementsPDF}
                      disabled={downloadingPDF}
                      className="hover:bg-gray-50"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      {downloadingPDF ? 'Generando...' : 'Descargar PDF'}
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {movements.slice(0, 15).map((movement) => (
                      <div key={movement.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{movement.title}</span>
                            <span className="text-xs text-gray-500">
                              {formatDateEcuador(movement.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{movement.description}</p>
                          {movement.createdByUser && (
                            <p className="text-xs text-gray-500 mt-1">
                              por {movement.createdByUser.firstName} {movement.createdByUser.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    {movements.length > 15 && (
                      <p className="text-sm text-gray-500 text-center">
                        +{movements.length - 15} movimientos más
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>
          </main>

          {showPartesModal && (
            <CasePartesModal
              case_={case_}
              onClose={() => setShowPartesModal(false)}
              onPartesUpdated={handlePartesUpdated}
            />
          )}

          {showTaskForm && (
            <TaskForm
              cases={[case_]}
              users={allUsers}
              onSubmit={handleCreateTask}
              onCancel={() => setShowTaskForm(false)}
            />
          )}

          {showTaskDetailModal && selectedTask && (
            <TaskDetailModal
              task={selectedTask}
              onClose={() => {
                setShowTaskDetailModal(false);
                setSelectedTask(null);
              }}
              onEdit={handleTaskEdit}
              onDelete={() => handleTaskDelete(selectedTask.id)}
              onStatusChange={handleTaskStatusChange}
              onAddComment={handleAddTaskComment}
            />
          )}

          {/* Modal del timeline completo del estado interno */}
          {showInternalStatusTimeline && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Historial Completo de Estados Internos</h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowInternalStatusTimeline(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <CaseInternalStatusTimeline
                    caseId={case_.id}
                    history={internalStatusHistory}
                    onHistoryUpdate={handleInternalStatusHistoryUpdate}
                    mode="full"
                  />
                </div>
              </div>
            </div>
          )}

          <TemplateSelectionModal
            isOpen={showTemplateModal}
            onClose={() => setShowTemplateModal(false)}
            onSelectTemplate={handleSelectTemplate}
            templates={templates}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};