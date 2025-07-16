"use client"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { useEffect, useState, useCallback } from "react"
import { Copy, Loader2, MapPin, UserPlus, Check } from 'lucide-react'
import { createClient, updateClient } from "@/features/clientes/clients"
import { useRouter } from "next/navigation"
import { getZones } from "@/features/zones/actions"
import { getCities } from "@/features/cities/actions"
import { ZoneDialog } from "@/features/zones/ZoneDialog"
import { CityDialog } from "@/features/cities/CityDialog"
import { SucursalDialog } from "@/features/sucursales/sucursal-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { SucursalSelect } from "@/features/sucursales/sucursal-select"

const clientFormSchema = z.object({
  name: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  document: z.string().optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email({ message: "Correo electrónico inválido" }).optional().or(z.literal("")),
  status: z.string({
    required_error: "Por favor seleccione un estado",
  }),
  zoneId: z.string().optional(),
  cityId: z.string().optional(),
  sucursalId: z.string().optional(),
  address: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
})

export type ClientFormData = z.infer<typeof clientFormSchema>

interface ClientFormProps {
  initialData?: any
  mode?: "create" | "edit"
  userId: string
  onSuccess?: (newClientId?: string, newClient?: any) => void
  onSubmit?: (data: ClientFormData) => Promise<void>
  closeDialog?: () => void
  showHeader?: boolean
  showFooter?: boolean
  hideFields?: string[]
}

interface Zone {
  id: string
  name: string
}

interface City {
  id: string
  name: string
}

