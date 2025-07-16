"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, MoreHorizontal, Printer, Shield, Calendar, Search, AlertCircle, Filter, AlertTriangle, ArrowUpCircle, ShieldCheck } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { differenceInDays, isPast } from "date-fns"
import { GarantiasMetrics } from "./garantias-metrics"

interface ServiceOrder {
  id: string
  orderNumber: string
  garantiaStartDate: Date | null
  garantiaEndDate: Date | null
  garantiaIlimitada: boolean
  garantiaPrioridad: string | null
  razonGarantia: string | null
  client: {
    name: string
  }
  appliances: {
    clientAppliance: {
      name: string
      brand: {
        name: string
      }
      applianceType: {
        name: string
      }
    }
  }[]
}

interface GarantiasTableProps {
  orders: ServiceOrder[]
  userId: string
}

export function GarantiasTable({ orders: initialOrders, userId }: GarantiasTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterPriority, setFilterPriority] = useState("all")
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>(initialOrders)

  // Filter orders based on search term, status and priority
  React.useEffect(() => {
    let filtered = initialOrders

    // Apply search filter
    if (searchTerm.trim() !== "") {
      const lowercasedSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(lowercasedSearch) ||
          order.client.name.toLowerCase().includes(lowercasedSearch) ||
          (order.appliances.length > 0 && order.appliances[0].clientAppliance.name.toLowerCase().includes(lowercasedSearch)) ||
          (order.appliances.length > 0 && order.appliances[0].clientAppliance.brand.name.toLowerCase().includes(lowercasedSearch))
      )
    }

    // Apply status filter
    if (filterStatus !== "all") {
      if (filterStatus === "active") {
        filtered = filtered.filter(
          (order) => order.garantiaIlimitada || (order.garantiaEndDate && !isPast(new Date(order.garantiaEndDate))),
        )
      } else if (filterStatus === "expired") {
        filtered = filtered.filter(
          (order) => !order.garantiaIlimitada && order.garantiaEndDate && isPast(new Date(order.garantiaEndDate)),
        )
      } else if (filterStatus === "unlimited") {
        filtered = filtered.filter((order) => order.garantiaIlimitada)
      }
    }
    
    // Apply priority filter
    if (filterPriority !== "all") {
      filtered = filtered.filter((order) => order.garantiaPrioridad === filterPriority)
    }

    setFilteredOrders(filtered)
  }, [searchTerm, filterStatus, filterPriority, initialOrders])

  // Get warranty status and days remaining
  const getWarrantyStatus = (order: ServiceOrder) => {
    if (order.garantiaIlimitada) {
      return {
        status: "unlimited",
        label: "Ilimitada",
        variant: "success",
      }
    }

    if (!order.garantiaEndDate) {
      return {
        status: "none",
        label: "Sin garantía",
        variant: "destructive",
      }
    }

    const endDate = new Date(order.garantiaEndDate)
    const today = new Date()

    if (isPast(endDate)) {
      return {
        status: "expired",
        label: "Expirada",
        variant: "destructive",
      }
    }

    const daysRemaining = differenceInDays(endDate, today)

    if (daysRemaining <= 7) {
      return {
        status: "expiring",
        label: `${daysRemaining} días`,
        variant: "warning",
      }
    }

    return {
      status: "active",
      label: `${daysRemaining} días`,
      variant: "success",
    }
  }
  
  // Get priority badge
  const getPriorityBadge = (priority: string | null) => {
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

  if (initialOrders.length === 0) {
    return (
      <div className="text-center py-10 space-y-4">
        <Shield className="h-16 w-16 mx-auto text-muted-foreground/30" />
        <p className="text-muted-foreground">No se encontraron garantías</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GarantiasMetrics orders={initialOrders} />
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Input
            placeholder="Buscar por número, cliente o equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 focus:ring-2 focus:ring-primary/20"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="active">Garantías activas</SelectItem>
              <SelectItem value="expired">Garantías expiradas</SelectItem>
              <SelectItem value="unlimited">Garantías ilimitadas</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <div className="flex items-center">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtrar por prioridad" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las prioridades</SelectItem>
              <SelectItem value="BAJA">Prioridad Baja</SelectItem>
              <SelectItem value="MEDIA">Prioridad Media</SelectItem>
              <SelectItem value="ALTA">Prioridad Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-1">No se encontraron resultados</p>
            <p className="text-sm text-muted-foreground">Intente con otros términos de búsqueda o filtros</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted hover:bg-muted">
                  <TableHead className="font-semibold">Número</TableHead>
                  <TableHead className="font-semibold">Cliente</TableHead>
                  <TableHead className="font-semibold">Electrodoméstico</TableHead>
                  <TableHead className="font-semibold">Inicio</TableHead>
                  <TableHead className="font-semibold">Fin</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold">Prioridad</TableHead>
                  <TableHead className="font-semibold w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order, index) => {
                  const warranty = getWarrantyStatus(order)

                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="group hover:bg-muted/50 cursor-pointer transition-colors"
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
                      <TableCell>{order.client.name}</TableCell>
                      <TableCell>
                        {order.appliances.length > 0 && order.appliances[0].clientAppliance ? (
                          <div className="flex flex-col">
                            <span>{order.appliances[0].clientAppliance.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {order.appliances[0].clientAppliance.brand.name} - {order.appliances[0].clientAppliance.applianceType.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.garantiaStartDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{formatDate(order.garantiaStartDate)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.garantiaIlimitada ? (
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                            <Shield className="h-3 w-3 mr-1" />
                            Ilimitada
                          </Badge>
                        ) : order.garantiaEndDate ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{formatDate(order.garantiaEndDate)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={warranty.variant}>{warranty.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(order.garantiaPrioridad)}
                      </TableCell>
                      <TableCell className="relative" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-70 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-[180px]">
                            <DropdownMenuItem onClick={() => router.push(`/ordenes/${order.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Ver detalles</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/ordenes/${order.id}/print`)}>
                              <Printer className="mr-2 h-4 w-4" />
                              <span>Imprimir</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <div className="text-sm text-muted-foreground text-center pt-2">
        Mostrando {filteredOrders.length} de {initialOrders.length} garantías
      </div>
    </div>
  )
}