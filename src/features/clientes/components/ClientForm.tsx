import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Client } from '@/lib/types';
import { 
  X, 
  Save, 
  Loader2, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Hash, 
  Info, 
  ShieldCheck,
  ChevronDown,
  AlertCircle,
  ToggleLeft,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Asumimos que SearchableSelect es un componente composable, similar a un Combobox de Radix/ShadCN
import { SearchableSelect } from '@/components/SearchableSelect';
import { cn } from '@/lib/utils';

// --- Esquema de Validación (sin cambios) ---
const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  clientType: z.enum(['PERSONA_NATURAL', 'EMPRESA']),
  email: z.string().email('El formato del email es inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  dni: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: ClientFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// --- Opciones para Selectores (AHORA CON ICONOS) ---
const clientTypeOptions = [
  { value: 'PERSONA_NATURAL', label: 'Persona Natural', icon: <User className="h-4 w-4" /> },
  { value: 'EMPRESA', label: 'Empresa', icon: <Building2 className="h-4 w-4" /> },
];

const statusOptions = [
  { value: 'ACTIVE', label: 'Activo', icon: <CheckCircle2 className="h-4 w-4 text-green-500" /> },
  { value: 'INACTIVE', label: 'Inactivo', icon: <ToggleLeft className="h-4 w-4 text-gray-500" /> },
];


// --- Componente de Formulario "Increíble" ---
export const ClientForm: React.FC<ClientFormProps> = ({
  client,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const isEditing = Boolean(client);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: client ? { ...client, email: client.email || '', phone: client.phone || '', address: client.address || '', dni: client.dni || '' } : {
      name: '', clientType: 'PERSONA_NATURAL', status: 'ACTIVE', email: '', phone: '', address: '', dni: '',
    }
  });

  const watchedClientType = watch('clientType');

  const handleFormSubmit = async (data: ClientFormData) => {
    const cleanedData = {
      ...data,
      email: data.email || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      dni: data.dni || undefined,
    };
    await onSubmit(cleanedData);
  };
  
  // Componente reutilizable para campos de entrada con icono
  const IconInput = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input"> & { icon: React.ReactNode }>((props, ref) => {
    const { icon, ...rest } = props;
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          {icon}
        </div>
        <Input ref={ref} {...rest} className={cn("pl-10", rest.className)} />
      </div>
    );
  });
  IconInput.displayName = 'IconInput';

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in-0 duration-300">
      <Card className="w-full max-w-4xl max-h-[95vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-400">
        
        {/* --- Encabezado Premium --- */}
        <CardHeader className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/25 p-3 rounded-xl shadow">
                {clientTypeOptions.find(opt => opt.value === watchedClientType)?.icon || <User className="h-7 w-7" />}
              </div>
              <div>
                <CardTitle className="text-2xl font-extrabold tracking-tight">
                  {isEditing ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
                </CardTitle>
                <CardDescription className="text-orange-100 mt-1">
                  {isEditing 
                    ? `Modifica los detalles de ${client?.name || 'cliente'}`
                    : 'Rellena la información para registrar un cliente'}
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel} disabled={loading} className="text-white rounded-full h-9 w-9 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:ring-white flex-shrink-0">
              <X className="h-6 w-6" />
            </Button>
          </div>
        </CardHeader>

        {/* --- Contenido del Formulario (con scroll y alineación perfecta) --- */}
        <CardContent className="p-6 md:p-8 flex-1 overflow-y-auto bg-gray-50/70">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
            
            {/* --- Sección: Detalles Generales --- */}
            <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 border-b pb-4">
                <Info className="h-6 w-6 text-orange-500" />
                Detalles Generales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                
                {/* Campo: Tipo de Cliente */}
                <div className="space-y-2">
                  <Label htmlFor="clientType" className="font-semibold text-gray-700">Tipo de Cliente <span className="text-orange-500">*</span></Label>
                  <Controller name="clientType" control={control} render={({ field }) => (
                     <SearchableSelect
                        options={clientTypeOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar tipo..."
                        disabled={loading}
                        // Esta es la parte clave para mostrar el icono en el trigger
                        renderTrigger={(selectedOption) => (
                           <div className="flex items-center gap-2">
                              {selectedOption ? selectedOption.icon : <User className="h-4 w-4 text-gray-400" />}
                              <span>{selectedOption ? selectedOption.label : "Seleccionar tipo..."}</span>
                           </div>
                        )}
                      />
                  )}/>
                  <div className="min-h-[1.25rem]"></div> {/* Espacio para error */}
                </div>

                {/* Campo: Estado */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="font-semibold text-gray-700">Estado <span className="text-orange-500">*</span></Label>
                   <Controller name="status" control={control} render={({ field }) => (
                     <SearchableSelect
                        options={statusOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar estado..."
                        disabled={loading}
                        renderTrigger={(selectedOption) => (
                           <div className="flex items-center gap-2">
                              {selectedOption ? selectedOption.icon : <ToggleLeft className="h-4 w-4 text-gray-400" />}
                              <span>{selectedOption ? selectedOption.label : "Seleccionar estado..."}</span>
                           </div>
                        )}
                      />
                  )}/>
                   <div className="min-h-[1.25rem]"></div> {/* Espacio para error */}
                </div>
              </div>
            </div>
            
            {/* --- Sección: Información de Identificación --- */}
            <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 border-b pb-4">
                <FileText className="h-6 w-6 text-orange-500" />
                Información de Identificación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">

                {/* Campo: Nombre */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold text-gray-700">{watchedClientType === 'EMPRESA' ? 'Razón Social' : 'Nombre y Apellido'} <span className="text-orange-500">*</span></Label>
                  <IconInput id="name" {...register('name')} icon={<User className="h-5 w-5 text-gray-400" />} placeholder="Ingresa el nombre completo..." disabled={loading} className={cn(errors.name && "border-red-500")} />
                  <div className="min-h-[1.25rem] pt-1">
                    {errors.name && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14}/> {errors.name.message}</p>}
                  </div>
                </div>

                {/* Campo: DNI/RIF */}
                <div className="space-y-2">
                  <Label htmlFor="dni" className="font-semibold text-gray-700">{watchedClientType === 'EMPRESA' ? 'RIF' : 'Cédula / DNI'}</Label>
                  <IconInput id="dni" {...register('dni')} icon={<Hash className="h-5 w-5 text-gray-400" />} placeholder={watchedClientType === 'EMPRESA' ? 'J-12345678-9' : 'V-12345678'} disabled={loading} />
                  <div className="min-h-[1.25rem]"></div> {/* Espacio para error */}
                </div>
              </div>
            </div>

            {/* --- Sección: Datos de Contacto --- */}
            <div className="bg-white p-6 rounded-xl border border-gray-200/80 shadow-sm space-y-6">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3 border-b pb-4">
                 <Mail className="h-6 w-6 text-orange-500" />
                Datos de Contacto
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">

                {/* Campo: Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="font-semibold text-gray-700">Correo Electrónico</Label>
                  <IconInput id="email" type="email" {...register('email')} icon={<Mail className="h-5 w-5 text-gray-400" />} placeholder="usuario@ejemplo.com" disabled={loading} className={cn(errors.email && "border-red-500")} />
                  <div className="min-h-[1.25rem] pt-1">
                    {errors.email && <p className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14}/>{errors.email.message}</p>}
                  </div>
                </div>

                {/* Campo: Teléfono */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="font-semibold text-gray-700">Teléfono</Label>
                  <IconInput id="phone" {...register('phone')} icon={<Phone className="h-5 w-5 text-gray-400" />} placeholder="+58 412 123 4567" disabled={loading} />
                  <div className="min-h-[1.25rem]"></div> {/* Espacio para error */}
                </div>
              </div>

              {/* Campo: Dirección */}
              <div className="space-y-2">
                <Label htmlFor="address" className="font-semibold text-gray-700">Dirección Fiscal</Label>
                <div className="relative">
                  <div className="pointer-events-none absolute left-3 top-3">
                    <MapPin className="h-5 w-5 text-gray-400" />
                  </div>
                  <Textarea id="address" {...register('address')} rows={3} placeholder="Avenida, calle, edificio, casa..." disabled={loading} className="pl-10 resize-y" />
                </div>
                <div className="min-h-[1.25rem]"></div> {/* Espacio para error */}
              </div>
            </div>

          </form>
        </CardContent>
        
        {/* --- Acciones del Formulario (Footer) --- */}
        <div className="p-6 bg-white border-t-2 border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="min-w-[120px] font-semibold">
                Cancelar
              </Button>
              <Button type="submit" form="client-form" disabled={loading} onClick={handleSubmit(handleFormSubmit)} className="min-w-[190px] font-bold text-base py-3 px-6 bg-orange-500 hover:bg-orange-600 focus-visible:ring-orange-500/50 text-white shadow-lg shadow-orange-500/40 transition-all duration-300 hover:scale-105 active:scale-95">
                {loading ? (
                  <><Loader2 className="h-5 w-5 mr-2.5 animate-spin" /> Procesando...</>
                ) : (
                  <><ShieldCheck className="h-5 w-5 mr-2.5" /> {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}</>
                )}
              </Button>
            </div>
        </div>
      </Card>
    </div>
  );
};