export function ClientForm({ 
  initialData, 
  mode = "create", 
  userId, 
  onSuccess, 
  onSubmit, 
  closeDialog,
  showHeader = false,
  showFooter = true,
  hideFields = []
}: ClientFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [syncWhatsapp, setSyncWhatsapp] = useState(mode === "create")
  const [isCopyMode, setIsCopyMode] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [zones, setZones] = useState<Zone[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [loadingZones, setLoadingZones] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false)
  const [cityDialogOpen, setCityDialogOpen] = useState(false)
  const [sucursalDialogOpen, setSucursalDialogOpen] = useState(false)
  const [zoneSearch, setZoneSearch] = useState("")
  const [citySearch, setCitySearch] = useState("")

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      document: initialData?.document || "",
      phone: initialData?.phone || "",
      phone2: initialData?.phone2 || "",
      whatsapp: initialData?.whatsapp || "",
      email: initialData?.email || "",
      status: initialData?.status || "active",
      zoneId: initialData?.zoneId || "",
      cityId: initialData?.cityId || "",
      sucursalId: initialData?.sucursalId || "",
      address: initialData?.address || "",
      latitude: initialData?.latitude ? String(initialData.latitude) : "",
      longitude: initialData?.longitude ? String(initialData.longitude) : "",
    },
  })

  const phoneValue = useWatch({
    control: form.control,
    name: "phone",
  })

  useEffect(() => {
    fetchZones()
    fetchCities()
  }, [])

  useEffect(() => {
    if (syncWhatsapp && phoneValue) {
      form.setValue("whatsapp", phoneValue)
    }
  }, [phoneValue, syncWhatsapp, form])

  const fetchZones = useCallback(async () => {
    try {
      setLoadingZones(true)
      const result = await getZones()
      if (result.success) setZones(result.data || [])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar las zonas",
      })
    } finally {
      setLoadingZones(false)
    }
  }, [toast])

  const fetchCities = useCallback(async () => {
    try {
      setLoadingCities(true)
      const result = await getCities()
      if (result.success) setCities(result.data || [])
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al cargar las ciudades",
      })
    } finally {
      setLoadingCities(false)
    }
  }, [toast])

  const handleZoneCreated = useCallback((newZone: Zone) => {
    fetchZones()
    form.setValue("zoneId", newZone.id)
    setZoneDialogOpen(false)
  }, [fetchZones, form])

  const handleCityCreated = useCallback((newCity: City) => {
    fetchCities()
    form.setValue("cityId", newCity.id)
    setCityDialogOpen(false)
  }, [fetchCities, form])

  const handleSucursalCreated = useCallback((newSucursal: any) => {
    form.setValue("sucursalId", newSucursal.id)
    setSucursalDialogOpen(false)
  }, [form])

  const handleFormSubmit = useCallback(async (data: ClientFormData) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      // Ensure hidden fields have their default values
      if (hideFields.includes("status") && !data.status) {
        data.status = "active";
      }

      if (onSubmit) {
        await onSubmit(data)
        closeDialog?.()
        return
      }

      const result = mode === "create" 
        ? await createClient(data, userId)
        : await updateClient(initialData.id, data, userId)

      if (result.success) {
        toast({
          title: "Éxito",
          description: `Cliente ${mode === "create" ? "creado" : "actualizado"} correctamente`,
        })
        
        if (mode === "create" && result.data) {
          onSuccess?.(result.data.id, result.data)
        } else {
          onSuccess?.()
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado",
      })
    } finally {
      setIsSubmitting(false)
      closeDialog?.()
      form.reset()
    }
  }, [isSubmitting, onSubmit, closeDialog, mode, userId, initialData?.id, toast, onSuccess, form, hideFields])

  const filteredZones = zoneSearch === ""
    ? zones
    : zones.filter((zone) =>
        zone.name.toLowerCase().includes(zoneSearch.toLowerCase())
      )

  const filteredCities = citySearch === ""
    ? cities
    : cities.filter((city) =>
        city.name.toLowerCase().includes(citySearch.toLowerCase())
      )

  return (
    <div className="max-w-full overflow-hidden flex flex-col">
      <ZoneDialog
        open={zoneDialogOpen}
        onOpenChange={setZoneDialogOpen}
        userId={userId}
        onSuccess={handleZoneCreated}
      />
      
      <CityDialog
        open={cityDialogOpen}
        onOpenChange={setCityDialogOpen}
        userId={userId}
        onSuccess={handleCityCreated}
      />

      <SucursalDialog
        open={sucursalDialogOpen}
        onOpenChange={setSucursalDialogOpen}
        userId={userId}
        onSuccess={handleSucursalCreated}
      />

      {showHeader && (
        <div className="flex-shrink-0 px-6 py-4 border-b">
          <h2 className="text-xl flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {mode === "create" ? "Nuevo Cliente" : "Editar Cliente"}
          </h2>
          <p className="text-sm mt-1 flex items-center justify-between">
            <span>Complete los datos del cliente. Todos los campos marcados con * son obligatorios.</span>
          </p>
        </div>
      )}

      <div className="overflow-y-auto flex-1 px-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Nombre *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan Pérez"
                        {...field}
                        className="bg-background focus:ring-2 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!hideFields.includes("document") && (
                <FormField
                  control={form.control}
                  name="document"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Documento/ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123456789"
                          {...field}
                          className="bg-background focus:ring-2 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Teléfono</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+1234567890"
                          {...field}
                          className="bg-background focus:ring-2 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Teléfono alternativo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+1234567890"
                          {...field}
                          className="bg-background focus:ring-2 focus:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-sm font-medium">WhatsApp</FormLabel>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("whatsapp", phoneValue || "")}
                          className="h-6 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copiar teléfono
                        </Button>
                        <div className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            id="sync-whatsapp"
                            checked={syncWhatsapp}
                            onChange={(e) => setSyncWhatsapp(e.target.checked)}
                            className="h-3 w-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="sync-whatsapp" className="text-xs text-muted-foreground">
                            Sincronizar
                          </label>
                        </div>
                      </div>
                    </div>
                    <FormControl>
                      <Input
                        placeholder="+1234567890"
                        {...field}
                        className="bg-background focus:ring-2 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Correo electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="juan@ejemplo.com"
                        {...field}
                        className="bg-background focus:ring-2 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="zoneId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-medium">Zona</FormLabel>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between bg-background",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? zones.find((zone) => zone.id === field.value)?.name
                                  : "Seleccionar zona"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="Buscar zona..."
                                value={zoneSearch}
                                onValueChange={setZoneSearch}
                              />
                              <CommandList>
                                <CommandEmpty>No se encontraron zonas</CommandEmpty>
                                <CommandGroup>
                                  {filteredZones.map((zone) => (
                                    <CommandItem
                                      value={zone.name}
                                      key={zone.id}
                                      onSelect={() => {
                                        form.setValue("zoneId", zone.id)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          zone.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {zone.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setZoneDialogOpen(true)}
                          className="px-3"
                        >
                          Nueva
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cityId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-medium">Ciudad</FormLabel>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                  "w-full justify-between bg-background",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value
                                  ? cities.find((city) => city.id === field.value)?.name
                                  : "Seleccionar ciudad"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="Buscar ciudad..."
                                value={citySearch}
                                onValueChange={setCitySearch}
                              />
                              <CommandList>
                                <CommandEmpty>No se encontraron ciudades</CommandEmpty>
                                <CommandGroup>
                                  {filteredCities.map((city) => (
                                    <CommandItem
                                      value={city.name}
                                      key={city.id}
                                      onSelect={() => {
                                        form.setValue("cityId", city.id)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          city.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {city.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setCityDialogOpen(true)}
                          className="px-3"
                        >
                          Nueva
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sucursalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Sucursal</FormLabel>
                    <div className="flex gap-2">
                      <FormControl className="flex-1">
                        <SucursalSelect
                          value={field.value || ""}
                          onValueChange={(value) => form.setValue("sucursalId", value)}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSucursalDialogOpen(true)}
                        className="px-3"
                      >
                        Nueva
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!hideFields.includes("status") && (
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Estado *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between bg-background",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value === "active" ? "Activo" : "Inactivo"}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandList>
                              <CommandGroup>
                                <CommandItem
                                  value="active"
                                  onSelect={() => form.setValue("status", "active")}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === "active" ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  Activo
                                </CommandItem>
                                <CommandItem
                                  value="disabled"
                                  onSelect={() => form.setValue("status", "disabled")}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      field.value === "disabled" ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  Inactivo
                                </CommandItem>
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Dirección</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Calle Principal #123, Ciudad"
                        {...field}
                        className="bg-background focus:ring-2 focus:ring-blue-500 resize-none"
                        rows={2}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {!hideFields.includes("latitude") && !hideFields.includes("longitude") && (
                <div className="grid grid-cols-1 gap-4 pb-2">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-medium">Ubicación GPS</label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigator.geolocation.getCurrentPosition(
                          (position) => {
                            form.setValue("latitude", position.coords.latitude.toString())
                            form.setValue("longitude", position.coords.longitude.toString())
                          }
                        )}
                        className="h-7 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        Obtener ubicación
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Latitud"
                                {...field}
                                className="bg-background focus:ring-2 focus:ring-blue-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Longitud"
                                {...field}
                                className="bg-background focus:ring-2 focus:ring-blue-500"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {showFooter && (
              <div className="flex space-x-2 mt-6 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isSubmitting}
                  className="flex-1 text-sm hover:bg-blue-50 hover:text-blue-600"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {mode === "create" ? "Creando..." : "Actualizando..."}
                    </>
                  ) : mode === "create" ? (
                    "Crear Cliente"
                  ) : (
                    "Actualizar Cliente"
                  )}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  )
}