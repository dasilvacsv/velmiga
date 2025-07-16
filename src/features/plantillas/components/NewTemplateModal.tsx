"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Wand2, FileText, Sparkles, Check, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Server Action
import { createTemplate } from '../actions'; 

// Components
import { TemplateEditor } from './TemplateEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface NewTemplateModalProps {
  children: React.ReactNode;
  onTemplateCreated: () => void;
}

export function NewTemplateModal({ children, onTemplateCreated }: NewTemplateModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateData, setTemplateData] = useState({
    name: '',
    description: '',
    content: ''
  });

  const handleSubmit = async () => {
    if (!templateData.name || !templateData.content) {
      toast.error('❌ Por favor completa el nombre y contenido de la plantilla');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await createTemplate({
        templateName: templateData.name,
        description: templateData.description,
        content: templateData.content
      });

      if (result.success) {
        setIsOpen(false);
        onTemplateCreated();
        setTemplateData({ name: '', description: '', content: '' });
        toast.success('✅ Plantilla creada exitosamente', {
          duration: 4000,
          style: {
            background: '#2D5016',
            color: 'white',
          },
        });
      } else {
        toast.error(`❌ Error al crear la plantilla: ${result.error}`);
      }
    } catch (error) {
      toast.error('❌ Error inesperado al crear la plantilla');
    }
    
    setIsSubmitting(false);
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="cursor-pointer">
        {children}
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl"
            >
              {/* Header con branding Velmiga */}
              <div className="relative bg-[#B8860B] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Nueva Plantilla - Velmiga</h2>
                      <p className="text-yellow-100 text-sm">Crea plantillas legales profesionales</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Content Body */}
              <div className="overflow-y-auto flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
                  {/* Sidebar con información básica */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
                      <h3 className="text-lg font-semibold text-[#B8860B] mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Información de la Plantilla
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-[#B8860B] mb-2">
                            Nombre de la Plantilla *
                          </label>
                          <Input
                            type="text"
                            value={templateData.name}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Ej: Contrato de Servicios Legales"
                            className="border-yellow-200 focus:border-[#B8860B] focus:ring-[#B8860B]"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#B8860B] mb-2">
                            Descripción
                          </label>
                          <Textarea
                            rows={4}
                            value={templateData.description}
                            onChange={(e) => setTemplateData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe el propósito y uso de esta plantilla..."
                            className="border-yellow-200 focus:border-[#B8860B] focus:ring-[#B8860B] resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Vista previa de estadísticas */}
                    <div className="bg-white rounded-xl border border-yellow-200 p-6">
                      <h4 className="font-semibold text-[#B8860B] mb-3">Estadísticas</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="text-lg font-bold text-[#B8860B]">
                            {(templateData.content.match(/\{\{[\w.]+\}\}/g) || []).length}
                          </div>
                          <div className="text-xs text-yellow-600">Variables</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-lg font-bold text-[#2D5016]">
                            {templateData.content.split(' ').length}
                          </div>
                          <div className="text-xs text-green-600">Palabras</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Editor principal */}
                  <div className="lg:col-span-8">
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold text-[#B8860B] mb-2 flex items-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        Editor de Plantilla
                      </h3>
                      <p className="text-yellow-600 text-sm">
                        Crea tu plantilla con campos dinámicos y formato profesional
                      </p>
                    </div>
                    <TemplateEditor
                      content={templateData.content}
                      onChange={(content) => setTemplateData(prev => ({ ...prev, content }))}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-yellow-200 bg-yellow-50 p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#B8860B]">
                    <span className="font-medium">Velmiga</span> - Sistema de Gestión Legal
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setIsOpen(false)} 
                      variant="outline"
                      className="border-yellow-300 text-[#B8860B] hover:bg-yellow-50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={isSubmitting || !templateData.name || !templateData.content}
                      className="bg-[#B8860B] hover:bg-[#9A7209] text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          Creando...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Crear Plantilla
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}