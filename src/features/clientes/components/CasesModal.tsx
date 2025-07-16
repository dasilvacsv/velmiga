// src/features/clientes/components/CasesModal.tsx
import React, { useState } from 'react';
import { ClientWithStats, CaseWithRelations } from '@/lib/types';
import { 
  X, 
  Calendar, 
  User as UserIcon, 
  Users as TeamIcon,
  Briefcase,
  CheckCircle,
  XCircle,
  Pause,
  Clock,
  ChevronDown,
  FileText,
  Hash,
  ExternalLink,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  BookText,
  Gavel,
  Link as LinkIcon,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';
import { cn, getInitials } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// Componente para mostrar el avatar
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

// Configuración de estados para casos
const statusConfig = {
  ACTIVO: { 
    label: 'Activo', 
    icon: <CheckCircle className="w-4 h-4" />, 
    className: "bg-green-100 text-green-700 border-green-200",
    gradient: "from-green-500 to-emerald-500"
  },
  EN_ESPERA: { 
    label: 'En Espera', 
    icon: <Pause className="w-4 h-4" />, 
    className: "bg-amber-100 text-amber-700 border-amber-200",
    gradient: "from-amber-500 to-yellow-500"
  },
  CERRADO: { 
    label: 'Cerrado', 
    icon: <XCircle className="w-4 h-4" />, 
    className: "bg-gray-100 text-gray-700 border-gray-200",
    gradient: "from-gray-500 to-slate-500"
  },
  ARCHIVADO: { 
    label: 'Archivado', 
    icon: <Clock className="w-4 h-4" />, 
    className: "bg-red-100 text-red-700 border-red-200",
    gradient: "from-red-500 to-rose-500"
  }
};

interface CasesModalProps {
  client: ClientWithStats;
  cases: CaseWithRelations[];
  isLoading: boolean;
  onClose: () => void;
}

export const CasesModal: React.FC<CasesModalProps> = ({ 
  client, 
  cases, 
  isLoading, 
  onClose 
}) => {
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  
  const toggleCaseExpansion = (caseId: string) => {
    setExpandedCaseId(expandedCaseId === caseId ? null : caseId);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0, scale: 0.95 }} 
          transition={{ duration: 0.2 }}
          className="w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-200/50 relative bg-white rounded-xl"
        >
          {/* Barra superior de estado */}
          <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-blue-600" />

          {/* Encabezado del modal */}
          <header className="bg-slate-50 p-6 border-b border-slate-200 rounded-t-xl">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4 min-w-0 flex-1">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0 flex items-center justify-center text-white shadow-md">
                  <Users className="w-7 h-7" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <h1 className="text-2xl font-bold text-slate-800 leading-tight">
                    Casos de {client.name}
                  </h1>
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
                      <Briefcase className="w-3 h-3 mr-1.5" />
                      {cases.length} caso(s) registrado(s)
                    </span>
                  </div>
                </div>
              </div>

              {/* Botón de cerrar */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose} 
                className="rounded-full h-9 w-9 hover:bg-slate-200/80"
              >
                <X className="h-5 w-5 text-slate-500" />
              </Button>
            </div>
          </header>

          {/* Contenido principal con barra de desplazamiento */}
          <main className="flex-1 overflow-y-auto bg-white">
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-600">Cargando casos...</p>
                  </div>
                </div>
              ) : cases.length === 0 ? (
                <div className="text-center py-10">
                  <Briefcase className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No se encontraron casos
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Este cliente no tiene casos registrados en el sistema.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cases.map((caseItem) => {
                    const isExpanded = expandedCaseId === caseItem.id;
                    const status = statusConfig[caseItem.status] || statusConfig.ACTIVO;
                    const client = caseItem.client;
                    
                    return (
                      <Card 
                        key={caseItem.id} 
                        className="bg-white shadow-sm overflow-hidden border border-gray-200"
                      >
                        {/* Encabezado del caso - siempre visible */}
                        <div 
                          className="p-4 bg-gray-50 border-b cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleCaseExpansion(caseItem.id)}
                        >
                          <div className="flex justify-between items-center gap-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${status.className}`}>
                                <Briefcase className="w-5 h-5" />
                              </div>
                              <div>
                                <CardTitle className="text-base font-bold">
                                  {caseItem.caseName}
                                </CardTitle>
                                <p className="text-sm text-gray-500">
                                  Nº de Caso: {caseItem.caseNumber || 'N/A'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                                  status.className
                                )}
                              >
                                {status.icon}
                                <span className="ml-1.5">{status.label}</span>
                              </span>
                              <ChevronDown className={cn(
                                "h-5 w-5 text-gray-500 transition-transform",
                                isExpanded && "rotate-180"
                              )} />
                            </div>
                          </div>
                        </div>

                        {/* Contenido expandible del caso */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <CardContent className="p-4 text-sm">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  {/* Columna 1: Información general del caso */}
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        Información del Caso
                                      </h4>
                                      <div className="space-y-3">
                                        {caseItem.description && (
                                          <div className="flex items-start gap-3">
                                            <FileText className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                                            <p>
                                              <span className="font-semibold">Descripción:</span>{' '}
                                              {caseItem.description}
                                            </p>
                                          </div>
                                        )}
                                        
                                        <div className="flex items-start gap-3">
                                          <Hash className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                                          <p>
                                            <span className="font-semibold">Código interno:</span>{' '}
                                            {caseItem.codigoInterno || 'N/A'}
                                          </p>
                                        </div>
                                        
                                        <div className="flex items-start gap-3">
                                          <ShieldCheck className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                                          <p>
                                            <span className="font-semibold">Estado oficial:</span>{' '}
                                            {caseItem.estadoOficial || 'N/A'}
                                          </p>
                                        </div>
                                        
                                        <div className="flex items-start gap-3">
                                          <ShieldCheck className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                                          <p>
                                            <span className="font-semibold">Estado interno:</span>{' '}
                                            {caseItem.estadoInterno || 'N/A'}
                                          </p>
                                        </div>
                                        
                                        {caseItem.authorities && (
                                          <div className="flex items-start gap-3">
                                            <Gavel className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                                            <p>
                                              <span className="font-semibold">Autoridades:</span>{' '}
                                              {caseItem.authorities}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Fechas
                                      </h4>
                                      <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                          <Calendar className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                                          <p>
                                            <span className="font-semibold">Apertura:</span>{' '}
                                            {caseItem.openingDate ? 
                                              format(new Date(caseItem.openingDate), 'dd/MM/yyyy', { locale: es }) : 
                                              'N/A'}
                                          </p>
                                        </div>
                                        
                                        {caseItem.closingDate && (
                                          <div className="flex items-start gap-3">
                                            <Calendar className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                                            <p>
                                              <span className="font-semibold">Cierre:</span>{' '}
                                              {format(new Date(caseItem.closingDate), 'dd/MM/yyyy', { locale: es })}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Columna 2: Información del cliente */}
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <UserIcon className="h-4 w-4" />
                                        Cliente
                                      </h4>
                                      {client ? (
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                                              {getInitials(client.name)}
                                            </div>
                                            <div>
                                              <p className="font-bold text-gray-900">{client.name}</p>
                                              <p className="text-xs text-gray-600">
                                                {client.clientType === 'PERSONA_NATURAL' ? 'Persona Natural' : 'Empresa'}
                                              </p>
                                            </div>
                                          </div>
                                          
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
                                            {client.address && (
                                              <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <MapPin className="w-4 h-4 mt-0.5" />
                                                <span>{client.address}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-gray-500">Cliente no asignado</p>
                                      )}
                                    </div>
                                    
                                    {caseItem.hyperlinkUrl && (
                                      <div>
                                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                          <LinkIcon className="h-4 w-4" />
                                          Enlace externo
                                        </h4>
                                        <a 
                                          href={caseItem.hyperlinkUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                          <span>Ver enlace</span>
                                          <ExternalLink className="h-3 w-3" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Columna 3: Equipo y detalles adicionales */}
                                  <div className="space-y-4">
                                    {caseItem.teamMembers && caseItem.teamMembers.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                          <TeamIcon className="h-4 w-4" />
                                          Equipo Asignado
                                        </h4>
                                        <div className="space-y-3">
                                          {caseItem.teamMembers.map(({ user, roleInCase }) => user && (
                                            <div key={user.id} className="flex items-center gap-3">
                                              <Avatar name={`${user.firstName} ${user.lastName}`} />
                                              <div>
                                                <p className="font-medium text-gray-900">
                                                  {user.firstName} {user.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  {roleInCase}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    
                                    {caseItem.partes && caseItem.partes.length > 0 && (
                                      <div>
                                        <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                          <UserIcon className="h-4 w-4" />
                                          Partes Procesales
                                        </h4>
                                        <div className="space-y-2">
                                          {caseItem.partes.slice(0, 3).map(parte => (
                                            <div key={parte.id} className="flex items-center gap-2">
                                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                                parte.type === 'ACTIVA' ? 'bg-green-500' : 'bg-red-500'
                                              }`}>
                                                {getInitials(`${parte.firstName} ${parte.lastName}`)}
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium">
                                                  {parte.firstName} {parte.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                  {parte.type === 'ACTIVA' ? 'Parte Activa' : 'Parte Demandada'}
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                          {caseItem.partes.length > 3 && (
                                            <p className="text-sm text-blue-600">
                                              +{caseItem.partes.length - 3} partes más
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};