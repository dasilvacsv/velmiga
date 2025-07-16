'use client';

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Calendar as CalendarIcon, Bell, Users, FileText, Clock, MapPin, ChevronsUpDown, Plus, Settings, FolderSync as Sync, AlertCircle, CheckCircle } from 'lucide-react';

// ShadCN UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Utils & Actions
import { cn } from '@/lib/utils';
import { createCalendarEventWithSync, getUserRole, checkSyncPermissions, getUserEmails } from '@/features/calendario/actions';
import { useToast } from '@/hooks/use-toast';

// --- Interfaces y Datos ---

interface EnhancedNewEventModalProps {
  children: React.ReactNode;
  userId?: string;
  defaultCaseId?: string; // **AGREGADO: defaultCaseId**
}

// Tipos de eventos predefinidos
const predefinedEventTypes = [
  { value: 'AUDIENCIA', label: 'Audiencia Judicial', icon: Users, color: 'blue' },
  { value: 'CITA_CON_CLIENTE', label: 'Cita con Cliente', icon: MapPin, color: 'green' },
  { value: 'REUNION_INTERNA', label: 'Reunión Interna', icon: Users, color: 'purple' },
  { value: 'VENCIMIENTO_LEGAL', label: 'Vencimiento Legal', icon: Clock, color: 'red' },
  { value: 'DILIGENCIA', label: 'Diligencia', icon: FileText, color: 'orange' },
  { value: 'CONSULTA_JURIDICA', label: 'Consulta Jurídica', icon: Users, color: 'teal' }
] as const;

const reminderOptions = [
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 1440, label: '1 día antes' },
  { value: 2880, label: '2 días antes' },
  { value: 10080, label: '1 semana antes' }
];

