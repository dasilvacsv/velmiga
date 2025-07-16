// Tu archivo: CasePartesModal.tsx

"use client"

import React, { useState, useEffect, useTransition } from 'react';
import { CaseWithRelations, Client } from '@/lib/types';
import {
  X, Plus, User, Users as UsersIcon, Mail, Phone, Building, Save, Trash2, Edit, Loader2, Scale, Fingerprint, FileText, Briefcase, Search, ArrowUp, ArrowDown,
  Hash
} from 'lucide-react';

// UI Components from shadcn/ui
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { getInitials, cn } from '@/lib/utils';
import { toast, useToast } from '@/hooks/use-toast';
import { addCaseParte, updateCaseParte, deleteCaseParte } from '@/features/casos/actions';
import { searchClients } from '@/features/gestion/actions';

// --- Interfaces ---
interface CasePartesModalProps {
  case_: CaseWithRelations;
  onClose: () => void;
  onPartesUpdated: (updatedCase: CaseWithRelations) => void;
}

interface CaseParteForm {
  id?: string;
  firstName: string;
  lastName: string;
  cedula: string;
  phone?: string;
  email?: string;
  type: 'ACTIVA' | 'DEMANDADA';
  hasBienes: boolean;
  bienesDescription?: string;
}

const initialFormData: CaseParteForm = {
  firstName: '',
  lastName: '',
  cedula: '',
  phone: '',
  email: '',
  type: 'ACTIVA',
  hasBienes: false,
  bienesDescription: ''
};

