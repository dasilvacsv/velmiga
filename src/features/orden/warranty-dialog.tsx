"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Loader2, 
  ShieldCheck, 
  Shield, 
  AlertTriangle, 
  ArrowUpCircle,
  CalendarIcon,
  AlertCircle,
  CalendarClock,
  BadgeCheck,
  Hammer,
  Clock
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { updateServiceOrder } from "./actions"
import { format, addMonths } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface WarrantyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceOrderId: string
  userId: string
  onSuccess: () => void
  initialWarranty?: {
    startDate: Date
    endDate: Date | null
    isUnlimited: boolean
  }
}

export function WarrantyDialog({
  open,
  onOpenChange,
  serviceOrderId,
  userId,
  onSuccess,
  initialWarranty
}: WarrantyDialogProps) {
  const { toast } = useToast()
  const [razonGarantia, setRazonGarantia] = useState("")
  const [prioridad, setPrioridad] = useState<"BAJA" | "MEDIA" | "ALTA">("BAJA")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [startDate, setStartDate] = useState<Date>(initialWarranty?.startDate || new Date())
  const [endDate, setEndDate] = useState<Date | null>(initialWarranty?.endDate || null)
  const [isUnlimited, setIsUnlimited] = useState<boolean>(initialWarranty?.isUnlimited || false)
  const [months, setMonths] = useState<string>("3")
  const [warrantyType, setWarrantyType] = useState<"DAMAGE" | "PERIOD">("DAMAGE")

  useEffect(() => {
    if (!isUnlimited && startDate) {
      setEndDate(addMonths(startDate, Number.parseInt(months)))
    }
  }, [startDate, months, isUnlimited])

  const applyWarranty = async () => {
    if (warrantyType === "DAMAGE" && !razonGarantia.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar una razón para la garantía",
        variant: "destructive",
      })
      return
    }

    if (warrantyType === "PERIOD" && !isUnlimited && !endDate) {
      toast({
        title: "Error",
        description: "Debe establecer una fecha de fin de garantía",
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
          garantiaPrioridad: prioridad,
          garantiaInicio: startDate,
          garantiaFin: isUnlimited ? null : endDate,
          garantiaIlimitada: isUnlimited
        },
        userId
      )

      if (result.success) {
        toast({
          title: "Éxito",
          description: warrantyType === "DAMAGE" 
            ? "Garantía por daño aplicada correctamente" 
            : "Plazo de garantía establecido correctamente",
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
      console.error("Error applying warranty:", error)
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
      setStartDate(initialWarranty?.startDate || new Date())
      setEndDate(initialWarranty?.endDate || null)
      setIsUnlimited(initialWarranty?.isUnlimited || false)
      setWarrantyType("DAMAGE")
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] mx-auto my-4 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-4">
          <DialogTitle className="flex items-center text-xl">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {warrantyType === "DAMAGE" ? (
                <Shield className="h-5 w-5 mr-2 text-primary" />
              ) : (
                <Clock className="h-5 w-5 mr-2 text-primary" />
              )}
            </motion.div>
            {warrantyType === "DAMAGE" ? "Reportar Daño en Garantía" : "Establecer Plazo de Garantía"}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-4">
          <RadioGroup 
            value={warrantyType} 
            onValueChange={(value) => setWarrantyType(value as "DAMAGE" | "PERIOD")} 
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="DAMAGE" id="type-damage" />
              <Label htmlFor="type-damage" className="cursor-pointer flex items-center gap-2">
                <Hammer className="h-4 w-4" />
                Reportar Daño
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PERIOD" id="type-period" />
              <Label htmlFor="type-period" className="cursor-pointer flex items-center gap-2">
                <CalendarClock className="h-4 w-4" />
                Establecer Plazo
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-4">
          <AnimatePresence mode="wait">
            {warrantyType === "DAMAGE" ? (
              <motion.div
                key="damage"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
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
            ) : (
              <motion.div
                key="period"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CalendarClock className="h-4 w-4 text-primary" />
                      Fecha de Inicio
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => date && setStartDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="unlimited-warranty" 
                      checked={isUnlimited} 
                      onCheckedChange={setIsUnlimited} 
                    />
                    <Label htmlFor="unlimited-warranty" className="flex items-center gap-2 cursor-pointer">
                      <BadgeCheck className={cn("h-4 w-4", isUnlimited ? "text-primary" : "text-muted-foreground")} />
                      Garantía Ilimitada
                    </Label>
                  </div>

                  <AnimatePresence>
                    {!isUnlimited && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-2">
                          <Label className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-primary" />
                            Duración de la Garantía
                          </Label>
                          <Select value={months} onValueChange={setMonths} disabled={isUnlimited}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Seleccionar duración" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 mes</SelectItem>
                              <SelectItem value="3">3 meses</SelectItem>
                              <SelectItem value="6">6 meses</SelectItem>
                              <SelectItem value="12">1 año</SelectItem>
                              <SelectItem value="24">2 años</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="pt-2">
                            <Label className="flex items-center gap-2">
                              <CalendarClock className="h-4 w-4 text-primary" />
                              Fecha de Fin
                            </Label>
                            <div className="bg-muted p-3 rounded-md mt-1 flex items-center">
                              <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                              {endDate ? format(endDate, "PPP", { locale: es }) : "Fecha no calculada"}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      <p>El plazo de garantía comenzará desde la fecha de inicio seleccionada.</p>
                      {isUnlimited && (
                        <p className="mt-1 font-medium">La garantía ilimitada requiere aprobación administrativa.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <div className="flex w-full justify-between gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button 
              onClick={applyWarranty} 
              disabled={isSubmitting || 
                (warrantyType === "DAMAGE" && !razonGarantia.trim()) ||
                (warrantyType === "PERIOD" && !isUnlimited && !endDate)
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  {warrantyType === "DAMAGE" ? (
                    <ShieldCheck className="mr-2 h-4 w-4" />
                  ) : (
                    <CalendarClock className="mr-2 h-4 w-4" />
                  )}
                  {warrantyType === "DAMAGE" ? "Reportar Daño" : "Establecer Plazo"}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}