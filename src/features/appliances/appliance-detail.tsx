"use client"
import Link from "next/link"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Calendar, Edit, FileText, MonitorSmartphone, Settings, Tag, Plus, ExternalLink } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ApplianceDialogForm } from "./appliance-dialog-form"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

interface ApplianceDetailProps {
  appliance: any
  serviceOrders: any[]
  userId: string
}

export function ApplianceDetail({ appliance, serviceOrders, userId }: ApplianceDetailProps) {
  const router = useRouter()
  const [openEditDialog, setOpenEditDialog] = useState(false)

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning"
      case "ASSIGNED":
        return "info"
      case "IN_PROGRESS":
        return "info"
      case "COMPLETED":
        return "success"
      case "DELIVERED":
        return "neutral"
      case "CANCELLED":
        return "destructive"
      default:
        return "neutral"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING":
        return "Pendiente"
      case "ASSIGNED":
        return "Asignada"
      case "IN_PROGRESS":
        return "En Progreso"
      case "COMPLETED":
        return "Completada"
      case "DELIVERED":
        return "Entregada"
      case "CANCELLED":
        return "Cancelada"
      default:
        return status
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/electrodomesticos">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{appliance.name}</h1>
        </div>

        <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0">
            <ApplianceDialogForm
              mode="edit"
              initialData={appliance}
              userId={userId}
              initialBrands={[appliance.brand]}
              initialApplianceTypes={[appliance.applianceType]}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden border-border bg-card hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2 bg-card">
              <CardTitle className="text-lg flex items-center gap-2">
                <MonitorSmartphone className="h-5 w-5 text-primary" />
                Información del Electrodoméstico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-medium text-muted-foreground">Nombre</h3>
                  <p className="font-medium">{appliance.name}</p>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-medium text-muted-foreground">Marca</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <Tag className="h-3 w-3 mr-1" />
                      {appliance.brand?.name || "N/A"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-sm font-medium text-muted-foreground">Tipo</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      <Settings className="h-3 w-3 mr-1" />
                      {appliance.applianceType?.name || "N/A"}
                    </Badge>
                  </div>
                </div>
                
                {appliance.model && (
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-medium text-muted-foreground">Modelo</h3>
                    <p>{appliance.model}</p>
                  </div>
                )}

                {appliance.serialNumber && (
                  <div className="space-y-1.5 col-span-full">
                    <h3 className="text-sm font-medium text-muted-foreground">Número de Serie</h3>
                    <p className="font-mono text-sm">{appliance.serialNumber}</p>
                  </div>
                )}

                <div className="space-y-1.5 col-span-full">
                  <h3 className="text-sm font-medium text-muted-foreground">Fecha de Creación</h3>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm">{formatDate(appliance.createdAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="overflow-hidden border-border bg-card hover:shadow-md transition-shadow duration-300">
            <CardHeader className="pb-2 bg-card">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Historial de Órdenes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {serviceOrders.length > 0 ? (
                <div className="overflow-x-auto -mx-4 px-4">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-muted/50">
                        <TableHead className="w-[100px]">Número</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {serviceOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell className="text-sm">{formatDate(order.receivedDate)}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(order.status)}>
                              {getStatusText(order.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="truncate max-w-[120px]" title={order.client?.name || "N/A"}>
                            {order.client?.name || "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                              <Link href={`/ordenes/${order.id}`}>
                                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                Ver
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 px-4">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground mb-4">No hay órdenes de servicio para este electrodoméstico</p>
                  <Button asChild>
                    <Link href="/orden" className="gap-1">
                      <Plus className="h-4 w-4" />
                      Crear orden
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Tabs defaultValue="diagnostics" className="mt-8">
          <TabsList>
            <TabsTrigger value="diagnostics" className="relative overflow-hidden">
              Diagnósticos
            </TabsTrigger>
            <TabsTrigger value="repairs" className="relative overflow-hidden">
              Reparaciones
            </TabsTrigger>
          </TabsList>
          <TabsContent value="diagnostics" className="p-6 border rounded-md mt-4 bg-card">
            {serviceOrders.filter((order) => order.diagnostics).length > 0 ? (
              <div className="space-y-6">
                {serviceOrders
                  .filter((order) => order.diagnostics)
                  .map((order) => (
                    <div key={order.id} className="border rounded-md overflow-hidden bg-background">
                      <div className="flex justify-between items-center border-b p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <h3 className="font-medium">Orden #{order.orderNumber}</h3>
                          <span className="text-sm text-muted-foreground hidden sm:inline">•</span>
                          <p className="text-sm text-muted-foreground">{formatDate(order.receivedDate)}</p>
                        </div>
                        <Badge variant={getStatusVariant(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      <div className="p-4 bg-muted/30">
                        <p className="whitespace-pre-line">{order.diagnostics}</p>
                      </div>
                      <div className="flex justify-end p-2 bg-background border-t">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/ordenes/${order.id}`} className="text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Ver detalles
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No hay diagnósticos registrados</p>
              </div>
            )}
          </TabsContent>
          <TabsContent value="repairs" className="p-6 border rounded-md mt-4 bg-card">
            {serviceOrders.filter((order) => order.solution).length > 0 ? (
              <div className="space-y-6">
                {serviceOrders
                  .filter((order) => order.solution)
                  .map((order) => (
                    <div key={order.id} className="border rounded-md overflow-hidden bg-background">
                      <div className="flex justify-between items-center border-b p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <h3 className="font-medium">Orden #{order.orderNumber}</h3>
                          <span className="text-sm text-muted-foreground hidden sm:inline">•</span>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(order.completedDate || order.receivedDate)}
                          </p>
                        </div>
                        <Badge variant={getStatusVariant(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      <div className="p-4 bg-muted/30">
                        <p className="whitespace-pre-line">{order.solution}</p>
                      </div>
                      <div className="flex justify-end p-2 bg-background border-t">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/ordenes/${order.id}`} className="text-xs">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Ver detalles
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">No hay reparaciones registradas</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </>
  )
}