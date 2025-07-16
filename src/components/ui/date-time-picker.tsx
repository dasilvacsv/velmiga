import * as React from "react"
import { Clock, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, parse } from "date-fns"
import { es } from "date-fns/locale"

export interface DateTimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  className?: string
  disabled?: boolean
}

export function DateTimePicker({
  date,
  setDate,
  className,
  disabled = false,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  const minuteOptions = React.useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => i).filter(i => i % 5 === 0)
  }, [])

  const hourOptions = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => i)
  }, [])

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate)
      if (date) {
        newDate.setHours(date.getHours())
        newDate.setMinutes(date.getMinutes())
      }
      setDate(newDate)
    }
    setOpen(true)
  }

  const handleHourChange = (hour: string) => {
    if (!date) return
    const newDate = new Date(date)
    newDate.setHours(parseInt(hour))
    setDate(newDate)
    setOpen(true)
  }

  const handleMinuteChange = (minute: string) => {
    if (!date) return
    const newDate = new Date(date)
    newDate.setMinutes(parseInt(minute))
    setDate(newDate)
    setOpen(true)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("grid gap-2", className)}>
        <PopoverTrigger asChild>
          <Button
            disabled={disabled}
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP HH:mm", { locale: es }) : <span>Seleccionar fecha y hora</span>}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleCalendarSelect}
            initialFocus
            locale={es}
          />
          <div className="p-3 border-t border-border">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col">
                <span className="text-sm font-medium mb-1">Hora</span>
                <Select
                  value={date ? date.getHours().toString() : undefined}
                  onValueChange={handleHourChange}
                  disabled={!date}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Hora" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {hourOptions.map((hour) => (
                      <SelectItem 
                        key={hour} 
                        value={hour.toString()}
                        className="cursor-pointer"
                      >
                        {hour.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col">
                <span className="text-sm font-medium mb-1">Minuto</span>
                <Select
                  value={date ? (Math.floor(date.getMinutes() / 5) * 5).toString() : undefined}
                  onValueChange={handleMinuteChange}
                  disabled={!date}
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue placeholder="Minuto" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {minuteOptions.map((minute) => (
                      <SelectItem 
                        key={minute} 
                        value={minute.toString()}
                        className="cursor-pointer"
                      >
                        {minute.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-center mt-3">
              <Clock className="h-4 w-4 text-muted-foreground mr-1" />
              <span className="text-sm text-muted-foreground">
                {date ? format(date, "HH:mm", { locale: es }) : "Seleccione fecha primero"}
              </span>
            </div>
          </div>
        </PopoverContent>
      </div>
    </Popover>
  )
}