// Schema mejorado con validación
const enhancedEventFormSchema = z.object({
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
  eventType: z.string().min(1, { message: 'Debe seleccionar o escribir un tipo de evento.' }),
  customEventType: z.string().optional(),
  startDate: z.date({ required_error: 'La fecha de inicio es obligatoria.' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido (HH:mm).' }),
  endDate: z.date().optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido (HH:mm).' }).optional(),
  description: z.string().optional(),
  location: z.string().optional(),
  reminderMinutes: z.number(),
  attendeeEmails: z.array(z.string().email()),
  syncWithGoogle: z.boolean(),
  emailNotification: z.boolean(),
  caseId: z.string().optional(),
});

type EnhancedEventFormData = z.infer<typeof enhancedEventFormSchema>;

export function EnhancedNewEventModal({ children, userId, defaultCaseId }: EnhancedNewEventModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomType, setIsCustomType] = useState(false);
  const [canSync, setCanSync] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemContacts, setSystemContacts] = useState<Array<{ name: string; email: string }>>([]);
  const { toast } = useToast();

  const form = useForm<EnhancedEventFormData>({
    resolver: zodResolver(enhancedEventFormSchema),
    defaultValues: {
      title: '',
      eventType: '',
      customEventType: '',
      startTime: '09:00',
      endTime: '10:00',
      reminderMinutes: 1440,
      attendeeEmails: [],
      syncWithGoogle: true,
      emailNotification: true,
      location: '',
      caseId: defaultCaseId || '', // **FIX: Usar defaultCaseId**
    },
  });

  // Verificar permisos al abrir el modal
  useEffect(() => {
    if (isOpen && userId) {
      const checkPermissions = async () => {
        try {
          const [role, syncPermissions, userEmails] = await Promise.all([
            getUserRole(userId),
            checkSyncPermissions(userId),
            getUserEmails()
          ]);
          setUserRole(role);
          setCanSync(syncPermissions);
          setSystemContacts(userEmails);
        } catch (error) {
          console.error('Error checking permissions:', error);
        }
      };
      checkPermissions();
    }
  }, [isOpen, userId]);

  const onSubmit = async (data: EnhancedEventFormData) => {
    try {
      setIsLoading(true);

      // Determinar el tipo de evento final
      const finalEventType = isCustomType && data.customEventType 
        ? data.customEventType 
        : data.eventType;

      // Combinar fecha y hora
      const [startHour, startMinute] = data.startTime.split(':').map(Number);
      const startDate = new Date(data.startDate);
      startDate.setHours(startHour, startMinute, 0, 0);

      let endDate;
      if (data.endDate && data.endTime) {
        const [endHour, endMinute] = data.endTime.split(':').map(Number);
        endDate = new Date(data.endDate);
        endDate.setHours(endHour, endMinute, 0, 0);
      } else {
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
      }

      // **FIX: Asegurar que caseId se pase correctamente**
      const eventPayload = {
        title: data.title,
        description: data.description,
        location: data.location,
        startDate,
        endDate,
        type: finalEventType,
        caseId: data.caseId || defaultCaseId, // Usar caseId del formulario o defaultCaseId
        reminderMinutes: data.reminderMinutes,
        attendeeEmails: data.attendeeEmails,
        syncWithGoogle: data.syncWithGoogle && canSync,
        emailNotification: data.emailNotification,
        userId: userId || ''
      };

      // Crear evento con sincronización
      const result = await createCalendarEventWithSync(eventPayload);

      if (!result.success) {
        throw new Error(result.error);
      }

      // Mostrar resultado
      if (result.syncStatus === 'synced') {
        toast({
          title: "Evento creado y sincronizado",
          description: `${data.title} ha sido creado y sincronizado con Google Calendar.`,
          variant: "default"
        });
      } else if (result.syncStatus === 'partial') {
        toast({
          title: "Evento creado parcialmente",
          description: "El evento se creó localmente pero hubo problemas con la sincronización de Google Calendar.",
          variant: "default"
        });
      } else {
        toast({
          title: "Evento creado",
          description: `${data.title} ha sido programado exitosamente.`,
          variant: "default"
        });
      }

      form.reset();
      setIsOpen(false);
      setIsCustomType(false);
      
      // **FIX: Refrescar solo las páginas relevantes**
      if (window.location.pathname.includes('/casos')) {
        window.location.reload();
      }

    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error al crear evento",
        description: (error as Error).message || "No se pudo crear el evento. Por favor, intente de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventTypeChange = (value: string) => {
    if (value === 'CUSTOM') {
      setIsCustomType(true);
      form.setValue('eventType', '');
      form.setValue('customEventType', '');
    } else {
      setIsCustomType(false);
      form.setValue('eventType', value);
      form.setValue('customEventType', '');
    }
  };

  const selectedType = isCustomType ? 'CUSTOM' : form.watch('eventType');
  const IconComponent = predefinedEventTypes.find(t => t.value === selectedType)?.icon || CalendarIcon;

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Nuevo Evento</h2>
                  <p className="text-sm text-gray-500">Programe audiencias, citas y reuniones</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)} 
                className="rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Sync Status Alert */}
            {userRole && (
              <div className="p-6 pb-0">
                <Alert className={canSync ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
                  {canSync ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <AlertDescription className={canSync ? "text-green-800" : "text-amber-800"}>
                    {canSync 
                      ? `Como ${userRole}, tus eventos se sincronizarán automáticamente con Google Calendar.`
                      : `Como ${userRole}, puedes crear eventos pero solo el usuario principal puede sincronizar con Google Calendar.`
                    }
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                
                {/* Event Type Section */}
                <div className="space-y-4">
                  <FormLabel className="font-semibold text-gray-700 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Tipo de Evento
                  </FormLabel>
                  
                  <FormField
                    control={form.control}
                    name="eventType"
                    render={({ field }) => (
                      <FormItem>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button 
                                variant="outline" 
                                role="combobox" 
                                className={cn("w-full justify-between", !selectedType && "text-muted-foreground")}
                              >
                                {isCustomType 
                                  ? "Tipo personalizado" 
                                  : selectedType 
                                    ? predefinedEventTypes.find((type) => type.value === selectedType)?.label 
                                    : "Seleccione un tipo"
                                }
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandInput placeholder="Buscar tipo..." />
                              <CommandEmpty>No se encontró el tipo.</CommandEmpty>
                              <CommandGroup>
                                {predefinedEventTypes.map((type) => (
                                  <CommandItem
                                    value={type.value}
                                    key={type.value}
                                    onSelect={() => handleEventTypeChange(type.value)}
                                  >
                                    <type.icon className={cn("mr-2 h-4 w-4", type.value === selectedType ? "opacity-100" : "opacity-40")} />
                                    {type.label}
                                  </CommandItem>
                                ))}
                                <Separator className="my-1" />
                                <CommandItem
                                  value="CUSTOM"
                                  onSelect={() => handleEventTypeChange('CUSTOM')}
                                >
                                  <Plus className={cn("mr-2 h-4 w-4", isCustomType ? "opacity-100" : "opacity-40")} />
                                  Escribir tipo personalizado
                                </CommandItem>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Custom Event Type Input */}
                  {isCustomType && (
                    <FormField
                      control={form.control}
                      name="customEventType"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Escriba el tipo de evento personalizado"
                              {...field}
                              autoFocus
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Event Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Título del Evento *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <IconComponent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input className="pl-10" placeholder="Ej: Audiencia vs. Cliente X" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Dates & Times Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="font-semibold text-gray-700">Fecha de Inicio *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-gray-700">Hora de Inicio *</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="font-semibold text-gray-700">Fecha de Fin</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Opcional</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                          </PopoverContent>
                        </Popover>
                        <p className="text-xs text-gray-500 mt-1">Por defecto: 1 hora de duración.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-gray-700">Hora de Fin</FormLabel>
                        <FormControl><Input type="time" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Description & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-gray-700">Descripción</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            <Textarea rows={3} className="pl-10 resize-none" placeholder="Detalles adicionales del evento..." {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-gray-700">Ubicación</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <Input className="pl-10" placeholder="Ej: Tribunal, Oficina, Virtual" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Reminder & Attendees */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reminderMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-gray-700">Recordatorio</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" role="combobox" className="w-full justify-between">
                                <Bell className="w-4 h-4 mr-2" />
                                {reminderOptions.find(opt => opt.value === field.value)?.label || "Seleccionar recordatorio"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                              <CommandList>
                                {reminderOptions.map(option => (
                                  <CommandItem
                                    key={option.value}
                                    value={String(option.value)}
                                    onSelect={() => field.onChange(option.value)}
                                  >
                                    {option.label}
                                  </CommandItem>
                                ))}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="attendeeEmails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-gray-700">Invitados</FormLabel>
                        <Controller
                          control={form.control}
                          name="attendeeEmails"
                          render={({ field: { onChange, value = [] } }) => (
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="flex items-center flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                                  <Users className="h-5 w-5 text-gray-400 mr-2" />
                                  {value.map((email) => (
                                    <Badge key={email} variant="secondary" className="gap-1.5">
                                      {email}
                                      <button 
                                        onClick={() => onChange(value.filter(e => e !== email))} 
                                        className="rounded-full hover:bg-background/50"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))}
                                  <span className="text-sm text-gray-400">{value.length === 0 && 'Seleccionar invitados...'}</span>
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                  <CommandInput placeholder="Buscar por email o nombre..." />
                                  <CommandList>
                                    <CommandEmpty>No se encontraron contactos.</CommandEmpty>
                                    <CommandGroup heading="Usuarios del Sistema">
                                      {systemContacts
                                        .filter(contact => !value.includes(contact.email))
                                        .map(contact => (
                                          <CommandItem
                                            key={contact.email}
                                            value={contact.email}
                                            onSelect={() => onChange([...value, contact.email])}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center">
                                                <Users className="w-3 h-3 text-amber-600" />
                                              </div>
                                              <div>
                                                <div className="font-medium">{contact.name}</div>
                                                <div className="text-xs text-gray-500">{contact.email}</div>
                                              </div>
                                            </div>
                                          </CommandItem>
                                        ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* **FIX: Campo oculto para caseId** */}
                <FormField
                  control={form.control}
                  name="caseId"
                  render={({ field }) => (
                    <input type="hidden" {...field} />
                  )}
                />

                {/* Sync Options */}
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
                  <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                    <Sync className="w-4 h-4" />
                    Opciones de Sincronización
                  </h4>
                  
                  <div className="space-y-3">
                    <FormField
                      control={form.control}
                      name="syncWithGoogle"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <Switch 
                              checked={field.value && canSync} 
                              onCheckedChange={field.onChange}
                              disabled={!canSync}
                            />
                          </FormControl>
                          <div className="flex-1">
                            <FormLabel className={cn(
                              "text-sm font-medium cursor-pointer",
                              canSync ? "text-blue-900" : "text-gray-500"
                            )}>
                              Sincronizar con Google Calendar
                            </FormLabel>
                            <p className={cn(
                              "text-xs",
                              canSync ? "text-blue-700" : "text-gray-400"
                            )}>
                              {canSync 
                                ? "El evento se agregará automáticamente a Google Calendar"
                                : "Solo disponible para el usuario principal"
                              }
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="emailNotification"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3">
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                          <div className="flex-1">
                            <FormLabel className="text-sm font-medium text-green-900 cursor-pointer">
                              Notificaciones por Email
                            </FormLabel>
                            <p className="text-xs text-green-700">
                              Enviar recordatorios por correo electrónico
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsOpen(false)} 
                    className="flex-1" 
                    disabled={isLoading}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 
                        Creando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" /> 
                        Crear Evento
                      </div>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}