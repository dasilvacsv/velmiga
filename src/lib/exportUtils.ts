'use client';

import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType } from 'docx';
import jsPDF from 'jspdf';
import { Template, Case, CaseWithRelations } from '@/lib/types';

// Tipos para la importación de Excel
export interface ExcelCaseData {
  caseName: string;
  caseNumber?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientDni?: string;
  clientType: 'PERSONA_NATURAL' | 'EMPRESA';
  description?: string;
  authorities?: string;
  internalStatus?: string;
  openingDate?: string;
  // Partes Activas
  parteActivaFirstName?: string;
  parteActivaLastName?: string;
  parteActivaCedula?: string;
  parteActivaPhone?: string;
  parteActivaEmail?: string;
  parteActivaBienes?: string;
  // Partes Demandadas
  parteDemandadaFirstName?: string;
  parteDemandadaLastName?: string;
  parteDemandadaCedula?: string;
  parteDemandadaPhone?: string;
  parteDemandadaEmail?: string;
  parteDemandadaBienes?: string;
  // Tareas
  taskDescription?: string;
  taskPriority?: 'ALTA' | 'MEDIA' | 'BAJA';
  taskDueDate?: string;
  assignedToEmail?: string;
  // Plantillas
  templateNames?: string; // Separado por comas
}

export interface ProcessedExcelData {
  cases: ExcelCaseData[];
  templates: Partial<Template>[];
  errors: string[];
  statistics: {
    totalRows: number;
    validCases: number;
    validTemplates: number;
    errors: number;
  };
}

// =================================================================
// FUNCIONES DE EXPORTACIÓN
// =================================================================

/**
 * Exporta una plantilla individual a PDF
 */
