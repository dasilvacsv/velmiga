import React from "react"
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Laptop, MonitorSmartphone, Settings, Tag } from "lucide-react"

interface ApplianceInfoCardProps {
  appliances: any[]
  onViewDetails?: () => void
}

export function ApplianceInfoCard({ appliances, onViewDetails }: ApplianceInfoCardProps) {
  return (
    <Card className="overflow-hidden border-l-4 border-l-indigo-500 dark:border-l-indigo-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <MonitorSmartphone className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />
          {appliances.length > 1 ? `Electrodomésticos (${appliances.length})` : "Electrodoméstico"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {appliances.map((appliance: any, index: number) => (
          <div key={index} className="space-y-3 border-b last:border-0 pb-3 last:pb-0">
            <div>
              <h3 className="font-medium text-muted-foreground">Nombre</h3>
              <p className="font-medium">{appliance.clientAppliance.name}</p>
            </div>

            <div>
              <h3 className="font-medium text-muted-foreground">Marca</h3>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <p>{appliance.clientAppliance.brand.name}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-muted-foreground">Tipo</h3>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
                <p>{appliance.clientAppliance.applianceType.name}</p>
              </div>
            </div>

            {appliance.clientAppliance.model && (
              <div>
                <h3 className="font-medium text-muted-foreground">Modelo</h3>
                <p>{appliance.clientAppliance.model}</p>
              </div>
            )}

            {appliance.clientAppliance.serialNumber && (
              <div>
                <h3 className="font-medium text-muted-foreground">Número de Serie</h3>
                <p className="font-mono text-xs">{appliance.clientAppliance.serialNumber}</p>
              </div>
            )}

            {appliance.clientAppliance.notes && (
              <div>
                <h3 className="font-medium text-muted-foreground">Notas</h3>
                <p className="whitespace-pre-line bg-muted p-2 rounded text-xs mt-1">{appliance.clientAppliance.notes}</p>
              </div>
            )}

            {appliance.falla && (
              <div>
                <h3 className="font-medium text-muted-foreground">Falla Reportada</h3>
                <p className="whitespace-pre-line bg-muted p-2 rounded text-xs mt-1">{appliance.falla}</p>
              </div>
            )}

            {appliance.solucion && (
              <div>
                <h3 className="font-medium text-muted-foreground">Solución</h3>
                <p className="whitespace-pre-line bg-muted p-2 rounded text-xs mt-1">{appliance.solucion}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
      {appliances.length > 1 && onViewDetails && (
        <CardFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewDetails}
            className="w-full justify-start hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-400"
          >
            <Laptop className="mr-2 h-4 w-4" />
            Ver detalles de fallas
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}