import React, { useState } from "react"
import { CreditCard, ChevronUp, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getPaymentMethodText, getPaymentStatusColor, getPaymentStatusText } from "@/lib/status-utils"

interface PaymentInfoCardProps {
  order: any
  onRegisterPayment: () => void
  onViewAllPayments?: () => void
}

export function PaymentInfoCard({ order, onRegisterPayment, onViewAllPayments }: PaymentInfoCardProps) {
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)

  return (
    <Card className="overflow-hidden border-l-4 border-l-amber-500 dark:border-l-amber-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          Información de Pago
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-muted-foreground">Estado</h3>
          <Badge variant="outline" className={getPaymentStatusColor(order.paymentStatus)}>
            {getPaymentStatusText(order.paymentStatus)}
          </Badge>
        </div>

        {order.presupuestoAmount && (
          <div>
            <h3 className="font-medium text-muted-foreground">Presupuesto</h3>
            <p className="text-lg font-medium text-purple-600 dark:text-purple-400">
              {formatCurrency(Number(order.presupuestoAmount))}
            </p>

            {/* Show IVA calculation if applicable */}
            {order.includeIVA && (
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <div className="flex justify-between items-center">
                  <span>IVA (16%):</span>
                  <span>{formatCurrency(Number(order.presupuestoAmount) * 0.16)}</span>
                </div>
                <div className="flex justify-between items-center font-medium pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Total con IVA:</span>
                  <span>{formatCurrency(Number(order.presupuestoAmount) * 1.16)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <h3 className="font-medium text-muted-foreground">Monto Total</h3>
          <p className="text-xl font-bold">{formatCurrency(Number(order.totalAmount) || 0)}</p>
        </div>

        <div>
          <h3 className="font-medium text-muted-foreground">Monto Pagado</h3>
          <p className="text-green-600 dark:text-green-400 font-medium">
            {formatCurrency(Number(order.paidAmount) || 0)}
          </p>
        </div>

        {Number(order.totalAmount) > 0 && Number(order.paidAmount) < Number(order.totalAmount) && (
          <div>
            <h3 className="font-medium text-muted-foreground">Saldo Pendiente</h3>
            <p className="text-red-600 dark:text-red-400 font-medium">
              {formatCurrency(Number(order.totalAmount) - Number(order.paidAmount))}
            </p>
          </div>
        )}

        {/* Quick payment summary */}
        {order.payments && order.payments.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <button
              className="flex items-center justify-between w-full text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPaymentDetails(!showPaymentDetails)}
            >
              <span className="font-medium">Últimos pagos</span>
              {showPaymentDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            <AnimatePresence>
              {showPaymentDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 space-y-2">
                    {order.payments.slice(0, 3).map((payment: any) => (
                      <div
                        key={payment.id}
                        className="flex justify-between items-center p-2 bg-muted rounded-md text-xs"
                      >
                        <div>
                          <div className="font-medium">{formatCurrency(Number(payment.amount))}</div>
                          <div className="text-muted-foreground">{formatDate(payment.paymentDate)}</div>
                        </div>
                        <Badge variant="outline" className="text-[10px] h-5">
                          {getPaymentMethodText(payment.paymentMethod)}
                        </Badge>
                      </div>
                    ))}
                    {order.payments.length > 3 && onViewAllPayments && (
                      <button
                        className="text-xs text-muted-foreground hover:text-primary transition-colors w-full text-center"
                        onClick={onViewAllPayments}
                      >
                        Ver todos los pagos ({order.payments.length})
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
          onClick={onRegisterPayment}
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Registrar Pago
        </Button>
      </CardFooter>
    </Card>
  )
}