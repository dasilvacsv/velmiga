import React, { useState } from "react"
import { Calendar, CreditCard, FileText, Percent, Stethoscope, XCircle } from "lucide-react"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { StatusHistory } from "./status-history"

interface OrderDetailsCardProps {
  order: any
}

export function OrderDetailsCard({ order }: OrderDetailsCardProps) {
  const [showFullConcepto, setShowFullConcepto] = useState(false)
  const [showFullDiagnostico, setShowFullDiagnostico] = useState(false)

  return (
    <Card className="overflow-hidden border-l-4 border-l-violet-500 dark:border-l-violet-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <FileText className="h-5 w-5 text-violet-500 dark:text-violet-400" />
          Detalles de la Orden
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <h3 className="font-medium text-muted-foreground">Fecha de Recepción</h3>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-violet-500 dark:text-violet-400" />
            <p>{formatDate(order.receivedDate)}</p>
          </div>
        </div>

        {order.presupuestoAmount && (
          <div>
            <h3 className="font-medium text-muted-foreground">Monto de Presupuesto</h3>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-violet-500 dark:text-violet-400" />
              <p className="font-semibold">{formatCurrency(Number(order.presupuestoAmount))}</p>
            </div>

            {/* Display IVA information if enabled */}
            {order.includeIVA && (
              <div className="mt-2 space-y-1 p-2 bg-cyan-50 dark:bg-cyan-950/20 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-cyan-700 dark:text-cyan-300 flex items-center">
                    <Percent className="h-3 w-3 mr-1" /> IVA (16%):
                  </span>
                  <span className="text-xs font-medium text-cyan-700 dark:text-cyan-300">
                    {formatCurrency(Number(order.presupuestoAmount) * 0.16)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-cyan-200 dark:border-cyan-800 mt-1">
                  <span className="text-xs font-medium text-cyan-800 dark:text-cyan-200">Total con IVA:</span>
                  <span className="text-xs font-bold text-cyan-800 dark:text-cyan-200">
                    {formatCurrency(Number(order.presupuestoAmount) * 1.16)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {order.reference && (
          <div>
            <h3 className="font-medium text-muted-foreground">Referencia</h3>
            <p>{order.reference}</p>
          </div>
        )}

        {order.description && (
          <div>
            <h3 className="font-medium text-muted-foreground">Descripción</h3>
            <p className="whitespace-pre-line bg-muted p-2 rounded text-xs mt-1">{order.description}</p>
          </div>
        )}

        {order.solution && (
          <div>
            <h3 className="font-medium text-muted-foreground">Solución</h3>
            <p className="whitespace-pre-line bg-muted p-2 rounded text-xs mt-1">{order.solution}</p>
          </div>
        )}

        {/* Diagnostics */}
        {order.diagnostics && (
          <div>
            <h3 className="font-medium text-muted-foreground flex items-center gap-1">
              <Stethoscope className="h-4 w-4 text-violet-500 dark:text-violet-400" />
              Diagnóstico Técnico
            </h3>
            <div className="bg-muted p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-800 mt-2">
              <pre
                className={`whitespace-pre-wrap font-sans text-sm ${!showFullDiagnostico ? "line-clamp-4" : ""}`}
              >
                {order.diagnostics}
              </pre>
              {order.diagnostics.length > 150 && (
                <Button
                  variant="link"
                  size="sm"
                  className="h-6 px-0 mt-1 text-primary"
                  onClick={() => setShowFullDiagnostico(!showFullDiagnostico)}
                >
                  {showFullDiagnostico ? "Ver menos" : "Ver más"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Display reason for rejection if exists */}
        {order.razonNoAprobado && (
          <div>
            <h3 className="font-medium text-muted-foreground flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
              Razón de Rechazo
            </h3>
            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800 mt-2">
              <pre className="whitespace-pre-wrap font-sans text-sm text-red-700 dark:text-red-300">
                {order.razonNoAprobado}
              </pre>
            </div>
          </div>
        )}

        {/* Concepto de Orden (si existe) */}
        {order.conceptoOrden && (
          <div>
            <h3 className="font-medium text-muted-foreground mb-2">Concepto de Orden</h3>
            <div className="bg-muted p-3 rounded-lg border border-dashed border-gray-200 dark:border-gray-800">
              {(() => {
                try {
                  const concepto =
                    typeof order.conceptoOrden === "string"
                      ? JSON.parse(order.conceptoOrden)
                      : order.conceptoOrden

                  const headerText = concepto.Header || "Concepto de Reparación"
                  const bodyText = concepto.Text || ""
                  const showVerMas = bodyText.length > 150

                  return (
                    <div className="space-y-2">
                      <h4 className="font-medium text-base">{headerText}</h4>
                      <div className="text-sm text-muted-foreground">
                        <pre className={`whitespace-pre-wrap font-sans ${!showFullConcepto ? "line-clamp-4" : ""}`}>
                          {bodyText}
                        </pre>
                        {showVerMas && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-6 px-0 mt-1 text-primary"
                            onClick={() => setShowFullConcepto(!showFullConcepto)}
                          >
                            {showFullConcepto ? "Ver menos" : "Ver más"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                } catch (e) {
                  return (
                    <pre className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {order.conceptoOrden}
                    </pre>
                  )
                }
              })()}
            </div>
          </div>
        )}

        {/* Status timeline */}
        <StatusHistory history={order.statusHistory} />
      </CardContent>
    </Card>
  )
}