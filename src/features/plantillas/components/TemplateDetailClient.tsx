"use client"

import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Components
import { TemplateEditor } from './TemplateEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Icons
import {
  Save, ChevronLeft, Loader2, FileText, Settings, PencilLine,
  Badge, Clock
} from 'lucide-react';

// Types and Actions
import { Template } from '@/lib/types';
import { updateTemplate } from '../actions';
import { formatDate } from '@/lib/utils';

interface TemplateDetailClientProps {
  initialTemplate: Template;
}

export function TemplateDetailClient({ initialTemplate }: TemplateDetailClientProps) {
  const [template, setTemplate] = useState(initialTemplate);
  const [isPending, setIsPending] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTemplate(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleStatusChange = (status: 'ACTIVE' | 'INACTIVE') => {
    setTemplate(prev => ({ ...prev, status }));
    setHasChanges(true);
  };

  const handleContentChange = (content: string) => {
    setTemplate(prev => ({ ...prev, content }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template.templateName) {
      alert('El nombre de la plantilla es obligatorio.');
      return;
    }

    setIsPending(true);
    
    try {
      const result = await updateTemplate(template.id, {
        templateName: template.templateName,
        description: template.description,
        content: template.content,
        status: template.status
      });

      if (result.success) {
        setHasChanges(false);
        alert('¡Plantilla actualizada exitosamente!');
      } else {
        alert(`Error al actualizar la plantilla: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Error al actualizar la plantilla');
    }
    
    setIsPending(false);
  };

  const handleBack = () => {
    if (hasChanges) {
      if (confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
        window.history.back();
      }
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen bg-yellow-50">
      <form onSubmit={handleSubmit}>
        {/* Enhanced Header con branding Velmiga */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-yellow-200/80 shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                type="button"
                variant="ghost" 
                size="sm" 
                onClick={handleBack} 
                className="hover:bg-yellow-100 text-[#B8860B]"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div className="w-px h-6 bg-yellow-300" />
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <FileText className="h-5 w-5 text-[#B8860B]" />
                </div>
                <div>
                  <span className="font-semibold text-[#B8860B]">
                    {template.templateName || "Nueva Plantilla"}
                  </span>
                  <div className="text-xs text-yellow-600">
                    Velmiga - Última modificación: {formatDate(template.updatedAt)}
                  </div>
                </div>
              </div>
              {hasChanges && (
                <Badge variant="outline" className="bg-green-50 text-[#2D5016] border-green-300">
                  Sin guardar
                </Badge>
              )}
            </div>
            <Button 
              type="submit" 
              disabled={isPending || !hasChanges} 
              className="bg-[#B8860B] hover:bg-[#9A7209] text-white shadow-lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            {/* Editor Column */}
            <div className="lg:col-span-8 xl:col-span-9">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <TemplateEditor
                  content={template.content}
                  onChange={handleContentChange}
                />
              </motion.div>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
              {/* Template Details Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm border-yellow-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-[#B8860B]">
                      <PencilLine className="h-5 w-5 text-[#B8860B]" />
                      Detalles de la Plantilla
                    </CardTitle>
                    <CardDescription className="text-yellow-600">
                      Configura el nombre y descripción para identificarla fácilmente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="templateName" className="text-sm font-medium text-[#B8860B]">
                        Nombre de la Plantilla
                      </Label>
                      <Input
                        id="templateName"
                        name="templateName"
                        value={template.templateName}
                        onChange={handleFieldChange}
                        required
                        placeholder="Ej: Contrato de servicios legales"
                        className="transition-all focus:ring-2 focus:ring-[#B8860B] focus:border-[#B8860B] border-yellow-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium text-[#B8860B]">
                        Descripción (Opcional)
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={template.description || ''}
                        onChange={handleFieldChange}
                        placeholder="Describe para qué se usa esta plantilla..."
                        rows={4}
                        className="transition-all focus:ring-2 focus:ring-[#B8860B] focus:border-[#B8860B] resize-none border-yellow-200"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Settings Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm border-yellow-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-[#B8860B]">
                      <Settings className="h-5 w-5 text-[#B8860B]" />
                      Configuración
                    </CardTitle>
                    <CardDescription className="text-yellow-600">
                      Estado y configuraciones adicionales de la plantilla.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-[#B8860B] flex items-center gap-2">
                        <Badge className="h-4 w-4" />
                        Estado
                      </Label>
                      <Select value={template.status} onValueChange={handleStatusChange}>
                        <SelectTrigger className="transition-all focus:ring-2 focus:ring-[#B8860B] focus:border-[#B8860B] border-yellow-200">
                          <SelectValue placeholder="Seleccionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-[#2D5016] rounded-full" />
                              Activa
                            </div>
                          </SelectItem>
                          <SelectItem value="INACTIVE">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-slate-400 rounded-full" />
                              Inactiva
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Statistics Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Card className="shadow-lg border-0 bg-yellow-50 border-yellow-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-[#B8860B]">
                      <Clock className="h-5 w-5" />
                      Estadísticas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#B8860B]">
                          {(template.content.match(/\{\{[\w.]+\}\}/g) || []).length}
                        </div>
                        <div className="text-xs text-yellow-600">Variables</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#2D5016]">
                          {template.content.split(' ').length}
                        </div>
                        <div className="text-xs text-green-600">Palabras</div>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-xs text-slate-600">
                        Creado: {formatDate(template.createdAt)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </aside>
          </motion.div>
        </main>
      </form>
    </div>
  );
}