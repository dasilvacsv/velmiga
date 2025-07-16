"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Edit,
  User,
  Phone,
  CalendarClock,
  ClipboardList,
  ClipboardCheck,
  Clock,
  CheckSquare,
  XCircle,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { TechnicianStatusToggle } from "./technician-status-toggle"
import { TechnicianDialog } from "./technician-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"

interface TechnicianDetailProps {
  technicianData: any
  userId: string
}

export function TechnicianDetail({ technicianData, userId }: TechnicianDetailProps) {
  const router = useRouter()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const { technician, assignments } = technicianData
  
  // Data validation - ensure technician data exists
  const isValidTechnician = useMemo(() => {
    return technician && 
           typeof technician === 'object' && 
           technician.id && 
           technician.name;
  }, [technician]);
  
  // If technician data is invalid, show error state
  if (!isValidTechnician) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500" />
          <h2 className="text-xl font-semibold">Error al cargar los datos del técnico</h2>
          <p className="text-muted-foreground max-w-md">
            La información del técnico no está disponible o es incompleta. Esto puede deberse a un problema en la base de datos.
          </p>
          <div className="flex gap-4 mt-4">
            <Button 
              variant="outline" 
              onClick={() => router.refresh()}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <Button 
              onClick={() => router.refresh()}
              className="gap-2"
            >
              <span>Reintentar</span>
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  
  const activeAssignments = assignments.filter((a: any) => a.isActive)
  const inactiveAssignments = assignments.filter((a: any) => !a.isActive)
  
  const getTotalAssignments = () => assignments.length
  const getActiveAssignments = () => activeAssignments.length
  const getCompletedAssignments = () => {
    return assignments.filter((a: any) => 
      ["COMPLETED", "DELIVERED", "FACTURADO", "ENTREGA_GENERADA"].includes(a.serviceOrder.status)
    ).length
  }
  
  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "APROBADO":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "NO_APROBADO":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "PENDIENTE_AVISAR":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "DELIVERED":
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300"
      case "CANCELLED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "FACTURADO": 
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "ENTREGA_GENERADA":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300"
    }
  }
  
  const getOrderStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pendiente"
      case "ASSIGNED":
        return "Asignada"
      case "APROBADO":
        return "Aprobada"
      case "NO_APROBADO":
        return "No Aprobada"
      case "PENDIENTE_AVISAR":
        return "Pendiente Avisar"
      case "COMPLETED":
        return "Completada"
      case "DELIVERED":
        return "Entregada"
      case "CANCELLED":
        return "Cancelada"
      case "FACTURADO":
        return "Facturada"
      case "ENTREGA_GENERADA":
        return "Entrega Generada"
      default:
        return status
    }
  }
  
  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);
    router.refresh();
    // Reset loading after a timeout
    setTimeout(() => setIsLoading(false), 1000);
  };
  
  if (isLoading) {
    return <TechnicianDetailSkeleton />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header with back button and technician name */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            asChild
            className="rounded-full shadow-sm hover:shadow-md transition-all"
          >
            <Link href="/tecnicos">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              {technician.name}
              <Badge variant={technician.is_active ? "success" : "neutral"}>
                {technician.is_active ? "Activo" : "Inactivo"}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              Creado el {formatDate(technician.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh} title="Actualizar datos">
            <span className="sr-only">Actualizar datos</span>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowLeft className="h-4 w-4 rotate-45" />
            )}
          </Button>
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </div>
        <TechnicianDialog
          mode="edit"
          initialData={{
            id: technician.id,
            name: technician.name,
            phone: technician.phone,
            is_active: technician.is_active
          }}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      </div>
      
      {/* Technician information and metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column - Technician details */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border-l-4 border-l-indigo-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <User className="h-5 w-5 text-indigo-500" />
                Información del Técnico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Nombre:</span>
                  <span className="font-medium">{technician.name}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Teléfono:</span>
                  <span className={!technician.phone ? "text-muted-foreground italic" : ""}>
                    {technician.phone || "No registrado"}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Creado el:</span>
                  <span>{formatDate(technician.createdAt)}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Actualizado el:</span>
                  <span>{formatDate(technician.updatedAt)}</span>
                </div>
              </div>
              
              <div className="pt-2 mt-2 border-t">
                <TechnicianStatusToggle
                  technicianId={technician.id}
                  isActive={technician.is_active}
                  inCard={true}
                />
                
                {!technician.is_active && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <Info className="h-4 w-4 mt-0.5" />
                    <div>
                      <p>Este técnico está marcado como inactivo.</p>
                      <p className="mt-1">Los técnicos inactivos no aparecerán en las listas de asignación, pero se mantiene su historial de órdenes.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Middle column - Assignment Statistics */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.1 }}
          className="space-y-6"
        >
          <Card className="overflow-hidden border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-500" />
                Asignaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Total de asignaciones:</span>
                  <span className="text-2xl font-bold">{getTotalAssignments()}</span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Asignaciones activas:</span>
                  <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                    {getActiveAssignments()}
                  </span>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Órdenes completadas:</span>
                  <span className="text-xl font-semibold text-green-600 dark:text-green-400">
                    {getCompletedAssignments()}
                  </span>
                </div>
                
                {assignments.length > 0 && (
                  <div className="pt-4 mt-2 border-t space-y-2">
                    <span className="text-sm font-medium">Última actualización:</span>
                    <div className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-blue-500" />
                      <span>{formatDate(assignments[0].assignedDate)}</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Right Column - Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="overflow-hidden border-l-4 border-l-purple-500 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-500" />
                Estado de Órdenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-amber-500" />
                        Pendientes
                      </span>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {assignments.filter((a: any) => ["PENDING", "ASSIGNED", "PENDIENTE_AVISAR"].includes(a.serviceOrder.status)).length}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-green-500" />
                        Completadas
                      </span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        {assignments.filter((a: any) => ["COMPLETED", "APROBADO", "FACTURADO", "ENTREGA_GENERADA", "DELIVERED"].includes(a.serviceOrder.status)).length}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Canceladas
                      </span>
                      <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {assignments.filter((a: any) => ["CANCELLED", "NO_APROBADO"].includes(a.serviceOrder.status)).length}
                      </Badge>
                    </div>
                  </div>
                  
                  {!technician.is_active && assignments.length > 0 && (
                    <div className="pt-4 mt-2 border-t">
                      <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-md text-sm">
                        <p className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                          <AlertCircle className="h-4 w-4" />
                          <span>Este técnico está inactivo pero tiene {getActiveAssignments()} asignaciones activas.</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No hay asignaciones de órdenes para este técnico</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Order Assignments Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-8"
      >
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="active" className="text-base">
              <CheckSquare className="mr-2 h-4 w-4" />
              Asignaciones Activas ({activeAssignments.length})
            </TabsTrigger>
            <TabsTrigger value="history" className="text-base">
              <ClipboardList className="mr-2 h-4 w-4" />
              Historial de Asignaciones ({inactiveAssignments.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="border rounded-lg p-1 mt-2">
            {activeAssignments.length > 0 ? (
              <AssignmentsTable 
                assignments={activeAssignments} 
                getOrderStatusColor={getOrderStatusColor}
                getOrderStatusText={getOrderStatusText}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No hay asignaciones activas para este técnico</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="history" className="border rounded-lg p-1 mt-2">
            {inactiveAssignments.length > 0 ? (
              <AssignmentsTable 
                assignments={inactiveAssignments} 
                getOrderStatusColor={getOrderStatusColor}
                getOrderStatusText={getOrderStatusText}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No hay historial de asignaciones para este técnico</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}

// Loading skeleton for the technician detail page
function TechnicianDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40 mt-2" />
          </div>
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      
      {/* Info cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[280px] w-full" />
        ))}
      </div>
      
      {/* Tabs skeleton */}
      <div className="mt-8">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    </div>
  );
}

interface AssignmentsTableProps {
  assignments: any[]
  getOrderStatusColor: (status: string) => string
  getOrderStatusText: (status: string) => string
}

function AssignmentsTable({ assignments, getOrderStatusColor, getOrderStatusText }: AssignmentsTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº Orden</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Fecha Asignación</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Notas</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assignments.map((assignment) => (
            <TableRow key={assignment.id}>
              <TableCell className="font-medium">
                <Link 
                  href={`/ordenes/${assignment.serviceOrder.id}`}
                  className="hover:text-primary transition-colors"
                >
                  #{assignment.serviceOrder.orderNumber}
                </Link>
              </TableCell>
              <TableCell>
                {assignment.serviceOrder.client?.name || (
                  <span className="text-muted-foreground italic">Cliente no disponible</span>
                )}
              </TableCell>
              <TableCell>{formatDate(assignment.assignedDate)}</TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={getOrderStatusColor(assignment.serviceOrder.status)}
                >
                  {getOrderStatusText(assignment.serviceOrder.status)}
                </Badge>
              </TableCell>
              <TableCell>
                {assignment.notes ? (
                  <span className="line-clamp-1">{assignment.notes}</span>
                ) : (
                  <span className="text-muted-foreground italic text-sm">Sin notas</span>
                )}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/ordenes/${assignment.serviceOrder.id}`}>
                    Ver orden
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}