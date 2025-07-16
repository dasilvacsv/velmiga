import React, { useState } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, Clock, Loader2, PencilIcon, Save, X } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"
import { formatDateString } from "@/lib/formatting"
import { DateTimePicker } from "@/components/ui/date-time-picker"

interface DateManagementCardProps {
  order: any
  userId: string
  onDateUpdate: (fieldName: string, date: Date | null) => Promise<void>
}

export function DateManagementCard({ order, userId, onDateUpdate }: DateManagementCardProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const handleEdit = (fieldName: string, currentDate: string | null) => {
    setEditingField(fieldName)
    setSelectedDate(currentDate ? new Date(currentDate) : new Date())
  }

  const handleSave = async () => {
    if (!editingField || !selectedDate) return

    try {
      setIsUpdating(true)
      await onDateUpdate(editingField, selectedDate)

      toast({
        title: "Éxito",
        description: "Fecha actualizada correctamente",
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating date:", error)
      toast({
        title: "Error",
        description: "Error al actualizar la fecha",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
      setEditingField(null)
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setSelectedDate(null)
  }

  const getDateItem = (
    fieldName: string,
    label: string,
    date: string | Date | null,
    icon: React.ReactNode,
    canEdit = true,
  ) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-muted-foreground">{label}</h3>
        {canEdit && !editingField && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => handleEdit(fieldName, date?.toString())}
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {editingField === fieldName ? (
        <div className="space-y-2">
          <DateTimePicker
            date={selectedDate || undefined}
            setDate={setSelectedDate}
          />

          <div className="flex items-center gap-1">
            <Button size="sm" variant="default" className="flex-1" onClick={handleSave} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar
            </Button>
            <Button size="sm" variant="ghost" className="flex-1" onClick={handleCancel} disabled={isUpdating}>
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {icon}
          <p>
            {date ? 
              formatDateString(date.toString()) :  
              <span className="text-muted-foreground italic">No establecida</span>
            }
          </p>
        </div>
      )}
    </div>
  )

  return (
    <Card className="overflow-hidden border-l-4 border-l-amber-500 dark:border-l-amber-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Clock className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          Fechas de Seguimiento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {getDateItem(
          "fechaCaptacion",
          "Fecha de Captación",
          order.fechaCaptacion,
          <Calendar className="h-4 w-4 text-amber-500 dark:text-amber-400" />,
        )}

        {getDateItem(
          "fechaAgendado",
          "Fecha y Hora de Agenda",
          order.fechaAgendado,
          <Calendar className="h-4 w-4 text-amber-500 dark:text-amber-400" />,
        )}

        {(order.status === "PENDIENTE_AVISAR" || order.fechaSeguimiento) &&
          getDateItem(
            "fechaSeguimiento",
            "Fecha y Hora de Seguimiento",
            order.fechaSeguimiento,
            <Calendar className="h-4 w-4 text-amber-500 dark:text-amber-400" />,
          )}

        {(order.status === "REPARANDO" || order.fechaReparacion) &&
          getDateItem(
            "fechaReparacion",
            "Fecha y Hora de Reparación",
            order.fechaReparacion,
            <Calendar className="h-4 w-4 text-amber-500 dark:text-amber-400" />,
          )}

        {order.status === "PENDIENTE_AVISAR" && !order.fechaSeguimiento && !editingField && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
            onClick={() => handleEdit("fechaSeguimiento", null)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Establecer fecha y hora de seguimiento
          </Button>
        )}

        {order.status === "APROBADO" && !order.fechaReparacion && !editingField && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-center hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
            onClick={() => handleEdit("fechaReparacion", null)}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Establecer fecha y hora de reparación
          </Button>
        )}
      </CardContent>
    </Card>
  )
}