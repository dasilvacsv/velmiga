"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BrandSelect } from "@/features/marcas/brand-select"
import { ApplianceTypeSelect } from "@/features/appliance-types/appliance-type-select"
import { ApplianceSelect } from "@/features/appliances/appliance-select"
import { ApplianceForm } from "@/features/appliances/appliance-form"
import { PlusCircle, Trash2, Laptop, AlertCircle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getApplianceById } from "./actions"

export interface SelectedAppliance {
  id: string
  name: string
  brandId: string
  brandName?: string
  applianceTypeId: string
  applianceTypeName?: string
  model?: string
  serialNumber?: string
  falla: string
}

interface MultiApplianceSelectorProps {
  initialAppliances?: SelectedAppliance[]
  onChange: (appliances: SelectedAppliance[]) => void
  brands: any[]
  applianceTypes: any[]
  userId: string
}

export function MultiApplianceSelector({
  initialAppliances = [],
  onChange,
  brands,
  applianceTypes,
  userId,
}: MultiApplianceSelectorProps) {
  const { toast } = useToast()
  const [selectedAppliances, setSelectedAppliances] = useState<SelectedAppliance[]>(initialAppliances)
  const [currentBrandId, setCurrentBrandId] = useState<string>("")
  const [currentApplianceTypeId, setCurrentApplianceTypeId] = useState<string>("")
  const [currentApplianceId, setCurrentApplianceId] = useState<string>("")
  const [currentFalla, setCurrentFalla] = useState<string>("")
  const [selectedBrand, setSelectedBrand] = useState<any>(null)
  const [selectedApplianceType, setSelectedApplianceType] = useState<any>(null)
  const [selectedAppliance, setSelectedAppliance] = useState<any>(null)
  const [isAdding, setIsAdding] = useState<boolean>(false)
  const [isLoadingAppliance, setIsLoadingAppliance] = useState<boolean>(false)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // Update parent component when selected appliances change
  useEffect(() => {
    // Verificar que todos los electrodomésticos tengan ID válido
    const allValid = selectedAppliances.every((app) => app.id && app.id.trim() !== "")

    if (selectedAppliances.length > 0) {
      console.log(
        "Actualizando electrodomésticos en el componente padre:",
        selectedAppliances.map((app) => ({ id: app.id, name: app.name })),
      )
    }

    if (allValid) {
      onChange(selectedAppliances)
    } else if (selectedAppliances.length > 0) {
      console.error("Hay electrodomésticos sin ID válido en la lista")
    }
  }, [selectedAppliances, onChange])

  const handleBrandSelect = (brandId: string, brand: any) => {
    setCurrentBrandId(brandId)
    setSelectedBrand(brand)
    setCurrentApplianceId("")
    setSelectedAppliance(null)
    setDebugInfo("")
  }

  const handleApplianceTypeSelect = (applianceTypeId: string, applianceType: any) => {
    setCurrentApplianceTypeId(applianceTypeId)
    setSelectedApplianceType(applianceType)
    setCurrentApplianceId("")
    setSelectedAppliance(null)
    setDebugInfo("")
  }

  // Mejorado para capturar correctamente el ID y los detalles del electrodoméstico
  const handleApplianceSelect = async (applianceId: string, appliance?: any) => {
    console.log("Electrodoméstico seleccionado con ID:", applianceId)
    setCurrentApplianceId(applianceId)
    setDebugInfo(`ID seleccionado: ${applianceId}`)

    // Si no se proporciona el objeto appliance completo, obtenerlo de la API
    if (!appliance && applianceId) {
      setIsLoadingAppliance(true)
      try {
        const result = await getApplianceById(applianceId)
        if (result.success && result.data) {
          setSelectedAppliance(result.data)
          console.log("Detalles del electrodoméstico obtenidos:", result.data)
          setDebugInfo(`ID: ${applianceId}, Nombre: ${result.data.name}`)
        } else {
          console.error("Error al obtener detalles del electrodoméstico:", result.error)
          setDebugInfo(`Error al obtener detalles del ID: ${applianceId}`)
        }
      } catch (error) {
        console.error("Error al obtener detalles del electrodoméstico:", error)
        setDebugInfo(`Error al obtener detalles del ID: ${applianceId}`)
      } finally {
        setIsLoadingAppliance(false)
      }
    } else if (appliance) {
      // Si se proporciona el objeto appliance, úsalo
      setSelectedAppliance(appliance)
      console.log("Detalles del electrodoméstico proporcionados:", appliance)
      setDebugInfo(`ID: ${applianceId}, Nombre: ${appliance.name || "No disponible"}`)
    }
  }

  const handleApplianceCreated = async (applianceId: string, appliance?: any) => {
    console.log("Electrodoméstico creado con ID:", applianceId)
    setCurrentApplianceId(applianceId)
    setDebugInfo(`Electrodoméstico creado con ID: ${applianceId}`)

    // Si no se proporciona el objeto appliance completo, obtenerlo de la API
    if (!appliance && applianceId) {
      setIsLoadingAppliance(true)
      try {
        const result = await getApplianceById(applianceId)
        if (result.success && result.data) {
          setSelectedAppliance(result.data)
          console.log("Detalles del electrodoméstico creado:", result.data)
          setDebugInfo(`ID creado: ${applianceId}, Nombre: ${result.data.name}`)
        }
      } catch (error) {
        console.error("Error al obtener detalles del electrodoméstico creado:", error)
      } finally {
        setIsLoadingAppliance(false)
      }
    } else if (appliance) {
      setSelectedAppliance(appliance)
      setDebugInfo(`ID creado: ${applianceId}, Nombre: ${appliance.name || "No disponible"}`)
    }

    toast({
      title: "Electrodoméstico creado",
      description: "El electrodoméstico ha sido creado y seleccionado",
    })
  }

  const addAppliance = () => {
    if (!currentApplianceId || !currentFalla.trim()) {
      toast({
        title: "Información incompleta",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    // Check if this appliance is already in the list
    if (selectedAppliances.some((app) => app.id === currentApplianceId)) {
      toast({
        title: "Electrodoméstico duplicado",
        description: "Este electrodoméstico ya ha sido agregado a la lista",
        variant: "destructive",
      })
      return
    }

    console.log("Agregando electrodoméstico con ID:", currentApplianceId)

    // Verificar que el ID sea válido
    if (!currentApplianceId || currentApplianceId.trim() === "") {
      console.error("Error: ID de electrodoméstico inválido")
      toast({
        title: "Error",
        description: "ID de electrodoméstico inválido",
        variant: "destructive",
      })
      return
    }

    const newAppliance: SelectedAppliance = {
      id: currentApplianceId,
      name: selectedAppliance?.name || "Electrodoméstico",
      brandId: currentBrandId,
      brandName: selectedBrand?.name,
      applianceTypeId: currentApplianceTypeId,
      applianceTypeName: selectedApplianceType?.name,
      model: selectedAppliance?.model,
      serialNumber: selectedAppliance?.serialNumber,
      falla: currentFalla,
    }

    console.log("Datos del electrodoméstico a agregar:", newAppliance)
    console.log("ID del electrodoméstico a agregar:", newAppliance.id)

    const updatedAppliances = [...selectedAppliances, newAppliance]
    setSelectedAppliances(updatedAppliances)

    // Imprimir todos los IDs para depuración
    console.log(
      "IDs de todos los electrodomésticos después de agregar:",
      updatedAppliances.map((app) => app.id),
    )

    // Reset form for next appliance
    setCurrentFalla("")
    setIsAdding(false)

    toast({
      title: "Electrodoméstico agregado",
      description: "El electrodoméstico ha sido agregado a la lista",
    })
  }

  const removeAppliance = (index: number) => {
    const updatedAppliances = [...selectedAppliances]
    const removedAppliance = updatedAppliances[index]
    updatedAppliances.splice(index, 1)
    setSelectedAppliances(updatedAppliances)
    setDebugInfo(`Electrodoméstico eliminado - ID: ${removedAppliance.id}`)

    toast({
      title: "Electrodoméstico eliminado",
      description: "El electrodoméstico ha sido eliminado de la lista",
    })

    // Log remaining appliance IDs for debugging
    console.log(
      "IDs de electrodomésticos restantes:",
      updatedAppliances.map((app) => app.id),
    )
  }

  return (
    <div className="space-y-6">
      {/* Debug info */}
      {debugInfo && (
        <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium">Información de depuración:</p>
              <p>{debugInfo}</p>
              {selectedAppliances.length > 0 && (
                <p className="mt-1">IDs seleccionados: {selectedAppliances.map((app) => app.id).join(", ")}</p>
              )}
            </div>
          </div>
        </Alert>
      )}

      {/* List of selected appliances */}
      {selectedAppliances.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Laptop className="h-5 w-5 text-primary" />
              Electrodomésticos Seleccionados ({selectedAppliances.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Electrodoméstico</TableHead>
                    <TableHead>Marca</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Falla</TableHead>
                    <TableHead className="w-[80px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedAppliances.map((appliance, index) => (
                    <TableRow key={`${appliance.id}-${index}`}>
                      <TableCell className="font-mono text-xs">{appliance.id.substring(0, 8)}...</TableCell>
                      <TableCell className="font-medium">
                        {appliance.name}
                        {appliance.model && (
                          <span className="text-xs text-muted-foreground block">Modelo: {appliance.model}</span>
                        )}
                        {appliance.serialNumber && (
                          <span className="text-xs text-muted-foreground block">S/N: {appliance.serialNumber}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-xs font-normal">
                          {appliance.brandName || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-secondary/5 border-secondary/20 text-xs font-normal">
                          {appliance.applianceTypeName || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={appliance.falla}>
                          {appliance.falla}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAppliance(index)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Button to add new appliance */}
      {!isAdding ? (
        <Button variant="outline" onClick={() => setIsAdding(true)} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Agregar Electrodoméstico
        </Button>
      ) : (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary" />
              Agregar Electrodoméstico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Marca</label>
                <BrandSelect
                  initialBrands={brands}
                  selectedBrandId={currentBrandId}
                  onBrandSelect={handleBrandSelect}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Tipo</label>
                <ApplianceTypeSelect
                  initialApplianceTypes={applianceTypes}
                  selectedApplianceTypeId={currentApplianceTypeId}
                  onApplianceTypeSelect={handleApplianceTypeSelect}
                />
              </div>
            </div>

            <AnimatePresence>
              {currentBrandId && currentApplianceTypeId && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Electrodoméstico</label>
                    <div className="relative">
                      <ApplianceSelect
                        brandId={currentBrandId}
                        applianceTypeId={currentApplianceTypeId}
                        value={currentApplianceId}
                        onChange={handleApplianceSelect}
                      />
                      {isLoadingAppliance && (
                        <div className="absolute right-10 top-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      )}
                    </div>
                  </div>

                  {!currentApplianceId && (
                    <div className="pt-2">
                      <div className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        ¿No encuentra el electrodoméstico? Puede crear uno nuevo:
                      </div>
                      <ApplianceForm
                        brandId={currentBrandId}
                        applianceTypeId={currentApplianceTypeId}
                        onApplianceCreated={handleApplianceCreated}
                        brand={selectedBrand}
                        applianceType={selectedApplianceType}
                      />
                    </div>
                  )}

                  <AnimatePresence>
                    {currentApplianceId && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-1.5 block">Descripción de la Falla *</label>
                            <Textarea
                              value={currentFalla}
                              onChange={(e) => setCurrentFalla(e.target.value)}
                              placeholder="Describa la falla o problema del electrodoméstico"
                              className="resize-none min-h-[100px]"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsAdding(false)
                                setCurrentApplianceId("")
                                setSelectedAppliance(null)
                                setCurrentFalla("")
                                setDebugInfo("")
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              onClick={addAppliance}
                              disabled={!currentApplianceId || !currentFalla.trim() || isLoadingAppliance}
                            >
                              {isLoadingAppliance ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Cargando...
                                </>
                              ) : (
                                <>
                                  <PlusCircle className="mr-2 h-4 w-4" />
                                  Agregar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {selectedAppliances.length === 0 && (
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay electrodomésticos seleccionados. Agregue al menos uno para continuar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