export async function exportToPDF(template: Template): Promise<void> {
  try {
    const doc = new jsPDF();
    
    // Configuración de la página
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    
    let yPosition = margin;
    
    // Función para añadir texto con salto de línea automático
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      
      const lines = doc.splitTextToSize(text, maxWidth);
      
      for (const line of lines) {
        if (yPosition > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += fontSize * 0.5;
      }
      yPosition += 5; // Espacio adicional después del párrafo
    };
    
    // Header con información Vilmega
    addText('Vilmega - SISTEMA DE GESTIÓN LEGAL', 16, true);
    addText('Plantilla de Documento Legal', 14, true);
    addText(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 10);
    yPosition += 10;
    
    // Información de la plantilla
    addText(`Nombre: ${template.templateName}`, 14, true);
    if (template.description) {
      addText(`Descripción: ${template.description}`, 12);
    }
    addText(`Estado: ${template.status === 'ACTIVE' ? 'Activa' : 'Inactiva'}`, 12);
    addText(`Creada: ${new Date(template.createdAt).toLocaleDateString('es-ES')}`, 10);
    yPosition += 10;
    
    // Línea separadora
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 15;
    
    // Contenido de la plantilla (procesado para quitar HTML)
    addText('CONTENIDO DE LA PLANTILLA:', 14, true);
    const cleanContent = template.content
      .replace(/<[^>]*>/g, '') // Quitar tags HTML
      .replace(/&nbsp;/g, ' ') // Reemplazar espacios
      .replace(/&amp;/g, '&') // Reemplazar entidades
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    
    addText(cleanContent, 11);
    
    // Footer
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Página ${i} de ${totalPages} - Generado por Vilmega`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }
    
    // Descargar el archivo
    doc.save(`${template.templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  } catch (error) {
    console.error('Error exportando PDF:', error);
    throw new Error('Error al generar el archivo PDF');
  }
}

/**
 * Exporta una plantilla individual a Word con formato mejorado
 */
export async function exportToWord(template: Template): Promise<void> {
  try {
    // Función para convertir HTML básico a párrafos de Word
    const processHtmlContent = (htmlContent: string) => {
      const paragraphs: Paragraph[] = [];
      
      // Dividir por párrafos HTML
      const htmlParagraphs = htmlContent.split(/<\/p>|<br\s*\/?>/gi);
      
      htmlParagraphs.forEach(para => {
        // Limpiar HTML tags básicos pero preservar estructura
        let cleanText = para
          .replace(/<p[^>]*>/gi, '')
          .replace(/<\/p>/gi, '')
          .replace(/<br[^>]*>/gi, '\n')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();

        if (cleanText) {
          // Detectar encabezados
          const isHeading1 = /<h1[^>]*>/i.test(para);
          const isHeading2 = /<h2[^>]*>/i.test(para);
          const isHeading3 = /<h3[^>]*>/i.test(para);
          
          // Limpiar tags de encabezados
          cleanText = cleanText.replace(/<\/?h[1-6][^>]*>/gi, '');

          if (isHeading1) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: cleanText, bold: true, size: 32 })],
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 200 }
            }));
          } else if (isHeading2) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: cleanText, bold: true, size: 28 })],
              heading: HeadingLevel.HEADING_2,
              spacing: { after: 160 }
            }));
          } else if (isHeading3) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: cleanText, bold: true, size: 24 })],
              heading: HeadingLevel.HEADING_3,
              spacing: { after: 120 }
            }));
          } else {
            // Párrafo normal, procesar texto con formato
            const textRuns: TextRun[] = [];
            
            // Dividir por elementos bold
            const parts = cleanText.split(/(<\/?strong>|<\/?b>)/gi);
            let isBold = false;
            
            parts.forEach(part => {
              if (part === '<strong>' || part === '<b>') {
                isBold = true;
              } else if (part === '</strong>' || part === '</b>') {
                isBold = false;
              } else if (part.trim()) {
                textRuns.push(new TextRun({
                  text: part.replace(/<[^>]*>/g, ''),
                  bold: isBold,
                  size: 22
                }));
              }
            });

            if (textRuns.length > 0) {
              paragraphs.push(new Paragraph({
                children: textRuns,
                spacing: { after: 120 }
              }));
            }
          }
        }
      });

      return paragraphs;
    };

    const doc = new Document({
      creator: "Vilmega - Sistema Legal",
      title: template.templateName,
      description: template.description || "",
      sections: [{
        properties: {
          page: {
            margin: {
              top: 1440,    // 1 inch
              right: 1440,  // 1 inch
              bottom: 1440, // 1 inch
              left: 1440,   // 1 inch
            },
          },
        },
        children: [
          // Header principal
          new Paragraph({
            children: [
              new TextRun({
                text: "Vilmega - SISTEMA DE GESTIÓN LEGAL",
                bold: true,
                size: 36,
                color: "1f2937"
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "PLANTILLA DE DOCUMENTO LEGAL",
                bold: true,
                size: 28,
                color: "374151"
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 480 }
          }),

          // Información de la plantilla en tabla
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Nombre de la Plantilla:", bold: true, size: 22 })]
                    })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: template.templateName, size: 22 })]
                    })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              ...(template.description ? [new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Descripción:", bold: true, size: 22 })]
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: template.description, size: 22 })]
                    })],
                  }),
                ],
              })] : []),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Estado:", bold: true, size: 22 })]
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ 
                        text: template.status === 'ACTIVE' ? 'Activa' : 'Inactiva', 
                        size: 22 
                      })]
                    })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Fecha de Creación:", bold: true, size: 22 })]
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ 
                        text: new Date(template.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }), 
                        size: 22 
                      })]
                    })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ text: "Fecha de Generación:", bold: true, size: 22 })]
                    })],
                  }),
                  new TableCell({
                    children: [new Paragraph({
                      children: [new TextRun({ 
                        text: new Date().toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }), 
                        size: 22 
                      })]
                    })],
                  }),
                ],
              }),
            ],
          }),
          
          new Paragraph({ text: "", spacing: { after: 480 } }), // Espacio
          
          // Título del contenido
          new Paragraph({
            children: [
              new TextRun({
                text: "CONTENIDO DE LA PLANTILLA",
                bold: true,
                size: 28,
                color: "1f2937"
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 240 }
          }),
          
          // Separador
          new Paragraph({
            children: [
              new TextRun({
                text: "─".repeat(50),
                color: "9ca3af"
              })
            ],
            spacing: { after: 240 }
          }),
          
          // Contenido procesado
          ...processHtmlContent(template.content),
          
          // Footer
          new Paragraph({ text: "", spacing: { after: 480 } }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "─".repeat(50),
                color: "9ca3af"
              })
            ],
            spacing: { after: 120 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: "Documento generado automáticamente por Vilmega - Sistema de Gestión Legal",
                italics: true,
                size: 20,
                color: "6b7280"
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    // Generar el archivo
    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    // Crear enlace de descarga
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exportando Word:', error);
    throw new Error('Error al generar el archivo Word');
  }
}

