import React from "react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { getStatusDotColor, getStatusText } from "@/lib/status-utils"

interface StatusHistoryProps {
  history: any[]
}

export function StatusHistory({ history }: StatusHistoryProps) {
  if (!history || history.length === 0) return null

  return (
    <div className="pt-2 mt-1">
      <h3 className="font-medium text-muted-foreground mb-3">Historial de Estados</h3>
      <div className="space-y-2 pl-2 border-l-2 border-muted">
        {history.map((record) => (
          <div key={record.id} className="relative">
            <div
              className={`absolute w-3 h-3 rounded-full -left-[7px] top-1 ${getStatusDotColor(record.status)}`}
            ></div>
            <p className="text-xs pl-4">
              <span className="font-medium">{getStatusText(record.status)}</span> - {formatDate(record.timestamp)}
              {record.presupuestoAmount && (
                <span className="ml-1 font-medium text-purple-600 dark:text-purple-400">
                  - Presupuesto: {formatCurrency(Number(record.presupuestoAmount))}
                </span>
              )}
            </p>
            {record.notes && <p className="text-xs pl-4 text-muted-foreground">{record.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}