// --- Componente Principal ---
export const CasePartesModal: React.FC<CasePartesModalProps> = ({ case_, onClose, onPartesUpdated }) => {
  const [partes, setPartes] = useState(case_.partes || []);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingParte, setEditingParte] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [parteToDelete, setParteToDelete] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setPartes(case_.partes || []);
  }, [case_.partes]);

  const handleOpenForm = (type: 'ACTIVA' | 'DEMANDADA', parte: any | null = null) => {
    if (parte) {
      setEditingParte(parte);
    } else {
      setEditingParte({ type });
    }
    setIsFormOpen(true);
  };

  const handleDeleteAttempt = (parte: any) => {
    setParteToDelete(parte);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!parteToDelete) return;
    setLoading(true);
    try {
      await deleteCaseParte(parteToDelete.id);
      const updatedPartes = partes.filter(p => p.id !== parteToDelete.id);
      setPartes(updatedPartes);
      onPartesUpdated({ ...case_, partes: updatedPartes });
      toast({ title: "Parte eliminada", description: "La parte ha sido eliminada exitosamente.", variant: "default" });
    } catch (error) {
      console.error('Error deleting parte:', error);
      toast({ title: "Error al eliminar", description: "No se pudo eliminar la parte.", variant: "destructive" });
    } finally {
      setLoading(false);
      setParteToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleSaveParte = async (formData: CaseParteForm) => {
    setLoading(true);
    try {
      let updatedCasePartes;
      if (formData.id) {
        const updatedParte = await updateCaseParte(formData.id, formData);
        updatedCasePartes = partes.map(p => p.id === formData.id ? updatedParte : p);
        toast({ title: "Parte actualizada", description: "Los datos han sido actualizados." });
      } else {
        const newParte = await addCaseParte(case_.id, formData);
        updatedCasePartes = [...partes, newParte];
        toast({ title: "Parte añadida", description: "La nueva parte ha sido registrada." });
      }
      setPartes(updatedCasePartes);
      onPartesUpdated({ ...case_, partes: updatedCasePartes });
      setIsFormOpen(false);
      setEditingParte(null);
    } catch (error) {
      console.error('Error saving parte:', error);
      toast({ title: "Error al guardar", description: "No se pudo guardar la información de la parte.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const partesActivas = partes.filter(p => p.type === 'ACTIVA');
  const partesDemandadas = partes.filter(p => p.type === 'DEMANDADA');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-300">
      <div className="bg-slate-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-slate-200/50">
        {/* Header */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="bg-gradient-to-br from-slate-600 to-gray-800 p-4 rounded-xl shadow-md">
                <Scale className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Gestión de Partes Procesales</h2>
                <p className="text-gray-500">{case_.caseName}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:bg-gray-200 rounded-full">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-grow p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ParteColumn type="ACTIVA" partes={partesActivas} onAdd={() => handleOpenForm('ACTIVA')} onEdit={(p) => handleOpenForm('ACTIVA', p)} onDelete={handleDeleteAttempt} loading={loading} />
            <ParteColumn type="DEMANDADA" partes={partesDemandadas} onAdd={() => handleOpenForm('DEMANDADA')} onEdit={(p) => handleOpenForm('DEMANDADA', p)} onDelete={handleDeleteAttempt} loading={loading} />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-100/50 flex items-center justify-end">
          <Button variant="outline" onClick={onClose} className="bg-white">
            Finalizar
          </Button>
        </div>
      </div>

      <ParteFormSheet
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingParte(null); }}
        onSave={handleSaveParte}
        initialData={editingParte}
        loading={loading}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la parte
              <span className='font-bold'> {parteToDelete?.firstName} {parteToDelete?.lastName} </span>
              del caso.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sí, eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// --- Sub-componentes ---

const ParteColumn: React.FC<{
  type: 'ACTIVA' | 'DEMANDADA';
  partes: any[];
  onAdd: () => void;
  onEdit: (parte: any) => void;
  onDelete: (parte: any) => void;
  loading: boolean;
}> = ({ type, partes, onAdd, onEdit, onDelete, loading }) => {
  const isActiva = type === 'ACTIVA';
  const title = isActiva ? 'Parte Activa' : 'Parte Demandada';
  const colorClass = isActiva ? 'text-green-600' : 'text-red-600';

  return (
    <section className="flex flex-col">
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2" style={{ borderColor: isActiva ? '#22c55e' : '#ef4444' }}>
        <h3 className={`text-xl font-bold flex items-center gap-2 ${colorClass}`}>
          <UsersIcon className="h-6 w-6" />
          {title}
          <Badge variant="secondary" className="text-sm">{partes.length}</Badge>
        </h3>
        <Button size="sm" variant="outline" onClick={onAdd} className={`${colorClass} border-current hover:${colorClass} hover:bg-opacity-10`}>
          <Plus className="h-4 w-4 mr-1" />
          Añadir
        </Button>
      </div>
      <div className="space-y-4 flex-grow">
        {partes.length > 0 ? (
          partes.map((parte) => (
            <ParteCard key={parte.id} parte={parte} onEdit={() => onEdit(parte)} onDelete={() => onDelete(parte)} color={isActiva ? 'green' : 'red'} loading={loading} />
          ))
        ) : (
          <EmptyParteCard type={isActiva ? 'activa' : 'demandada'} onAdd={onAdd} />
        )}
      </div>
    </section>
  );
};

const ParteCard: React.FC<{
  parte: any;
  onEdit: () => void;
  onDelete: () => void;
  color: 'green' | 'red';
  loading?: boolean;
}> = ({ parte, onEdit, onDelete, color, loading }) => {
  const colorClasses = color === 'green'
    ? { bg: 'bg-green-50', border: 'border-green-200/80', avatar: 'from-green-500 to-emerald-600', bienes: 'text-green-800 bg-green-100 border-green-200' }
    : { bg: 'bg-red-50', border: 'border-red-200/80', avatar: 'from-red-500 to-rose-600', bienes: 'text-red-800 bg-red-100 border-red-200' };

  return (
    <div className={cn('rounded-xl p-4 border transition-all duration-300 hover:shadow-xl hover:border-slate-300 hover:scale-[1.02]', colorClasses.bg, colorClasses.border)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-4">
          <div className={cn('w-12 h-12 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-md bg-gradient-to-br', colorClasses.avatar)}>
            {getInitials(`${parte.firstName} ${parte.lastName}`)}
          </div>
          <div>
            <h4 className="font-bold text-lg text-gray-900">{parte.firstName} {parte.lastName}</h4>
            <p className="text-sm text-gray-500 font-mono">C.I: {parte.cedula}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={onEdit} disabled={loading} className="text-slate-500 hover:text-blue-600 hover:bg-blue-100 h-9 w-9 rounded-full">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} disabled={loading} className="text-slate-500 hover:text-red-600 hover:bg-red-100 h-9 w-9 rounded-full">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2 text-sm pl-16">
        {parte.phone && (
          <div className="flex items-center gap-2 text-gray-600">
            <Phone className="w-4 h-4 text-gray-400" />
            <a href={`tel:${parte.phone}`} className="hover:text-blue-600 transition-colors">{parte.phone}</a>
          </div>
        )}
        {parte.email && (
          <div className="flex items-center gap-2 text-gray-600">
            <Mail className="w-4 h-4 text-gray-400" />
            <a href={`mailto:${parte.email}`} className="hover:text-blue-600 transition-colors">{parte.email}</a>
          </div>
        )}
        {parte.hasBienes && (
          <div className={cn('mt-3 p-3 rounded-lg border', colorClasses.bienes)}>
            <div className="flex items-center gap-2 mb-1">
              <Building className="w-4 h-4" />
              <span className="text-sm font-semibold">Con bienes asociados</span>
            </div>
            {parte.bienesDescription && (
              <p className="text-xs text-opacity-80 text-current whitespace-pre-wrap">{parte.bienesDescription}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyParteCard: React.FC<{ type: 'activa' | 'demandada'; onAdd: () => void }> = ({ type, onAdd }) => (
  <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-white h-full flex flex-col justify-center items-center">
    <UsersIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
    <h4 className="text-lg font-semibold text-gray-700 mb-1">Sin Parte {type}</h4>
    <p className="text-gray-500 mb-4 text-sm max-w-xs mx-auto">Añade la primera parte {type} para continuar con la gestión del caso.</p>
    <Button onClick={onAdd} variant="default" className="bg-slate-700 hover:bg-slate-800">
      <Plus className="h-4 w-4 mr-2" />
      Añadir Parte
    </Button>
  </div>
);

// Componente de autocompletado de clientes con la lógica de búsqueda corregida
const ClientSearchField: React.FC<{
  onClientSelect: (client: Client) => void;
  placeholder: string;
}> = ({ onClientSelect, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Estados para los filtros y el valor del input
  const [sortBy, setSortBy] = useState<'name' | 'dni' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchValue, setSearchValue] = useState('');
  
  // Estado para el valor "debounced" (retrasado) de la búsqueda
  const [debouncedSearchValue, setDebouncedSearchValue] = useState(searchValue);

  // useEffect para actualizar el valor debounced después de que el usuario deja de escribir
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, 350); // 350ms de retraso

    // Limpia el timeout si el usuario sigue escribiendo
    return () => {
      clearTimeout(handler);
    };
  }, [searchValue]);

  // useEffect principal para buscar clientes. Se activa cuando se abre,
  // cambian los filtros, o cambia el valor de búsqueda "debounced".
  useEffect(() => {
    if (open) {
      setLoading(true);
      startTransition(async () => {
        try {
          const results = await searchClients({
            searchTerm: debouncedSearchValue,
            sortBy,
            sortOrder,
          });
          setClients(results);
        } catch (error) {
          console.error('Error fetching clients:', error);
          toast({ title: "Error", description: "No se pudieron buscar los clientes.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      });
    }
  }, [open, debouncedSearchValue, sortBy, sortOrder, startTransition]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-gray-500">{placeholder}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] sm:w-[450px] p-0">
        <Command shouldFilter={false}>
          <div className='flex items-center border-b'>
             <Hash className="h-4 w-4 ml-3 shrink-0 opacity-50" />
             <CommandInput
                placeholder="Buscar por nombre, CI/RIF, tlf..."
                value={searchValue}
                onValueChange={setSearchValue}
                className="border-0 focus:ring-0"
             />
          </div>

          {/* Controles de Filtro y Ordenamiento */}
          <div className="p-2 border-b flex items-center justify-between gap-1 bg-slate-50/80">
            <div className='flex items-center gap-2'>
                <Label className="text-xs font-medium text-slate-600">Ordenar por:</Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="h-7 text-xs w-auto focus:ring-slate-400">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">Nombre</SelectItem>
                        <SelectItem value="dni">Documento</SelectItem>
                        <SelectItem value="createdAt">Recientes</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                <span className="sr-only">Cambiar orden</span>
            </Button>
          </div>

          <CommandList>
            {loading ? (
              <div className="p-4 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-500" />
                <p className="text-sm text-gray-500 mt-2">Buscando...</p>
              </div>
            ) : clients.length === 0 ? (
                <CommandEmpty>No se encontraron clientes.</CommandEmpty>
            ) : (
                <CommandGroup>
                  {clients.map((client) => (
                    <CommandItem
                      key={client.id}
                      onSelect={() => {
                        onClientSelect(client);
                        setOpen(false);
                      }}
                      className="flex flex-col items-start gap-1 p-3 hover:bg-gray-50 cursor-pointer"
                    >
                      <p className="font-medium text-gray-900 leading-tight">{client.name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 w-full">
                        {client.dni && <span className='font-mono'>{client.dni}</span>}
                        {client.phone && <span>• {client.phone}</span>}
                        {client.email && <span className='truncate hidden sm:inline-block'>• {client.email}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};


const ParteFormSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CaseParteForm) => void;
  initialData: any | null;
  loading: boolean;
}> = ({ isOpen, onClose, onSave, initialData, loading }) => {
  const [formData, setFormData] = useState<CaseParteForm>(initialFormData);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (initialData && initialData.id) {
        setFormData({
          id: initialData.id,
          firstName: initialData.firstName || '',
          lastName: initialData.lastName || '',
          cedula: initialData.cedula || '',
          phone: initialData.phone || '',
          email: initialData.email || '',
          type: initialData.type || 'ACTIVA',
          hasBienes: initialData.hasBienes || false,
          bienesDescription: initialData.bienesDescription || ''
        });
      } else {
        setFormData({
          ...initialFormData,
          type: initialData?.type || 'ACTIVA',
        });
      }
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  }

  const handleClientSelect = (client: Client) => {
    const nameParts = client.name.split(' ');
    const firstName = nameParts.length > 0 ? nameParts[0] : '';
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    
    setFormData(prev => ({
      ...prev,
      firstName: firstName,
      lastName: lastName,
      email: client.email || '',
      phone: client.phone || '',
      cedula: client.dni || ''
    }));

    toast({
      title: "Cliente seleccionado",
      description: `Se han completado los datos desde el cliente: ${client.name}`,
      variant: "default"
    });
  };

  const handleSubmit = () => {
    if (!formData.firstName || !formData.lastName || !formData.cedula) {
      toast({
        title: "Campos incompletos",
        description: "Nombre, Apellido y Cédula son obligatorios.",
        variant: "destructive",
      });
      return;
    }
    onSave(formData);
  };

  const title = formData.id ? 'Editar Parte Procesal' : 'Añadir Nueva Parte';
  const description = `Completa los datos para registrar la parte en el proceso.`;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="p-6">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <div className="flex-grow overflow-y-auto px-6 py-2 space-y-8">
          {!formData.id && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-500" />
                Buscar Cliente Existente
              </h3>
              <ClientSearchField
                onClientSelect={handleClientSelect}
                placeholder="Buscar para autocompletar datos..."
              />
              <p className="text-sm text-gray-600">
                Si la parte ya existe como cliente en el sistema, sus datos se completarán automáticamente.
              </p>
            </div>
          )}

          {/* --- Sección de Información Personal --- */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-500" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500" />Nombre <span className="text-red-500">*</span></Label>
                <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="flex items-center gap-2"><User className="h-4 w-4 text-gray-500" />Apellido <span className="text-red-500">*</span></Label>
                <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="cedula" className="flex items-center gap-2"><Fingerprint className="h-4 w-4 text-gray-500" />Cédula <span className="text-red-500">*</span></Label>
                <Input id="cedula" value={formData.cedula} onChange={handleChange} placeholder="V-12345678" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-500" />Teléfono</Label>
                <Input id="phone" type="tel" value={formData.phone || ''} onChange={handleChange} placeholder="+58 412 1234567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-500" />Email</Label>
                <Input id="email" type="email" value={formData.email || ''} onChange={handleChange} placeholder="john.doe@email.com" />
              </div>
            </div>
          </div>

          {/* --- Sección de Detalles del Proceso --- */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-gray-500" />
              Detalles en el Proceso
            </h3>
            <div className="space-y-2">
              <Label htmlFor="type" className="flex items-center gap-2"><Scale className="h-4 w-4 text-gray-500" />Tipo de Parte</Label>
              <Select
                value={formData.type}
                onValueChange={(value: 'ACTIVA' | 'DEMANDADA') => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="type" className="w-full">
                  <SelectValue placeholder="Seleccione un tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVA">Parte Activa</SelectItem>
                  <SelectItem value="DEMANDADA">Parte Demandada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
              <div className="flex items-center space-x-3">
                <Checkbox id="hasBienes" checked={formData.hasBienes} onCheckedChange={(checked) => setFormData({ ...formData, hasBienes: !!checked })} />
                <Label htmlFor="hasBienes" className="font-medium text-base flex items-center gap-2"><Building className="h-4 w-4 text-gray-500" />Tiene bienes asociados</Label>
              </div>
              {formData.hasBienes && (
                <div className="space-y-2 pl-7 animate-in fade-in-50 duration-300">
                  <Label htmlFor="bienesDescription">Descripción de Bienes y Ubicación</Label>
                  <Textarea id="bienesDescription" rows={4} value={formData.bienesDescription || ''} onChange={handleChange} placeholder="Ej: Vehículo Mazda 3, Placas..., ubicado en Lechería. Apto en Res. Aguamarina..." />
                </div>
              )}
            </div>
          </div>
        </div>
        <SheetFooter className="p-6 border-t bg-slate-50">
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading} className="w-32">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <><Save className="h-4 w-4 mr-2" /> {formData.id ? 'Actualizar' : 'Guardar'}</>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};