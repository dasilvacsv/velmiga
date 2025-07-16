import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import {
    AlertCircle, Calendar as CalendarIcon, Check, ChevronsUpDown,
    CheckSquare, Loader2, Save, X, User, Briefcase, PenSquare
} from 'lucide-react';

import { TaskWithRelations, User as UserType, CaseWithRelations } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from '@/lib/utils';

const taskSchema = z.object({
  caseId: z.string().min(1, 'Debe seleccionar un caso'),
  assignedToId: z.string().min(1, 'Debe asignar la tarea a alguien'),
  title: z.string().optional(),
  description: z.string().min(1, 'La descripción es requerida'),
  dueDate: z.date().optional(),
  priority: z.enum(['ALTA', 'MEDIA', 'BAJA']),
});

type TaskFormData = z.infer<typeof taskSchema>;

const priorityOptions = [
    { 
      value: 'ALTA', 
      label: 'Alta', 
      color: 'text-red-600',
      description: 'Requiere atención inmediata'
    },
    { 
      value: 'MEDIA', 
      label: 'Media', 
      color: 'text-yellow-600',
      description: 'Importante pero no urgente'
    },
    { 
      value: 'BAJA', 
      label: 'Baja', 
      color: 'text-gray-600',
      description: 'Puede esperar si es necesario'
    },
];

interface TaskFormProps {
  task?: TaskWithRelations;
  cases: CaseWithRelations[];
  users: UserType[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({ 
  task, 
  cases, 
  users, 
  onSubmit, 
  onCancel, 
  loading = false 
}) => {
  const isEditing = Boolean(task);
  
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: task ? {
        caseId: task.caseId,
        assignedToId: task.assignedToId,
        title: task.title || '',
        description: task.description,
        dueDate: task.fechaDeVencimiento ? new Date(task.fechaDeVencimiento) : undefined,
        priority: task.priority,
    } : {
        priority: 'MEDIA',
    }
  });

  const { handleSubmit, control, formState: { errors }, setValue } = form;

