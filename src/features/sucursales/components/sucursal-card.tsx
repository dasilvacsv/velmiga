"use client"

import { useState } from "react"
import Image from "next/image"
import { 
  Building, 
  Users, 
  MoreHorizontal, 
  Edit, 
  Trash2,
  ChevronDown,
  ChevronUp,
  Printer,
  FileText,
  Loader2
} from "lucide-react"
import { deleteSucursalWithRevalidation } from "../sucursales"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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
import { formatDate } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

interface SucursalCardProps {
  sucursal: any
  clients: any[]
  onEdit: () => void
  onDelete: (id: string) => void
  onPrintOrder?: (sucursalId: string) => void
  onPrintDelivery?: (sucursalId: string) => void
}

export function SucursalCard({ 
  sucursal, 
  clients, 
  onEdit,
  onDelete,
  onPrintOrder,
  onPrintDelivery
}: SucursalCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showClients, setShowClients] = useState(false)
  const [isImageLoading, setIsImageLoading] = useState(true)
  const { toast } = useToast()
  
  const handleDelete = async () => {
    setIsDeleting(true)
    
    try {
      const result = await deleteSucursalWithRevalidation(sucursal.id)
      
      if (result.success) {
        toast({
          title: "Sucursal eliminada",
          description: "La sucursal ha sido eliminada correctamente",
        })
        onDelete(sucursal.id)
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Error al eliminar la sucursal",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Ocurrió un error inesperado",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }
  
  const createdAt = sucursal.createdAt ? formatDate(new Date(sucursal.createdAt)) : 'Fecha desconocida'
  
  return (
    <>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-opacity-70 hover:border-opacity-100 group">
        <CardHeader className="p-0 relative overflow-hidden h-48 bg-gradient-to-r from-sky-600 to-indigo-700">
          {sucursal.logo ? (
            <>
              {isImageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              )}
              <div className="relative w-full h-full">
                <Image
                  src={sucursal.logo}
                  alt={sucursal.name}
                  fill
                  className={`object-contain p-4 transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                  onLoad={() => setIsImageLoading(false)}
                  onError={() => setIsImageLoading(false)}
                />
              </div>
            </>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <Building className="h-20 w-20 text-white/70" />
            </div>
          )}
          
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="bg-background/90 hover:bg-background shadow-sm"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar sucursal
                </DropdownMenuItem>
                
                {(onPrintOrder || onPrintDelivery) && (
                  <>
                    <DropdownMenuSeparator />
                    
                    {onPrintOrder && (
                      <DropdownMenuItem onClick={() => onPrintOrder(sucursal.id)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Orden de servicio
                      </DropdownMenuItem>
                    )}
                    
                    {onPrintDelivery && (
                      <DropdownMenuItem onClick={() => onPrintDelivery(sucursal.id)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Nota de entrega
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {sucursal.header && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm p-2 text-white text-sm font-medium truncate">
              {sucursal.header}
            </div>
          )}
        </CardHeader>
        
        <CardContent className="p-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{sucursal.name}</h2>
            <p className="text-sm text-gray-500 mt-1">Creada: {createdAt}</p>
          </div>
          
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-indigo-600" />
            <span className="text-sm font-medium">{clients.length} {clients.length === 1 ? 'Cliente' : 'Clientes'}</span>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col p-4 pt-0 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-between hover:bg-gray-50"
            onClick={() => setShowClients(!showClients)}
          >
            {showClients ? "Ocultar clientes" : "Ver clientes"}
            {showClients ? (
              <ChevronUp className="h-4 w-4 ml-2 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2 text-gray-500" />
            )}
          </Button>
          
          {showClients && (
            <div className="w-full mt-2 max-h-40 overflow-y-auto rounded-md border border-gray-100">
              {clients.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {clients.map(client => (
                    <li 
                      key={client.id} 
                      className="text-sm py-2 px-3 flex justify-between items-center hover:bg-gray-50"
                    >
                      <span className="truncate">{client.name}</span>
                      <Badge 
                        variant={client.status === "ACTIVE" ? "outline" : "secondary"} 
                        className="shrink-0 ml-2"
                      >
                        {client.status === "ACTIVE" ? "Activo" : "Inactivo"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 py-3 px-3 text-center">
                  No hay clientes asociados
                </p>
              )}
            </div>
          )}
          
          {sucursal.bottom && (
            <div className="w-full mt-2 pt-2 border-t text-xs text-gray-500">
              {sucursal.bottom}
            </div>
          )}
        </CardFooter>
      </Card>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la sucursal <strong className="font-semibold text-gray-900">{sucursal.name}</strong> y no se puede deshacer.
              {clients.length > 0 && (
                <span className="block mt-2 text-red-500 bg-red-50 p-2 rounded-md">
                  ¡Atención! Esta sucursal tiene {clients.length} cliente{clients.length !== 1 && 's'} asociado{clients.length !== 1 && 's'}.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-500"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function SucursalCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="h-48 bg-gray-200">
        <Skeleton className="h-full w-full" />
      </div>
      <CardContent className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/4 mb-4" />
        <Skeleton className="h-4 w-1/3" />
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  )
}