"use client"

import React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Shield, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  ArrowUpCircle, 
  ShieldCheck, 
  Users, 
  ClipboardList,
  Loader2,
  FileDown
} from "lucide-react"
import Link from "next/link"
import { WarrantyMetrics } from "./warranty-metrics"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { PDFDownloadLink } from '@react-pdf/renderer'
import { WarrantyPDF } from "./warranty-pdf"

interface TechnicianWithWarrantyProps {
  technicians: any[];
  isLoading?: boolean;
}

export function TechniciansWithWarranty({ technicians, isLoading = false }: TechnicianWithWarrantyProps) {
  console.log(technicians);
  
  const [expandedTechnician, setExpandedTechnician] = useState<string | null>(null)
  const router = useRouter()
  
  // Calculate total warranty orders across all technicians
  const allWarrantyOrders = technicians.flatMap(tech => tech.warrantyOrders || [])
  
  const toggleTechnician = (id: string) => {
    setExpandedTechnician(expandedTechnician === id ? null : id)
  }
  
  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "BAJA":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><ShieldCheck className="h-3 w-3 mr-1" /> Baja</Badge>
      case "MEDIA":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><AlertTriangle className="h-3 w-3 mr-1" /> Media</Badge>
      case "ALTA":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><ArrowUpCircle className="h-3 w-3 mr-1" /> Alta</Badge>
      default:
        return <Badge variant="outline">No definida</Badge>
    }
  }
  
  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Metrics skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        
        {/* Table skeleton */}
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }
  
  // No technicians to display
  if (technicians.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No hay técnicos con garantías asignadas</p>
        </CardContent>
      </Card>
    )
  }
  
  // No warranty orders at all
  if (allWarrantyOrders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No hay órdenes con garantía aplicada</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <WarrantyMetrics warrantyOrders={allWarrantyOrders} />
        <PDFDownloadLink
          document={<WarrantyPDF technicians={technicians.filter(tech => tech.warrantyCount > 0)} />}
          fileName={`garantias-tecnicos-${new Date().toISOString().split('T')[0]}.pdf`}
        >
          {({ blob, url, loading, error }) => (
            <Button variant="outline" disabled={loading}>
              <FileDown className="h-4 w-4 mr-2" />
              {loading ? 'Generando PDF...' : 'Exportar PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Shield className="h-5 w-5 mr-2 text-primary" /> 
            Técnicos con Garantías
          </CardTitle>
          <CardDescription>
            Listado ordenado por cantidad de garantías (mayor a menor)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead className="text-center">Total Garantías</TableHead>
                  <TableHead className="text-center">Prioridad Baja</TableHead>
                  <TableHead className="text-center">Prioridad Media</TableHead>
                  <TableHead className="text-center">Prioridad Alta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicians
                  .filter(technician => technician.warrantyCount > 0 || (technician.warrantyOrders && technician.warrantyOrders.length > 0))
                  .map((technician) => (
                  <React.Fragment key={technician.id}>
                    <TableRow 
                      className={`group hover:bg-muted/40 ${expandedTechnician === technician.id ? 'bg-muted/40' : ''}`}
                      onClick={() => toggleTechnician(technician.id)}
                    >
                      <TableCell className="p-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleTechnician(technician.id)
                          }}
                        >
                          {expandedTechnician === technician.id ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-medium">
                        {technician.name ? (
                          <Link 
                            href={`/tecnicos/${technician.id}`} 
                            className="hover:text-primary transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {technician.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground italic">Nombre no disponible</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={technician.warrantyCount > 0 ? "default" : "outline"}>
                          {technician.warrantyCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={technician.priorityStats.baja > 0 ? "bg-green-50 text-green-700 border-green-200" : ""}>
                          {technician.priorityStats.baja}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={technician.priorityStats.media > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : ""}>
                          {technician.priorityStats.media}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={technician.priorityStats.alta > 0 ? "bg-red-50 text-red-700 border-red-200" : ""}>
                          {technician.priorityStats.alta}
                        </Badge>
                      </TableCell>
                    </TableRow>
                    <AnimatePresence>
                      {expandedTechnician === technician.id && technician.warrantyOrders.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0 border-t-0">
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="bg-muted/20 p-4 rounded-b-md">
                                <h3 className="text-sm font-medium mb-3 flex items-center">
                                  <ClipboardList className="h-4 w-4 mr-1.5 text-primary" />
                                  Órdenes con Garantía Asignadas
                                </h3>
                                <div className="rounded-md border bg-background">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Número</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Electrodoméstico</TableHead>
                                        <TableHead>Teléfono</TableHead>
                                        <TableHead>Dirección</TableHead>
                                        <TableHead>Razón Garantía</TableHead>
                                        <TableHead>Prioridad</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {technician.warrantyOrders.map((order: any) => (
                                        <TableRow 
                                          key={order.id} 
                                          className="hover:bg-muted/30 cursor-pointer"
                                          onClick={() => router.push(`/ordenes/${order.id}`)}
                                        >
                                          <TableCell className="font-medium">
                                            <Link 
                                              href={`/ordenes/${order.id}`}
                                              className="hover:text-primary transition-colors"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              #{order.orderNumber}
                                            </Link>
                                          </TableCell>
                                          <TableCell>
                                            {order.client?.name || (
                                              <span className="text-muted-foreground italic">Cliente no disponible</span>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {order.appliances.length > 0 && order.appliances[0].clientAppliance ? (
                                              <div className="flex flex-col">
                                                <span>{order.appliances[0].clientAppliance.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                  {order.appliances[0].clientAppliance.brand.name} - {order.appliances[0].clientAppliance.applianceType.name}
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-muted-foreground italic">No disponible</span>
                                            )}
                                          </TableCell>
                                          <TableCell>
                                            {order.client?.phone || (
                                              <span className="text-muted-foreground italic">No disponible</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="max-w-[200px]">
                                            <div className="truncate">
                                              {order.client?.address || (
                                                <span className="text-muted-foreground italic">No disponible</span>
                                              )}
                                            </div>
                                          </TableCell>
                                          <TableCell className="max-w-[200px]">
                                            <div className="truncate">
                                              {order.razonGarantia || "No especificada"}
                                            </div>
                                          </TableCell>
                                          <TableCell>{getPriorityBadge(order.garantiaPrioridad || "")}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))}
                
                {/* If no technicians have warranty orders */}
                {technicians.every(t => t.warrantyCount === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <Shield className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                      <p className="text-muted-foreground">No hay órdenes con garantía asignadas a técnicos</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}