  const handleFormSubmit = (data: TaskFormData) => {
    const submissionData = {
      ...data,
      dueDate: data.dueDate ? data.dueDate.toISOString() : null,
    };
    onSubmit(submissionData);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-500">
      <div className="bg-white dark:bg-black/50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-200/50 dark:border-gray-800 relative">
        
        {/* Gradient decorative header */}
        <div className="h-2 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600" />
        
        <header className="bg-gradient-to-br from-white via-green-50/30 to-white dark:from-gray-900 dark:via-green-900/10 dark:to-gray-950 p-8 border-b border-gray-200/50 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-4 rounded-2xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <CheckSquare className="h-10 w-10 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 font-raleway">
                  {isEditing ? 'Editar Tarea' : 'Crear Nueva Tarea'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {isEditing ? `Modificando tarea del caso` : 'Configure los detalles de la nueva tarea legal'}
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
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckSquare className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Información de la Tarea</h3>
              </div>
              
              <div className="space-y-6">
                
                {/* Case Selection */}
                <Controller name="caseId" control={control} render={({ field }) => (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Caso Asociado <span className="text-red-500">*</span>
                    </label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              role="combobox" 
                              className="w-full justify-between h-14 text-base font-normal text-gray-900 bg-gray-50/50 border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200" 
                              disabled={loading}
                            >
                                <span className="flex items-center gap-3 truncate">
                                    <Briefcase className="h-5 w-5 text-gray-400" />
                                    {field.value ? cases.find(c => c.id === field.value)?.caseName : "Seleccionar caso..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                            <Command>
                                <CommandInput placeholder="Buscar caso..." />
                                <CommandList>
                                  <CommandEmpty>No se encontraron casos.</CommandEmpty>
                                  <CommandGroup>
                                    {cases.map(case_ => (
                                        <CommandItem 
                                          key={case_.id} 
                                          value={case_.caseName} 
                                          onSelect={() => setValue("caseId", case_.id, { shouldValidate: true })}
                                          className="flex items-center gap-3 p-3 hover:bg-green-50 rounded-lg cursor-pointer"
                                        >
                                            <Check className={cn("h-4 w-4", field.value === case_.id ? "opacity-100 text-green-500" : "opacity-0")} />
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                {case_.caseName.charAt(0).toUpperCase()}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{case_.caseName}</p>
                                                <p className="text-xs text-gray-500">{case_.client?.name}</p>
                                              </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {errors.caseId && (
                      <div className="mt-2 text-sm text-red-600 font-medium flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        {errors.caseId.message}
                      </div>
                    )}
                  </div>
                )} />

                {/* Assigned To Selection */}
                <Controller name="assignedToId" control={control} render={({ field }) => (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Asignar a <span className="text-red-500">*</span>
                    </label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button 
                              variant="outline" 
                              role="combobox" 
                              className="w-full justify-between h-14 text-base font-normal text-gray-900 bg-gray-50/50 border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200" 
                              disabled={loading}
                            >
                                <span className="flex items-center gap-3 truncate">
                                    <User className="h-5 w-5 text-gray-400" />
                                    {field.value ? users.find(u => u.id === field.value)?.firstName + ' ' + users.find(u => u.id === field.value)?.lastName : "Seleccionar persona..."}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                            <Command>
                                <CommandInput placeholder="Buscar persona..." />
                                <CommandList>
                                  <CommandEmpty>No se encontraron usuarios.</CommandEmpty>
                                  <CommandGroup>
                                    {users.map(user => (
                                        <CommandItem 
                                          key={user.id} 
                                          value={`${user.firstName} ${user.lastName}`} 
                                          onSelect={() => setValue("assignedToId", user.id, { shouldValidate: true })}
                                          className="flex items-center gap-3 p-3 hover:bg-green-50 rounded-lg cursor-pointer"
                                        >
                                            <Check className={cn("h-4 w-4", field.value === user.id ? "opacity-100 text-green-500" : "opacity-0")} />
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                              </div>
                                              <div>
                                                <p className="font-medium">{user.firstName} {user.lastName}</p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                              </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    {errors.assignedToId && (
                      <div className="mt-2 text-sm text-red-600 font-medium flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                        <AlertCircle className="w-4 h-4" />
                        {errors.assignedToId.message}
                      </div>
                    )}
                  </div>
                )} />

                {/* Title */}
                <Controller name="title" control={control} render={({ field }) => (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-3">
                      Título de la Tarea
                    </label>
                    <div className="relative group">
                      <CheckSquare className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200" />
                      <input 
                        {...field} 
                        placeholder="Título breve y descriptivo de la tarea" 
                        className="w-full h-14 pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-base placeholder-gray-400 hover:border-gray-300" 
                        disabled={loading} 
                      />
                    </div>
                  </div>
                )} />

                {/* Description */}
                <Controller name="description" control={control} render={({ field }) => (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          Descripción de la Tarea <span className="text-red-500">*</span>
                        </label>
                        <div className="relative group">
                            <PenSquare className="absolute left-4 top-4 h-5 w-5 text-gray-400 group-focus-within:text-green-500 transition-colors duration-200 pointer-events-none" />
                            <textarea 
                              {...field} 
                              rows={4} 
                              className="w-full pt-4 pb-4 pl-12 pr-4 border-2 border-gray-200 rounded-xl bg-gray-50/50 text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-base resize-none placeholder-gray-400 hover:border-gray-300" 
                              placeholder="Describa detalladamente la tarea a realizar, incluyendo objetivos específicos, documentos necesarios y cualquier instrucción especial..." 
                              disabled={loading} 
                            />
                        </div>
                        {errors.description && (
                          <div className="mt-2 text-sm text-red-600 font-medium flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4" />
                            {errors.description.message}
                          </div>
                        )}
                    </div>
                )} />
              </div>
            </section>
            
            {/* Configuración de la Tarea */}
            <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200/50 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Configuración y Prioridad</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Priority */}
                    <Controller name="priority" control={control} render={({ field }) => (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">
                          Prioridad <span className="text-red-500">*</span>
                        </label>
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  role="combobox" 
                                  className="w-full justify-between h-14 text-base font-normal text-gray-900 bg-gray-50/50 border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200" 
                                  disabled={loading}
                                >
                                    <span className="flex items-center gap-3">
                                        {field.value ? (
                                          <>
                                            <div className={`w-3 h-3 rounded-full ${
                                              field.value === 'ALTA' ? 'bg-red-500' :
                                              field.value === 'MEDIA' ? 'bg-yellow-500' : 'bg-gray-500'
                                            }`} />
                                            <span className={priorityOptions.find(p => p.value === field.value)?.color}>
                                              {priorityOptions.find(p => p.value === field.value)?.label}
                                            </span>
                                          </>
                                        ) : (
                                          <>
                                            <div className="w-3 h-3 rounded-full bg-gray-400" />
                                            <span className="text-gray-500">Seleccionar prioridad...</span>
                                          </>
                                        )}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                                <Command>
                                  <CommandList>
                                    <CommandEmpty>No se encontraron prioridades.</CommandEmpty>
                                    <CommandGroup>
                                      {priorityOptions.map(option => (
                                          <CommandItem 
                                            key={option.value} 
                                            value={option.label} 
                                            onSelect={() => setValue("priority", option.value as any, { shouldValidate: true })}
                                            className="flex items-center gap-3 p-4 hover:bg-green-50 rounded-lg cursor-pointer"
                                          >
                                              <Check className={cn("h-4 w-4", field.value === option.value ? "opacity-100 text-green-500" : "opacity-0")} />
                                              <div className="flex items-center gap-3 flex-1">
                                                <div className={`w-4 h-4 rounded-full ${
                                                  option.value === 'ALTA' ? 'bg-red-500' :
                                                  option.value === 'MEDIA' ? 'bg-yellow-500' : 'bg-gray-500'
                                                }`} />
                                                <div>
                                                  <p className={`font-medium ${option.color}`}>{option.label}</p>
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

                    {/* Due Date */}
                    <Controller name="dueDate" control={control} render={({ field }) => (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-3">Fecha de Vencimiento</label>
                        <Popover>
                            <PopoverTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="w-full justify-start text-left font-normal h-14 text-base text-gray-900 bg-gray-50/50 border-2 border-gray-200 rounded-xl hover:border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200" 
                                disabled={loading}
                              >
                                <CalendarIcon className="mr-3 h-5 w-5 text-gray-400" />
                                {field.value ? format(field.value, "PPP", { locale: es }) : <span className="text-gray-400">Selecciona una fecha (opcional)</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-2 border-gray-200 rounded-xl shadow-xl">
                              <Calendar 
                                mode="single" 
                                selected={field.value} 
                                onSelect={field.onChange} 
                                disabled={(date) => date < new Date()} 
                                initialFocus 
                              />
                            </PopoverContent>
                        </Popover>
                      </div>
                    )} />
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
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold px-8 h-12 min-w-[180px] transition-all duration-300 rounded-xl shadow-lg hover:shadow-xl hover:shadow-green-500/25 hover:scale-105 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" /> 
                Procesando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" /> 
                {isEditing ? 'Guardar Cambios' : 'Crear Tarea'}
              </>
            )}
          </Button>
        </footer>
      </div>
    </div>
  );
};