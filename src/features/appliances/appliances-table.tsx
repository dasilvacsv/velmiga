"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Eye, MoreHorizontal, Pencil, Trash2, Laptop, Search, PlusCircle, SortAsc, SortDesc, Tag, Settings, Filter } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { deleteAppliance } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { ApplianceDialogForm } from "./appliance-dialog-form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"

interface Appliance {
  id: string
  name: string
  model: string | null
  serialNumber: string | null
  brandId: string | null
  applianceTypeId: string | null
  createdAt: Date | null
  brand?: {
    name: string
  }
  applianceType?: {
    name: string
  }
}

interface AppliancesTableProps {
  appliances: Appliance[]
  userId: string
  brands: any[]
  applianceTypes: any[]
}

export function AppliancesTable({ appliances, userId, brands, applianceTypes }: AppliancesTableProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [applianceToDelete, setApplianceToDelete] = useState<Appliance | null>(null)
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [selectedAppliance, setSelectedAppliance] = useState<Appliance | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterBrand, setFilterBrand] = useState("")
  const [filterType, setFilterType] = useState("")
  const [sortField, setSortField] = useState<"name" | "brand" | "type" | "createdAt">("createdAt")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [showFilters, setShowFilters] = useState(false)

  const handleDeleteClick = (appliance: Appliance) => {
    setApplianceToDelete(appliance)
    setOpenDeleteDialog(true)
  }

  const handleEditClick = (appliance: Appliance) => {
    setSelectedAppliance(appliance)
    setOpenEditDialog(true)
  }

  const confirmDelete = async () => {
    if (!applianceToDelete) return

    try {
      const result = await deleteAppliance(applianceToDelete.id)

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Electrodoméstico eliminado correctamente",
        })
        router.refresh()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al eliminar el electrodoméstico",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting appliance:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setOpenDeleteDialog(false)
      setApplianceToDelete(null)
    }
  }

  // Filter and sort appliances
  const filteredAppliances = appliances
    .filter(appliance => {
      const matchesSearch = searchTerm === "" || 
                           appliance.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (appliance.model && appliance.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (appliance.serialNumber && appliance.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (appliance.brand?.name && appliance.brand.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (appliance.applianceType?.name && appliance.applianceType.name.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesBrand = filterBrand === "" || appliance.brandId === filterBrand
      const matchesType = filterType === "" || appliance.applianceTypeId === filterType
      
      return matchesSearch && matchesBrand && matchesType
    })
    .sort((a, b) => {
      if (sortField === "name") {
        return sortDirection === "asc" 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      } else if (sortField === "brand") {
        const brandA = a.brand?.name || ""
        const brandB = b.brand?.name || ""
        return sortDirection === "asc"
          ? brandA.localeCompare(brandB)
          : brandB.localeCompare(brandA)
      } else if (sortField === "type") {
        const typeA = a.applianceType?.name || ""
        const typeB = b.applianceType?.name || ""
        return sortDirection === "asc"
          ? typeA.localeCompare(typeB)
          : typeB.localeCompare(typeA)
      } else {
        // Default sort by createdAt
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA
      }
    })

  const toggleSort = (field: "name" | "brand" | "type" | "createdAt") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const resetFilters = () => {
    setSearchTerm("")
    setFilterBrand("")
    setFilterType("")
    setSortField("createdAt")
    setSortDirection("desc")
  }

  if (appliances.length === 0) {
    return (
      <motion.div 
        className="text-center py-16 px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Laptop className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-medium mb-2">No hay electrodomésticos registrados</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Aún no se han registrado electrodomésticos en el sistema. 
          Cree su primer electrodoméstico para comenzar.
        </p>
        <Button onClick={() => setOpenCreateDialog(true)} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Crear primer electrodoméstico
        </Button>

        {/* Dialog para crear electrodoméstico */}
        <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
          <DialogContent className="max-w-4xl p-0">
            <ApplianceDialogForm userId={userId} initialBrands={brands} initialApplianceTypes={applianceTypes} />
          </DialogContent>
        </Dialog>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Search and Filters */}
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar electrodomésticos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 w-full bg-background h-10"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1 text-xs h-10"
            >
              <Filter className="h-3.5 w-3.5" />
              Filtros
              {(filterBrand || filterType) && (
                <Badge variant="secondary" className="ml-1 h-5 px-1 text-[10px]">
                  {(filterBrand ? 1 : 0) + (filterType ? 1 : 0)}
                </Badge>
              )}
            </Button>
            <Button 
              onClick={() => setOpenCreateDialog(true)} 
              size="sm" 
              className="gap-1 h-10 ml-auto sm:ml-0"
            >
              <PlusCircle className="h-4 w-4" />
              Nuevo
            </Button>
          </div>
        </div>
        
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/50 p-3 rounded-md border"
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  Marca
                </label>
                <Select value={filterBrand} onValueChange={setFilterBrand}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todas las marcas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas las marcas</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium flex items-center gap-1">
                  <Settings className="h-3 w-3" />
                  Tipo
                </label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los tipos</SelectItem>
                    {applianceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={resetFilters}
                  className="h-9 text-xs"
                  disabled={!searchTerm && !filterBrand && !filterType && sortField === "createdAt" && sortDirection === "desc"}
                >
                  Restablecer filtros
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-muted/50">
              <TableHead 
                className="w-[30%] cursor-pointer"
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center gap-1">
                  Nombre
                  {sortField === "name" && (
                    sortDirection === "asc" ? 
                      <SortAsc className="h-3.5 w-3.5 text-muted-foreground" /> : 
                      <SortDesc className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort("brand")}
              >
                <div className="flex items-center gap-1">
                  Marca
                  {sortField === "brand" && (
                    sortDirection === "asc" ? 
                      <SortAsc className="h-3.5 w-3.5 text-muted-foreground" /> : 
                      <SortDesc className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer"
                onClick={() => toggleSort("type")}
              >
                <div className="flex items-center gap-1">
                  Tipo
                  {sortField === "type" && (
                    sortDirection === "asc" ? 
                      <SortAsc className="h-3.5 w-3.5 text-muted-foreground" /> : 
                      <SortDesc className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
              </TableHead>
              <TableHead className="hidden md:table-cell">Modelo</TableHead>
              <TableHead className="hidden md:table-cell">Serie</TableHead>
              <TableHead className="hidden md:table-cell">Creado</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAppliances.length > 0 ? (
              filteredAppliances.map((appliance) => (
                <TableRow 
                  key={appliance.id} 
                  className="group hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <button
                      onClick={() => router.push(`/electrodomesticos/${appliance.id}`)}
                      className="hover:text-primary text-left flex items-center gap-1.5 transition-colors"
                    >
                      <Laptop className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      {appliance.name}
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-primary/5 border-primary/20 text-xs font-normal">
                      {appliance.brand?.name || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-secondary/5 border-secondary/20 text-xs font-normal">
                      {appliance.applianceType?.name || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm truncate">
                    {appliance.model || <span className="text-muted-foreground italic">N/A</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm font-mono text-xs truncate">
                    {appliance.serialNumber || <span className="text-muted-foreground italic">N/A</span>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {formatDate(appliance.createdAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onClick={() => router.push(`/electrodomesticos/${appliance.id}`)}
                          className="cursor-pointer text-sm"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleEditClick(appliance)}
                          className="cursor-pointer text-sm"
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(appliance)}
                          className="text-destructive focus:text-destructive cursor-pointer text-sm"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Search className="h-8 w-8 mb-3" />
                    <p>No se encontraron electrodomésticos</p>
                    <p className="text-sm mt-1">Intente con otros términos de búsqueda o filtros</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog para crear electrodoméstico */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent className="max-w-4xl p-0">
          <ApplianceDialogForm userId={userId} initialBrands={brands} initialApplianceTypes={applianceTypes} />
        </DialogContent>
      </Dialog>

      {/* Dialog para editar electrodoméstico */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-4xl p-0">
          <ApplianceDialogForm
            mode="edit"
            initialData={selectedAppliance}
            userId={userId}
            initialBrands={brands}
            initialApplianceTypes={applianceTypes}
          />
        </DialogContent>
      </Dialog>

      {/* Alert Dialog para eliminar electrodoméstico */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Confirmar eliminación
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el electrodoméstico
              {applianceToDelete?.name ? ` "${applianceToDelete.name}"` : ""}.
              {applianceToDelete?.model ? ` Modelo: ${applianceToDelete.model}` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}