/**
 * Exporta todas las plantillas a Excel
 */
export async function exportToExcel(templates: Template[]): Promise<void> {
  try {
    // Crear datos para la hoja de plantillas
    const templateData = templates.map(template => ({
      'ID': template.id,
      'Nombre': template.templateName,
      'Descripción': template.description || '',
      'Estado': template.status,
      'Categoría': template.category || 'general',
      'Variables': (template.content.match(/\{\{[\w.]+\}\}/g) || []).length,
      'Palabras': template.content.split(' ').length,
      'Fecha Creación': new Date(template.createdAt).toLocaleDateString('es-ES'),
      'Fecha Actualización': new Date(template.updatedAt).toLocaleDateString('es-ES'),
      'Contenido': template.content.replace(/<[^>]*>/g, '').substring(0, 1000) + '...',
    }));

    // Crear estadísticas
    const stats = {
      'Total Plantillas': templates.length,
      'Plantillas Activas': templates.filter(t => t.status === 'ACTIVE').length,
      'Plantillas Inactivas': templates.filter(t => t.status === 'INACTIVE').length,
      'Total Variables': templates.reduce((sum, t) => sum + (t.content.match(/\{\{[\w.]+\}\}/g) || []).length, 0),
      'Total Palabras': templates.reduce((sum, t) => sum + t.content.split(' ').length, 0),
    };

    const statsData = Object.entries(stats).map(([key, value]) => ({
      'Métrica': key,
      'Valor': value,
    }));

    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    // Añadir hoja de plantillas
    const ws1 = XLSX.utils.json_to_sheet(templateData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Plantillas');
    
    // Añadir hoja de estadísticas
    const ws2 = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Estadísticas');
    
    // Configurar anchos de columna
    const wscols = [
      { wch: 10 }, // ID
      { wch: 30 }, // Nombre
      { wch: 50 }, // Descripción
      { wch: 10 }, // Estado
      { wch: 15 }, // Categoría
      { wch: 10 }, // Variables
      { wch: 10 }, // Palabras
      { wch: 15 }, // Fecha Creación
      { wch: 15 }, // Fecha Actualización
      { wch: 80 }, // Contenido
    ];
    ws1['!cols'] = wscols;
    
    // Descargar archivo
    XLSX.writeFile(wb, `plantillas_Vilmega_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exportando Excel:', error);
    throw new Error('Error al generar el archivo Excel');
  }
}

// =================================================================
// FUNCIONES DE IMPORTACIÓN
// =================================================================

/**
 * Procesa un archivo Excel y extrae datos de casos y plantillas
 */
export async function importFromExcel(file: File): Promise<ProcessedExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const result: ProcessedExcelData = {
          cases: [],
          templates: [],
          errors: [],
          statistics: {
            totalRows: 0,
            validCases: 0,
            validTemplates: 0,
            errors: 0,
          }
        };

        // Procesar hoja de casos (si existe)
        if (workbook.SheetNames.includes('Casos')) {
          const casesSheet = workbook.Sheets['Casos'];
          const casesData = XLSX.utils.sheet_to_json(casesSheet);
          result.statistics.totalRows += casesData.length;
          
          casesData.forEach((row: any, index: number) => {
            try {
              const caseData = processCaseRow(row);
              if (caseData) {
                result.cases.push(caseData);
                result.statistics.validCases++;
              }
            } catch (error) {
              result.errors.push(`Fila ${index + 2} (Casos): ${error}`);
              result.statistics.errors++;
            }
          });
        }

        // Procesar hoja de plantillas (si existe)
        if (workbook.SheetNames.includes('Plantillas')) {
          const templatesSheet = workbook.Sheets['Plantillas'];
          const templatesData = XLSX.utils.sheet_to_json(templatesSheet);
          result.statistics.totalRows += templatesData.length;
          
          templatesData.forEach((row: any, index: number) => {
            try {
              const templateData = processTemplateRow(row);
              if (templateData) {
                result.templates.push(templateData);
                result.statistics.validTemplates++;
              }
            } catch (error) {
              result.errors.push(`Fila ${index + 2} (Plantillas): ${error}`);
              result.statistics.errors++;
            }
          });
        }

        // Si no hay hojas específicas, intentar procesar la primera hoja como casos
        if (result.cases.length === 0 && result.templates.length === 0 && workbook.SheetNames.length > 0) {
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const firstSheetData = XLSX.utils.sheet_to_json(firstSheet);
          result.statistics.totalRows = firstSheetData.length;
          
          firstSheetData.forEach((row: any, index: number) => {
            try {
              // Intentar procesar como caso primero
              const caseData = processCaseRow(row);
              if (caseData) {
                result.cases.push(caseData);
                result.statistics.validCases++;
              } else {
                // Si no es válido como caso, intentar como plantilla
                const templateData = processTemplateRow(row);
                if (templateData) {
                  result.templates.push(templateData);
                  result.statistics.validTemplates++;
                }
              }
            } catch (error) {
              result.errors.push(`Fila ${index + 2}: ${error}`);
              result.statistics.errors++;
            }
          });
        }

        resolve(result);
      } catch (error) {
        reject(new Error(`Error procesando archivo Excel: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error leyendo el archivo'));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Procesa una fila de Excel para extraer datos de caso
 */
function processCaseRow(row: any): ExcelCaseData | null {
  // Mapear posibles nombres de columnas
  const getField = (fieldNames: string[]) => {
    for (const fieldName of fieldNames) {
      if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
        return String(row[fieldName]).trim();
      }
    }
    return undefined;
  };

  const caseName = getField(['Nombre del Caso', 'Case Name', 'Caso', 'Name', 'caseName']);
  const clientName = getField(['Cliente', 'Client Name', 'Client', 'Nombre Cliente', 'clientName']);

  // Validar campos obligatorios
  if (!caseName || !clientName) {
    return null;
  }

  return {
    caseName,
    caseNumber: getField(['Número', 'Number', 'Expediente', 'Case Number', 'caseNumber', 'N° Proceso']),
    clientName,
    clientEmail: getField(['Email Cliente', 'Client Email', 'Email', 'clientEmail']),
    clientPhone: getField(['Teléfono Cliente', 'Client Phone', 'Phone', 'Teléfono', 'clientPhone']),
    clientAddress: getField(['Dirección', 'Address', 'clientAddress']),
    clientDni: getField(['DNI', 'Cédula', 'RIF', 'Document', 'clientDni']),
    clientType: (getField(['Tipo Cliente', 'Client Type', 'Type', 'clientType']) === 'EMPRESA') ? 'EMPRESA' : 'PERSONA_NATURAL',
    description: getField(['Descripción', 'Description', 'Desc', 'description']),
    authorities: getField(['Autoridades', 'Authorities', 'Juzgado', 'authorities']),
    internalStatus: getField(['Estado Interno', 'Internal Status', 'internalStatus']),
    openingDate: getField(['Fecha Apertura', 'Opening Date', 'Date', 'openingDate']),
    
    // Partes Activas
    parteActivaFirstName: getField(['Parte Activa Nombre', 'Active Party First Name', 'Nombre Activa', 'parteActivaFirstName']),
    parteActivaLastName: getField(['Parte Activa Apellido', 'Active Party Last Name', 'Apellido Activa', 'parteActivaLastName']),
    parteActivaCedula: getField(['Parte Activa Cédula', 'Active Party ID', 'Cédula Activa', 'parteActivaCedula']),
    parteActivaPhone: getField(['Parte Activa Teléfono', 'Active Party Phone', 'Teléfono Activa', 'parteActivaPhone']),
    parteActivaEmail: getField(['Parte Activa Email', 'Active Party Email', 'Email Activa', 'parteActivaEmail']),
    parteActivaBienes: getField(['Parte Activa Bienes', 'Active Party Assets', 'Bienes Activa', 'parteActivaBienes']),
    
    // Partes Demandadas
    parteDemandadaFirstName: getField(['Parte Demandada Nombre', 'Defendant First Name', 'Nombre Demandada', 'parteDemandadaFirstName']),
    parteDemandadaLastName: getField(['Parte Demandada Apellido', 'Defendant Last Name', 'Apellido Demandada', 'parteDemandadaLastName']),
    parteDemandadaCedula: getField(['Parte Demandada Cédula', 'Defendant ID', 'Cédula Demandada', 'parteDemandadaCedula']),
    parteDemandadaPhone: getField(['Parte Demandada Teléfono', 'Defendant Phone', 'Teléfono Demandada', 'parteDemandadaPhone']),
    parteDemandadaEmail: getField(['Parte Demandada Email', 'Defendant Email', 'Email Demandada', 'parteDemandadaEmail']),
    parteDemandadaBienes: getField(['Parte Demandada Bienes', 'Defendant Assets', 'Bienes Demandada', 'parteDemandadaBienes']),
    
    // Tareas
    taskDescription: getField(['Tarea', 'Task', 'Task Description', 'taskDescription']),
    taskPriority: (getField(['Prioridad', 'Priority', 'taskPriority']) as 'ALTA' | 'MEDIA' | 'BAJA') || 'MEDIA',
    taskDueDate: getField(['Fecha Vencimiento', 'Due Date', 'taskDueDate']),
    assignedToEmail: getField(['Asignado A', 'Assigned To', 'assignedToEmail']),
    
    // Plantillas
    templateNames: getField(['Plantillas', 'Templates', 'templateNames']),
  };
}

/**
 * Procesa una fila de Excel para extraer datos de plantilla
 */
function processTemplateRow(row: any): Partial<Template> | null {
  const getField = (fieldNames: string[]) => {
    for (const fieldName of fieldNames) {
      if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
        return String(row[fieldName]).trim();
      }
    }
    return undefined;
  };

  const templateName = getField(['Nombre', 'Name', 'Template Name', 'templateName']);
  const content = getField(['Contenido', 'Content', 'Template Content', 'content']);

  // Validar campos obligatorios
  if (!templateName || !content) {
    return null;
  }

  return {
    templateName,
    description: getField(['Descripción', 'Description', 'Desc', 'description']),
    content,
    category: getField(['Categoría', 'Category', 'category']) || 'general',
    status: (getField(['Estado', 'Status', 'status']) === 'INACTIVE') ? 'INACTIVE' : 'ACTIVE',
  };
}

/**
 * Descarga una plantilla de Excel para importación
 */
export function downloadImportTemplate(): void {
  // Crear datos de ejemplo para casos
  const exampleCases = [
    {
      'Nombre del Caso': 'Ejemplo Caso de Divorcio',
      'N° Proceso': 'CASO-2024-0001',
      'Código Interno': 'CO-2024-001',
      'Cliente': 'Juan Pérez',
      'Email Cliente': 'juan.perez@email.com',
      'Teléfono Cliente': '+58 412-1234567',
      'Dirección': 'Av. Principal, Caracas',
      'DNI': 'V-12345678',
      'Tipo Cliente': 'PERSONA_NATURAL',
      'Descripción': 'Proceso de divorcio contencioso',
      'Autoridades': 'Tribunal de Familia',
      'Estado Interno': 'En proceso',
      'Fecha Apertura': '2024-01-15',
      'Parte Activa Nombre': 'Juan',
      'Parte Activa Apellido': 'Pérez',
      'Parte Activa Cédula': 'V-12345678',
      'Parte Activa Teléfono': '+58 412-1234567',
      'Parte Activa Email': 'juan.perez@email.com',
      'Parte Demandada Nombre': 'María',
      'Parte Demandada Apellido': 'González',
      'Parte Demandada Cédula': 'V-87654321',
      'Tarea': 'Revisar documentos iniciales',
      'Prioridad': 'ALTA',
      'Fecha Vencimiento': '2024-02-01',
      'Asignado A': 'abogado@Vilmega.com',
      'Plantillas': 'Demanda de Divorcio, Poder'
    }
  ];

  // Crear datos de ejemplo para plantillas
  const exampleTemplates = [
    {
      'Nombre': 'Contrato de Servicios Legales',
      'Descripción': 'Plantilla estándar para contratos de servicios',
      'Contenido': 'CONTRATO DE SERVICIOS LEGALES\n\nEntre {{client.name}} y {{firm.name}}...',
      'Categoría': 'contratos',
      'Estado': 'ACTIVE'
    }
  ];

  // Crear workbook con instrucciones
  const wb = XLSX.utils.book_new();
  
  // Hoja de instrucciones
  const instructions = [
    { 'INSTRUCCIONES PARA IMPORTACIÓN': 'Lea atentamente antes de importar' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '1. Complete los datos en las hojas "Casos" y "Plantillas"' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '2. Los campos marcados como obligatorios deben completarse' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '3. Respete los formatos de fecha (YYYY-MM-DD)' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '4. Use los valores exactos para campos de selección' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '5. Guarde el archivo como .xlsx antes de importar' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': 'CAMPOS OBLIGATORIOS PARA CASOS:' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '- Nombre del Caso' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '- Cliente' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': 'CAMPOS OBLIGATORIOS PARA PLANTILLAS:' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '- Nombre' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '- Contenido' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': '' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': 'VALORES PERMITIDOS:' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': 'Tipo Cliente: PERSONA_NATURAL, EMPRESA' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': 'Prioridad: ALTA, MEDIA, BAJA' },
    { 'INSTRUCCIONES PARA IMPORTACIÓN': 'Estado: ACTIVE, INACTIVE' },
  ];
  
  const wsInstructions = XLSX.utils.json_to_sheet(instructions);
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instrucciones');
  
  // Hoja de casos de ejemplo
  const wsCases = XLSX.utils.json_to_sheet(exampleCases);
  XLSX.utils.book_append_sheet(wb, wsCases, 'Casos');
  
  // Hoja de plantillas de ejemplo
  const wsTemplates = XLSX.utils.json_to_sheet(exampleTemplates);
  XLSX.utils.book_append_sheet(wb, wsTemplates, 'Plantillas');
  
  // Descargar archivo
  XLSX.writeFile(wb, 'plantilla_importacion_Vilmega.xlsx');
}

/**
 * Exporta casos con sus plantillas relacionadas a Excel
 */
export async function exportCasesWithTemplates(cases: CaseWithRelations[]): Promise<void> {
  try {
    const casesData = cases.map(caseItem => {
      // Format tasks with numbers like "1 - Task name, 2 - Task name"
      const tasksFormatted = caseItem.tasks?.map((task, index) => 
        `${index + 1} - ${task.description || task.title || 'Tarea sin título'}`
      ).join(', ') || '';

      return {
        'ID Caso': caseItem.id,
        'N° Proceso': caseItem.caseNumber || '', // Added process number
        'Nombre del Caso': caseItem.caseName,
        'Código Interno': caseItem.codigoInterno || '',
        'Cliente': caseItem.client?.name || '',
        'Email Cliente': caseItem.client?.email || '',
        'Teléfono Cliente': caseItem.client?.phone || '',
        'Estado': caseItem.status,
        'Estado Oficial': caseItem.estadoOficial || '',
        'Estado Interno': caseItem.estadoInterno || '',
        'Autoridades': caseItem.authorities || '',
        'Fecha Apertura': caseItem.openingDate ? new Date(caseItem.openingDate).toLocaleDateString('es-ES') : '',
        'Fecha Cierre': caseItem.closingDate ? new Date(caseItem.closingDate).toLocaleDateString('es-ES') : '',
        'Partes Activas': caseItem.partes?.filter(p => p.type === 'ACTIVA').map(p => `${p.firstName} ${p.lastName}`).join(', ') || '',
        'Partes Demandadas': caseItem.partes?.filter(p => p.type === 'DEMANDADA').map(p => `${p.firstName} ${p.lastName}`).join(', ') || '',
        'Tareas Pendientes': caseItem.tasks?.filter(t => t.status === 'ACTIVO').length || 0,
        'Total Tareas': caseItem.tasks?.length || 0,
        'Tareas Detalle': tasksFormatted, // Added formatted tasks
        'Creado': new Date(caseItem.createdAt).toLocaleDateString('es-ES'),
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(casesData);
    
    // Updated column widths to accommodate new columns
    const wscols = [
      { wch: 10 }, // ID
      { wch: 15 }, // N° Proceso
      { wch: 30 }, // Nombre
      { wch: 15 }, // Código Interno
      { wch: 25 }, // Cliente
      { wch: 25 }, // Email
      { wch: 15 }, // Teléfono
      { wch: 15 }, // Estado
      { wch: 20 }, // Estado Oficial
      { wch: 20 }, // Estado Interno
      { wch: 25 }, // Autoridades
      { wch: 15 }, // Fecha Apertura
      { wch: 15 }, // Fecha Cierre
      { wch: 30 }, // Partes Activas
      { wch: 30 }, // Partes Demandadas
      { wch: 15 }, // Tareas Pendientes
      { wch: 15 }, // Total Tareas
      { wch: 50 }, // Tareas Detalle
      { wch: 15 }, // Creado
    ];
    ws['!cols'] = wscols;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Casos');
    XLSX.writeFile(wb, `casos_Vilmega_${new Date().toISOString().split('T')[0]}.xlsx`);
  } catch (error) {
    console.error('Error exportando casos:', error);
    throw new Error('Error al exportar casos a Excel');
  }
}