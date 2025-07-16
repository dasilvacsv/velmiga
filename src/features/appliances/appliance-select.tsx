"use client"

import { useState, useEffect } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Loader2, RefreshCw, Search, Laptop } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { getAppliances, getApplianceById } from "./actions"
import { Appliance } from "./types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ApplianceSelectProps {
  brandId: string
  applianceTypeId: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

export function ApplianceSelect({
  brandId,
  applianceTypeId,
  value,
  onChange,
  disabled = false,
  className
}: ApplianceSelectProps) {
  const [appliances, setAppliances] = useState<Appliance[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()
  
  // Filter appliances based on brandId and applianceTypeId
  const filteredAppliances = appliances
    .filter(appliance => 
      appliance.brandId === brandId && 
      appliance.applianceTypeId === applianceTypeId
    )
    .filter(appliance => 
      searchTerm === "" || 
      appliance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (appliance.model && appliance.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (appliance.serialNumber && appliance.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    )

  // Load appliances when brandId and applianceTypeId change
  useEffect(() => {
    if (brandId && applianceTypeId) {
      loadAppliances()
    }
  }, [brandId, applianceTypeId])

  // Load all appliances
  const loadAppliances = async () => {
    if (!brandId || !applianceTypeId) return
    
    setLoading(true)
    try {
      const result = await getAppliances()
      if (result.success && result.data) {
        setAppliances(result.data)
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al cargar los electrodomésticos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error loading appliances:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get appliance details if only id is provided
  useEffect(() => {
    const fetchApplianceDetails = async () => {
      if (value && !appliances.some(a => a.id === value)) {
        try {
          const result = await getApplianceById(value)
          if (result.success && result.data) {
            // Only add if not already in the list and if data is not null
            if (result.data && !appliances.some(a => a.id === result.data.id)) {
              setAppliances(prev => [...prev, result.data])
            }
          }
        } catch (error) {
          console.error("Error fetching appliance details:", error)
        }
      }
    }

    fetchApplianceDetails()
  }, [value, appliances])

  // Get selected appliance if exists
  const selectedAppliance = value ? appliances.find(a => a.id === value) : null

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <PopoverSelect
            options={filteredAppliances.map(appliance => ({
              label: `${appliance.name}${appliance.model ? ` - ${appliance.model}` : ''}${appliance.serialNumber ? ` (${appliance.serialNumber})` : ''}`,
              value: appliance.id,
              icon: <Laptop className="h-4 w-4 mr-2 text-primary" />
            }))}
            value={value}
            onValueChange={onChange}
            placeholder={
              loading 
                ? "Cargando electrodomésticos..." 
                : !brandId || !applianceTypeId 
                  ? "Primero seleccione marca y tipo" 
                  : filteredAppliances.length === 0 
                    ? "No hay electrodomésticos disponibles" 
                    : "Seleccione un electrodoméstico"
            }
            disabled={disabled || loading || !brandId || !applianceTypeId}
            emptyMessage={
              !brandId || !applianceTypeId 
                ? "Primero seleccione marca y tipo" 
                : "No hay electrodomésticos disponibles"
            }
            searchPlaceholder="Buscar electrodoméstico..."
            onSearch={setSearchTerm}
            showSearch={true}
            searchIcon={<Search className="h-4 w-4 text-muted-foreground" />}
            className="w-full transition-all"
          />
          
          {selectedAppliance && (
            <motion.div 
              className="mt-1.5 text-xs text-muted-foreground flex flex-wrap gap-x-2"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {selectedAppliance.model && (
                <span className="inline-flex items-center">
                  <span className="font-medium mr-1">Modelo:</span> {selectedAppliance.model}
                </span>
              )}
              {selectedAppliance.serialNumber && (
                <span className="inline-flex items-center">
                  <span className="font-medium mr-1">S/N:</span> {selectedAppliance.serialNumber}
                </span>
              )}
            </motion.div>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={loading || !brandId || !applianceTypeId}
          onClick={loadAppliances}
          className="flex-shrink-0 transition-all hover:bg-primary/10"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}