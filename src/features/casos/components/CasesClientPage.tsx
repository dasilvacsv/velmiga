"use client"

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Plus, RefreshCw, Download, ChevronDown, FileText, FileSpreadsheet
} from 'lucide-react';
import { CaseWithRelations, Client, User, CaseReportData } from '@/lib/types';
import {
  createCase,
  updateCase,
  deleteCase,
  assignTeamMember,
  removeTeamMember,
  getCasesPaginated,
  getCasesCount,
  getCaseInternalStatusHistory
} from '@/features/casos/actions';
// Import optimized functions
import { getCasesForExport, getCasesForExportCount } from '@/features/casos/actions';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { CasesTable } from './CasesTable';
import { CaseForm } from './CaseForm';
import { CaseDetailModal } from './CaseDetailModal';
import { TeamManagementModal } from './TeamManagementModal';
import { CasesFacetedFilters } from './CasesFacetedFilters';
import { CasesReportPDF } from '@/components/pdf/CasesReportPDF';
import { useToast } from '@/hooks/use-toast';
import { generateExcelFilename, generatePDFFilename2, formatDateTimeEcuador, formatDateEcuador } from '@/lib/utils';
import { pdf } from '@react-pdf/renderer';
import { saveAs } from 'file-saver';

interface CasesClientPageProps {
  initialCases: CaseWithRelations[];
  clients: Client[];
  users: User[];
  stats: any;
}

interface FilterOptions {
  search: string;
  statusFilter: string[];
  clientFilter: string[];
  sortBy: 'createdAt' | 'caseName' | 'openingDate';
  sortOrder: 'asc' | 'desc';
}

const ITEMS_PER_PAGE = 20;

