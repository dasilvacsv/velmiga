"use client"

import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import type { Brand } from "@/features/marcas/types"
import type { ApplianceType } from "@/features/appliance-types/types"
import { ClientSelect } from "@/features/clientes/client-select"
import { InlineClientForm } from "@/features/clientes/inline-client-form"
import { getClientAppliances } from "@/features/clientes/client-appliances-actions"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ClipboardList,
  Laptop,
  User,
  Loader2,
  AlertCircle,
  PlusCircle,
  Calendar as CalendarIcon,
  Check,
  Plus,
  X
} from "lucide-react"
import { ordenFormSchema, type OrdenFormValues } from "./schema"
import type { Client } from "@/lib/types"
import { createServiceOrder, updateServiceOrder } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getTechnicians } from "@/features/tecnicos/technicians"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import React from "react"
import { Switch } from "@/components/ui/switch"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { addClientAppliance } from "@/features/clientes/client-appliances-actions"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import { CreateBrandForm } from "@/features/brands/create-brand-form"
import { CreateApplianceTypeForm } from "@/features/appliance-types/create-appliance-type-form"
import { PopoverApplianceSelect } from "@/features/appliances/popover-appliance-select"

interface OrdenFormProps {
  brands: Brand[]
  applianceTypes: ApplianceType[]
  userId: string
  initialData?: any
  mode?: "create" | "edit"
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3 },
}

