import React, { useState } from "react"
import { Calendar, ChevronDown, ChevronUp, Loader2, Users, XCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"
import { TechnicianDeactivationDialog } from "./technician-deactivation-dialog"
import { useToast } from "@/hooks/use-toast"

interface TechnicianCardProps {
  order: any
  userId: string
  onDeactivateTechnician: (technicianId: string) => Promise<void>
  onShowAssignDialog: () => void
}

export function TechnicianCard({
  order,
  userId,
  onDeactivateTechnician,
  onShowAssignDialog,
}: TechnicianCardProps) {
  const activeTechnicians = order.technicianAssignments.filter((assignment: any) => assignment.isActive)
  const inactiveTechnicians = order.technicianAssignments.filter((assignment: any) => !assignment.isActive)
  const [showInactiveHistory, setShowInactiveHistory] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState<string | null>(null)
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false)
  const [technicianToDeactivate, setTechnicianToDeactivate] = useState<{ id: string; name: string } | null>(null)
  const { toast } = useToast()

  const handleDeactivateClick = (technicianId: string, technicianName: string) => {
    setTechnicianToDeactivate({ id: technicianId, name: technicianName })
    setShowDeactivateConfirm(true)
  }

  const handleDeactivateConfirm = async () => {
    if (!technicianToDeactivate) return

    try {
      setIsDeactivating(technicianToDeactivate.id)
      await onDeactivateTechnician(technicianToDeactivate.id)
      toast({
        title: "Éxito",
        description: "Técnico desactivado correctamente",
        variant: "default",
      })
      setShowDeactivateConfirm(false)
    } catch (error) {
      console.error("Error deactivating technician:", error)
      toast({
        title: "Error",
        description: "Error al desactivar el técnico",
        variant: "destructive",
      })
    } finally {
      setIsDeactivating(null)
    }
  }

  // Filter technician guarantees to only show when not 0
  const technicianHasGuarantees = (assignment: any) => {
    // Only show guarantees when they are not 0 or empty
    return (
      assignment.technician.guarantees &&
      Array.isArray(assignment.technician.guarantees) &&
      assignment.technician.guarantees.length > 0
    )
  }

  return (
    <>
      <Card className="overflow-hidden border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
            Técnicos Asignados
            {activeTechnicians.length > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {activeTechnicians.length} activo{activeTechnicians.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeTechnicians.length > 0 ? (
            <div className="space-y-4">
              {activeTechnicians.map((assignment: any, index: number) => (
                <div
                  key={assignment.id}
                  className={`space-y-3 text-sm ${
                    index < activeTechnicians.length - 1 ? "pb-4 border-b border-dashed border-gray-200 dark:border-gray-800" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-muted-foreground">Nombre</h3>
                      <p className="font-medium">{assignment.technician.name}</p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => handleDeactivateClick(assignment.technician.id, assignment.technician.name)}
                      disabled={isDeactivating === assignment.technician.id}
                    >
                      {isDeactivating === assignment.technician.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <span className="ml-1">Dar de baja</span>
                    </Button>
                  </div>

                  {assignment.technician.phone && (
                    <div>
                      <h3 className="font-medium text-muted-foreground">Teléfono</h3>
                      <p>{assignment.technician.phone}</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium text-muted-foreground">Fecha de Asignación</h3>
                    <p>{formatDate(assignment.assignedDate)}</p>
                  </div>

                  {/* Only show guarantees when they are not 0 or empty */}
                  {technicianHasGuarantees(assignment) && (
                    <div>
                      <h3 className="font-medium text-muted-foreground">Garantías</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {assignment.technician.guarantees.map((guarantee: any, i: number) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-300"
                          >
                            {guarantee.type}: {guarantee.count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {assignment.notes && (
                    <div>
                      <h3 className="font-medium text-muted-foreground">Notas</h3>
                      <p className="bg-muted p-2 rounded text-xs mt-1">{assignment.notes}</p>
                    </div>
                  )}
                </div>
              ))}

              {inactiveTechnicians.length > 0 && (
                <div className="pt-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-sm text-muted-foreground"
                    onClick={() => setShowInactiveHistory(!showInactiveHistory)}
                  >
                    {showInactiveHistory ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Ocultar historial de técnicos
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Ver historial de técnicos ({inactiveTechnicians.length})
                      </>
                    )}
                  </Button>

                  <AnimatePresence>
                    {showInactiveHistory && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-3"
                      >
                        <div className="border-t pt-4 space-y-4">
                          <h3 className="font-medium text-sm text-muted-foreground">Técnicos Desactivados</h3>
                          {inactiveTechnicians.map((assignment: any) => (
                            <div
                              key={assignment.id}
                              className="text-sm border-l-2 border-gray-200 dark:border-gray-800 pl-3 py-2 space-y-1 opacity-75"
                            >
                              <p className="font-medium">{assignment.technician.name}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {formatDate(assignment.assignedDate)} - {formatDate(assignment.updatedAt)}
                                </span>
                              </div>
                              {assignment.notes && <p className="text-xs text-muted-foreground">{assignment.notes}</p>}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-muted-foreground">No hay técnicos asignados</p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400"
            onClick={onShowAssignDialog}
          >
            <Users className="mr-2 h-4 w-4" />
            {activeTechnicians.length > 0 ? "Gestionar técnicos" : "Asignar técnicos"}
          </Button>
        </CardFooter>
      </Card>

      {/* Confirmation dialog for technician deactivation */}
      <TechnicianDeactivationDialog
        open={showDeactivateConfirm}
        onOpenChange={setShowDeactivateConfirm}
        technician={technicianToDeactivate}
        onConfirm={handleDeactivateConfirm}
        isProcessing={!!isDeactivating}
      />
    </>
  )
}