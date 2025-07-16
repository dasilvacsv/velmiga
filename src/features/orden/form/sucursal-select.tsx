"use client"

import { useState, useEffect } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { getSucursales } from "./sucursales"

interface Sucursal {
  id: string
  name: string
}

interface SucursalSelectProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function SucursalSelect({ value, onValueChange, className }: SucursalSelectProps) {
  const [open, setOpen] = useState(false)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadSucursales = async () => {
      setLoading(true)
      try {
        const result = await getSucursales()
        if (result.success) {
          setSucursales(result.data || [])
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Error al cargar las sucursales",
          })
        }
      } catch (error) {
        console.error("Error loading sucursales:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar las sucursales",
        })
      } finally {
        setLoading(false)
      }
    }

    loadSucursales()
  }, [toast])

  const selectedSucursal = sucursales.find((sucursal) => sucursal.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={loading}
        >
          {loading
            ? "Cargando sucursales..."
            : selectedSucursal?.name || "Seleccionar sucursal"}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-full p-0"
        style={{ minWidth: "var(--radix-popover-trigger-width)" }}
      >
        <Command>
          <CommandInput placeholder="Buscar sucursal..." />
          <CommandEmpty>
            {loading ? "Cargando..." : "No se encontró ninguna sucursal."}
          </CommandEmpty>
          <CommandGroup>
            {sucursales.map((sucursal) => (
              <CommandItem
                key={sucursal.id}
                value={sucursal.name}
                onSelect={() => {
                  onValueChange(sucursal.id)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === sucursal.id ? "opacity-100" : "opacity-0"
                  )}
                />
                {sucursal.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}