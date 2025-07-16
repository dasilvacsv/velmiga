"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
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
import { getLogos } from "@/lib/logos/actions"
import { useToast } from "@/hooks/use-toast"

interface Logo {
  name: string
  path: string
  url: string
}

interface LogoSelectProps {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function LogoSelect({ value, onValueChange, className }: LogoSelectProps) {
  const [open, setOpen] = useState(false)
  const [logos, setLogos] = useState<Logo[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    const fetchLogos = async () => {
      setLoading(true)
      try {
        const result = await getLogos()
        if (result.success) {
          setLogos(result.data || [])
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: result.error || "Error al cargar los logos",
          })
        }
      } catch (error) {
        console.error("Error loading logos:", error)
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los logos",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchLogos()
  }, [toast])

  const filteredLogos = logos.filter(logo => 
    logo.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Find the current selected logo
  const selectedLogo = logos.find(logo => logo.url === value || logo.path === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !selectedLogo && "text-muted-foreground",
            className
          )}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Cargando logos...</span>
            </div>
          ) : selectedLogo ? (
            <div className="flex items-center">
              <div className="w-6 h-6 mr-2 relative">
                <Image
                  src={selectedLogo.url}
                  alt={selectedLogo.name}
                  fill
                  className="object-contain"
                />
              </div>
              {selectedLogo.name}
            </div>
          ) : (
            "Seleccionar logo"
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" style={{ width: "var(--radix-popover-trigger-width)" }}>
        <Command>
          <CommandInput 
            placeholder="Buscar logo..." 
            className="h-9"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Cargando...</span>
                </div>
              ) : (
                "No se encontraron logos."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredLogos.map((logo) => (
                <CommandItem
                  key={logo.path}
                  value={logo.name}
                  onSelect={() => {
                    onValueChange(logo.url)
                    setOpen(false)
                  }}
                  className="flex items-center py-2"
                >
                  <div className="flex items-center flex-1">
                    <div className="w-6 h-6 mr-2 relative">
                      <Image
                        src={logo.url}
                        alt={logo.name}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span>{logo.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      (value === logo.url || value === logo.path) ? "opacity-100" : "opacity-0"
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