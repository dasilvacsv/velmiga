"use client"

import * as React from "react"
import { useState } from "react"
import { Check, ChevronsUpDown, PlusCircle, Search } from "lucide-react"
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

interface ClientAppliance {
  id: string
  name: string
  notes?: string | null
  brand: {
    id: string
    name: string
  }
  applianceType: {
    id: string
    name: string
  }
  createdAt: Date | null
  updatedAt: Date | null
}

interface Client {
  id: string
  name: string
  document: string | null
  phone: string | null
  phone2: string | null
  whatsapp: string | null
  email: string | null
  status: string
  address: string | null
  appliances: ClientAppliance[]
}

interface PopoverClientSelectProps {
  clients: Client[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  userId: string
  showAddClientForm: () => void
  onClientCreated?: (clientId: string, client: Client) => void
}

const normalizeSearch = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/\s+/g, '') // Eliminar espacios
    .replace(/[^a-z0-9]/g, "") // Eliminar caracteres especiales
}

export function PopoverClientSelect({
  clients,
  value,
  onValueChange,
  placeholder = "Seleccionar cliente",
  disabled = false,
  className,
  userId,
  showAddClientForm,
  onClientCreated,
}: PopoverClientSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  
  const filteredClients = React.useMemo(() => {
    if (!searchTerm.trim()) return clients
    
    const searchQuery = normalizeSearch(searchTerm)
    
    return clients.filter(client => {
      const searchFields = [
        client.name,
        client.document,
        client.phone,
        client.phone2,
        client.whatsapp,
        client.email,
        client.address
      ].filter(Boolean).join(' ')

      return normalizeSearch(searchFields).includes(searchQuery)
    })
  }, [clients, searchTerm])

  const selectedClient = clients.find(client => client.id === value)

  const handleCreateClick = () => {
    setOpen(false)
    showAddClientForm()
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
          {selectedClient ? (
            <div className="flex flex-col items-start text-left">
              <span className="font-medium">{selectedClient.name}</span>
              <span className="text-xs text-muted-foreground">
                {selectedClient.document && `Doc: ${selectedClient.document} `}
                {selectedClient.phone && `Tel: ${selectedClient.phone}`}
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
              placeholder="Buscar cliente..." 
              value={searchTerm}
              onValueChange={setSearchTerm}
              className="h-9 flex-1 border-0 focus:ring-0"
            />
          </div>
          <CommandList className="max-h-[300px] overflow-auto">
            <CommandGroup>
              <CommandItem
                onSelect={handleCreateClick}
                className="cursor-pointer text-primary"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Crear nuevo cliente</span>
              </CommandItem>
            </CommandGroup>
            
            <CommandSeparator />
            
            <CommandGroup heading="Clientes">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <CommandItem
                    key={client.id}
                    value={client.id}
                    onSelect={() => {
                      onValueChange(client.id)
                      setOpen(false)
                    }}
                    className="flex flex-col items-start py-2 px-4"
                  >
                    <div className="flex w-full justify-between">
                      <div className="flex flex-col">
                        <span className="font-medium">{client.name}</span>
                        <div className="flex flex-wrap text-xs text-muted-foreground gap-1">
                          {client.document && <span>Doc: {client.document}</span>}
                          {client.phone && <span>Tel: {client.phone}</span>}
                          {client.email && <span>Email: {client.email}</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {client.appliances.length > 0 
                            ? `${client.appliances.length} electrodoméstico${client.appliances.length !== 1 ? 's' : ''}`
                            : "Sin electrodomésticos"
                          }
                        </div>
                      </div>
                      {value === client.id && (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                    </div>
                  </CommandItem>
                ))
              ) : (
                <CommandEmpty className="py-3 text-center text-sm">
                  {clients.length === 0 
                    ? "No hay clientes registrados" 
                    : "No se encontraron coincidencias"}
                </CommandEmpty>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}