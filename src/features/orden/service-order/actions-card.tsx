import React from "react"
import { 
  Badge, 
  Calendar as CalendarIcon, 
  ChevronDown, 
  ChevronUp, 
  ClipboardCheck, 
  CreditCard, 
  Edit, 
  FileText, 
  Loader2, 
  Printer, 
  RefreshCw, 
  Shield, 
  Truck, 
  UserCheck, 
  Wrench, 
  XCircle,
  Check 
} from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { formatDate } from "date-fns"

interface ActionsCardProps {
  order: any
  isUpdating: boolean
  onMarkAsCompleted: () => void
  onShowStatusDialog: () => void
  onShowAssignDialog: () => void
  onShowTechnicianActionsDialog: () => void
  onShowConceptoOrdenDialog: () => void
  onShowDeliveryDialog: () => void
  onShowWarrantyPeriodDialog: () => void
  onShowWarrantyDamageDialog: () => void
  onShowSetRepairDateDialog: () => void
  onShowCancellationDialog: () => void
  onSendWhatsAppMessage: () => void
  onShowEditPresupuestoDialog: () => void
  isSendingWhatsApp: boolean
}

export function ActionsCard({
  order,
  isUpdating,
  onMarkAsCompleted,
  onShowStatusDialog,
  onShowAssignDialog,
  onShowTechnicianActionsDialog,
  onShowConceptoOrdenDialog,
  onShowDeliveryDialog,
  onShowWarrantyPeriodDialog,
  onShowWarrantyDamageDialog,
  onShowSetRepairDateDialog,
  onShowCancellationDialog,
  onShowEditPresupuestoDialog,
  onSendWhatsAppMessage,
  isSendingWhatsApp,
}: ActionsCardProps) {
  const canApplyWarranty =
    order.status === "DELIVERED" &&
    ((order.garantiaEndDate && new Date(order.garantiaEndDate) > new Date()) || order.garantiaIlimitada)

  const [showFullConcepto, setShowFullConcepto] = React.useState(false)

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  // Helper function to render the Edit Budget button
  const renderEditBudgetButton = () => (
    <Button
      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      onClick={onShowEditPresupuestoDialog}
      disabled={!order.conceptoOrden}
    >
      <Edit className="mr-2 h-4 w-4" />
      <span>Editar Presupuesto</span>
    </Button>
  )

  // Helper function to render the concepto display
  const renderConceptoDisplay = () => (
    order.conceptoOrden ? (
      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
        <div className="flex justify-between items-start mb-1">
          <h4 className="text-sm font-medium">Concepto de Orden:</h4>
          <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900/50">
            {formatDate(order.updatedAt, "dd/MM/yyyy")}
          </Badge>
        </div>
        <div className="text-xs">
          {(() => {
            try {
              const concepto = typeof order.conceptoOrden === "string" 
                ? JSON.parse(order.conceptoOrden) 
                : order.conceptoOrden
              
              const header = concepto.Header || "Detalles de la reparación"
              const text = concepto.Text || ""
              const fullText = `${header}\n${text}`
              const showVerMas = fullText.length > 150
              const displayText = showFullConcepto ? fullText : truncateText(fullText, 150)

              return (
                <div className="space-y-2">
                  <pre className="whitespace-pre-wrap font-sans text-[0.8rem]">
                    {displayText}
                  </pre>
                  {showVerMas && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-6 px-0 mt-1 text-blue-600 dark:text-blue-400 hover:no-underline"
                      onClick={() => setShowFullConcepto(!showFullConcepto)}
                    >
                      {showFullConcepto ? (
                        <>
                          <ChevronUp className="h-3.5 w-3.5" />
                          Ver menos
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3.5 w-3.5" />
                          Ver más
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )
            } catch (e) {
              return (
                <div className="space-y-2">
                  <pre className="whitespace-pre-wrap font-sans text-[0.8rem]">
                    {truncateText(order.conceptoOrden, 150)}
                  </pre>
                  {order.conceptoOrden.length > 150 && (
                    <Button
                      variant="link"
                      size="sm"
                      className="h-6 px-0 mt-1 text-blue-600 dark:text-blue-400 hover:no-underline"
                      onClick={() => setShowFullConcepto(!showFullConcepto)}
                    >
                      {showFullConcepto ? "Ver menos" : "Ver más"}
                    </Button>
                  )}
                </div>
              )
            }
          })()}
        </div>
      </div>
    ) : (
      <Button
        variant="outline"
        className="w-full hover:bg-blue-50 dark:hover:bg-blue-950/20"
        onClick={onShowConceptoOrdenDialog}
      >
        <FileText className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-blue-600 dark:text-blue-400">Establecer Concepto de Orden</span>
      </Button>
    )
  )

  return (
    <Card className="overflow-hidden border-l-4 border-l-teal-500 dark:border-l-teal-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <Wrench className="h-5 w-5 text-teal-500 dark:text-teal-400" />
          Acciones
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Estado: PREORDER */}
        {order.status === "PREORDER" && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onShowStatusDialog}
          >
            <div className="flex items-center">
              <RefreshCw className="mr-2 h-4 w-4" />
              <span>Convertir en Orden</span>
            </div>
          </Button>
        )}

        {/* Estado: PENDING */}
        {order.status === "PENDING" && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onShowAssignDialog}
          >
            <div className="flex items-center">
              <UserCheck className="mr-2 h-4 w-4" />
              <span>Asignar Técnico</span>
            </div>
          </Button>
        )}

        {/* Estado: IN_PROGRESS */}
        {order.status === "IN_PROGRESS" && (
          <>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={onMarkAsCompleted}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Actualizando...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  <span>Marcar como Completada</span>
                </div>
              )}
            </Button>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onShowTechnicianActionsDialog}
            >
              <div className="flex items-center">
                <Wrench className="mr-2 h-4 w-4" />
                <span>Actualizar estado de Presupuesto</span>
              </div>
            </Button>
          </>
        )}

        {/* Estado: ASSIGNED */}
        {order.status === "ASSIGNED" && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onShowConceptoOrdenDialog}
          >
            <div className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Presupuestar</span>
            </div>
          </Button>
        )}

        {/* Estado: COMPLETED */}
        {order.status === "COMPLETED" && (
          <>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={onShowDeliveryDialog}
            >
              <Truck className="mr-2 h-4 w-4" />
              <span>Crear Nota de Entrega</span>
            </Button>
            {renderEditBudgetButton()}
          </>
        )}

        {/* Estado: REPARANDO */}
        {order.status === "REPARANDO" && (
          <div className="space-y-3">
            {!(order.garantiaStartDate || order.garantiaEndDate || order.garantiaIlimitada) ? (
              <>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={onShowWarrantyPeriodDialog}
                >
                  <div className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Establecer Garantía</span>
                  </div>
                </Button>
                {renderEditBudgetButton()}
              </>
            ) : (
              <>
                <Button
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={onShowDeliveryDialog}
                >
                  <div className="flex items-center">
                    <Truck className="mr-2 h-4 w-4" />
                    <span>Crear Nota de Entrega</span>
                  </div>
                </Button>
                {renderEditBudgetButton()}
              </>
            )}
          </div>
        )}

        {/* Estado: APROBADO */}
        {order.status === "APROBADO" && (
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={onShowConceptoOrdenDialog}
          >
            <div className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              <span>Establecer Concepto y Facturar</span>
            </div>
          </Button>
        )}

        {/* Estado: NO_APROBADO */}
        {order.status === "NO_APROBADO" && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onShowSetRepairDateDialog}
          >
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>Establecer Fecha de Reparación</span>
            </div>
          </Button>
        )}

        {/* Estado: PENDIENTE_AVISAR */}
        {order.status === "PENDIENTE_AVISAR" && (
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onShowSetRepairDateDialog}
          >
            <div className="flex items-center">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span>Establecer Fecha de Reparación</span>
            </div>
          </Button>
        )}

        {/* Estado: FACTURADO */}
        {order.status === "FACTURADO" && (
          <div className="space-y-3">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onShowTechnicianActionsDialog}
              
            >
              <div className="flex items-center">
                <Wrench className="mr-2 h-4 w-4" />
                <span>Actualizar estado de Presupuesto</span>
              </div>
            </Button>

            {renderEditBudgetButton()}

            {renderConceptoDisplay()}
          </div>
        )}

        {/* Estado: ENTREGA_GENERADA */}
        {order.status === "ENTREGA_GENERADA" && (
          <div className="space-y-3">
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
              onClick={onShowDeliveryDialog}
            >
              <Truck className="mr-2 h-4 w-4" />
              <span>Crear Nota de Entrega</span>
            </Button>
            
            {renderEditBudgetButton()}
            
            {renderConceptoDisplay()}
          </div>
        )}

        {/* Estado: GARANTIA_APLICADA */}
        {order.status === "GARANTIA_APLICADA" && (
          <div className="space-y-3">
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              onClick={onShowStatusDialog}
            >
              <div className="flex items-center">
                <Check className="mr-2 h-4 w-4" />
                <span>Resolver Garantía</span>
              </div>
            </Button>
            
            {renderEditBudgetButton()}
            
            {renderConceptoDisplay()}
          </div>
        )}

        {/* Acciones de Garantía */}
        {canApplyWarranty && (
          <div className="space-y-3">
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              onClick={onShowWarrantyDamageDialog}
            >
              <Shield className="mr-2 h-4 w-4" />
              <span>Reportar Daño</span>
            </Button>

            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={onShowWarrantyPeriodDialog}
            >
              <Shield className="mr-2 h-4 w-4" />
              <span>Modificar Plazo</span>
            </Button>
          </div>
        )}

        {/* Acciones Secundarias */}
        <div className="pt-2 border-t mt-2">
          <p className="text-xs text-muted-foreground mb-2">Otras acciones:</p>

          <Button
            variant="outline"
            className="w-full mb-2 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700"
            onClick={onSendWhatsAppMessage}
            disabled={isSendingWhatsApp}
          >
            {isSendingWhatsApp ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.9 11.9l-1.05 3.9 4-1.05A8 8 0 0 0 20 12.06a8 8 0 0 0-2.4-5.74zm-5.55 12.2a6.55 6.55 0 0 1-3.4-.93l-.25-.15-2.5.65.67-2.43-.16-.25a6.59 6.59 0 0 1 10.07-8.4 6.62 6.62 0 0 1 2 4.95A6.64 6.64 0 0 1 12.05 18.52zm3.9-4.87c-.2-.1-1.2-.6-1.4-.67s-.33-.1-.47.1-.52.67-.65.8-.24.15-.43.05a5.8 5.8 0 0 1-1.57-.97 5.82 5.82 0 0 1-1.1-1.36c-.1-.2 0-.3.1-.4s.2-.24.32-.37a1.32 1.32 0 0 0 .22-.37.41.41 0 0 0-.02-.38c-.05-.1-.47-1.13-.64-1.55s-.33-.35-.47-.35-.26 0-.4.02a.8.8 0 0 0-.57.27 2.4 2.4 0 0 0-.74 1.77 4.18 4.18 0 0 0 .85 2.2 9.51 9.51 0 0 0 3.64 3.24c.5.22.9.35 1.2.45.5.16.96.14 1.32.08.4-.05 1.23-.5 1.4-.98s.18-.9.13-1c-.05-.08-.18-.13-.38-.23z" />
                </svg>
                <span>Enviar por WhatsApp</span>
              </>
            )}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <Link
                href={`/ordenes/${order.id}/print`}
                target="_blank"
                className="flex items-center justify-center"
              >
                <Printer className="mr-2 h-4 w-4" />
                <span>Imprimir</span>
              </Link>
            </Button>
          </div>

          {!["CANCELLED", "DELIVERED"].includes(order.status) && (
            <Button
              variant="outline"
              className="w-full mt-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onShowCancellationDialog}
            >
              <XCircle className="mr-2 h-4 w-4" />
              <span>Cancelar Orden</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}