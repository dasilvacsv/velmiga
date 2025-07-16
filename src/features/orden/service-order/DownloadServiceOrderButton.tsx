'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { PDFDownloadLink } from '@react-pdf/renderer'
import { ServiceOrderPDF } from './ServiceOrderPDF'
import { Download } from 'lucide-react'

interface DownloadServiceOrderButtonProps {
  order: any
}

export function DownloadServiceOrderButton({ order }: DownloadServiceOrderButtonProps) {
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

  return (
    <PDFDownloadLink
      document={<ServiceOrderPDF order={order} />}
      fileName={`orden-servicio-${order.orderNumber}.pdf`}
    >
      {({ loading, error }) => {
        if (error) {
          console.error("PDF Error:", error);
        }
        return (
          <Button variant="outline" disabled={loading}>
            <Download className="mr-2 h-4 w-4" />
            {loading ? 'Preparando...' : 'Descargar Orden'}
          </Button>
        );
      }}
    </PDFDownloadLink>
  )
} 