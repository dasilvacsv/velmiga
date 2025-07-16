"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2, Search, Building } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { getSucursales } from "./sucursales"
import Image from "next/image"

interface Sucursal {
  id: string
  name: string
  logo?: string | null
}

interface SucursalSelectProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function SucursalSelect({ 
  value, 
  onValueChange, 
  className, 
  placeholder = "Seleccionar sucursal",
  disabled = false
}: SucursalSelectProps) {
  const [open, setOpen] = useState(false)
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
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

  const filteredSucursales = searchQuery 
    ? sucursales.filter((sucursal) => 
        sucursal.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sucursales

  const selectedSucursal = sucursales.find((sucursal) => sucursal.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedSucursal && "text-muted-foreground",
            className
          )}
          disabled={disabled || loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando sucursales...</span>
            </div>
          ) : selectedSucursal ? (
            <div className="flex items-center gap-2 truncate">
              {selectedSucursal.logo ? (
                <div className="relative h-5 w-5">
                  <Image
                    src={selectedSucursal.logo}
                    alt={selectedSucursal.name}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <Building className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="truncate">{selectedSucursal.name}</span>
            </div>
          ) : (
            <span>{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="p-0"
        style={{ width: "var(--radix-popover-trigger-width)" }}
        align="start"
      >
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput 
              placeholder="Buscar sucursal..." 
              className="h-9 border-0 outline-none focus-visible:ring-0 flex-1"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Cargando...</span>
                </div>
              ) : (
                "No se encontró ninguna sucursal."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredSucursales.map((sucursal) => (
                <CommandItem
                  key={sucursal.id}
                  value={sucursal.name}
                  onSelect={() => {
                    onValueChange(sucursal.id)
                    setOpen(false)
                    setSearchQuery('')
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2 flex-1 truncate">
                    {sucursal.logo ? (
                      <div className="relative h-5 w-5">
                        <Image
                          src={sucursal.logo}
                          alt={sucursal.name}
                          fill
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <Building className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="truncate">{sucursal.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      value === sucursal.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}