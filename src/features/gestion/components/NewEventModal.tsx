'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, Calendar as CalendarIcon, Bell, Users, FileText, Clock, MapPin, ChevronsUpDown } from 'lucide-react';

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

// Utils & Actions
import { cn } from '@/lib/utils';
import { createCalendarEvent, createGoogleCalendarEvent } from '@/features/gestion/actions';
import { useToast } from '@/hooks/use-toast';

// --- Interfaces y Datos Constantes ---

interface NewEventModalProps {
  children: React.ReactNode;
}

// Simulamos una lista de contactos que vendría de tu backend
const contacts = [
  { name: 'Ana Torres', email: 'ana.torres@example.com' },
  { name: 'Carlos Gomez', email: 'carlos.gomez@example.com' },
  { name: 'Luisa Fernandez', email: 'luisa.fernandez@example.com' },
  { name: 'Javier Morales', email: 'javier.morales@lawfirm.com' },
  { name: 'Sofia Castillo', email: 'sofia.castillo@client.com' }
];

const eventTypes = [
  { value: 'AUDIENCIA', label: 'Audiencia Judicial', icon: Users, color: 'blue' },
  { value: 'CITA_CON_CLIENTE', label: 'Cita con Cliente', icon: MapPin, color: 'green' },
  { value: 'REUNION_INTERNA', label: 'Reunión Interna', icon: Users, color: 'purple' },
  { value: 'VENCIMIENTO_LEGAL', label: 'Vencimiento Legal', icon: Clock, color: 'red' }
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

// Zod Schema for validation
const eventFormSchema = z.object({
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
  type: z.enum(['AUDIENCIA', 'CITA_CON_CLIENTE', 'REUNION_INTERNA', 'VENCIMIENTO_LEGAL']),
  startDate: z.date({ required_error: 'La fecha de inicio es obligatoria.' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido (HH:mm).' }),
  endDate: z.date().optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido (HH:mm).' }).optional(),
  description: z.string().optional(),
  reminderMinutes: z.number(),
  attendeeEmails: z.array(z.string().email()),
  syncWithGoogle: z.boolean(),
  caseId: z.string().optional(),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export function NewEventModal({ children }: NewEventModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      type: 'AUDIENCIA',
      startTime: '09:00',
      endTime: '10:00',
      reminderMinutes: 1440,
      attendeeEmails: [],
      syncWithGoogle: true,
    },
  });

  const onSubmit = async (data: EventFormData) => {
    try {
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
        endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Duración de 1 hora por defecto
      }

      // Create event in local database
      const eventResult = await createCalendarEvent({
        ...data,
        startDate,
        endDate,
      });

      if (!eventResult.success) {
        throw new Error(eventResult.error);
      }

      // Sync with Google Calendar if requested
      if (data.syncWithGoogle) {
        try {
          await createGoogleCalendarEvent({
            ...data,
            startDate,
            endDate,
          });
        } catch (googleError) {
          console.warn('Failed to sync with Google Calendar:', googleError);
          toast({
            title: "Evento creado parcialmente",
            description: "El evento se creó localmente pero no se pudo sincronizar con Google Calendar",
            variant: "default"
          });
        }
      }

      toast({
        title: "Evento creado exitosamente",
        description: `${data.title} ha sido programado.`,
        variant: "success"
      });

      form.reset();
      setIsOpen(false);
      window.location.reload();

    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error al crear evento",
        description: (error as Error).message || "No se pudo crear el evento. Por favor, intente de nuevo.",
        variant: "destructive"
      });
    }
  };
  
  const selectedType = form.watch('type');
  const IconComponent = eventTypes.find(t => t.value === selectedType)?.icon || CalendarIcon;

  return (
    <>
      <div onClick={() => setIsOpen(true)}>{children}</div>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-white" />
                  </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Nuevo Evento</h2>
                  <p className="text-sm text-gray-500">Programe audiencias, citas y reuniones</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-full hover:bg-gray-100">
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                
                {/* Event Type */}
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-semibold text-gray-700">Tipo de Evento</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                              {field.value ? eventTypes.find((type) => type.value === field.value)?.label : "Seleccione un tipo"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar tipo..." />
                            <CommandEmpty>No se encontró el tipo.</CommandEmpty>
                            <CommandGroup>
                              {eventTypes.map((type) => (
                                <CommandItem
                                  value={type.value}
                                  key={type.value}
                                  onSelect={() => form.setValue('type', type.value)}
                                >
                                  <type.icon className={cn("mr-2 h-4 w-4", type.value === field.value ? "opacity-100" : "opacity-40")} />
                                  {type.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                {/* Dates & Times */}
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
                                {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elige una fecha</span>}
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

                {/* Description */}
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

                {/* Reminder */}
                <FormField
                  control={form.control}
                  name="reminderMinutes"
                  render={({ field }) => (
                    <FormItem>
                       <FormLabel className="font-semibold text-gray-700">Recordatorio por Email</FormLabel>
                       <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className="w-full justify-between">
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
                                   onSelect={() => form.setValue('reminderMinutes', option.value)}
                                 >
                                   {option.label}
                                 </CommandItem>
                               ))}
                            </CommandList>
                           </Command>
                        </PopoverContent>
                       </Popover>
                    </FormItem>
                  )}
                />

                {/* Attendees */}
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
                                                    <button onClick={() => onChange(value.filter(e => e !== email))} className="rounded-full hover:bg-background/50">
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
                                                <CommandGroup>
                                                    {contacts
                                                        .filter(contact => !value.includes(contact.email)) // Filtrar los ya seleccionados
                                                        .map(contact => (
                                                            <CommandItem
                                                                key={contact.email}
                                                                value={contact.email}
                                                                onSelect={() => onChange([...value, contact.email])}
                                                            >
                                                                {contact.name} <span className="text-xs text-gray-500 ml-2">{contact.email}</span>
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
                
                {/* Google Sync */}
                <FormField
                  control={form.control}
                  name="syncWithGoogle"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                       <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="flex-1">
                        <FormLabel className="text-sm font-medium text-blue-900 cursor-pointer">
                          Sincronizar con Google Calendar
                        </FormLabel>
                        <p className="text-xs text-blue-700">El evento se agregará a tu calendario de Google.</p>
                      </div>
                    </FormItem>
                  )}
                />
                
                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1" disabled={form.formState.isSubmitting}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creando...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" /> Crear Evento
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