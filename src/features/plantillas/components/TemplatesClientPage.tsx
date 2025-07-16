"use client";

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, FileText, Search, Filter, TrendingUp, Activity, Clock,
  BarChart3, Zap, Target, ChevronDown, SortAsc, Grid3X3, List,
  Sparkles, AlertTriangle, CheckCircle2, Info, Database,
  FolderOpen, Layers, Trash2, Copy, Edit, Eye, Calendar,
  MoreVertical, Star
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Components
import { NewTemplateModal } from './NewTemplateModal';
import { ExportImportActions } from './ExportImportActions';
import { CaseTemplateSelector } from './CaseTemplateSelector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; // Se mantiene si se usa en la versión no compacta de TemplateCard

// Actions
import { createTemplate, deleteTemplate } from '../actions';

// Types
import { Template } from '@/lib/types';

// --- NUEVO COLOR PRINCIPAL BASADO EN EL LOGO ---
const Vilmega_GREEN = '#556B2F';
const Vilmega_GREEN_DARK = '#425225'; // Tono más oscuro para hover

interface TemplatesClientPageProps {
  initialTemplates: Template[];
  stats: {
    totalTemplates: number;
    activeTemplates: number;
    recentTemplates: number;
  };
}

// Función para formatear fechas
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Componente de Tarjeta de Plantilla con Botones Visibles
function TemplateCard({ template, onCopy, onDelete, isDeleting, compact = false }: {
  template: Template;
  onCopy: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  compact?: boolean;
}) {
  const variableCount = (template.content.match(/\{\{[\w.]+\}\}/g) || []).length;
  const wordCount = template.content.split(' ').length;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    },
    hover: {
      y: -4,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  const templateHref = `/plantillas/${template.id}`;

  if (compact) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
        className="group"
      >
        <Card className="relative overflow-hidden bg-white border-slate-200 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col">
          <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          <div className="absolute top-2 right-2 z-10">
            <Badge variant={template.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs px-2 py-1">
              <div className="flex items-center gap-1">
                <div className={`w-1 h-1 rounded-full ${template.status === 'ACTIVE' ? 'bg-slate-600' : 'bg-slate-400'}`} />
                {template.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
              </div>
            </Badge>
          </div>

          <CardContent className="relative p-4 flex flex-col flex-grow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3 flex-1 mr-2">
                <motion.div
                  className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-all duration-300"
                  whileHover={{ scale: 1.05, rotate: 3 }}
                >
                  <FileText className="h-4 w-4 text-slate-600" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-slate-800 transition-colors duration-200 line-clamp-2 text-sm">
                    {template.templateName}
                  </h3>
                  {template.description && (
                    <p className="text-xs text-slate-600 line-clamp-1 group-hover:text-slate-700 transition-colors duration-200">
                      {template.description}
                    </p>
                  )}
                </div>
              </div>
              {/* ELIMINADO EL POPOVER Y MoreVertical DE AQUÍ PARA EL MODO COMPACTO */}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="text-center p-2 bg-slate-100 rounded-md border border-slate-200 transition-all duration-300">
                <div className="text-sm font-bold text-slate-700">{variableCount}</div>
                <div className="text-xs text-slate-600">Variables</div>
              </div>
              <div className="text-center p-2 bg-slate-100 rounded-md border border-slate-200 transition-all duration-300">
                <div className="text-sm font-bold text-slate-700">{wordCount}</div>
                <div className="text-xs text-slate-600">Palabras</div>
              </div>
            </div>

            <div className="text-xs text-slate-500 mt-auto mb-2">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" />
                <span>Creado: {formatDate(template.createdAt)}</span>
              </div>
            </div>

            {/* AHORA TODOS LOS BOTONES ESTÁN EN UN MISMO DIV Y SIEMPRE VISIBLES */}
            <div className="flex gap-2 mt-auto">
              <Link href={templateHref} passHref legacyBehavior className="flex-1">
                <Button
                  as="a"
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white shadow-md transition-all duration-300 group-hover:shadow-lg text-xs py-2"
                  size="sm"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Ver / Editar
                </Button>
              </Link>
              <Button
                onClick={onCopy}
                variant="outline"
                size="sm"
                className="border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300"
              >
                <Copy className="h-4 w-4" />
              </Button>
              {/* BOTÓN DE ELIMINAR DIRECTAMENTE VISIBLE */}
              <Button
                onClick={onDelete}
                disabled={isDeleting}
                variant="outline" // Puedes usar 'destructive' aquí si prefieres que sea rojo más intenso
                size="sm"
                className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>

          <div className="absolute inset-0 border-2 border-transparent group-hover:border-slate-300 rounded-xl transition-all duration-300 pointer-events-none" />
        </Card>
      </motion.div>
    );
  }

  // --- Versión no compacta (compact=false) ---
  // Mantenemos el Popover aquí, ya que parece ser el diseño deseado para esta vista
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="group"
    >
      <Card className="relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-300 backdrop-blur-sm h-full flex flex-col border-slate-200">
        <div className="absolute inset-0 bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-4 right-4 z-10">
          <div className={`px-2 py-1 rounded-full text-xs font-medium transition-all duration-300 ${
            template.status === 'ACTIVE'
              ? 'bg-slate-200 text-slate-700 border border-slate-300'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full ${
                template.status === 'ACTIVE' ? 'bg-slate-600' : 'bg-slate-400'
                }`} />
              {template.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
            </div>
          </div>
        </div>

        <CardContent className="relative p-6 flex flex-col flex-grow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4 flex-1 mr-4">
              <motion.div
                className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-all duration-300"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <FileText className="h-6 w-6 text-slate-600" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-slate-800 transition-colors duration-200 line-clamp-2">
                  {template.templateName}
                </h3>
                {template.description && (
                  <p className="text-sm text-slate-600 line-clamp-2 group-hover:text-slate-700 transition-colors duration-200">
                    {template.description}
                  </p>
                )}
              </div>
            </div>

            {/* More Options (se mantiene el Popover para la versión no compacta) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="end">
                <Link href={templateHref} passHref legacyBehavior>
                  <Button as="a" variant="ghost" size="sm" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={onCopy} className="w-full justify-start">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </Button>
                <Button variant="ghost" size="sm" onClick={onDelete} disabled={isDeleting} className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </Button>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-slate-100 rounded-lg border border-slate-200 group-hover:bg-slate-200 transition-all duration-300">
              <div className="text-lg font-bold text-slate-700">{variableCount}</div>
              <div className="text-xs text-slate-600 font-medium">Variables</div>
            </div>
            <div className="text-center p-3 bg-slate-100 rounded-lg border border-slate-200 group-hover:bg-slate-200 transition-all duration-300">
              <div className="text-lg font-bold text-slate-700">{wordCount}</div>
              <div className="text-xs text-slate-600 font-medium">Palabras</div>
            </div>
            <div className="text-center p-3 bg-slate-100 rounded-lg border border-slate-200 group-hover:bg-slate-200 transition-all duration-300">
              <div className="text-lg font-bold text-slate-700">
                <Star className="h-4 w-4 mx-auto" />
              </div>
              <div className="text-xs text-slate-600 font-medium">Favorita</div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500 mt-auto mb-4">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>Creado: {formatDate(template.createdAt)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              <span>Modificado: {formatDate(template.updatedAt)}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={templateHref} passHref legacyBehavior className="flex-1">
              <Button
                as="a"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white shadow-lg transition-all duration-300 group-hover:shadow-xl"
                size="sm"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver / Editar
              </Button>
            </Link>
            <Button
              onClick={onCopy}
              variant="outline"
              size="sm"
              className="border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-all duration-300"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>

        <div className="absolute inset-0 border-2 border-transparent group-hover:border-slate-300 rounded-xl transition-all duration-300 pointer-events-none" />
      </Card>
    </motion.div>
  );
}

// Componente de Estadísticas Compacto
function CompactTemplateStats({ stats, templates }: { stats: TemplatesClientPageProps['stats'], templates: Template[] }) {
  const totalVariables = templates.reduce((sum, template) => sum + (template.content.match(/\{\{[\w.]+\}\}/g) || []).length, 0);
  const totalWords = templates.reduce((sum, template) => sum + template.content.split(' ').length, 0);
  const activePercentage = stats.totalTemplates > 0 ? Math.round((stats.activeTemplates / stats.totalTemplates) * 100) : 0;

  const compactStats = [
    { title: 'Total', value: stats.totalTemplates, icon: FileText, color: 'text-green-800', bg: 'bg-green-100/60', trend: '+12%' },
    { title: 'Activas', value: stats.activeTemplates, icon: Activity, color: 'text-green-800', bg: 'bg-green-100/60', trend: `${activePercentage}%` },
    { title: 'Recientes', value: stats.recentTemplates, icon: TrendingUp, color: 'text-green-800', bg: 'bg-green-100/60', trend: '+25%' },
    { title: 'Variables', value: totalVariables, icon: Zap, color: 'text-green-800', bg: 'bg-green-100/60', trend: '+15%' },
    { title: 'Palabras', value: totalWords.toLocaleString(), icon: BarChart3, color: 'text-green-800', bg: 'bg-green-100/60', trend: '+18%' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {compactStats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <Card className="relative overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 group bg-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`h-4 w-4 ${stat.color}`} />
                  </div>
                  <Badge variant="outline" className={`text-xs ${stat.color} border-green-200`}>
                    {stat.trend}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold" style={{ color: Vilmega_GREEN }}>{stat.value}</div>
                  <div className="text-xs font-medium text-green-700">{stat.title}</div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// Componente de Búsqueda y Filtros Compacto
function CompactSearchAndFilters({ searchTerm, setSearchTerm, statusFilter, setStatusFilter, sortBy, setSortBy, viewMode, setViewMode, templatesCount }: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  templatesCount: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white/80 backdrop-blur-sm rounded-xl border border-green-200 p-4 shadow-lg"
    >
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 h-4 w-4" />
          <Input
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 transition-all focus:ring-2 border-green-200"
            style={{ '--tw-ring-color': Vilmega_GREEN } as React.CSSProperties}
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 border-green-200">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas</SelectItem>
              <SelectItem value="ACTIVE">Activas</SelectItem>
              <SelectItem value="INACTIVE">Inactivas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36 border-green-200">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Recientes</SelectItem>
              <SelectItem value="oldest">Antiguos</SelectItem>
              <SelectItem value="name">A-Z</SelectItem>
              <SelectItem value="variables">Variables</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center bg-green-100/70 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={`h-8 w-8 p-0 transition-colors ${viewMode === 'grid' ? 'text-white' : 'text-gray-600'}`}
              style={{ backgroundColor: viewMode === 'grid' ? Vilmega_GREEN : 'transparent' }}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={`h-8 w-8 p-0 transition-colors ${viewMode === 'list' ? 'text-white' : 'text-gray-600'}`}
              style={{ backgroundColor: viewMode === 'list' ? Vilmega_GREEN : 'transparent' }}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Badge variant="outline" className="border-green-200" style={{ color: Vilmega_GREEN }}>
            {templatesCount} resultados
          </Badge>
        </div>
      </div>
    </motion.div>
  );
}

// Componente Principal de la Página
export function TemplatesClientPage({ initialTemplates, stats }: TemplatesClientPageProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | undefined>();
  const [activeTab, setActiveTab] = useState('templates');

  const filteredAndSortedTemplates = templates
    .filter(template => {
      const matchesSearch = template.templateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus = statusFilter === 'ALL' || template.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name': return a.templateName.localeCompare(b.templateName);
        case 'name-desc': return b.templateName.localeCompare(a.templateName);
        case 'variables':
          const aVars = (a.content.match(/\{\{[\w.]+\}\}/g) || []).length;
          const bVars = (b.content.match(/\{\{[\w.]+\}\}/g) || []).length;
          return bVars - aVars;
        default: return 0;
      }
    });

  const handleTemplateCreated = () => {
    window.location.reload();
    toast.success('✅ Plantilla creada exitosamente', {
      duration: 4000,
      style: {
        background: Vilmega_GREEN,
        color: 'white',
      },
    });
  };

  const handleCopy = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    toast.success(`✅ Contenido de "${template.templateName}" copiado al portapapeles`, {
      duration: 3000,
    });
  };

  const handleDelete = async (templateId: string, templateName: string) => {
    const confirmed = await new Promise<boolean>((resolve) => {
      toast((t) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="font-medium">¿Eliminar plantilla?</span>
          </div>
          <p className="text-sm text-gray-600">
            Esta acción no se puede deshacer. Se eliminará permanentemente "{templateName}".
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(true);
              }}
            >
              Eliminar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                toast.dismiss(t.id);
                resolve(false);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ), {
        duration: Infinity,
      });
    });

    if (confirmed) {
      startTransition(async () => {
        try {
          const result = await deleteTemplate(templateId);
          if (result.success) {
            setTemplates(prev => prev.filter(t => t.id !== templateId));
            toast.success('🗑️ Plantilla eliminada exitosamente', {
              duration: 3000,
            });
          } else {
            toast.error(`❌ Error al eliminar: ${result.error}`);
          }
        } catch (error) {
          toast.error('❌ Error inesperado al eliminar la plantilla');
        }
      });
    }
  };

  const handleImportComplete = async (importedTemplates: Partial<Template>[]) => {
    for (const template of importedTemplates) {
      if (template.templateName && template.content) {
        try {
          const result = await createTemplate({
            templateName: template.templateName,
            description: template.description,
            content: template.content
          });

          if (result.success) {
            window.location.reload();
          }
        } catch (error) {
          console.error('Error creating imported template:', error);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-green-50/30">
      <Toaster
        position="top-right"
        toastOptions={{
          className: '',
          style: {
            background: '#fff',
            color: '#374151',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #E5E7EB'
          },
        }}
      />

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header con nuevo color */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100/70 rounded-xl">
                <FileText className="h-8 w-8" style={{ color: Vilmega_GREEN }} />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1" style={{ color: Vilmega_GREEN }}>
                  Plantillas Vilmega
                </h1>
                <p className="text-green-700">
                  Gestión completa de plantillas legales y casos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ExportImportActions
                templates={templates}
                selectedTemplate={selectedTemplate}
                onImportComplete={handleImportComplete}
              />
              <NewTemplateModal onTemplateCreated={handleTemplateCreated}>
                <Button
                  className="text-white shadow-lg gap-2 px-6"
                  style={{ backgroundColor: Vilmega_GREEN }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = Vilmega_GREEN_DARK}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = Vilmega_GREEN}
                >
                  <Plus className="h-5 w-5" /> Nueva Plantilla
                </Button>
              </NewTemplateModal>
            </div>
          </div>
        </motion.div>

        {/* Estadísticas Compactas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <CompactTemplateStats stats={stats} templates={templates} />
        </motion.div>

        {/* Tabs con nuevo color */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-96 bg-white border border-green-200">
            <TabsTrigger
              value="templates"
              className="data-[state=active]:text-white flex items-center gap-2"
              style={{'--bg-active': Vilmega_GREEN} as any}
              data-state-active-bg={Vilmega_GREEN}
              onClick={(e) => e.currentTarget.style.backgroundColor = Vilmega_GREEN}
              onFocus={(e) => e.currentTarget.style.backgroundColor = activeTab === 'templates' ? Vilmega_GREEN : 'transparent'}
            >
              <style>{`.data-[state=active]:bg-\\[\\#556B2F\\] { background-color: ${Vilmega_GREEN} !important; }`}</style>
              <Layers className="h-4 w-4" />
              Plantillas
            </TabsTrigger>
            <TabsTrigger
              value="cases"
              className="data-[state=active]:text-white flex items-center gap-2"
              onClick={(e) => e.currentTarget.style.backgroundColor = Vilmega_GREEN}
              onFocus={(e) => e.currentTarget.style.backgroundColor = activeTab === 'cases' ? Vilmega_GREEN : 'transparent'}
            >
              <Database className="h-4 w-4" />
              Casos y Plantillas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="space-y-6">
            {/* Búsqueda y Filtros Compactos */}
            <CompactSearchAndFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              viewMode={viewMode}
              setViewMode={setViewMode}
              templatesCount={filteredAndSortedTemplates.length}
            />

            {/* Grid de Plantillas */}
            <AnimatePresence mode="wait">
              {filteredAndSortedTemplates.length > 0 ? (
                <motion.div
                  key="templates-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className={
                    viewMode === 'grid'
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                      : "space-y-3"
                  }
                >
                  {filteredAndSortedTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      onClick={() => setSelectedTemplate(template)}
                      className={`rounded-xl transition-all ${selectedTemplate?.id === template.id ? 'ring-2' : ''}`}
                      style={{'--tw-ring-color': Vilmega_GREEN} as React.CSSProperties}
                    >
                      <TemplateCard
                        template={template}
                        onCopy={() => handleCopy(template)}
                        onDelete={() => handleDelete(template.id, template.templateName)}
                        isDeleting={isPending}
                        compact={viewMode === 'grid'}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-12"
                >
                  <div className="max-w-md mx-auto">
                    <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Sparkles className="h-8 w-8" style={{ color: Vilmega_GREEN }}/>
                    </div>
                    <h3 className="text-xl font-semibold mb-2" style={{ color: Vilmega_GREEN }}>
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'No se encontraron plantillas'
                        : 'Aún no tienes plantillas'
                      }
                    </h3>
                    <p className="text-green-700 mb-6">
                      {searchTerm || statusFilter !== 'ALL'
                        ? 'Intenta ajustar los filtros de búsqueda'
                        : 'Comienza creando tu primera plantilla legal profesional'
                      }
                    </p>
                    <NewTemplateModal onTemplateCreated={handleTemplateCreated}>
                       <Button
                          className="text-white shadow-lg gap-2 px-6"
                          style={{ backgroundColor: Vilmega_GREEN }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = Vilmega_GREEN_DARK}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = Vilmega_GREEN}
                      >
                        <Plus className="h-5 w-5" />
                        {templates.length === 0 ? 'Crear Primera Plantilla' : 'Nueva Plantilla'}
                      </Button>
                    </NewTemplateModal>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
          <TabsContent value="cases" className="space-y-6">
            <CaseTemplateSelector onTemplateCreated={handleTemplateCreated} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}