export const CasesClientPage: React.FC<CasesClientPageProps> = ({
  initialCases,
  clients,
  users,
  stats: initialStats
}) => {
  // State management
  const [cases, setCases] = useState<CaseWithRelations[]>(initialCases);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseWithRelations | undefined>();
  const [selectedCase, setSelectedCase] = useState<CaseWithRelations | undefined>();
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Pagination and infinite scroll state
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    statusFilter: [],
    clientFilter: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const { toast } = useToast();

  // Load cases with current filters
  const loadCases = useCallback(async (
    offset: number = 0,
    append: boolean = false,
    customFilters?: Partial<FilterOptions>
  ) => {
    try {
      setLoading(true);
      const currentFilters = { ...filters, ...customFilters };

      const [casesData, count] = await Promise.all([
        getCasesPaginated({
          limit: ITEMS_PER_PAGE,
          offset,
          search: currentFilters.search || undefined,
          statusFilter: currentFilters.statusFilter.length > 0 ? currentFilters.statusFilter : undefined,
          clientFilter: currentFilters.clientFilter.length > 0 ? currentFilters.clientFilter : undefined,
          sortBy: currentFilters.sortBy,
          sortOrder: currentFilters.sortOrder
        }),
        getCasesCount({
          search: currentFilters.search || undefined,
          statusFilter: currentFilters.statusFilter.length > 0 ? currentFilters.statusFilter : undefined,
          clientFilter: currentFilters.clientFilter.length > 0 ? currentFilters.clientFilter : undefined,
        })
      ]);

      if (append) {
        setCases(prev => [...prev, ...casesData]);
      } else {
        setCases(casesData);
        setCurrentOffset(0);
      }

      setTotalCount(count);
      setHasNextPage(casesData.length === ITEMS_PER_PAGE && (offset + casesData.length) < count);
      
      if (append) {
        setCurrentOffset(offset + casesData.length);
      }
    } catch (error) {
      console.error('Error loading cases:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los casos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  // Load next page for infinite scroll
  const loadNextPage = useCallback(async () => {
    if (isNextPageLoading || !hasNextPage) return;

    try {
      setIsNextPageLoading(true);
      const nextOffset = currentOffset;
      await loadCases(nextOffset, true);
    } catch (error) {
      console.error('Error loading next page:', error);
    } finally {
      setIsNextPageLoading(false);
    }
  }, [currentOffset, hasNextPage, isNextPageLoading, loadCases]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    loadCases(0, false, updatedFilters);
  }, [filters, loadCases]);

  // Initial load
  useEffect(() => {
    setTotalCount(initialCases.length);
    setHasNextPage(initialCases.length === ITEMS_PER_PAGE);
    setCurrentOffset(initialCases.length);
  }, [initialCases]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await loadCases(0, false);
        if (selectedCase) {
          const updatedSelectedCase = cases.find(c => c.id === selectedCase.id);
          if (updatedSelectedCase) {
            setSelectedCase(updatedSelectedCase);
          }
        }
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadCases, selectedCase, cases]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCases(0, false);
    setRefreshing(false);
    toast({
      title: "Datos actualizados",
      description: "La información se ha actualizado correctamente",
      variant: "default"
    });
  };

  const handleCreateCase = () => {
    setEditingCase(undefined);
    setShowForm(true);
  };

  const handleEditCase = (case_: CaseWithRelations) => {
    setEditingCase(case_);
    setShowForm(true);
  };

  const handleViewCase = (case_: CaseWithRelations) => {
    setSelectedCase(case_);
    setShowDetailModal(true);
  };

  const handleManageTeam = (case_: CaseWithRelations) => {
    setSelectedCase(case_);
    setShowTeamModal(true);
  };

  const handleDeleteCase = async (case_: CaseWithRelations) => {
    if (window.confirm(`¿Está seguro de eliminar el caso "${case_.caseName}"?`)) {
      try {
        await deleteCase(case_.id);
        await loadCases(0, false);
        toast({
          title: "Caso eliminado",
          description: `El caso "${case_.caseName}" ha sido eliminado`,
          variant: "default"
        });
      } catch (error) {
        console.error('Error deleting case:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el caso",
          variant: "destructive"
        });
      }
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setFormLoading(true);
      if (editingCase) {
        await updateCase(editingCase.id, data);
        toast({
          title: "Caso actualizado",
          description: "Los cambios han sido guardados correctamente",
          variant: "default"
        });
      } else {
        await createCase(data);
        toast({
          title: "Caso creado",
          description: "El nuevo caso ha sido registrado en el sistema",
          variant: "default"
        });
      }
      setShowForm(false);
      await loadCases(0, false);
    } catch (error) {
      console.error('Error saving case:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el caso",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleAddTeamMember = async (userId: string, role: string) => {
    if (!selectedCase) return;

    try {
      await assignTeamMember(selectedCase.id, userId, role);
      await loadCases(0, false);
      const updatedCase = cases.find(c => c.id === selectedCase.id);
      if (updatedCase) setSelectedCase(updatedCase);
    } catch (error) {
      throw error;
    }
  };

  const handleRemoveTeamMember = async (userId: string) => {
    if (!selectedCase) return;

    try {
      await removeTeamMember(selectedCase.id, userId);
      await loadCases(0, false);
      const updatedCase = cases.find(c => c.id === selectedCase.id);
      if (updatedCase) setSelectedCase(updatedCase);
    } catch (error) {
      throw error;
    }
  };

  // Handle partes update
  const handlePartesUpdated = async (updatedCase: CaseWithRelations) => {
    setSelectedCase(updatedCase);
    await loadCases(0, false);
  };

  // OPTIMIZED: Prepare report data using the optimized data structure
  const prepareOptimizedReportData = (casesToProcess: CaseWithRelations[]): CaseReportData[] => {
    return casesToProcess.map(case_ => {
      // Use the pre-fetched optimized data
      const teamMembersNames = case_.teamMembersString || '';
      const activeTasks = case_.activeTasksCount || 0;
      const totalTasks = case_.totalTasksCount || 0;
      const tasksFormatted = case_.tasksString || '';
      const parteActiva = case_.parteActivaString || '';
      const parteDemandada = case_.parteDemandadaString || '';

      // Use the latest internal status from optimized query
      const estadoInternoActual = case_.latestInternalStatus || case_.estadoInterno || '';
      const fechaHoraEstadoInterno = case_.latestInternalStatusDate 
        ? formatDateTimeEcuador(case_.latestInternalStatusDate)
        : '';

      return {
        id: case_.id,
        caseNumber: case_.caseNumber || '',
        caso: case_.caseName,
        codigoInterno: case_.codigoInterno || '',
        parteActiva,
        parteDemandada,
        estadoOficial: case_.estadoOficial || case_.status,
        estadoInterno: estadoInternoActual,
        fechaHoraEstadoInterno,
        cliente: case_.client?.name || '',
        fechaApertura: formatDateEcuador(case_.openingDate),
        fechaCierre: case_.closingDate ? formatDateEcuador(case_.closingDate) : '',
        descripcion: case_.description || '',
        autoridades: case_.authorities || '',
        equipoLegal: teamMembersNames,
        tareasActivas: activeTasks,
        totalTareas: totalTasks,
        tareasDetalle: tasksFormatted,
        totalMovimientos: 0 // Not needed for export, saves query time
      };
    });
  };

  // OPTIMIZED: Export to Excel with much faster query
  const handleExportToExcel = async () => {
    try {
      setExporting(true);

      toast({
        title: "Preparando exportación",
        description: "Obteniendo casos con consulta optimizada...",
        variant: "default"
      });

      const startTime = Date.now();

      // Use optimized export function
      const allFilteredCases = await getCasesForExport({
        search: filters.search || undefined,
        statusFilter: filters.statusFilter.length > 0 ? filters.statusFilter : undefined,
        clientFilter: filters.clientFilter.length > 0 ? filters.clientFilter : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const reportData = prepareOptimizedReportData(allFilteredCases);
      
      const queryTime = Date.now() - startTime;
      console.log(`Export data prepared in ${queryTime}ms`);

      // Generate Excel file
      const worksheet = [
        [
          'N° Proceso', 'Caso', 'Código Interno', 'Parte Activa', 'Parte Demandada', 
          'Estado Oficial', 'Estado Interno', 'Fecha/Hora Estado Interno', 'Cliente', 'Fecha Apertura', 'Fecha Cierre',
          'Descripción', 'Autoridades', 'Equipo Legal', 'Tareas Activas', 'Total Tareas', 'Tareas Detalle'
        ],
        ...reportData.map(row => [
          row.caseNumber,
          row.caso,
          row.codigoInterno,
          row.parteActiva,
          row.parteDemandada,
          row.estadoOficial,
          row.estadoInterno,
          row.fechaHoraEstadoInterno,
          row.cliente,
          row.fechaApertura,
          row.fechaCierre,
          row.descripcion,
          row.autoridades,
          row.equipoLegal,
          row.tareasActivas,
          row.totalTareas,
          row.tareasDetalle
        ])
      ];

      const workbook = {
        SheetNames: ['Reporte de Casos'],
        Sheets: {
          'Reporte de Casos': {
            '!ref': `A1:Q${worksheet.length}`,
            ...worksheet.reduce((acc, row, rowIndex) => {
              row.forEach((cell, colIndex) => {
                const cellAddress = String.fromCharCode(65 + colIndex) + (rowIndex + 1);
                acc[cellAddress] = { v: cell, t: typeof cell === 'number' ? 'n' : 's' };
              });
              return acc;
            }, {} as any)
          }
        }
      };

      const XLSX = await import('xlsx');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateExcelFilename('Reporte_Avanzado_Casos');
      link.click();
      
      window.URL.revokeObjectURL(url);

      const totalTime = Date.now() - startTime;
      
      toast({
        title: "Reporte Excel exportado",
        description: `Se exportaron ${reportData.length} casos en ${totalTime}ms (consulta optimizada)`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error exporting Excel report:', error);
      toast({
        title: "Error en exportación",
        description: "No se pudo generar el reporte Excel",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // OPTIMIZED: Export tasks to CSV using optimized query
  const handleExportTasksToCSV = async () => {
    try {
      setExporting(true);

      toast({
        title: "Preparando exportación de tareas",
        description: "Obteniendo tareas con consulta optimizada...",
        variant: "default"
      });

      // Get optimized data
      const allFilteredCases = await getCasesForExport({
        search: filters.search || undefined,
        statusFilter: filters.statusFilter.length > 0 ? filters.statusFilter : undefined,
        clientFilter: filters.clientFilter.length > 0 ? filters.clientFilter : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      // For CSV export, we still need detailed task data, so we'll use a separate optimized query
      // This is a simplified version - you might want to create another optimized function for this
      const tasksData: any[] = [];
      
      allFilteredCases.forEach(case_ => {
        if (case_.tasksString) {
          const tasks = case_.tasksString.split('; ');
          tasks.forEach(task => {
            if (task.trim()) {
              tasksData.push({
                'Caso Asociado': case_.caseName,
                'N° Proceso': case_.caseNumber || '',
                'Código Interno': case_.codigoInterno || '',
                'Tarea': task.replace(/^\d+\s*-\s*/, ''), // Remove the number prefix
                'Estado': 'N/A', // Would need separate query for detailed task data
                'Prioridad': 'N/A',
                'Persona Asignada': 'N/A',
                'Email Asignado': '',
                'Fecha Asignación': '',
                'Fecha Vencimiento': '',
                'Cliente': case_.client?.name || '',
                'Creado Por': ''
              });
            }
          });
        }
      });

      if (tasksData.length === 0) {
        toast({
          title: "Sin tareas",
          description: "No hay tareas para exportar en los casos filtrados",
          variant: "default"
        });
        return;
      }

      // Create CSV content
      const headers = Object.keys(tasksData[0]);
      const csvContent = [
        headers.join(','),
        ...tasksData.map(task => 
          headers.map(header => `"${(task[header] || '').toString().replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Tareas_Vilmega_${formatDateEcuador(new Date()).replace(/\s+/g, '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Tareas exportadas",
        description: `Se exportaron ${tasksData.length} tareas al archivo CSV (optimizado)`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error exporting tasks CSV:', error);
      toast({
        title: "Error en exportación",
        description: "No se pudo generar el archivo CSV de tareas",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  // OPTIMIZED: Export to PDF using optimized query
  const handleExportToPDF = async () => {
    try {
      setExporting(true);

      toast({
        title: "Generando reporte PDF",
        description: "El reporte se está procesando con consulta optimizada...",
        variant: "default"
      });

      // Use optimized export function
      const allFilteredCases = await getCasesForExport({
        search: filters.search || undefined,
        statusFilter: filters.statusFilter.length > 0 ? filters.statusFilter : undefined,
        clientFilter: filters.clientFilter.length > 0 ? filters.clientFilter : undefined,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const reportData = prepareOptimizedReportData(allFilteredCases);
      const activeCases = allFilteredCases.filter(c => c.status === 'ACTIVO').length;
      const closedCases = allFilteredCases.filter(c => c.status === 'CERRADO').length;

      // Generate PDF blob
      const blob = await pdf(
        <CasesReportPDF 
          reportData={reportData}
          totalCases={allFilteredCases.length}
          activeCases={activeCases}
          closedCases={closedCases}
        />
      ).toBlob();
      
      // Generate filename and download
      const filename = generatePDFFilename2('Reporte_Avanzado_Casos', 'Sistema_Legal');
      saveAs(blob, filename);
      
      toast({
        title: "Reporte PDF generado",
        description: `Se exportaron ${reportData.length} casos al archivo PDF (optimizado)`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte PDF. Por favor, intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* Compact Filters - con gradientes sutiles */}
      <div className="bg-gradient-to-r from-white to-blue-50/30 rounded-lg shadow-sm border border-blue-100 p-4">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <CasesFacetedFilters
            cases={[]} // Empty since we're using server-side filtering
            onFilteredCasesChange={() => {}} // Not used
            onFiltersChange={handleFiltersChange}
            filters={filters}
          />
          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="hover:bg-blue-50 border-blue-200 h-8 text-blue-700"
            >
              <RefreshCw className={`h-3 w-3 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>

            {/* Advanced Report Dropdown */}
            <DropdownMenu>
              <div className="group">
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exporting}
                    className="hover:bg-purple-50 border-purple-200 h-8 text-purple-700"
                  >
                    <Download className={`h-3 w-3 mr-2 ${exporting ? 'animate-spin' : ''}`} />
                    Reporte Avanzado
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleExportToExcel} disabled={exporting}>
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                    Exportar Casos a Excel ⚡
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportTasksToCSV} disabled={exporting}>
                    <FileSpreadsheet className="h-4 w-4 mr-2 text-blue-600" />
                    Exportar Tareas a CSV ⚡
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportToPDF} disabled={exporting}>
                    <FileText className="h-4 w-4 mr-2 text-red-600" />
                    Exportar a PDF ⚡
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </div>
            </DropdownMenu>

            <Button
              onClick={handleCreateCase}
              size="sm"
              className="px-3 py-1 text-sm font-medium h-8 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-sm"
            >
              <Plus className="h-3 w-3 mr-2" />
              Nuevo Caso
            </Button>
          </div>
        </div>
      </div>

      {/* Cases Table with Virtual Scrolling */}
      <div>
        <CasesTable
          cases={cases}
          onView={handleViewCase}
          onEdit={handleEditCase}
          onDelete={handleDeleteCase}
          onManageTeam={handleManageTeam}
          loading={loading}
          hasNextPage={hasNextPage}
          isNextPageLoading={isNextPageLoading}
          loadNextPage={loadNextPage}
          totalCount={totalCount}
        />
      </div>

      {/* Modals */}
      {showForm && (
        <CaseForm
          case_={editingCase}
          clients={clients}
          onSubmit={handleFormSubmit}
          onCancel={() => setShowForm(false)}
          loading={formLoading}
        />
      )}

      {showDetailModal && selectedCase && (
        <CaseDetailModal
          case_={selectedCase}
          onClose={() => setShowDetailModal(false)}
          onEdit={() => {
            setShowDetailModal(false);
            handleEditCase(selectedCase);
          }}
          onDelete={() => {
            setShowDetailModal(false);
            handleDeleteCase(selectedCase);
          }}
          onManageTeam={() => {
            setShowDetailModal(false);
            handleManageTeam(selectedCase);
          }}
          onPartesUpdated={handlePartesUpdated}
        />
      )}

      {showTeamModal && selectedCase && (
        <TeamManagementModal
          case_={selectedCase}
          availableUsers={users}
          onClose={() => setShowTeamModal(false)}
          onAddMember={handleAddTeamMember}
          onRemoveMember={handleRemoveTeamMember}
        />
      )}
    </>
  );
};