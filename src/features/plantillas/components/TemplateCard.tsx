import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  FileText, Edit, Copy, Trash2, Eye, Calendar,
  MoreVertical, Star, Clock, Activity // MoreVertical ya no será necesario para la versión compacta
} from 'lucide-react';
import { Template } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
// Popover ya no se importaría si no lo usas en ninguna parte, pero lo dejo por si acaso lo usas en otro sitio.
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface TemplateCardProps {
  template: Template;
  onCopy: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  compact?: boolean;
}

export function TemplateCard({
  template,
  onCopy,
  onDelete,
  isDeleting,
  compact = false
}: TemplateCardProps) {
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

          {/* Status Badge compacto */}
          <div className="absolute top-2 right-2 z-10">
            <Badge variant={template.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs px-2 py-1">
              <div className="flex items-center gap-1">
                <div className={`w-1 h-1 rounded-full ${template.status === 'ACTIVE' ? 'bg-slate-600' : 'bg-slate-400'}`} />
                {template.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}
              </div>
            </Badge>
          </div>

          <CardContent className="relative p-4 flex flex-col flex-grow">
            {/* Header compacto - Eliminado el Popover de aquí */}
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
              {/* MoreVertical y Popover han sido eliminados de esta sección para el modo compacto */}
            </div>

            {/* Statistics compactas */}
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

            {/* Metadata compacta */}
            <div className="text-xs text-slate-500 mt-auto mb-2">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="h-3 w-3" />
                <span>Creado: {formatDate(template.createdAt)}</span>
              </div>
            </div>

            {/* NUEVOS BOTONES DE ACCIÓN VISIBLES DIRECTAMENTE */}
            <div className="flex gap-2 mt-auto"> {/* Añadido mt-auto para empujar hacia abajo */}
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
              {/* BOTÓN DE ELIMINAR DIRECTO EN LA TARJETA */}
              <Button
                onClick={onDelete}
                disabled={isDeleting}
                variant="outline" // Puedes cambiar a 'destructive' si quieres que sea rojo por defecto
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

  // Versión completa (compact=false) - Mantenemos el Popover aquí
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

        {/* Status Badge con color neutro */}
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
          {/* Header Section */}
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

          {/* Statistics Grid con colores neutros y sin gradientes */}
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

          {/* Metadata */}
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

          {/* Action Buttons con colores sólidos */}
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