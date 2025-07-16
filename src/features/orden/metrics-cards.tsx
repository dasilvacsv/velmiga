import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Clock, CheckSquare, Shield } from "lucide-react";

interface MetricsCardsProps {
  metrics: {
    total: number;
    pending: number;
    completed: number;
    delivered: number;
    warranty: number;
  };
  totalOrders: number;
  hasActiveFilters: boolean;
}

export function MetricsCards({ metrics, totalOrders, hasActiveFilters }: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="overflow-hidden border-l-4 border-l-blue-500 transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Órdenes Totales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.total}</p>
          {hasActiveFilters && (
            <p className="text-sm text-muted-foreground mt-1">
              {metrics.total === totalOrders 
                ? "Mostrando todas las órdenes" 
                : `Filtrando ${metrics.total} de ${totalOrders} órdenes`}
            </p>
          )}
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-l-4 border-l-amber-500 transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Órdenes Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.pending}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {Math.round((metrics.pending / metrics.total) * 100) || 0}% del total
          </p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-l-4 border-l-green-500 transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-green-500" />
            Órdenes Completadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.completed}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {Math.round((metrics.completed / metrics.total) * 100) || 0}% del total
          </p>
        </CardContent>
      </Card>
      
      <Card className="overflow-hidden border-l-4 border-l-purple-500 transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-500" />
            Órdenes en Garantía
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{metrics.warranty}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {Math.round((metrics.warranty / metrics.total) * 100) || 0}% del total de órdenes
          </p>
        </CardContent>
      </Card>
    </div>
  );
}