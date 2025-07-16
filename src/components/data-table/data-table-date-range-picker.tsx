"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"
import type { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface DataTableDateRangePickerProps<TData, TValue> {
  column?: Column<TData, TValue>
}

export function DataTableDateRangePicker<TData, TValue>({ column }: DataTableDateRangePickerProps<TData, TValue>) {
  const [date, setDate] = React.useState<DateRange | undefined>()

  React.useEffect(() => {
    if (date?.from && date?.to) {
      // Set the filter value when both dates are selected
      column?.setFilterValue([date.from, date.to])
    } else if (!date) {
      // Clear the filter when date is reset
      column?.setFilterValue(undefined)
    }
  }, [date, column])

  return (
    <div className="grid gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            size="sm"
            className={cn("h-8 border-dashed justify-start text-left font-normal", !date && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {date.from.toLocaleDateString()} - {date.to.toLocaleDateString()}
                </>
              ) : (
                date.from.toLocaleDateString()
              )
            ) : (
              <span>Date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
          <div className="flex items-center justify-between p-3 border-t">
            <Button variant="ghost" size="sm" onClick={() => setDate(undefined)}>
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() =>
                document
                  .querySelector("[role=dialog]")
                  ?.closest("div[data-radix-popper-content-wrapper]")
                  ?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
              }
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
