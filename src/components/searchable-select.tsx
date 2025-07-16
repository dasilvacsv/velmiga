"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus, Search, Loader2 } from "lucide-react"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

export interface Option {
  label: string
  value: string
}

interface SearchableSelectProps {
  options: Option[]
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  loading?: boolean
  onRefresh?: () => Promise<void>
  className?: string
  onCreateOption?: (name: string) => Promise<void>
  createNewLabel?: string
  createNewTitle?: string
  createNewDescription?: string
  createNewPlaceholder?: string
  parentOptionId?: string
}

const createSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres")
})

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Seleccionar opción",
  emptyMessage = "No se encontraron opciones",
  disabled = false,
  loading = false,
  onRefresh,
  className,
  onCreateOption,
  createNewLabel = "Crear nuevo",
  createNewTitle = "Crear nueva opción",
  createNewDescription = "Ingrese el nombre para crear una nueva opción",
  createNewPlaceholder = "Nombre",
  parentOptionId
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [isCreating, setIsCreating] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<{ name: string }>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: search,
    },
  })

  // Reset form values when search changes
  React.useEffect(() => {
    if (search) {
      form.setValue("name", search)
    }
  }, [search, form])

  const handleOpenCreateDialog = () => {
    setOpenCreateDialog(true)
    setOpen(false)
  }

  const selectedOption = React.useMemo(() => {
    return options.find((option) => option.value === value)
  }, [options, value])

  const handleCreate = async (values: { name: string }) => {
    if (!onCreateOption) return
    
    try {
      setIsCreating(true)
      await onCreateOption(values.name)
      toast({
        title: "Éxito",
        description: "Opción creada correctamente",
      })
      setOpenCreateDialog(false)
      form.reset()
      setSearch("")
      
      // Refresh the options list after creating
      if (onRefresh) {
        await onRefresh()
      }
    } catch (error) {
      console.error("Error creating option:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error al crear la opción",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    
    return options.filter((option) => 
      option.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [options, search])

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              className
            )}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Cargando...</span>
              </div>
            ) : value && selectedOption ? (
              selectedOption.label
            ) : (
              placeholder
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <CommandInput 
                placeholder="Buscar..." 
                className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                value={search}
                onValueChange={setSearch}
              />
            </div>
            <CommandList>
              <CommandEmpty>
                {search.trim() !== "" && onCreateOption ? (
                  <div className="p-2">
                    <p className="text-sm text-muted-foreground py-1">No se encontraron resultados para "{search}"</p>
                    <Button 
                      variant="outline" 
                      className="w-full mt-1 justify-start bg-background hover:bg-accent text-primary"
                      onClick={handleOpenCreateDialog}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {createNewLabel}
                    </Button>
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
                )}
              </CommandEmpty>
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                      setSearch("")
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                {search.trim() !== "" && filteredOptions.length > 0 && onCreateOption && (
                  <CommandItem
                    onSelect={() => handleOpenCreateDialog()}
                    className="cursor-pointer text-primary"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear "{search}"
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Create new option dialog */}
      {onCreateOption && (
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{createNewTitle}</DialogTitle>
              <DialogDescription>{createNewDescription}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder={createNewPlaceholder} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setOpenCreateDialog(false)}
                    disabled={isCreating}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creando...
                      </>
                    ) : (
                      'Crear'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}