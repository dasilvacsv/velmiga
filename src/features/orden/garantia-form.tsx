"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarIcon, Loader2, Shield, AlertCircle, CalendarClock, BadgeCheck } from "lucide-react"
import { format, addMonths } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface GarantiaFormProps {
  initialData: {
    startDate: Date
    endDate: Date | null
    isUnlimited: boolean
  }
  onSubmit: (data: any) => void
  isLoading: boolean
}

export function GarantiaForm({ initialData, onSubmit, isLoading }: GarantiaFormProps) {
  const [startDate, setStartDate] = useState<Date>(initialData.startDate || new Date())
  const [endDate, setEndDate] = useState<Date | null>(initialData.endDate || null)
  const [isUnlimited, setIsUnlimited] = useState<boolean>(initialData.isUnlimited || false)
  const [months, setMonths] = useState<string>("3")

  // Update end date when start date or months change
  useEffect(() => {
    if (!isUnlimited && startDate) {
      setEndDate(addMonths(startDate, Number.parseInt(months)))
    }
  }, [startDate, months, isUnlimited])

  const handleSubmit = () => {
    onSubmit({
      startDate,
      endDate,
      isUnlimited,
    })
  }

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-4">
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
          <Switch id="unlimited-warranty" checked={isUnlimited} onCheckedChange={setIsUnlimited} />
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

        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800 flex items-start gap-2 mt-2">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p>La garantía comenzará a partir de la fecha seleccionada.</p>
            {isUnlimited && (
              <p className="mt-1 font-medium">La garantía ilimitada solo puede ser establecida por un administrador.</p>
            )}
          </div>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={isLoading || (!isUnlimited && !endDate)} className="w-full">
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
        Establecer Garantía
      </Button>
    </div>
  )
}
