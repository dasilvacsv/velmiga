import React from "react"
import { motion } from "framer-motion"
import { Clock, CreditCard, Laptop, Printer, Truck } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getPaymentMethodText } from "@/lib/status-utils"

interface TabsSectionProps {
  order: any
  activeTab: string
  onChangeTab: (value: string) => void
  hasMultipleAppliances: boolean
  onShowPaymentDialog: () => void
}

export function TabsSection({ order, activeTab, onChangeTab, hasMultipleAppliances, onShowPaymentDialog }: TabsSectionProps) {
  const statusHistory = (order.statusHistory || []).sort(
    (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  )

  const getStatusDotColor = (status: string) => {
    switch (status) {
      case "PREORDER": return "bg-orange-500 dark:bg-orange-400"
      case "PENDING": return "bg-yellow-500 dark:bg-yellow-400"
      case "ASSIGNED": return "bg-blue-500 dark:bg-blue-400"
      case "IN_PROGRESS": return "bg-purple-500 dark:bg-purple-400"
      case "COMPLETED": return "bg-green-500 dark:bg-green-400"
      case "DELIVERED": return "bg-slate-500 dark:bg-slate-400"
      case "CANCELLED": return "bg-red-500 dark:bg-red-400"
      case "APROBADO": return "bg-green-500 dark:bg-green-400"
      case "NO_APROBADO": return "bg-red-500 dark:bg-red-400"
      case "PENDIENTE_AVISAR": return "bg-amber-500 dark:bg-amber-400"
      case "FACTURADO": return "bg-violet-500 dark:bg-violet-400"
      case "GARANTIA_APLICADA": return "bg-teal-500 dark:bg-teal-400"
      default: return "bg-gray-500 dark:bg-gray-400"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PREORDER": return "Pre-orden"
      case "PENDING": return "Pendiente"
      case "ASSIGNED": return "Asignada"
      case "IN_PROGRESS": return "En Progreso"
      case "COMPLETED": return "Completada"
      case "DELIVERED": return "Entregada"
      case "CANCELLED": return "Cancelada"
      case "APROBADO": return "Aprobada"
      case "NO_APROBADO": return "No Aprobada"
      case "PENDIENTE_AVISAR": return "Pendiente Avisar"
      case "FACTURADO": return "Presupuestada"
      case "ENTREGA_GENERADA": return "Entrega Generada"
      case "GARANTIA_APLICADA": return "Garantía Aplicada"
      case "REPARANDO": return "Reparando"
      default: return status
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="mt-8"
    >
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={onChangeTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="payments" className="text-base">
            <CreditCard className="mr-2 h-4 w-4" />
            Pagos
          </TabsTrigger>
          {hasMultipleAppliances && (
            <TabsTrigger value="appliances" className="text-base">
              <Laptop className="mr-2 h-4 w-4" />
              Electrodomésticos
            </TabsTrigger>
          )}
          <TabsTrigger value="deliveryNotes" className="text-base">
            <Truck className="mr-2 h-4 w-4" />
            Notas de Entrega
          </TabsTrigger>
          <TabsTrigger value="history" className="text-base">
            <Clock className="mr-2 h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Payments Tab */}
        <TabsContent value="payments" className="p-4 border rounded-lg mt-2 bg-card">
          {order.payments?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted text-muted-foreground text-sm">
                    <th className="text-left p-3 font-medium">Fecha</th>
                    <th className="text-left p-3 font-medium">Monto</th>
                    <th className="text-left p-3 font-medium">Método</th>
                    <th className="text-left p-3 font-medium">Referencia</th>
                    <th className="text-left p-3 font-medium">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {order.payments.map((payment: any, index: number) => (
                    <motion.tr
                      key={payment.id}
                      className="border-b"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <td className="p-3 text-sm">{formatDate(payment.paymentDate)}</td>
                      <td className="p-3 text-sm font-medium">{formatCurrency(Number(payment.amount))}</td>
                      <td className="p-3 text-sm">
                        <Badge variant="outline">{getPaymentMethodText(payment.paymentMethod)}</Badge>
                      </td>
                      <td className="p-3 text-sm">{payment.reference || "-"}</td>
                      <td className="p-3 text-sm">{payment.notes || "-"}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <CreditCard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay pagos registrados</p>
              <Button className="mt-4" onClick={onShowPaymentDialog}>
                Registrar pago
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Appliances Tab */}
        {hasMultipleAppliances && (
          <TabsContent value="appliances" className="p-4 border rounded-lg mt-2 bg-card">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted text-muted-foreground text-sm">
                    <th className="text-left p-3 font-medium">Electrodoméstico</th>
                    <th className="text-left p-3 font-medium">Marca</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Falla</th>
                    <th className="text-left p-3 font-medium">Solución</th>
                  </tr>
                </thead>
                <tbody>
                  {order.appliances.map((appliance: any, index: number) => (
                    <motion.tr
                      key={`${appliance.clientAppliance.id}-${index}`}
                      className="border-b"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <td className="p-3 text-sm font-medium">
                        {appliance.clientAppliance.name}
                        {appliance.clientAppliance.model && (
                          <span className="text-xs text-muted-foreground block">
                            Modelo: {appliance.clientAppliance.model}
                          </span>
                        )}
                        {appliance.clientAppliance.serialNumber && (
                          <span className="text-xs text-muted-foreground block">
                            S/N: {appliance.clientAppliance.serialNumber}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm">{appliance.clientAppliance.brand.name}</td>
                      <td className="p-3 text-sm">{appliance.clientAppliance.applianceType.name}</td>
                      <td className="p-3 text-sm">
                        <div className="max-w-[300px] whitespace-pre-line">{appliance.falla || "-"}</div>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="max-w-[300px] whitespace-pre-line">{appliance.solucion || "-"}</div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        )}

        {/* Delivery Notes Tab */}
        <TabsContent value="deliveryNotes" className="p-4 border rounded-lg mt-2 bg-card">
          {order.deliveryNotes?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted text-muted-foreground text-sm">
                    <th className="text-left p-3 font-medium">Número</th>
                    <th className="text-left p-3 font-medium">Fecha</th>
                    <th className="text-left p-3 font-medium">Recibido por</th>
                    <th className="text-left p-3 font-medium">Monto</th>
                    <th className="text-left p-3 font-medium">IVA</th>
                    <th className="text-left p-3 font-medium">Notas</th>
                    <th className="text-left p-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {order.deliveryNotes.map((note: any, index: number) => (
                    <motion.tr
                      key={note.id}
                      className="border-b"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <td className="p-3 text-sm font-medium">#{note.noteNumber}</td>
                      <td className="p-3 text-sm">{formatDate(note.deliveryDate)}</td>
                      <td className="p-3 text-sm">{note.receivedBy}</td>
                      <td className="p-3 text-sm">{note.amount ? formatCurrency(Number(note.amount)) : "-"}</td>
                      <td className="p-3 text-sm">
                        {note.includeIVA ? (
                          <Badge variant="outline" className="bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300">
                            16%
                          </Badge>
                        ) : "-"}
                      </td>
                      <td className="p-3 text-sm">{note.notes || "-"}</td>
                      <td className="p-3 text-sm">
                        <Button variant="ghost" size="sm" asChild className="p-0 h-8 w-8">
                          <a href={`/ordenes/${order.id}/delivery/${note.id}/print`} target="_blank">
                            <Printer className="h-4 w-4" />
                          </a>
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10">
              <Truck className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay notas de entrega registradas</p>
              {(order.status === "COMPLETED" || order.status === "ENTREGA_GENERADA") && (
                <Button className="mt-4" onClick={() => {}}>
                  Crear nota de entrega
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="p-4 border rounded-lg mt-2 bg-card">
          {statusHistory.length > 0 ? (
            <div className="space-y-6">
              {statusHistory.map((entry: any, index: number) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${getStatusDotColor(entry.status)}`} />
                    {index !== statusHistory.length - 1 && (
                      <div className="w-px h-full bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{getStatusText(entry.status)}</p>
                      <span className="text-muted-foreground text-sm">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {entry.notes}
                      </p>
                    )}
                    {entry.user && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Actualizado por: {entry.user.name}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No hay historial registrado</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}