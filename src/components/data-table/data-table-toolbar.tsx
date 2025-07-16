"use client"

import { Cross2Icon } from "@radix-ui/react-icons"
import type { Table } from "@tanstack/react-table"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { DataTableFacetedFilter } from "./data-table-faceted-filter"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableDateRangePicker } from "./data-table-date-range-picker"

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({ table }: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || table.getState().globalFilter !== ""

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={table.getState().globalFilter ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="w-full pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {table.getColumn("status") && (
            <DataTableFacetedFilter
              column={table.getColumn("status")}
              title="Status"
              options={[
                { label: "Pending", value: "pending" },
                { label: "Processing", value: "processing" },
                { label: "Success", value: "success" },
                { label: "Failed", value: "failed" },
              ]}
            />
          )}
          {table.getColumn("paymentMethod") && (
            <DataTableFacetedFilter
              column={table.getColumn("paymentMethod")}
              title="Payment Method"
              options={[
                { label: "Credit Card", value: "Credit Card" },
                { label: "PayPal", value: "PayPal" },
                { label: "Bank Transfer", value: "Bank Transfer" },
              ]}
            />
          )}
          {table.getColumn("category") && (
            <DataTableFacetedFilter
              column={table.getColumn("category")}
              title="Category"
              options={[
                { label: "Subscription", value: "Subscription" },
                { label: "One-time", value: "One-time" },
              ]}
            />
          )}
          {table.getColumn("createdAt") && <DataTableDateRangePicker column={table.getColumn("createdAt")} />}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => {
                table.resetColumnFilters()
                table.setGlobalFilter("")
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}
