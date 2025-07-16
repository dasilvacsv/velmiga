'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { PDFDownloadLink } from '@react-pdf/renderer'
import { DeliveryNotePDF } from './DeliveryNotePDF'
import { Download } from 'lucide-react'

interface DownloadDeliveryNoteButtonProps {
  order: any
  deliveryNote?: any
  isPresupuesto?: boolean
}

export function DownloadDeliveryNoteButton({ 
  order, 
  deliveryNote,
  isPresupuesto = false 
}: DownloadDeliveryNoteButtonProps) {
  const [isClient, setIsClient] = useState(false)

  // React-PDF needs to be client-side rendered
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <Button variant="outline" disabled>
        <Download className="mr-2 h-4 w-4" />
        Preparando...
      </Button>
    )
  }

  const fileName = isPresupuesto 
    ? `presupuesto-${order.orderNumber}.pdf`
    : `nota-entrega-${order.orderNumber}.pdf`

  return (
    <PDFDownloadLink
      document={<DeliveryNotePDF 
        order={order} 
        deliveryNote={deliveryNote}
        isPresupuesto={isPresupuesto}
      />}
      fileName={fileName}
    >
      {({ loading, error }) => {
        if (error) {
          console.error("PDF Error:", error);
        }
        return (
          <Button variant="outline" disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            {loading ? 'Preparando...' : isPresupuesto ? 'Descargar Presupuesto' : 'Descargar PDF'}
          </Button>
        );
      }}
    </PDFDownloadLink>
  )
} 