'use client';

import React, { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, FileText, Loader2, Save } from 'lucide-react';

import { NewsWithRelations, User } from '@/lib/types';
import { createNews, updateNews } from '@/features/novedades/actions'; // Asegúrate que la ruta a tus actions sea correcta
import { cn } from '@/lib/utils';

// Componentes de UI de Shadcn/ui
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

// Esquema de validación con Zod
const newsFormSchema = z.object({
  title: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres.' }),
  summary: z.string().optional(),
  content: z.string().min(10, { message: 'El contenido debe tener al menos 10 caracteres.' }),
  category: z.string({ required_error: 'Debe seleccionar una categoría.' }),
  priority: z.string({ required_error: 'Debe seleccionar una prioridad.' }),
  status: z.string({ required_error: 'Debe seleccionar un estado.' }),
  createdBy: z.string({ required_error: 'Debe seleccionar un autor.' }),
});

type NewsFormValues = z.infer<typeof newsFormSchema>;

// Opciones para los selectores
const categories = [
  { value: 'GENERAL', label: 'General' },
  { value: 'LEGAL_UPDATE', label: 'Actualización Legal' },
  { value: 'FIRM_NEWS', label: 'Noticias del Despacho' },
  { value: 'ANNOUNCEMENT', label: 'Anuncio' },
  { value: 'TRAINING', label: 'Capacitación' },
];

const priorities = [
  { value: 'ALTA', label: 'Alta' },
  { value: 'MEDIA', label: 'Media' },
  { value: 'BAJA', label: 'Baja' },
];

const statuses = [
    { value: 'ACTIVE', label: 'Activo' },
    { value: 'INACTIVE', label: 'Inactivo' },
];

interface NewsFormProps {
  news?: NewsWithRelations;
  users: User[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewsForm({ news, users, isOpen, onClose, onSuccess }: NewsFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!news;

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: news?.title || '',
      summary: news?.summary || '',
      content: news?.content || '',
      category: news?.category || 'GENERAL',
      priority: news?.priority || 'MEDIA',
      status: news?.status || 'ACTIVE',
      createdBy: news?.createdBy || '',
    },
  });

  const onSubmit = (data: NewsFormValues) => {
    startTransition(async () => {
      try {
        if (isEditing) {
          await updateNews(news.id, data);
          toast.success('Novedad actualizada con éxito.');
        } else {
          await createNews(data);
          toast.success('Novedad creada con éxito.');
        }
        onSuccess();
        onClose();
      } catch (error) {
        toast.error('Error al guardar la novedad.', {
          description: error instanceof Error ? error.message : 'Ocurrió un error inesperado.',
        });
      }
    });
  };
  
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        title: news?.title || '',
        summary: news?.summary || '',
        content: news?.content || '',
        category: news?.category || 'GENERAL',
        priority: news?.priority || 'MEDIA',
        status: news?.status || 'ACTIVE',
        createdBy: news?.createdBy || '',
      });
    }
  }, [news, isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center text-2xl">
            <FileText className="h-6 w-6 mr-3 text-orange-500" />
            {isEditing ? 'Editar Novedad' : 'Crear Nueva Novedad'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-2">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                        <Input placeholder="Ej: Nuevo Criterio de la Corte Suprema" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="summary"
                    render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                        <FormLabel>Resumen (Opcional)</FormLabel>
                        <FormControl>
                        <Textarea
                            placeholder="Un breve resumen para la vista previa de la novedad..."
                            rows={3}
                            {...field}
                        />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                              {field.value ? categories.find((c) => c.value === field.value)?.label : "Seleccionar categoría"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar categoría..." />
                            <CommandList><CommandEmpty>No se encontró.</CommandEmpty><CommandGroup>
                                {categories.map((c) => (
                                    <CommandItem value={c.label} key={c.value} onSelect={() => { form.setValue("category", c.value)}}>
                                      <Check className={cn("mr-2 h-4 w-4", c.value === field.value ? "opacity-100" : "opacity-0")}/>
                                      {c.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup></CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridad *</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                              {field.value ? priorities.find((p) => p.value === field.value)?.label : "Seleccionar prioridad"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar prioridad..." />
                             <CommandList><CommandEmpty>No se encontró.</CommandEmpty><CommandGroup>
                                {priorities.map((p) => (
                                    <CommandItem value={p.label} key={p.value} onSelect={() => { form.setValue("priority", p.value)}}>
                                    <Check className={cn("mr-2 h-4 w-4", p.value === field.value ? "opacity-100" : "opacity-0")}/>
                                    {p.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup></CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="createdBy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Autor *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                              {field.value ? users.find((user) => user.id === field.value)?.firstName + ' ' + users.find((user) => user.id === field.value)?.lastName : "Seleccionar autor"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar autor..." />
                             <CommandList><CommandEmpty>No se encontró al usuario.</CommandEmpty><CommandGroup>
                                {users.map((user) => (
                                    <CommandItem value={`${user.firstName} ${user.lastName}`} key={user.id} onSelect={() => {form.setValue("createdBy", user.id)}}>
                                    <Check className={cn("mr-2 h-4 w-4", user.id === field.value ? "opacity-100" : "opacity-0")}/>
                                    {user.firstName} {user.lastName}
                                    </CommandItem>
                                ))}
                            </CommandGroup></CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                 <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado *</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                              {field.value ? statuses.find((s) => s.value === field.value)?.label : "Seleccionar estado"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                          <Command>
                             <CommandList><CommandGroup>
                                {statuses.map((s) => (
                                    <CommandItem value={s.label} key={s.value} onSelect={() => { form.setValue("status", s.value)}}>
                                      <Check className={cn("mr-2 h-4 w-4", s.value === field.value ? "opacity-100" : "opacity-0")}/>
                                      {s.label}
                                    </CommandItem>
                                ))}
                            </CommandGroup></CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                        <FormLabel>Contenido *</FormLabel>
                        <FormControl>
                        <Textarea placeholder="Desarrolle aquí el contenido completo de la novedad..." rows={12} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                </div>
            </form>
            </Form>
        </div>

        <DialogFooter className="pt-4 mt-auto">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)} disabled={isPending} className="bg-orange-500 hover:bg-orange-600 text-white">
            {isPending ? (<Loader2 className="h-4 w-4 mr-2 animate-spin" />) : (<Save className="h-4 w-4 mr-2" />)}
            {isPending ? 'Guardando...' : (isEditing ? 'Actualizar Novedad' : 'Crear Novedad')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}