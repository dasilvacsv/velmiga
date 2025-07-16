"use client";

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Download, Upload, FileSpreadsheet, FileText, File,
  ChevronDown, AlertCircle, CheckCircle, Loader2, 
  FolderOpen, Database, Zap, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Template } from '@/lib/types';
import { 
  exportToPDF, 
  exportToWord, 
  exportToExcel, 
  importFromExcel, 
  downloadImportTemplate,
  exportCasesWithTemplates,
  ProcessedExcelData
} from '@/lib/exportUtils';
import { 
  bulkCreateCasesFromExcel, 
  createTemplate,
  getCasesWithTemplateUsage 
} from '@/features/plantillas/actions';
import toast from 'react-hot-toast';

interface ExportImportActionsProps {
  templates: Template[];
  selectedTemplate?: Template;
  onImportComplete?: (templates: Partial<Template>[]) => void;
}

// Componente de progreso de importación
function ImportProgressModal({ 
  isOpen, 
  onClose, 
  data 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  data: ProcessedExcelData | null;
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [results, setResults] = useState<any>(null);

  const handleStartImport = async () => {
    if (!data) return;

    setIsProcessing(true);
    setProgress(0);
    setCurrentStep('Iniciando importación...');

    try {
      // Importar casos
      if (data.cases.length > 0) {
        setCurrentStep(`Importando ${data.cases.length} casos...`);
        setProgress(20);

        const caseResults = await bulkCreateCasesFromExcel(data.cases);
        setProgress(60);

        if (caseResults.success) {
          toast.success(`✅ ${caseResults.summary.successful} casos importados exitosamente`);
          if (caseResults.summary.failed > 0) {
            toast.error(`⚠️ ${caseResults.summary.failed} casos fallaron al importar`);
          }
        }
      }

      // Importar plantillas
      if (data.templates.length > 0) {
        setCurrentStep(`Importando ${data.templates.length} plantillas...`);
        setProgress(80);

        let templateSuccessCount = 0;
        for (const templateData of data.templates) {
          if (templateData.templateName && templateData.content) {
            try {
              const result = await createTemplate({
                templateName: templateData.templateName,
                description: templateData.description,
                content: templateData.content
              });
              
              if (result.success) {
                templateSuccessCount++;
              }
            } catch (error) {
              console.error('Error creating template:', error);
            }
          }
        }

        if (templateSuccessCount > 0) {
          toast.success(`✅ ${templateSuccessCount} plantillas importadas exitosamente`);
        }
      }

      setProgress(100);
      setCurrentStep('¡Importación completada!');
      
      // Recargar página después de un breve delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Error during import:', error);
      toast.error('❌ Error durante la importación');
      setCurrentStep('Error en la importación');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl w-full max-w-2xl shadow-2xl"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Database className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Importación de Datos Excel
                </h3>
                <p className="text-gray-600">
                  Revisar y confirmar importación
                </p>
              </div>
            </div>
          </div>

          {/* Estadísticas de importación */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{data.statistics.totalRows}</div>
                <div className="text-xs text-gray-600">Filas Totales</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{data.statistics.validCases}</div>
                <div className="text-xs text-gray-600">Casos Válidos</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{data.statistics.validTemplates}</div>
                <div className="text-xs text-gray-600">Plantillas Válidas</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{data.statistics.errors}</div>
                <div className="text-xs text-gray-600">Errores</div>
              </CardContent>
            </Card>
          </div>

          {/* Errores si los hay */}
          {data.errors.length > 0 && (
            <Card className="mb-6 border-red-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Errores Encontrados ({data.errors.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-32 overflow-y-auto">
                {data.errors.slice(0, 5).map((error, index) => (
                  <div key={index} className="text-sm text-red-600 mb-1">
                    • {error}
                  </div>
                ))}
                {data.errors.length > 5 && (
                  <div className="text-sm text-red-500 italic">
                    ... y {data.errors.length - 5} errores más
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Barra de progreso durante procesamiento */}
          {isProcessing && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{currentStep}</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleStartImport}
              disabled={isProcessing || (data.statistics.validCases === 0 && data.statistics.validTemplates === 0)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Iniciar Importación
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export function ExportImportActions({ 
  templates, 
  selectedTemplate, 
  onImportComplete 
}: ExportImportActionsProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<ProcessedExcelData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportPDF = async () => {
    if (!selectedTemplate) {
      toast.error('Selecciona una plantilla para exportar');
      return;
    }

    setIsExporting('pdf');
    try {
      await exportToPDF(selectedTemplate);
      toast.success('✅ Plantilla exportada a PDF exitosamente');
    } catch (error) {
      toast.error('❌ Error al exportar a PDF');
      console.error('Export PDF error:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportWord = async () => {
    if (!selectedTemplate) {
      toast.error('Selecciona una plantilla para exportar');
      return;
    }

    setIsExporting('word');
    try {
      await exportToWord(selectedTemplate);
      toast.success('✅ Plantilla exportada a Word exitosamente');
    } catch (error) {
      toast.error('❌ Error al exportar a Word');
      console.error('Export Word error:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (templates.length === 0) {
      toast.error('No hay plantillas para exportar');
      return;
    }

    setIsExporting('excel');
    try {
      await exportToExcel(templates);
      toast.success('✅ Plantillas exportadas a Excel exitosamente');
    } catch (error) {
      toast.error('❌ Error al exportar a Excel');
      console.error('Export Excel error:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportCasesWithTemplates = async () => {
    setIsExporting('cases');
    try {
      const cases = await getCasesWithTemplateUsage();
      await exportCasesWithTemplates(cases);
      toast.success('✅ Casos exportados a Excel exitosamente');
    } catch (error) {
      toast.error('❌ Error al exportar casos');
      console.error('Export cases error:', error);
    } finally {
      setIsExporting(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('❌ Solo se permiten archivos Excel (.xlsx, .xls)');
      return;
    }

    setIsImporting(true);
    try {
      const processedData = await importFromExcel(file);
      
      if (processedData.statistics.validCases === 0 && processedData.statistics.validTemplates === 0) {
        toast.error('❌ No se encontraron datos válidos para importar');
        return;
      }

      setImportData(processedData);
      setShowImportModal(true);
      toast.success(`✅ Archivo procesado: ${processedData.statistics.totalRows} filas analizadas`);
      
    } catch (error) {
      toast.error('❌ Error al procesar el archivo Excel');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
      // Limpiar el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadTemplate = () => {
    try {
      downloadImportTemplate();
      toast.success('✅ Plantilla de importación descargada');
    } catch (error) {
      toast.error('❌ Error al descargar plantilla');
      console.error('Download template error:', error);
    }
  };

  return (
    <>
      <div className="flex items-center gap-3">
        {/* Exportar */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2 bg-gradient-to-r from-emerald-50 to-amber-50 border-emerald-200 hover:from-emerald-100 hover:to-amber-100"
            >
              <Download className="h-4 w-4" />
              Exportar
              <Badge variant="secondary" className="ml-1">
                {selectedTemplate ? '1' : templates.length}
              </Badge>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="end">
            <div className="space-y-2">
              <div className="px-2 py-1 text-sm font-medium text-emerald-800 border-b border-emerald-200">
                Opciones de Exportación
              </div>
              
              {selectedTemplate ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportPDF}
                    disabled={isExporting === 'pdf'}
                    className="w-full justify-start gap-2"
                  >
                    {isExporting === 'pdf' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <File className="h-4 w-4 text-red-600" />
                    )}
                    Exportar Plantilla a PDF
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleExportWord}
                    disabled={isExporting === 'word'}
                    className="w-full justify-start gap-2"
                  >
                    {isExporting === 'word' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4 text-blue-600" />
                    )}
                    Exportar Plantilla a Word
                  </Button>
                </>
              ) : (
                <div className="px-2 py-3 text-xs text-slate-500 text-center border border-amber-200 bg-amber-50 rounded">
                  <AlertCircle className="h-4 w-4 mx-auto mb-1 text-amber-600" />
                  Selecciona una plantilla específica para exportar PDF/Word
                </div>
              )}
              
              <div className="border-t border-emerald-200 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportExcel}
                  disabled={isExporting === 'excel' || templates.length === 0}
                  className="w-full justify-start gap-2"
                >
                  {isExporting === 'excel' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  )}
                  Exportar Todas las Plantillas a Excel
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportCasesWithTemplates}
                  disabled={isExporting === 'cases'}
                  className="w-full justify-start gap-2"
                >
                  {isExporting === 'cases' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-purple-600" />
                  )}
                  Exportar Casos con Plantillas
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Importar */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="gap-2 bg-gradient-to-r from-amber-50 to-emerald-50 border-amber-200 hover:from-amber-100 hover:to-emerald-100"
            >
              <Upload className="h-4 w-4" />
              Importar
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2" align="end">
            <div className="space-y-2">
              <div className="px-2 py-1 text-sm font-medium text-amber-800 border-b border-amber-200">
                Importar Datos desde Excel
              </div>
              
              <div className="px-2 py-2 text-xs text-slate-600 bg-slate-50 rounded">
                <CheckCircle className="h-3 w-3 inline mr-1 text-green-600" />
                Importa casos completos, plantillas y más desde Excel
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownloadTemplate}
                className="w-full justify-start gap-2"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                Descargar Plantilla de Excel
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleImportClick}
                disabled={isImporting}
                className="w-full justify-start gap-2"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 text-blue-600" />
                )}
                {isImporting ? 'Procesando...' : 'Seleccionar Archivo Excel'}
              </Button>
              
              <div className="px-2 py-2 text-xs text-slate-500 border-t border-slate-200">
                <div className="font-medium mb-1">📋 Datos que se pueden importar:</div>
                <div>• Casos con clientes y partes</div>
                <div>• Tareas asignadas</div>
                <div>• Plantillas de documentos</div>
                <div>• Relaciones entre casos y plantillas</div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Input oculto para archivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Modal de progreso de importación */}
      <ImportProgressModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        data={importData}
      />
    </>
  );
}