"use client"

import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { DateTimePicker } from "@/components/ui/date-time-picker"

interface ApplianceIssueFormProps {
  falla: string
  setFalla: (value: string) => void
  isPreOrder: boolean
  setIsPreOrder: (value: boolean) => void
  clientApplianceName?: string
  fechaAgendado?: Date | null
  setFechaAgendado: (value: Date | null) => void
}

export function ApplianceIssueForm({
  falla,
  setFalla,
  isPreOrder,
  setIsPreOrder,
  clientApplianceName,
  fechaAgendado,
  setFechaAgendado
}: ApplianceIssueFormProps) {
  // Invert the switch functionality (true = orden, false = pre-orden)
  const isOrden = !isPreOrder
  const handleOrderTypeChange = (value: boolean) => {
    setIsPreOrder(!value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalles del Servicio</CardTitle>
        <CardDescription>
          Ingrese la información sobre el problema del electrodoméstico
          {clientApplianceName && `: ${clientApplianceName}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="falla">Falla o Problema</Label>
          <Textarea
            id="falla"
            placeholder="Describa el problema o falla que presenta el electrodoméstico"
            value={falla}
            onChange={(e) => setFalla(e.target.value)}
            className="min-h-20"
          />
        </div>
        
        <div className="flex items-center space-x-2 justify-between pt-2 pb-2 border-t border-b">
          <div className="flex items-center space-x-2">
            <Label htmlFor="orderType" className="font-normal">Tipo: </Label>
            <span className={isOrden ? "text-primary font-medium" : "text-muted-foreground"}>Orden</span>
            <Switch
              id="orderType"
              checked={isOrden}
              onCheckedChange={handleOrderTypeChange}
            />
            <span className={!isOrden ? "text-primary font-medium" : "text-muted-foreground"}>Pre-Orden</span>
          </div>
        </div>
        
        {/* Solo mostrar el selector de fecha y hora cuando es una orden regular */}
        {!isPreOrder && (
          <div className="space-y-2 pt-2">
            <Label htmlFor="fechaAgendado">Fecha y Hora Agendada (opcional)</Label>
            <DateTimePicker
              date={fechaAgendado || undefined}
              setDate={(date) => setFechaAgendado(date || null)}
              disabledDate={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}