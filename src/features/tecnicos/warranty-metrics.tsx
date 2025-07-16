"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, ShieldCheck, ArrowUpCircle, BarChart3, Shield } from "lucide-react"
import { motion } from "framer-motion"

interface WarrantyMetricsProps {
  warrantyOrders: any[]
}

export function WarrantyMetrics({ warrantyOrders }: WarrantyMetricsProps) {
  const [metrics, setMetrics] = useState({
    total: 0,
    baja: 0,
    media: 0,
    alta: 0,
  })

  useEffect(() => {
    // Calculate metrics
    const total = warrantyOrders.length
    const baja = warrantyOrders.filter(order => order.garantiaPrioridad === "BAJA").length
    const media = warrantyOrders.filter(order => order.garantiaPrioridad === "MEDIA").length
    const alta = warrantyOrders.filter(order => order.garantiaPrioridad === "ALTA").length

    setMetrics({
      total,
      baja,
      media,
      alta,
    })
  }, [warrantyOrders])

  // Calculate percentages for the progress bars
  const calculatePercentage = (value: number) => {
    if (metrics.total === 0) return 0
    return (value / metrics.total) * 100
  }

  const bajaPercentage = calculatePercentage(metrics.baja)
  const mediaPercentage = calculatePercentage(metrics.media)
  const altaPercentage = calculatePercentage(metrics.alta)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Garantías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-primary mr-2" />
              <div className="text-2xl font-bold">{metrics.total}</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Órdenes con garantía activa
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prioridad Baja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ShieldCheck className="h-5 w-5 text-green-500 mr-2" />
              <div className="text-2xl font-bold">{metrics.baja}</div>
              <Badge variant="outline" className="ml-auto">
                {bajaPercentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="mt-2">
              <div className="bg-muted rounded-full h-2 w-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full rounded-full" 
                  style={{ width: `${bajaPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prioridad Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <div className="text-2xl font-bold">{metrics.media}</div>
              <Badge variant="outline" className="ml-auto">
                {mediaPercentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="mt-2">
              <div className="bg-muted rounded-full h-2 w-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full" 
                  style={{ width: `${mediaPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prioridad Alta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ArrowUpCircle className="h-5 w-5 text-red-500 mr-2" />
              <div className="text-2xl font-bold">{metrics.alta}</div>
              <Badge variant="outline" className="ml-auto">
                {altaPercentage.toFixed(1)}%
              </Badge>
            </div>
            <div className="mt-2">
              <div className="bg-muted rounded-full h-2 w-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full rounded-full" 
                  style={{ width: `${altaPercentage}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}