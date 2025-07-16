"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TechnicianDialogForm } from "./technician-dialog-form"
import { useState } from "react"
import { Plus } from "lucide-react"
import { TechnicianFormData } from "./technicians"

interface TechnicianDialogProps {
  initialData?: TechnicianFormData & { id: string }
  mode?: "create" | "edit"
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function TechnicianDialog({ 
  initialData,
  mode = "create",
  trigger,
  open,
  onOpenChange
}: TechnicianDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Use external open state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="p-0 border shadow-lg dark:shadow-primary/5">
        <TechnicianDialogForm
          closeDialog={() => setIsOpen(false)}
          initialData={initialData}
          mode={mode}
        />
      </DialogContent>
    </Dialog>
  )
}