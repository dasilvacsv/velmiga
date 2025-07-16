"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Search, PlusCircle, X, Loader2, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ApplianceType } from '@/features/appliance-types/types'
import { Brand } from '@/features/marcas/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { CreateBrandForm } from "@/features/brands/create-brand-form"
import { CreateApplianceTypeForm } from "@/features/appliance-types/create-appliance-type-form"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addClientAppliance, getClientAppliances } from "@/features/clientes/client-appliances-actions"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

interface ClientAppliance {
  id: string
  name: string
  notes?: string | null
  brand: Brand
  applianceType: ApplianceType
  createdAt: Date | null
  updatedAt: Date | null
}

interface PopoverApplianceSelectProps {
  appliances?: ClientAppliance[]
  clientId: string
  value: string
  onValueChange: (value: string, appliance?: any) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  userId?: string
  onAddNew?: () => void
  brands?: Brand[]
  applianceTypes?: ApplianceType[]
}

const normalizeSearch = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, "")
}

export function PopoverApplianceSelect({
  appliances: initialAppliances,
  clientId,
  value,
  onValueChange,
  placeholder = "Seleccionar electrodoméstico",
  disabled = false,
  className,
  userId,
  onAddNew,
  brands: initialBrands,
  applianceTypes: initialApplianceTypes,
}: PopoverApplianceSelectProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [brandSearchTerm, setBrandSearchTerm] = useState("")
  const [typeSearchTerm, setTypeSearchTerm] = useState("")
  
  const [appliances, setAppliances] = useState<ClientAppliance[]>(initialAppliances || [])
  const [isLoadingAppliances, setIsLoadingAppliances] = useState(false)
  
  const [isCreatingAppliance, setIsCreatingAppliance] = useState(false)
  const [newApplianceNotes, setNewApplianceNotes] = useState("")
  const [isAddingNewAppliance, setIsAddingNewAppliance] = useState(false)
  
  const [brands, setBrands] = useState<Brand[]>(initialBrands || [])
  const [applianceTypes, setApplianceTypes] = useState<ApplianceType[]>(initialApplianceTypes || [])
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null)
  const [selectedApplianceType, setSelectedApplianceType] = useState<ApplianceType | null>(null)
  const [createBrandOpen, setCreateBrandOpen] = useState(false)
  const [createTypeOpen, setCreateTypeOpen] = useState(false)
  const [brandPopoverOpen, setBrandPopoverOpen] = useState(false)
  const [typePopoverOpen, setTypePopoverOpen] = useState(false)

  useEffect(() => {
    if (clientId) loadClientAppliances()
  }, [clientId])

  useEffect(() => {
    if (initialBrands) setBrands(initialBrands)
    if (initialApplianceTypes) setApplianceTypes(initialApplianceTypes)
  }, [initialBrands, initialApplianceTypes])

  const loadClientAppliances = async () => {
    if (!clientId) return
    setIsLoadingAppliances(true)
    try {
      const result = await getClientAppliances(clientId)
      if (result.success) setAppliances(result.data || [])
      else toast({ variant: "destructive", title: "Error", description: result.error })
    } catch (error) {
      console.error("Error loading appliances:", error)
      toast({ variant: "destructive", title: "Error", description: "Error al cargar los electrodomésticos" })
    } finally {
      setIsLoadingAppliances(false)
    }
  }

  const handleBrandCreated = (newBrand: Brand) => {
    setCreateBrandOpen(false)
    setSelectedBrand(newBrand)
    setBrands(prev => [...prev, newBrand])
    setBrandSearchTerm("")
  }

  const handleApplianceTypeCreated = (newType: ApplianceType) => {
    setCreateTypeOpen(false)
    setSelectedApplianceType(newType)
    setApplianceTypes(prev => [...prev, newType])
    setTypeSearchTerm("")
  }

  const handleCreateAppliance = async () => {
    if (!clientId || !selectedBrand?.id || !selectedApplianceType?.id || !userId) {
      toast({ title: "Información incompleta", description: "Seleccione marca y tipo", variant: "destructive" })
      return
    }

    setIsAddingNewAppliance(true)
    try {
      const result = await addClientAppliance({
        clientId,
        brandId: selectedBrand.id,
        applianceTypeId: selectedApplianceType.id,
        notes: newApplianceNotes,
        userId,
      })

      if (result.success && result.data) {
        const newAppliance = { ...result.data, brand: selectedBrand, applianceType: selectedApplianceType }
        setAppliances(prev => [newAppliance, ...prev])
        onValueChange(newAppliance.id, newAppliance)
        setNewApplianceNotes("")
        setSelectedBrand(null)
        setSelectedApplianceType(null)
        setIsCreatingAppliance(false)
        setOpen(false)
        toast({ title: "Éxito", description: "Electrodoméstico agregado" })
      }
    } catch (error) {
      console.error("Error creating appliance:", error)
      toast({ title: "Error", description: "Error al crear el electrodoméstico", variant: "destructive" })
    } finally {
      setIsAddingNewAppliance(false)
    }
  }

  const filteredAppliances = React.useMemo(() => {
    if (!searchTerm.trim()) return appliances
    const searchQuery = normalizeSearch(searchTerm)
    
    return appliances.filter(appliance => {
      const searchFields = [
        appliance.name,
        appliance.brand.name,
        appliance.applianceType.name,
        appliance.notes
      ].filter(Boolean).join(' ')
      
      return normalizeSearch(searchFields).includes(searchQuery)
    })
  }, [appliances, searchTerm])

  const filteredBrands = React.useMemo(() => {
    if (!brandSearchTerm.trim()) return brands
    const searchQuery = normalizeSearch(brandSearchTerm)
    return brands.filter(brand => 
      normalizeSearch(brand.name).includes(searchQuery)
    )
  }, [brands, brandSearchTerm])

  const filteredApplianceTypes = React.useMemo(() => {
    if (!typeSearchTerm.trim()) return applianceTypes
    const searchQuery = normalizeSearch(typeSearchTerm)
    return applianceTypes.filter(type => 
      normalizeSearch(type.name).includes(searchQuery))
  }, [applianceTypes, typeSearchTerm])

  const selectedAppliance = appliances.find(appliance => appliance.id === value)

  const toggleNewApplianceForm = () => setIsCreatingAppliance(!isCreatingAppliance)

  const renderMainContent = () => {
    if (!appliances.length && !isCreatingAppliance) {
      return (
        <div className="p-4 border rounded-lg bg-muted/10 text-center">
          <p className="text-sm text-muted-foreground mb-3">No hay electrodomésticos registrados</p>
          <Button variant="outline" className="w-full" onClick={() => setIsCreatingAppliance(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Crear electrodoméstico
          </Button>
        </div>
      )
    }

    if (isCreatingAppliance) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-4 space-y-4 bg-muted/10"
        >
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Nuevo Electrodoméstico</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsCreatingAppliance(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4">
            <div className="flex flex-col space-y-2">
              <Label>Marca</Label>
              <Popover open={brandPopoverOpen} onOpenChange={setBrandPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedBrand?.name || "Seleccionar marca..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Buscar marca..." 
                      value={brandSearchTerm}
                      onValueChange={setBrandSearchTerm}
                    />
                    <CommandEmpty>
                      <Button variant="ghost" className="w-full" onClick={() => setCreateBrandOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Crear nueva marca
                      </Button>
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredBrands.map(brand => (
                        <CommandItem
                          key={brand.id}
                          value={brand.name}
                          onSelect={() => {
                            setSelectedBrand(brand)
                            setBrandPopoverOpen(false)
                          }}
                        >
                          {brand.name}
                          <Check className={`ml-auto h-4 w-4 ${selectedBrand?.id === brand.id ? "opacity-100" : "opacity-0"}`} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col space-y-2">
              <Label>Tipo</Label>
              <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between">
                    {selectedApplianceType?.name || "Seleccionar tipo..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command shouldFilter={false}>
                    <CommandInput 
                      placeholder="Buscar tipo..." 
                      value={typeSearchTerm}
                      onValueChange={setTypeSearchTerm}
                    />
                    <CommandEmpty>
                      <Button variant="ghost" className="w-full" onClick={() => setCreateTypeOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Crear nuevo tipo
                      </Button>
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredApplianceTypes.map(type => (
                        <CommandItem
                          key={type.id}
                          value={type.name}
                          onSelect={() => {
                            setSelectedApplianceType(type)
                            setTypePopoverOpen(false)
                          }}
                        >
                          {type.name}
                          <Check className={`ml-auto h-4 w-4 ${selectedApplianceType?.id === type.id ? "opacity-100" : "opacity-0"}`} />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={newApplianceNotes}
              onChange={(e) => setNewApplianceNotes(e.target.value)}
              placeholder="Notas adicionales"
              className="min-h-[60px]"
            />
          </div>

          <Button 
            onClick={handleCreateAppliance} 
            disabled={isAddingNewAppliance || !selectedBrand || !selectedApplianceType}
            className="w-full"
          >
            {isAddingNewAppliance ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Agregando...</>
            ) : (
              <><PlusCircle className="mr-2 h-4 w-4" />Agregar</>
            )}
          </Button>
        </motion.div>
      )
    }

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-10 font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            {selectedAppliance ? (
              <div className="flex flex-col items-start text-left">
                <span className="font-medium">{selectedAppliance.name}</span>
                <span className="text-xs text-muted-foreground">
                  {selectedAppliance.brand.name} | {selectedAppliance.applianceType.name}
                </span>
              </div>
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[300px] max-h-[400px]">
          <Command className="w-full" shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground mr-2" />
              <CommandInput 
                placeholder="Buscar electrodoméstico..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
                className="h-9 flex-1 border-0 focus:ring-0"
              />
            </div>
            <CommandList className="max-h-[300px] overflow-auto">
              <CommandGroup>
                <CommandItem onSelect={toggleNewApplianceForm} className="cursor-pointer text-primary">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>Crear nuevo</span>
                </CommandItem>
              </CommandGroup>
              
              <CommandSeparator />
              
              <CommandGroup heading="Electrodomésticos">
                {isLoadingAppliances ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="ml-2 text-sm">Cargando...</span>
                  </div>
                ) : filteredAppliances.length > 0 ? (
                  filteredAppliances.map(appliance => (
                    <CommandItem
                      key={appliance.id}
                      value={appliance.id}
                      onSelect={() => {
                        onValueChange(appliance.id, appliance)
                        setOpen(false)
                      }}
                      className="flex flex-col items-start py-2 px-4"
                    >
                      <div className="flex w-full justify-between">
                        <div className="flex flex-col">
                          <span className="font-medium">{appliance.name}</span>
                          <div className="text-xs text-muted-foreground">
                            {appliance.brand.name} | {appliance.applianceType.name}
                          </div>
                          {appliance.notes && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                              {appliance.notes}
                            </div>
                          )}
                        </div>
                        {value === appliance.id && <Check className="h-4 w-4 shrink-0 text-primary" />}
                      </div>
                    </CommandItem>
                  ))
                ) : (
                  <CommandEmpty className="py-3 text-center text-sm">
                    No se encontraron resultados
                  </CommandEmpty>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }

  return (
    <>
      {renderMainContent()}
      
      <Dialog open={createBrandOpen} onOpenChange={setCreateBrandOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear Nueva Marca</DialogTitle></DialogHeader>
          <CreateBrandForm userId={userId} onSuccess={handleBrandCreated} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={createTypeOpen} onOpenChange={setCreateTypeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Crear Nuevo Tipo</DialogTitle></DialogHeader>
          <CreateApplianceTypeForm userId={userId} onSuccess={handleApplianceTypeCreated} />
        </DialogContent>
      </Dialog>
    </>
  )
}