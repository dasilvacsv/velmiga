"use client"
import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { createZone } from "./actions"
import { Loader2 } from "lucide-react"

interface ZoneDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  onSuccess: (newZone: any) => void
}

export function ZoneDialog({ open, onOpenChange, userId, onSuccess }: ZoneDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "El nombre de la zona es requerido",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await createZone({ name }, userId)
      if (!result.success) throw new Error(result.error)
      
      onSuccess(result.data)
      setName("")
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Error al crear la zona",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [name, userId, onSuccess, onOpenChange, toast])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Nueva Zona</DialogTitle>
          <DialogDescription>
            Ingrese el nombre de la nueva zona que desea crear.
          </DialogDescription>
        </DialogHeader>
        
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la zona"
          disabled={isSubmitting}
        />
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Crear Zona
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}