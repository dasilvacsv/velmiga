import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import {
    Activity, AlertCircle, Briefcase, Calendar as CalendarIcon, Check, ChevronsUpDown,
    FileText, Hash, HelpCircle, Loader2, PenSquare, Save, Scale, User, X, CheckCircle, XCircle, Pause, Archive, Code, Shield
} from 'lucide-react';

import { CaseWithRelations, Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const caseSchema = z.object({
  caseName: z.string().min(1, 'El nombre del caso es requerido'),
  clientId: z.string().min(1, 'Debe seleccionar un cliente'),
  description: z.string().optional(),
  caseNumber: z.string().optional(),
  codigoInterno: z.string().optional(),
  status: z.enum(['ACTIVO', 'EN_ESPERA', 'CERRADO', 'ARCHIVADO']),
  estadoOficial: z.string().optional(),
  estadoInterno: z.string().optional(),
  authorities: z.string().optional(),
  openingDate: z.date({ required_error: 'La fecha de apertura es requerida' }),
  closingDate: z.date().optional(),
});

type CaseFormData = z.infer<typeof caseSchema>;

const statusOptions = [
    { 
      value: 'ACTIVO', 
      label: 'Activo', 
      icon: <CheckCircle className="h-4 w-4" />, 
      color: 'text-green-600',
      description: 'Caso en proceso activo'
    },
    { 
      value: 'EN_ESPERA', 
      label: 'En Espera', 
      icon: <Pause className="h-4 w-4" />, 
      color: 'text-amber-600',
      description: 'Caso pausado temporalmente'
    },
    { 
      value: 'CERRADO', 
      label: 'Cerrado', 
      icon: <XCircle className="h-4 w-4" />, 
      color: 'text-gray-600',
      description: 'Caso finalizado exitosamente'
    },
    { 
      value: 'ARCHIVADO', 
      label: 'Archivado', 
      icon: <Archive className="h-4 w-4" />, 
      color: 'text-red-600',
      description: 'Caso archivado o cancelado'
    },
];

interface CaseFormProps {
  case_?: CaseWithRelations;
  clients: Client[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const CaseForm: React.FC<CaseFormProps> = ({ case_, clients, onSubmit, onCancel, loading = false }) => {
  const isEditing = Boolean(case_);
  
  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseSchema),
    defaultValues: case_ ? {
        ...case_,
        description: case_.description || '',
        caseNumber: case_.caseNumber || '',
        codigoInterno: case_.codigoInterno || '',
        estadoOficial: case_.estadoOficial || '',
        estadoInterno: case_.estadoInterno || '',
        authorities: case_.authorities || '',
        openingDate: case_.openingDate ? new Date(case_.openingDate) : new Date(),
        closingDate: case_.closingDate ? new Date(case_.closingDate) : undefined,
    } : {
        status: 'ACTIVO',
        caseNumber: '',
        codigoInterno: '',
        openingDate: new Date(),
    }
  });

  const { handleSubmit, control, formState: { errors }, watch, setValue } = form;
  const watchedStatus = watch('status');
  const watchedOpeningDate = watch('openingDate');

  const handleFormSubmit = (data: CaseFormData) => {
    const submissionData = {
      ...data,
      openingDate: data.openingDate.toISOString().split('T')[0],
      closingDate: data.closingDate ? data.closingDate.toISOString().split('T')[0] : null,
    };
    onSubmit(submissionData);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-500">
      <div className="bg-white dark:bg-black/50 rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-200/50 dark:border-gray-800 relative">
        
        {/* Gradient decorative header */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600" />
        
        <header className="bg-gradient-to-br from-white via-amber-50/30 to-white dark:from-gray-900 dark:via-amber-900/10 dark:to-gray-950 p-8 border-b border-gray-200/50 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-gradient-to-br from-amber-500 to-yellow-500 p-4 rounded-2xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <Scale className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {isEditing ? 'Editar Caso Legal' : 'Crear Nuevo Caso'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {isEditing ? `Modificando: ${case_?.caseName}` : 'Configure los detalles del nuevo expediente legal'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onCancel} 
              disabled={loading} 
              className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 hover:scale-110"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </header>

        <main className="overflow-y-auto flex-1 bg-gradient-to-br from-gray-50/50 to-white">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8 space-y-8">
            
            {/* Información Principal */}
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Información Principal</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <Controller name="caseName" control={control} render={({ field }) => (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Nombre del Caso <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-200" />
                      <input 
                        {...field} 
                        placeholder="Ej: Demanda por incumplimiento contractual - Empresa ABC vs Proveedor XYZ" 
                        className="w-full h-14 pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base placeholder-gray-400 hover:border-gray-300" 
                        disabled={loading} 
                      />
                    </div>
                    {errors.caseName && (
                      <div className="mt-2 text-sm text-red-600 font-medium flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        {errors.caseName.message}
                      </div>
                    )}
                  </div>
                )} />

                <Controller name="clientId" control={control} render={({ field }) => (
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          Cliente Asociado <span className="text-red-500">*</span>
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  role="combobox" 
                                  className="w-full justify-between h-14 text-base font-normal text-gray-900 bg-gray-50/50 border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200" 
                                  disabled={loading}
                                >
                                    <span className="flex items-center gap-3 truncate">
                                        <User className="h-5 w-5 text-gray-400" />
                                        {field.value ? clients.find(c => c.id === field.value)?.name : "Seleccionar cliente..."}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                                <Command>
                                    <CommandInput placeholder="Buscar cliente..." />
                                    <CommandList>
                                      <CommandEmpty>No se encontraron clientes.</CommandEmpty>
                                      <CommandGroup>
                                        {clients.map(client => (
                                            <CommandItem 
                                              key={client.id} 
                                              value={client.name} 
                                              onSelect={() => setValue("clientId", client.id, { shouldValidate: true })}
                                              className="flex items-center gap-3 p-3 hover:bg-amber-50 rounded-lg cursor-pointer"
                                            >
                                                <Check className={cn("h-4 w-4", field.value === client.id ? "opacity-100 text-amber-500" : "opacity-0")} />
                                                <div className="flex items-center gap-3">
                                                  <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-yellow-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                    {client.name.charAt(0).toUpperCase()}
                                                  </div>
                                                  <div>
                                                    <p className="font-medium">{client.name}</p>
                                                    <p className="text-xs text-gray-500">{client.clientType === 'PERSONA_NATURAL' ? 'Persona Natural' : 'Empresa'}</p>
                                                  </div>
                                                </div>
                                            </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {errors.clientId && (
                          <div className="mt-2 text-sm text-red-600 font-medium flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            {errors.clientId.message}
                          </div>
                        )}
                    </div>
                )} />

                <Controller name="caseNumber" control={control} render={({ field }) => (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Código de Proceso
                      <span className="text-xs text-gray-500 ml-1">(Manual)</span>
                    </label>
                    <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-200" />
                      <input 
                        {...field} 
                        placeholder="Ej: C-2025-001, EXP-001-2025" 
                        className="w-full h-14 pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base placeholder-gray-400 hover:border-gray-300 font-mono" 
                        disabled={loading} 
                      />
                    </div>
                  </div>
                )} />

                <Controller name="codigoInterno" control={control} render={({ field }) => (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Código Interno
                      <span className="text-xs text-gray-500 ml-1">(Manual)</span>
                    </label>
                    <div className="relative group">
                      <Code className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-200" />
                      <input 
                        {...field} 
                        placeholder="Ej: CO-2025-001, CT-ABC-2025" 
                        className="w-full h-14 pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base placeholder-gray-400 hover:border-gray-300 font-mono" 
                        disabled={loading} 
                      />
                    </div>
                  </div>
                )} />
                
                <Controller name="status" control={control} render={({ field }) => (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Estado del Caso <span className="text-red-500">*</span>
                    </label>
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              role="combobox" 
                              className="w-full justify-between h-14 text-base font-normal text-gray-900 bg-gray-50/50 border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200" 
                              disabled={loading}
                            >
                                <span className="flex items-center gap-3">
                                    {field.value ? (
                                      <>
                                        {React.cloneElement(statusOptions.find(s => s.value === field.value)?.icon || <HelpCircle className="h-5 w-5" />, { 
                                          className: cn("h-5 w-5", statusOptions.find(s => s.value === field.value)?.color)
                                        })}
                                        {statusOptions.find(s => s.value === field.value)?.label}
                                      </>
                                    ) : (
                                      <>
                                        <HelpCircle className="h-5 w-5 text-gray-400" />
                                        "Seleccionar estado..."
                                      </>
                                    )}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                            <Command>
                              <CommandList>
                                <CommandEmpty>No se encontraron estados.</CommandEmpty>
                                <CommandGroup>
                                  {statusOptions.map(option => (
                                      <CommandItem 
                                        key={option.value} 
                                        value={option.label} 
                                        onSelect={() => setValue("status", option.value as any, { shouldValidate: true })}
                                        className="flex items-center gap-3 p-4 hover:bg-amber-50 rounded-lg cursor-pointer"
                                      >
                                          <Check className={cn("h-4 w-4", field.value === option.value ? "opacity-100 text-amber-500" : "opacity-0")} />
                                          <div className="flex items-center gap-3 flex-1">
                                            {React.cloneElement(option.icon, { className: cn("h-5 w-5", option.color) })}
                                            <div>
                                              <p className="font-medium">{option.label}</p>
                                              <p className="text-xs text-gray-500">{option.description}</p>
                                            </div>
                                          </div>
                                      </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                  </div>
                )} />

                <Controller name="estadoOficial" control={control} render={({ field }) => (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Estado Oficial</label>
                    <div className="relative group">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-200" />
                      <input 
                        {...field} 
                        placeholder="Estado oficial del caso" 
                        className="w-full h-14 pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base placeholder-gray-400 hover:border-gray-300" 
                        disabled={loading} 
                      />
                    </div>
                  </div>
                )} />

                <Controller name="estadoInterno" control={control} render={({ field }) => (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">Estado Interno</label>
                    <div className="relative group">
                      <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-200" />
                      <input 
                        {...field} 
                        placeholder="Estado interno del despacho" 
                        className="w-full h-14 pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base placeholder-gray-400 hover:border-gray-300" 
                        disabled={loading} 
                      />
                    </div>
                  </div>
                )} />

                <Controller name="authorities" control={control} render={({ field }) => (
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-3">Autoridades Competentes</label>
                    <div className="relative group">
                      <Briefcase className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-200 pointer-events-none" />
                      <textarea 
                        {...field} 
                        rows={3} 
                        className="w-full pt-4 pb-4 pl-12 pr-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base resize-none placeholder-gray-400 hover:border-gray-300" 
                        placeholder="Especifique las autoridades competentes para este caso..." 
                        disabled={loading} 
                      />
                    </div>
                  </div>
                )} />
                
                <Controller name="description" control={control} render={({ field }) => (
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-3">Descripción Detallada</label>
                        <div className="relative group">
                            <PenSquare className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-200 pointer-events-none" />
                            <textarea 
                              {...field} 
                              rows={5} 
                              className="w-full pt-4 pb-4 pl-12 pr-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200 text-base resize-none placeholder-gray-400 hover:border-gray-300" 
                              placeholder="Descri ba los antecedentes, circunstancias relevantes, objetivos del caso y cualquier información importante que pueda ser útil para el equipo legal..." 
                              disabled={loading} 
                            />
                        </div>
                    </div>
                )} />
              </div>
            </section>
            
            {/* Fechas del Caso */}
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Fechas del Proceso</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Controller name="openingDate" control={control} render={({ field }) => (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          Fecha de Apertura <span className="text-red-500">*</span>
                        </label>
                        <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="w-full justify-start text-left font-normal h-14 text-base text-gray-900 bg-gray-50/50 border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200" 
                                disabled={loading}
                              >
                                <CalendarIcon className="mr-3 h-5 w-5 text-gray-400" />
                                {field.value ? format(field.value, "PPP", { locale: es }) : <span className="text-gray-400">Selecciona una fecha</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                              <Calendar 
                                mode="single" 
                                selected={field.value} 
                                onSelect={field.onChange} 
                                disabled={(date) => date > new Date() || date < new Date("1900-01-01")} 
                                initialFocus 
                              />
                            </PopoverContent>
                        </Popover>
                        {errors.openingDate && (
                          <div className="mt-2 text-sm text-red-600 font-medium flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            {errors.openingDate.message}
                          </div>
                        )}
                      </div>
                    )} />

                    {(watchedStatus === 'CERRADO' || watchedStatus === 'ARCHIVADO') && (
                       <Controller name="closingDate" control={control} render={({ field }) => (
                         <div>
                           <label className="block text-sm font-bold text-gray-700 mb-3">Fecha de Cierre</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    className="w-full justify-start text-left font-normal h-14 text-base text-gray-900 bg-gray-50/50 border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all duration-200" 
                                    disabled={loading}
                                  >
                                    <CalendarIcon className="mr-3 h-5 w-5 text-gray-400" />
                                    {field.value ? format(field.value, "PPP", { locale: es }) : <span className="text-gray-400">Selecciona una fecha</span>}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                                  <Calendar 
                                    mode="single" 
                                    selected={field.value} 
                                    onSelect={field.onChange} 
                                    disabled={(date) => (watchedOpeningDate && date < watchedOpeningDate) || date > new Date()} 
                                    initialFocus 
                                  />
                                </PopoverContent>
                            </Popover>
                         </div>
                       )} />
                    )}
                </div>
            </section>
          </form>
        </main>

        <footer className="bg-gradient-to-r from-white via-gray-50/50 to-white border-t border-gray-200/50 p-6 flex items-center justify-end space-x-4 backdrop-blur-sm">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onCancel} 
            disabled={loading} 
            className="font-semibold text-gray-700 hover:bg-gray-100 px-8 h-12 rounded-xl transition-all duration-200 hover:scale-105"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            onClick={handleSubmit(handleFormSubmit)} 
            disabled={loading} 
            className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-bold px-8 h-12 min-w-[180px] transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:shadow-amber-500/25 hover:scale-105 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> 
                Procesando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" /> 
                {isEditing ? 'Guardar Cambios' : 'Crear Caso Legal'}
              </>
            )}
          </Button>
        </footer>
      </div>
    </div>
  );
};