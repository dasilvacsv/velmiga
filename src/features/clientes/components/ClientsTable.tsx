import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ClientWithStats } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Edit, 
  Trash2, 
  FileText, 
  User as UserIcon, 
  Building2, 
  Mail, 
  Phone,
  ChevronDown, 
  MapPin, 
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, FolderSearch } from 'lucide-react';
import { FixedSizeList as List, areEqual } from 'react-window';
import { VariableSizeList } from 'react-window';
import { PaginatedResult } from '../actions';

// Componente Avatar
const Avatar: React.FC<{ name: string; icon?: React.ReactNode }> = ({ name, icon }) => {
  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) return `${names[0][0]}${names[1]?.[0] || ''}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };
  return (
    <div className="relative inline-flex items-center justify-center w-10 h-10 overflow-hidden bg-orange-100 rounded-full shadow-inner">
      <span className="font-bold text-orange-600 text-sm">{getInitials(name)}</span>
      {icon && <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-md">{icon}</div>}
    </div>
  );
};

// Constantes para el virtual scrolling
const ITEM_HEIGHT = 120; // Altura base de cada fila
const EXPANDED_ITEM_HEIGHT = 240; // Altura cuando está expandida

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading: boolean;
  totalItems: number;
  pageSize: number;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  loading,
  totalItems,
  pageSize
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
      <div className="flex items-center text-sm text-gray-700">
        <span>
          Mostrando {startItem} a {endItem} de {totalItems} clientes
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center space-x-1">
          {getVisiblePages().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <span className="px-3 py-1 text-gray-500">
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              ) : (
                <Button
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  disabled={loading}
                  className={cn(
                    "h-8 w-8 p-0",
                    page === currentPage && "bg-orange-500 hover:bg-orange-600 text-white"
                  )}
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          className="h-8 w-8 p-0"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// Componente de fila individual con memo para optimización
interface ClientRowProps {
  client: ClientWithStats;
  isExpanded: boolean;
  onToggleExpanded: (clientId: string) => void;
  onEdit: (client: ClientWithStats) => void;
  onDelete: (client: ClientWithStats) => void;
  onViewCases: (client: ClientWithStats) => void;
  style?: React.CSSProperties;
}

const ClientRow = React.memo<ClientRowProps>(({
  client,
  isExpanded,
  onToggleExpanded,
  onEdit,
  onDelete,
  onViewCases,
  style
}) => {
  return (
    <div style={style} className="w-full">
      <div className="bg-white rounded-lg shadow-md border transition-all duration-300 mx-4 my-2">
        <div className="p-4 hover:bg-orange-50/50">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4 flex items-center gap-4">
              <Avatar 
                name={client.name} 
                icon={client.clientType === 'EMPRESA' ? <Building2 className="h-3 w-3" /> : <UserIcon className="h-3 w-3" />} 
              />
              <div className="flex-grow">
                <p className="font-bold text-base text-gray-800">{client.name}</p>
                <p className="text-sm text-gray-500">{client.dni || 'Sin DNI/RIF'}</p>
              </div>
            </div>
            
            <div className="md:col-span-2 text-sm text-gray-700 space-y-1">
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{client.phone}</span>
                </div>
              )}
            </div>
            
            <div className="md:col-span-2 flex items-center gap-2 text-sm font-medium text-gray-800">
              <Briefcase className="h-5 w-5 text-orange-500" />
              <div>
                <span>{client._count?.cases || 0}</span>
                <span className="text-gray-500 font-normal"> total</span>
                <span className="text-green-600 font-semibold ml-2">
                  ({client._count?.activeCases || 0}
                </span>
                <span className="text-gray-500 font-normal"> activos)</span>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <div className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
                client.status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-700'
              )}>
                {client.status === 'ACTIVE' 
                  ? <CheckCircle2 className="h-3.5 w-3.5" /> 
                  : <XCircle className="h-3.5 w-3.5" />}
                {client.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
              </div>
            </div>
            
            <div className="md:col-span-2 flex items-center justify-start md:justify-end gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onToggleExpanded(client.id)} 
                title={isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
              >
                <ChevronDown className={cn(
                  "h-5 w-5 text-gray-500 transition-transform", 
                  isExpanded && "rotate-180"
                )} />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onEdit(client)} 
                title="Editar"
              >
                <Edit className="h-5 w-5 text-gray-500 hover:text-orange-600" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onDelete(client)} 
                title="Eliminar"
              >
                <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-600" />
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onViewCases(client)} 
                className="ml-2 border-orange-200 text-orange-700 hover:bg-orange-100 hover:text-orange-800"
              >
                <FileText className="h-4 w-4 mr-2" /> Casos
              </Button>
            </div>
          </div>
        </div>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }} 
              transition={{ duration: 0.3, ease: 'easeInOut' }} 
              className="overflow-hidden"
            >
              <div className="bg-orange-50/30 border-t border-orange-200/50 p-6">
                <h4 className="font-bold text-md mb-4 text-gray-800">
                  Detalles Adicionales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-600">Dirección</p>
                      <p className="text-gray-800">{client.address || 'No especificada'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-600">Fecha de Registro</p>
                      <p className="text-gray-800">
                        {format(new Date(client.createdAt), "dd 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <RefreshCcw className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-600">Última Actualización</p>
                      <p className="text-gray-800">
                        {format(new Date(client.updatedAt), "dd 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}, areEqual);

ClientRow.displayName = 'ClientRow';

interface ClientsTableProps {
  paginatedData: PaginatedResult<ClientWithStats> | null;
  onEdit: (client: ClientWithStats) => void;
  onDelete: (client: ClientWithStats) => void;
  onViewCases: (client: ClientWithStats) => void;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({ 
  paginatedData,
  onEdit, 
  onDelete, 
  onViewCases,
  onPageChange,
  loading = false 
}) => {
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const listRef = useRef<VariableSizeList>(null);

  const handleToggleDetails = useCallback((clientId: string) => {
    setExpandedClientId(prevId => {
      const newId = prevId === clientId ? null : clientId;
      // Reset sizes when expanding/collapsing
      if (listRef.current) {
        listRef.current.resetAfterIndex(0);
      }
      return newId;
    });
  }, []);

  const getItemSize = useCallback((index: number) => {
    if (!paginatedData?.data[index]) return ITEM_HEIGHT;
    const client = paginatedData.data[index];
    return expandedClientId === client.id ? EXPANDED_ITEM_HEIGHT : ITEM_HEIGHT;
  }, [expandedClientId, paginatedData?.data]);

  const renderRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    if (!paginatedData?.data[index]) return null;
    
    const client = paginatedData.data[index];
    const isExpanded = expandedClientId === client.id;

    return (
      <ClientRow
        key={client.id}
        client={client}
        isExpanded={isExpanded}
        onToggleExpanded={handleToggleDetails}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewCases={onViewCases}
        style={style}
      />
    );
  }, [paginatedData?.data, expandedClientId, handleToggleDetails, onEdit, onDelete, onViewCases]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 text-orange-500 animate-spin" />
        <p className="ml-4 text-gray-600">Cargando clientes...</p>
      </div>
    );
  }

  if (!paginatedData || paginatedData.data.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderSearch className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No se encontraron clientes
        </h3>
        <p className="mt-2 text-gray-500">
          No hay clientes que coincidan con los filtros seleccionados
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header de la tabla */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 bg-gray-50 rounded-t-lg border-b font-semibold text-xs text-gray-500 uppercase tracking-wider">
        <div className="col-span-4">Cliente</div>
        <div className="col-span-2">Contacto</div>
        <div className="col-span-2">Casos</div>
        <div className="col-span-2">Estado</div>
        <div className="col-span-2 text-right">Acciones</div>
      </div>
      
      {/* Lista virtual */}
      <div className="h-[600px]"> {/* Altura fija para el virtual scrolling */}
        <VariableSizeList
          ref={listRef}
          height={600}
          itemCount={paginatedData.data.length}
          itemSize={getItemSize}
          overscanCount={2}
        >
          {renderRow}
        </VariableSizeList>
      </div>

      {/* Controles de paginación */}
      <PaginationControls
        currentPage={paginatedData.page}
        totalPages={paginatedData.totalPages}
        onPageChange={onPageChange}
        loading={loading}
        totalItems={paginatedData.total}
        pageSize={paginatedData.pageSize}
      />
    </div>
  );
};