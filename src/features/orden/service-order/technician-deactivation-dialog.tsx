import React from "react"
import { AlertCircle, Loader2, XCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface TechnicianDeactivationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  technician: { id: string; name: string } | null
  onConfirm: () => Promise<void>
  isProcessing: boolean
}

export function TechnicianDeactivationDialog({
  open,
  onOpenChange,
  technician,
  onConfirm,
  isProcessing,
}: TechnicianDeactivationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 dark:text-red-500 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Confirmar baja de técnico
          </DialogTitle>
          <DialogDescription>
            ¿Estás seguro que deseas dar de baja al técnico <strong>{technician?.name}</strong>?
          </DialogDescription>
        </DialogHeader>
        <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md border border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <p>Esta acción no se puede deshacer. El técnico perderá acceso a la información y detalles de esta orden.</p>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Confirmar baja
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}