import React, { useState } from "react"
import { AlertCircle, BellOff, BellRing, Loader2, MessageSquare } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface NotificationToggleCardProps {
  order: any
  userId: string
  clientNotificationsEnabled: boolean
  onToggleNotifications: (enabled: boolean) => Promise<void>
}

export function NotificationToggleCard({
  order,
  userId,
  clientNotificationsEnabled,
  onToggleNotifications,
}: NotificationToggleCardProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const { toast } = useToast()

  const handleToggleChange = async (checked: boolean) => {
    try {
      setIsUpdating(true)
      await onToggleNotifications(checked)

      toast({
        title: checked ? "Notificaciones activadas" : "Notificaciones desactivadas",
        description: checked
          ? "El cliente recibirá notificaciones por WhatsApp"
          : "El cliente no recibirá notificaciones por WhatsApp",
        variant: "default",
      })
    } catch (error) {
      console.error("Error toggling notifications:", error)
      toast({
        title: "Error",
        description: "No se pudo cambiar la configuración de notificaciones",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="overflow-hidden border-l-4 border-l-blue-500 dark:border-l-blue-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          Notificaciones WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label htmlFor="client-notifications" className="text-base">
              Notificaciones al Cliente
            </Label>
            <p className="text-sm text-muted-foreground">
              {clientNotificationsEnabled
                ? "El cliente recibirá notificaciones por WhatsApp sobre cambios en la orden"
                : "El cliente NO recibirá notificaciones por WhatsApp"}
            </p>
          </div>
          <div className="flex items-center">
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : clientNotificationsEnabled ? (
              <BellRing className="h-4 w-4 mr-2 text-green-500" />
            ) : (
              <BellOff className="h-4 w-4 mr-2 text-amber-500" />
            )}
            <Switch
              id="client-notifications"
              checked={clientNotificationsEnabled}
              onCheckedChange={handleToggleChange}
              disabled={isUpdating}
            />
          </div>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p>El jefe y los técnicos seguirán recibiendo todas las notificaciones sin importar esta configuración.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}