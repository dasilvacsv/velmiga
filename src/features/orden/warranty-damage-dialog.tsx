"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { motion } from "framer-motion"
import { 
  Loader2, 
  ShieldCheck, 
  Shield, 
  AlertTriangle, 
  ArrowUpCircle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateServiceOrder } from "./actions"

interface WarrantyDamageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceOrderId: string
  userId: string
  onSuccess: () => void
}

export function WarrantyDamageDialog({
  open,
  onOpenChange,
  serviceOrderId,
  userId,
  onSuccess
}: WarrantyDamageDialogProps) {
  const { toast } = useToast()
  const [razonGarantia, setRazonGarantia] = useState("")
  const [prioridad, setPrioridad] = useState<"BAJA" | "MEDIA" | "ALTA">("BAJA")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const applyWarrantyDamage = async () => {
    if (!razonGarantia.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar una razón para la garantía",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateServiceOrder(
        serviceOrderId,
        {
          status: "GARANTIA_APLICADA",
          razonGarantia: razonGarantia.trim(),
          garantiaPrioridad: prioridad
        },
        userId
      )

      if (result.success) {
        toast({
          title: "Éxito",
          description: "Garantía por daño aplicada correctamente",
          variant: "default",
        })
        onOpenChange(false)
        onSuccess()
      } else {
        toast({
          title: "Error",
          description: result.error || "Error al aplicar la garantía",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error applying warranty damage:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setRazonGarantia("")
      setPrioridad("BAJA")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] mx-auto my-4 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-4">
          <DialogTitle className="flex items-center text-xl">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Shield className="h-5 w-5 mr-2 text-primary" />
            </motion.div>
            Reportar Daño en Garantía
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-4">
          <motion.div
            key="damage"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="warranty-reason">Razón del Daño</Label>
                <Textarea
                  id="warranty-reason"
                  placeholder="Describa el daño o problema encontrado..."
                  value={razonGarantia}
                  onChange={(e) => setRazonGarantia(e.target.value)}
                  className="resize-none min-h-[120px]"
                />
              </div>

              <div className="space-y-3">
                <Label>Prioridad de la Reparación</Label>
                <RadioGroup 
                  value={prioridad} 
                  onValueChange={(value) => setPrioridad(value as "BAJA" | "MEDIA" | "ALTA")}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-colors hover:bg-muted/40">
                    <RadioGroupItem value="BAJA" id="priority-low" className="text-green-600" />
                    <Label htmlFor="priority-low" className="flex items-center cursor-pointer">
                      <ShieldCheck className="h-4 w-4 mr-2 text-green-600" />
                      <span>Baja - Problemas cosméticos menores</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-colors hover:bg-muted/40">
                    <RadioGroupItem value="MEDIA" id="priority-medium" className="text-amber-600" />
                    <Label htmlFor="priority-medium" className="flex items-center cursor-pointer">
                      <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                      <span>Media - Funcionalidad parcialmente afectada</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer transition-colors hover:bg-muted/40">
                    <RadioGroupItem value="ALTA" id="priority-high" className="text-red-600" />
                    <Label htmlFor="priority-high" className="flex items-center cursor-pointer">
                      <ArrowUpCircle className="h-4 w-4 mr-2 text-red-600" />
                      <span>Alta - Inoperativo o riesgo de seguridad</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </motion.div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex w-full justify-between gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={applyWarrantyDamage} 
              disabled={isSubmitting || !razonGarantia.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Reportar Daño
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}