export function OrdenForm({ brands, applianceTypes, userId, initialData, mode = "create" }: OrdenFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddClientForm, setShowAddClientForm] = useState(false)
  const [openApplianceDialog, setOpenApplianceDialog] = useState(false)
  const [technicians, setTechnicians] = useState<any[]>([])
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [clientRefreshKey, setClientRefreshKey] = useState(0);
  const [clientListKey, setClientListKey] = useState(0)
  
  // New state variables for appliance creation
  const [isCreatingNewAppliance, setIsCreatingNewAppliance] = useState(false)
  const [createBrandOpen, setCreateBrandOpen] = useState(false)
  const [createTypeOpen, setCreateTypeOpen] = useState(false)
  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false)
  const [typePopoverOpen, setTypePopoverOpen] = useState(false)
  const [newApplianceFalla, setNewApplianceFalla] = useState("")
  const [isAddingNewAppliance, setIsAddingNewAppliance] = useState(false)
  const [newApplianceNotes, setNewApplianceNotes] = useState("")
  

  // Get selected objects
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedApplianceType, setSelectedApplianceType] = useState<ApplianceType | null>(null)
  const [selectedAppliance, setSelectedAppliance] = useState<any>(null)

  // Track order type (regular order vs pre-order)
  const [isPreOrder, setIsPreOrder] = useState(initialData?.status === "PREORDER")

  // Initialize form
  const form = useForm<OrdenFormValues>({
    resolver: zodResolver(ordenFormSchema),
    defaultValues: {
      clientId: initialData?.clientId || "",
      brandId: initialData?.appliance?.brandId || "",
      applianceTypeId: initialData?.appliance?.applianceTypeId || "",
      applianceId: initialData?.applianceId || "",
      reference: initialData?.reference || "",
      description: initialData?.description || "",
      technicianId: initialData?.technicianAssignments?.[0]?.technicianId || "",
      diagnostics: initialData?.diagnostics || "",
      solution: initialData?.solution || "",
      totalAmount: initialData?.totalAmount ? String(initialData.totalAmount) : "",
      falla: initialData?.falla || "",
      fechaAgendado: initialData?.fechaAgendado || undefined,
      fechaCaptacion: new Date(), // Set current date
      isPreOrder: initialData?.status === "PREORDER" || false, // Set based on initial data
    },
  })

  // Load technicians
  useEffect(() => {
    const loadTechnicians = async () => {
      setIsLoadingTechnicians(true)
      try {
        const result = await getTechnicians()
        if (result.data) {
          const activeTechnicians = result.data.filter((tech: any) => tech.is_active)
          setTechnicians(activeTechnicians)
        }
      } catch (error) {
        console.error("Error loading technicians:", error)
      } finally {
        setIsLoadingTechnicians(false)
      }
    }

    loadTechnicians()
  }, [])

  // Watch for form values 
  const clientId = form.watch("clientId")
  const brandId = form.watch("brandId")
  const applianceTypeId = form.watch("applianceTypeId")
  const applianceId = form.watch("applianceId")
  const brandValue = form.watch("brandId")
  const applianceTypeValue = form.watch("applianceTypeId")

  // Update appliance UI based on client selection
  const [canAddAppliance, setCanAddAppliance] = useState(false)

  useEffect(() => {
    setCanAddAppliance(!!clientId)
  }, [clientId])

  const handleClientSelect = (clientId: string, client: Client) => {
    form.setValue("clientId", clientId || "")
    setSelectedClient(client)
    setCanAddAppliance(!!clientId)
    setShowAddClientForm(false)
    
    // Reset appliance selection when changing clients
    form.setValue("applianceId", "")
    form.setValue("falla", "")
    
    // Load appliances for the selected client
    if (clientId) {
      loadClientAppliances(clientId)
    } else {
      setClientAppliances([])
    }
  }

  const handleBrandSelect = (brandId: string, brand: Brand) => {
    form.setValue("brandId", brandId || "")
    setSelectedBrand(brand)
  }

  const handleApplianceTypeSelect = (applianceTypeId: string, applianceType: ApplianceType) => {
    form.setValue("applianceTypeId", applianceTypeId || "")
    setSelectedApplianceType(applianceType)
  }

  const handleApplianceCreated = (applianceId: string) => {
    form.setValue("applianceId", applianceId || "")
  }

  const handleApplianceSelected = (applianceId: string, appliance: any) => {
    form.setValue("applianceId", applianceId || "")
    setSelectedAppliance(appliance)
  }

  

  // Updated handleSubmit function to handle the isPreOrder flag
  const handleSubmit = async (formData: OrdenFormValues) => {
    setIsSubmitting(true);
    setFormError(null);
    
    // Make sure isPreOrder is set correctly in the form data
    formData.isPreOrder = isPreOrder;
    
    try {
      // Validate required data
      if (!formData.clientId) {
        setFormError("Debe seleccionar un cliente");
        setIsSubmitting(false);
        return;
      }

      // When using a single appliance, check the applianceId field
      if (!formData.applianceId) {
        setFormError("Debe seleccionar un electrodoméstico");
        setIsSubmitting(false);
        return;
      }
      
      // Also validate that falla is provided
      if (!formData.falla) {
        setFormError("Debe ingresar la descripción de la falla");
        setIsSubmitting(false);
        return;
      }

      let result;
      
      if (mode === "create") {
        try {
          result = await createServiceOrder(formData, userId);
        } catch (error) {
          console.error("Error calling createServiceOrder:", error);
          throw error;
        }
      } else {
        try {
          result = await updateServiceOrder(initialData.id, formData, userId);
        } catch (error) {
          console.error("Error calling updateServiceOrder:", error);
          throw error;
        }
      }

      if (result.success) {
        toast({
          title: "Éxito",
          description: `${isPreOrder ? 'Pre-orden' : 'Orden'} de servicio ${mode === "create" ? "creada" : "actualizada"} correctamente`,
        });

        if (mode === "create") {
          router.push("/ordenes");
        } else {
          router.push(`/ordenes/${initialData.id}`);
        }
      } else {
        setFormError(result.error || `Error al ${mode === "create" ? "crear" : "actualizar"} la orden de servicio`);
        toast({
          title: "Error",
          description: result.error || `Error al ${mode === "create" ? "crear" : "actualizar"} la orden de servicio`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormError("Ocurrió un error inesperado al procesar la solicitud");
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado al procesar la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle creating a new appliance for the client
  const handleCreateAppliance = async () => {
    if (!selectedClient?.id || !selectedBrand?.id || !selectedApplianceType?.id) {
      toast({
        title: "Información incompleta",
        description: "Por favor seleccione cliente, marca y tipo de electrodoméstico",
        variant: "destructive",
      });
      return;
    }

    if (!newApplianceFalla) {
      toast({
        title: "Falla requerida",
        description: "Por favor ingrese la descripción de la falla",
        variant: "destructive",
      });
      return;
    }

    setIsAddingNewAppliance(true);

    try {
      const result = await addClientAppliance({
        clientId: selectedClient.id,
        brandId: selectedBrand.id,
        applianceTypeId: selectedApplianceType.id,
        notes: newApplianceNotes || null,
        userId,
      });

      if (result.success && result.data) {
        // Set the applianceId and falla in the form
        form.setValue("applianceId", result.data.id);
        form.setValue("falla", newApplianceFalla);
        setSelectedAppliance(result.data);
        
        // Reset the form
        setNewApplianceFalla("");
        setNewApplianceNotes("");
        setIsCreatingNewAppliance(false);
        
        // Refresh client appliances
        loadClientAppliances(selectedClient.id);
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al crear el electrodoméstico",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating appliance:", error);
      toast({
        title: "Error",
        description: "Error al crear el electrodoméstico",
        variant: "destructive",
      });
    } finally {
      setIsAddingNewAppliance(false);
    }
  };

  // Add a new state for dialog
  const [clientAppliances, setClientAppliances] = useState<any[]>([])
  const [isLoadingAppliances, setIsLoadingAppliances] = useState(false)

  // Add an effect to load client appliances when client is selected
  useEffect(() => {
    if (clientId) {
      loadClientAppliances(clientId)
    }
  }, [clientId])

  // Add a function to load client appliances
  const loadClientAppliances = async (cId: string) => {
    setIsLoadingAppliances(true)
    try {
      const result = await getClientAppliances(cId)
      if (result.success && result.data) {
        setClientAppliances(result.data)
      }
    } catch (error) {
      console.error("Error loading client appliances:", error)
    } finally {
      setIsLoadingAppliances(false)
    }
  }

  // Add a handler for appliance added
  const handleApplianceAdded = (newAppliance: any) => {
    // Add to the list of appliances
    setClientAppliances((prev) => [newAppliance, ...prev])
    
    // Set the applianceId and close dialog
    form.setValue("applianceId", newAppliance.id)
    setSelectedAppliance(newAppliance)
    setOpenApplianceDialog(false)
    
    // Set falla field to empty to prompt user to add it
    form.setValue("falla", "")
  }

  // Handle brand created
  const handleBrandCreated = (newBrand: Brand) => {
    setCreateBrandOpen(false)
    form.setValue("brandId", newBrand.id)
    setSelectedBrand(newBrand)
  }

  // Handle appliance type created
  const handleApplianceTypeCreated = (newType: ApplianceType) => {
    setCreateTypeOpen(false)
    form.setValue("applianceTypeId", newType.id)
    setSelectedApplianceType(newType)
  }

  // Handle pre-order toggle
  const handlePreOrderToggle = (checked: boolean) => {
    setIsPreOrder(checked);
    form.setValue("isPreOrder", checked);
    
    // Remove technician if switching to pre-order
    if (checked && form.getValues("technicianId")) {
      form.setValue("technicianId", "");
    }
  };

  // Handle client created via inline form
  const handleClientCreated = (newClientId?: string, newClient?: any) => {
  if (newClientId && newClient) {
    // Forzar actualización de la lista de clientes
    setClientListKey(prev => prev + 1);
    handleClientSelect(newClientId, newClient);
    setShowAddClientForm(false);
  }
}

  // Toggle client form visibility
  const toggleClientForm = () => {
  setShowAddClientForm(!showAddClientForm);
  if (showAddClientForm) {
    setClientListKey(prev => prev + 1); // Actualizar lista al cerrar formulario
    form.setValue("clientId", "");
    setSelectedClient(null);
  }
}

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(form.getValues());
        }} 
        className="space-y-8"
      >
        {/* Error message */}
        {formError && (
          <div className="bg-destructive/10 text-destructive p-3 rounded-md border border-destructive/20 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <p>{formError}</p>
          </div>
        )}

        {/* Client Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5 text-primary" />
              Información del Cliente
            </CardTitle>
            <CardDescription>Seleccione un cliente existente o cree uno nuevo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showAddClientForm ? (
              <>
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ClientSelect
                          key={clientListKey} // Esta clave fuerza nuevo render al cambiar
                          selectedClientId={field.value}
                          onClientSelect={handleClientSelect}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O</span>
                  </div>
                </div>

                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full" 
                  onClick={toggleClientForm}
                >
                  <User className="mr-2 h-4 w-4" />
                  Crear Nuevo Cliente
                </Button>
              </>
            ) : (
              <div className="relative pb-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-0 right-0 z-10"
                  onClick={toggleClientForm}
                >
                  <X className="h-4 w-4" />
                </Button>
                <InlineClientForm
                  userId={userId}
                  onSuccess={handleClientCreated}
                  isInline={true}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appliance Card - Only show if client is selected */}
        {canAddAppliance && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Laptop className="h-5 w-5 text-primary" />
                Información del Electrodoméstico
              </CardTitle>
              <CardDescription>Seleccione un electrodoméstico existente o cree uno nuevo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingAppliances ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <FormField
                    control={form.control}
                    name="applianceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Electrodoméstico</FormLabel>
                        <div className="flex gap-2">
                          <FormControl className="flex-1">
                            <PopoverApplianceSelect
                              clientId={clientId}
                              value={field.value}
                              onValueChange={handleApplianceSelected}
                              onAddNew={() => setIsCreatingNewAppliance(true)}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreatingNewAppliance(true)}
                            className="flex items-center gap-1"
                          >
                            <PlusCircle className="h-4 w-4" />
                            Nuevo
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Order Type Selection (Pre-order/Order toggle) */}
                  {applianceId && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center justify-between space-x-2 py-4 mt-4 border-t border-b"
                    >
                      <Label htmlFor="order-type">Tipo de orden</Label>
                      <div className="flex items-center space-x-2">
                        <span className={isPreOrder ? "text-primary font-medium" : "text-muted-foreground"}>Pre-orden</span>
                        <Switch
                          id="order-type"
                          checked={isPreOrder}
                          onCheckedChange={handlePreOrderToggle}
                          key={`pre-order-switch-${isPreOrder}`}
                        />
                        <span className={!isPreOrder ? "text-primary font-medium" : "text-muted-foreground"}>Orden</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Falla field for the selected appliance */}
                  {applianceId && selectedAppliance && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4 mt-4"
                    >
                      <FormField
                        control={form.control}
                        name="falla"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción de la Falla *</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Describa la falla o problema del electrodoméstico"
                                className="resize-none min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Display appliance notes if available */}
                      {selectedAppliance.notes && (
                        <div className="p-3 bg-muted/20 rounded-md border">
                          <h4 className="text-sm font-medium mb-1">Notas del Electrodoméstico:</h4>
                          <p className="text-sm text-muted-foreground">{selectedAppliance.notes}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  {/* Date Picker for Fecha Agendado */}
                  {applianceId && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4"
                    >
                      <FormField
                        control={form.control}
                        name="fechaAgendado"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha Agendada (opcional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: es })
                                    ) : (
                                      <span>Seleccionar fecha</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date < new Date(new Date().setHours(0, 0, 0, 0))
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              La fecha para la cual se agenda la visita técnica
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  {applianceId && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex justify-end pt-4 mt-4"
                    >
                      <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="min-w-[200px]"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {mode === "create" ? "Creando..." : "Actualizando..."}
                          </>
                        ) : (
                          <>
                            <ClipboardList className="mr-2 h-4 w-4" />
                            {mode === "create" ? "Crear Orden" : "Actualizar Orden"}
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}
                </>
              )}

              {/* New Appliance Creation Form */}
              {isCreatingNewAppliance && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border rounded-lg p-4 space-y-4 mt-4 bg-muted/10"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Nuevo Electrodoméstico</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsCreatingNewAppliance(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Brand Selection */}
                    <div className="flex flex-col space-y-2">
                      <Label>Marca</Label>
                      <Popover open={brandPopoverOpen} onOpenChange={setBrandPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedBrand ? selectedBrand.name : "Seleccionar marca..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar marca..." />
                            <CommandEmpty>
                              <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => {
                                  setBrandPopoverOpen(false)
                                  setCreateBrandOpen(true)
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Crear nueva marca
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {brands.map((brand) => (
                                <CommandItem
                                  key={brand.id}
                                  value={brand.name}
                                  onSelect={() => {
                                    form.setValue("brandId", brand.id)
                                    setSelectedBrand(brand)
                                    setBrandPopoverOpen(false)
                                  }}
                                >
                                  {brand.name}
                                  <Check
                                    className={`ml-auto h-4 w-4 ${
                                      brandValue === brand.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Appliance Type Selection */}
                    <div className="flex flex-col space-y-2">
                      <Label>Tipo de electrodoméstico</Label>
                      <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className="w-full justify-between"
                          >
                            {selectedApplianceType ? selectedApplianceType.name : "Seleccionar tipo..."}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Buscar tipo..." />
                            <CommandEmpty>
                              <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => {
                                  setTypePopoverOpen(false)
                                  setCreateTypeOpen(true)
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Crear nuevo tipo
                              </Button>
                            </CommandEmpty>
                            <CommandGroup>
                              {applianceTypes.map((type) => (
                                <CommandItem
                                  key={type.id}
                                  value={type.name}
                                  onSelect={() => {
                                    form.setValue("applianceTypeId", type.id)
                                    setSelectedApplianceType(type)
                                    setTypePopoverOpen(false)
                                  }}
                                >
                                  {type.name}
                                  <Check
                                    className={`ml-auto h-4 w-4 ${
                                      applianceTypeValue === type.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    }`}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label>Notas (Opcional)</Label>
                    <Textarea
                      value={newApplianceNotes}
                      onChange={(e) => setNewApplianceNotes(e.target.value)}
                      placeholder="Ingrese notas o especificaciones sobre este electrodoméstico"
                      className="resize-none min-h-[60px]"
                    />
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Label>Descripción de la Falla *</Label>
                    <Textarea
                      value={newApplianceFalla}
                      onChange={(e) => setNewApplianceFalla(e.target.value)}
                      placeholder="Describa la falla o problema del electrodoméstico"
                      className="resize-none min-h-[80px]"
                    />
                  </div>

                  <Button 
                    onClick={handleCreateAppliance} 
                    disabled={isAddingNewAppliance || !selectedBrand || !selectedApplianceType || !newApplianceFalla}
                    className="w-full"
                  >
                    {isAddingNewAppliance ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Agregando...
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Electrodoméstico
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Brand and ApplianceType creation dialogs */}
              <Dialog open={createBrandOpen} onOpenChange={setCreateBrandOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Marca</DialogTitle>
                  </DialogHeader>
                  <CreateBrandForm userId={userId} onSuccess={handleBrandCreated} />
                </DialogContent>
              </Dialog>
              
              <Dialog open={createTypeOpen} onOpenChange={setCreateTypeOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Tipo</DialogTitle>
                  </DialogHeader>
                  <CreateApplianceTypeForm userId={userId} onSuccess={handleApplianceTypeCreated} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  )
}