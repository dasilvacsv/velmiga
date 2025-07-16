"use client"

import { 
  Building2, 
  Users, 
  TrendingUp, 
  Award,
  BarChart3
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface SucursalMetricsProps {
  stats: {
    totalClients: number
    sucursalCount: number
    avgClientsPerSucursal: number
    maxClients: number
    sucursalWithMostClients: string
  }
  sucursales: any[]
}

export function SucursalMetrics({ stats, sucursales }: SucursalMetricsProps) {
  // Find name of sucursal with most clients
  const topSucursalName = sucursales.find(
    s => s.id === stats.sucursalWithMostClients
  )?.name || "Ninguna"
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Total Sucursales
          </CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.sucursalCount}</div>
          <CardDescription>
            Ubicaciones activas en el sistema
          </CardDescription>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Total Clientes
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalClients}</div>
          <CardDescription>
            En todas las sucursales
          </CardDescription>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Promedio de Clientes
          </CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgClientsPerSucursal}</div>
          <CardDescription>
            Por sucursal
          </CardDescription>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-3">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Sucursal con Más Clientes
          </CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold truncate">{topSucursalName}</div>
          <CardDescription>
            {stats.maxClients} clientes registrados
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  )
}