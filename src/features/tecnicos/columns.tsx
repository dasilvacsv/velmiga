"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreHorizontal, Pencil, Trash, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { TechnicianDialog } from "./technician-dialog"
import { TechnicianStatusToggle } from "./technician-status-toggle"
import { useState } from "react"
import Link from "next/link"

export type Technician = {
  id: string
  name: string
  phone: string | null
  is_active: boolean
  createdAt: Date
  updatedAt: Date
}

export const columns: ColumnDef<Technician>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "Nombre",
    cell: ({ row }) => (
      <div className="font-medium">
        <Link href={`/tecnicos/${row.original.id}`} className="hover:text-primary transition-colors">
          {row.getValue("name")}
        </Link>
      </div>
    )
  },
  {
    accessorKey: "phone",
    header: "Teléfono",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string | null
      return (
        <div className={phone ? "" : "text-muted-foreground italic"}>
          {phone || "No registrado"}
        </div>
      )
    }
  },
  {
    accessorKey: "is_active",
    header: "Estado",
    cell: ({ row }) => {
      const is_active = row.getValue("is_active") as boolean
      const technician = row.original

      return (
        <div className="flex items-center gap-2">
          <Badge 
            variant={is_active ? "success" : "neutral"} 
            className="transition-all duration-200"
          >
            {is_active ? "Activo" : "Inactivo"}
          </Badge>
          <TechnicianStatusToggle 
            technicianId={technician.id} 
            isActive={is_active}
          />
        </div>
      )
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const technician = row.original
      const [editDialogOpen, setEditDialogOpen] = useState(false)

      return (
        <>
          <TechnicianDialog
            mode="edit"
            initialData={{
              id: technician.id,
              name: technician.name,
              phone: technician.phone,
              is_active: technician.is_active
            }}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">Abrir menú</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
              <DropdownMenuItem asChild className="cursor-pointer flex items-center gap-2 text-sm">
                <Link href={`/tecnicos/${technician.id}`}>
                  <User className="h-4 w-4" />
                  Ver detalles
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => setEditDialogOpen(true)}
                className="cursor-pointer flex items-center gap-2 text-sm"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer flex items-center gap-2 text-sm">
                <Trash className="h-4 w-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )
    },
  },
]