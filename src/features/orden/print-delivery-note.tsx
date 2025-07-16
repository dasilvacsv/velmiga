"use client"

import React, { useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Printer, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

interface PrintDeliveryNoteProps {
  order: any;
  deliveryNote: any;
}

export function PrintDeliveryNote({ order, deliveryNote }: PrintDeliveryNoteProps) {
  const router = useRouter();
  const { theme } = useTheme();

  useEffect(() => {
    // Auto-print when component mounts
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-4xl bg-background">
      {/* No-print buttons */}
      <div className="print:hidden flex justify-between mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>Volver</span>
        </Button>
        <Button variant="default" size="sm" onClick={() => window.print()} className="flex items-center">
          <Printer className="mr-2 h-4 w-4" />
          <span>Imprimir</span>
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-primary">NOTA DE ENTREGA</h1>
        <p className="text-xl font-semibold mt-2 text-foreground">#{deliveryNote.noteNumber}</p>
        <p className="text-sm mt-2 text-muted-foreground">Fecha: {formatDate(deliveryNote.deliveryDate)}</p>
        <p className="text-sm text-muted-foreground">Orden de Servicio: #{order.orderNumber}</p>
      </div>

      {/* Client and Appliance Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="border p-5 rounded-lg shadow-sm bg-card">
          <h2 className="font-bold text-lg mb-3 border-b pb-2 text-card-foreground">Información del Cliente</h2>
          <div className="space-y-2">
            <div>
              <span className="font-semibold text-card-foreground">Nombre:</span> 
              <span className="text-card-foreground ml-2">{order.client.name}</span>
            </div>
            {order.client.document && (
              <div>
                <span className="font-semibold text-card-foreground">Documento:</span> 
                <span className="text-card-foreground ml-2">{order.client.document}</span>
              </div>
            )}
            {order.client.phone && (
              <div>
                <span className="font-semibold text-card-foreground">Teléfono:</span> 
                <span className="text-card-foreground ml-2">{order.client.phone}</span>
              </div>
            )}
            {order.client.email && (
              <div>
                <span className="font-semibold text-card-foreground">Email:</span> 
                <span className="text-card-foreground ml-2">{order.client.email}</span>
              </div>
            )}
            {order.client.address && (
              <div>
                <span className="font-semibold text-card-foreground">Dirección:</span> 
                <span className="text-card-foreground ml-2">{order.client.address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="border p-5 rounded-lg shadow-sm bg-card">
          <h2 className="font-bold text-lg mb-3 border-b pb-2 text-card-foreground">Información del Electrodoméstico</h2>
          <div className="space-y-2">
            <div>
              <span className="font-semibold text-card-foreground">Nombre:</span> 
              <span className="text-card-foreground ml-2">{order.appliance.name}</span>
            </div>
            <div>
              <span className="font-semibold text-card-foreground">Marca:</span> 
              <span className="text-card-foreground ml-2">{order.appliance.brand.name}</span>
            </div>
            <div>
              <span className="font-semibold text-card-foreground">Tipo:</span> 
              <span className="text-card-foreground ml-2">{order.appliance.applianceType.name}</span>
            </div>
            {order.appliance.model && (
              <div>
                <span className="font-semibold text-card-foreground">Modelo:</span> 
                <span className="text-card-foreground ml-2">{order.appliance.model}</span>
              </div>
            )}
            {order.appliance.serialNumber && (
              <div>
                <span className="font-semibold text-card-foreground">Número de Serie:</span> 
                <span className="text-card-foreground ml-2">{order.appliance.serialNumber}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delivery Details */}
      <div className="mb-8 border p-5 rounded-lg shadow-sm bg-card">
        <h2 className="font-bold text-lg mb-3 border-b pb-2 text-card-foreground">Detalles de la Entrega</h2>

        <div className="space-y-2">
          <div>
            <span className="font-semibold text-card-foreground">Recibido por:</span> 
            <span className="text-card-foreground ml-2">{deliveryNote.receivedBy}</span>
          </div>
          <div>
            <span className="font-semibold text-card-foreground">Fecha de Entrega:</span> 
            <span className="text-card-foreground ml-2">{formatDate(deliveryNote.deliveryDate)}</span>
          </div>
        </div>

        {deliveryNote.notes && (
          <div className="mt-4 pt-2 border-t">
            <h3 className="font-semibold text-card-foreground mb-2">Notas:</h3>
            <p className="whitespace-pre-line text-card-foreground">{deliveryNote.notes}</p>
          </div>
        )}
      </div>

      {/* Service Details */}
      <div className="mb-8 border p-5 rounded-lg shadow-sm bg-card">
        <h2 className="font-bold text-lg mb-3 border-b pb-2 text-card-foreground">Detalles del Servicio</h2>

        {order.diagnostics && (
          <div className="mb-4">
            <h3 className="font-semibold text-card-foreground mb-2">Diagnóstico:</h3>
            <p className="whitespace-pre-line text-card-foreground">{order.diagnostics}</p>
          </div>
        )}

        {order.solution && (
          <div className="mb-4">
            <h3 className="font-semibold text-card-foreground mb-2">Solución:</h3>
            <p className="whitespace-pre-line text-card-foreground">{order.solution}</p>
          </div>
        )}
      </div>

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-8 mt-12">
        <div className="text-center">
          <div className="border-t border-black pt-2 mt-16">
            <p className="font-semibold text-foreground">Entregado por</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-black pt-2 mt-16">
            <p className="font-semibold text-foreground">Recibido por</p>
            <p className="text-foreground">{deliveryNote.receivedBy}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm mt-12 pt-4 border-t">
        <p className="text-muted-foreground">Este documento certifica la entrega del electrodoméstico reparado al cliente.</p>
        <p className="text-muted-foreground">Para cualquier consulta, por favor contacte con nosotros.</p>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 1cm;
          }
          body {
            font-size: 12pt;
            background-color: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          h1, h2, h3, h4, h5, h6 {
            color: black !important;
          }
          .border {
            border-color: #e2e8f0 !important;
          }
          .bg-card, .bg-background {
            background-color: white !important;
          }
          .text-card-foreground, .text-foreground {
            color: black !important;
          }
          .text-muted-foreground {
            color: #4b5563 !important;
          }
          .text-primary {
            color: #000000 !important;
          }
          .shadow-sm {
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  );
}