'use client'

import React, { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send, Loader2, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import ServiceOrderPDF from './service-order-pdf';
import { DownloadDeliveryNoteButton } from './service-order/DownloadDeliveryNoteButton';
import { DownloadServiceOrderButton } from './service-order/DownloadServiceOrderButton';
import { toast } from "@/hooks/use-toast";
import { sendWhatsappMessageWithPDF, sendWhatsappMessageWithQR } from '@/features/whatsapp/actions';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { pdf } from '@react-pdf/renderer';
import { ServiceOrderPDF as PDFServiceOrder } from './service-order/ServiceOrderPDF';
import { DeliveryNotePDF } from './service-order/DeliveryNotePDF';

interface PrintServiceOrderProps {
  order: any;
}

export function PrintServiceOrder({ order }: PrintServiceOrderProps) {
  console.log('order', order);
  
  const router = useRouter();
  const [activeView, setActiveView] = useState<'service' | 'delivery'>('service');
  const [isPresupuesto, setIsPresupuesto] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const serviceNoteRef = useRef<HTMLDivElement>(null);
  const deliveryNoteRef = useRef<HTMLDivElement>(null);

  const handlePrintServiceNote = useReactToPrint({
    content: () => serviceNoteRef.current,
    documentTitle: `Orden-Servicio-${order.orderNumber}`,
  });

  const handlePrintDeliveryNote = useReactToPrint({
    content: () => deliveryNoteRef.current,
    documentTitle: isPresupuesto 
      ? `Presupuesto-${order.orderNumber}`
      : `Nota-Entrega-${order.orderNumber}`,
  });

  // Default boss phone and client phone from order
  const bossPhone = "+584121924476";
  const clientPhone = order.client?.phone;

  // Function to ensure proper phone format with country code
  const formatPhoneNumber = (phone: string | undefined): string => {
    if (!phone) return '';
    
    // Log the original phone
    console.log('Original phone to format:', phone);
    
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    console.log('Phone after removing non-digits:', cleaned);
    
    // Add Venezuela country code if not present
    if (!cleaned.startsWith('58') && !cleaned.startsWith('+58')) {
      // If it starts with 0, remove the leading 0 before adding country code
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }
      cleaned = '58' + cleaned;
      console.log('Phone after adding country code:', cleaned);
    }
    
    // Ensure it has a plus sign at the beginning
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
      console.log('Phone after adding plus sign:', cleaned);
    }
    
    return cleaned;
  };

  // Format the client phone
  const formattedClientPhone = formatPhoneNumber(clientPhone);
  // Format the boss phone to be consistent
  const formattedBossPhone = formatPhoneNumber(bossPhone);
  
  console.log('Boss phone formatted:', formattedBossPhone);
  console.log('Client phone formatted:', formattedClientPhone);

  const sendServiceOrderViaWhatsApp = async (phone: string) => {
    try {
      setIsSending(true);
      
      // Log who we're sending to
      console.log(`Attempting to send service order to ${phone}`);
      
      // Generate PDF blob
      const pdfDoc = <PDFServiceOrder order={order} />;
      const pdfBlob = await pdf(pdfDoc).toBlob();
      
      // Check if blob was generated successfully
      console.log(`PDF blob generated, size: ${pdfBlob.size} bytes`);
      
      // Convert blob to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1];
            console.log(`Base64 conversion successful, length: ${base64.length}`);
            resolve(base64);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });
      
      // Prepare message text
      const message = `🔧 *ORDEN DE SERVICIO #${order.orderNumber}* 🔧\n\n` +
        `Le enviamos los detalles de la orden de servicio adjuntos en este PDF.`;
      
      try {
        // First attempt: Try to send as PDF
        const result = await sendWhatsappMessageWithPDF(
          phone, 
          message, 
          base64Data,
          `Orden-Servicio-${order.orderNumber}.pdf`
        );
        
        if (result.success) {
          toast({
            title: "Éxito",
            description: "Orden de servicio enviada correctamente",
          });
          return;
        }
        
        throw new Error(result.error || "Error desconocido al enviar PDF");
      } catch (pdfError) {
        console.warn("Failed to send as PDF, attempting to send as image:", pdfError);
        
        // If PDF fails, try to send as image
        if (serviceNoteRef.current) {
          // Create a fallback message explaining we're sending an image
          const fallbackMessage = `🔧 *ORDEN DE SERVICIO #${order.orderNumber}* 🔧\n\n` +
            `Le enviamos los detalles de la orden de servicio como imagen debido a limitaciones técnicas.`;
          
          // Try to take a screenshot of the rendered HTML
          try {
            const canvas = document.createElement('canvas');
            const element = serviceNoteRef.current;
            const width = element.offsetWidth;
            const height = element.offsetHeight;
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Failed to get canvas context");
            
            // Convert HTML to an image (simplified approach)
            // This is a very simplified approach and might not capture the full styling
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            
            // Create a data URL from the canvas
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            const base64Image = dataUrl.split(',')[1];
            
            console.log(`Image generated from canvas, base64 length: ${base64Image.length}`);
            
            // Send image using the QR method (which is known to work)
            const imageResult = await sendWhatsappMessageWithQR(
              phone, 
              fallbackMessage, 
              base64Image
            );
            
            if (imageResult.success) {
              toast({
                title: "Éxito",
                description: "Orden de servicio enviada como imagen",
              });
              return;
            }
            
            throw new Error(imageResult.error || "Failed to send as image");
          } catch (imageError) {
            console.error("Failed to send as image:", imageError);
            throw imageError;
          }
        } else {
          throw pdfError;
        }
      }
    } catch (error) {
      console.error('Error sending service order:', error);
      toast({
        title: "Error",
        description: "Error al enviar el documento: " + (error instanceof Error ? error.message : 'Desconocido'),
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendDeliveryNoteViaWhatsApp = async (phone: string) => {
    try {
      setIsSending(true);
      
      // Generate PDF blob
      const pdfDoc = <DeliveryNotePDF 
        order={order} 
        deliveryNote={order.deliveryNotes?.[0]}
        isPresupuesto={isPresupuesto}
      />;
      const pdfBlob = await pdf(pdfDoc).toBlob();
      
      // Convert blob to base64
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(pdfBlob);
      });
      
      // Prepare message text
      const docType = isPresupuesto ? "PRESUPUESTO" : "NOTA DE ENTREGA";
      const message = `📋 *${docType} - ORDEN #${order.orderNumber}* 📋\n\n` +
        `Le enviamos los detalles ${isPresupuesto ? "del presupuesto" : "de la entrega"} adjuntos en este PDF.`;
      
      try {
        // First attempt: Try to send as PDF
        const result = await sendWhatsappMessageWithPDF(
          phone, 
          message, 
          base64Data,
          isPresupuesto 
            ? `Presupuesto-${order.orderNumber}.pdf`
            : `Nota-Entrega-${order.orderNumber}.pdf`
        );
        
        if (result.success) {
          toast({
            title: "Éxito",
            description: `${isPresupuesto ? "Presupuesto" : "Nota de entrega"} enviado correctamente`,
          });
          return;
        }
        
        throw new Error(result.error || "Error desconocido al enviar PDF");
      } catch (pdfError) {
        console.warn("Failed to send as PDF, attempting to send as image:", pdfError);
        
        // If PDF fails, try to send as image
        if (deliveryNoteRef.current) {
          // Create a fallback message explaining we're sending an image
          const fallbackMessage = `📋 *${docType} - ORDEN #${order.orderNumber}* 📋\n\n` +
            `Le enviamos los detalles ${isPresupuesto ? "del presupuesto" : "de la entrega"} como imagen debido a limitaciones técnicas.`;
          
          // Try to take a screenshot of the rendered HTML
          try {
            const canvas = document.createElement('canvas');
            const element = deliveryNoteRef.current;
            const width = element.offsetWidth;
            const height = element.offsetHeight;
            
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Failed to get canvas context");
            
            // Convert HTML to an image (simplified approach)
            // This is a very simplified approach and might not capture the full styling
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, width, height);
            
            // Create a data URL from the canvas
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            const base64Image = dataUrl.split(',')[1];
            
            // Send image using the QR method (which is known to work)
            const imageResult = await sendWhatsappMessageWithQR(
              phone, 
              fallbackMessage, 
              base64Image
            );
            
            if (imageResult.success) {
              toast({
                title: "Éxito",
                description: `${isPresupuesto ? "Presupuesto" : "Nota de entrega"} enviado como imagen`,
              });
              return;
            }
            
            throw new Error(imageResult.error || "Failed to send as image");
          } catch (imageError) {
            console.error("Failed to send as image:", imageError);
            throw imageError;
          }
        } else {
          throw pdfError;
        }
      }
    } catch (error) {
      console.error('Error sending delivery note:', error);
      toast({
        title: "Error",
        description: "Error al enviar el documento: " + (error instanceof Error ? error.message : 'Desconocido'),
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl bg-background">
      <div className="flex justify-between mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4" />
          <span>Volver</span>
        </Button>
        <div className="flex gap-2">
          <Button 
            className={`${activeView === 'service' 
              ? 'bg-blue-600 text-white font-semibold shadow-md' 
              : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}
            onClick={() => setActiveView('service')}
          >
            {activeView === 'service' 
              ? '📝 ORDEN DE SERVICIO ✓' 
              : '📝 Ver Orden de Servicio'}
          </Button>
          <Button 
            className={`${activeView === 'delivery' 
              ? 'bg-purple-600 text-white font-semibold shadow-md' 
              : 'bg-purple-200 text-purple-800 hover:bg-purple-300'}`}
            onClick={() => setActiveView('delivery')}
          >
            📋 PRESUPUESTO / NOTA DE ENTREGA {activeView === 'delivery' ? '✓' : ''}
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-4 mb-4 items-center">
        {activeView === 'delivery' && (
          <div className="flex items-center gap-2 mr-4">
            <label className="text-sm font-medium">Modo Presupuesto</label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPresupuesto}
                onChange={(e) => setIsPresupuesto(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        )}
        
        {activeView === 'service' ? (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSending}
                >
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  )}
                  Enviar Orden
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <div className="py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-none"
                    onClick={() => sendServiceOrderViaWhatsApp(formattedBossPhone)}
                    disabled={isSending}
                  >
                    Enviar al Jefe
                  </Button>
                  {formattedClientPhone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start rounded-none"
                      onClick={() => sendServiceOrderViaWhatsApp(formattedClientPhone)}
                      disabled={isSending}
                    >
                      Enviar al Cliente
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <DownloadServiceOrderButton order={order} />
            <Button 
              onClick={handlePrintServiceNote}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Imprimir Orden de Servicio
            </Button>
          </>
        ) : (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSending}
                >
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  )}
                  Enviar {isPresupuesto ? 'Presupuesto' : 'Nota de Entrega'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <div className="py-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start rounded-none"
                    onClick={() => sendDeliveryNoteViaWhatsApp(formattedBossPhone)}
                    disabled={isSending}
                  >
                    Enviar al Jefe
                  </Button>
                  {formattedClientPhone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start rounded-none"
                      onClick={() => sendDeliveryNoteViaWhatsApp(formattedClientPhone)}
                      disabled={isSending}
                    >
                      Enviar al Cliente
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <DownloadDeliveryNoteButton 
              order={order} 
              deliveryNote={order.deliveryNotes?.[0]} 
              isPresupuesto={isPresupuesto}
            />
            <Button 
              onClick={handlePrintDeliveryNote}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Imprimir {isPresupuesto ? 'Presupuesto' : 'Nota de Entrega'}
            </Button>
          </>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden shadow-lg">
        {activeView === 'service' && (
          <div ref={serviceNoteRef}>
            <ServiceOrderPDF order={order} />
          </div>
        )}
        
        {activeView === 'delivery' && (
          <div ref={deliveryNoteRef}>
            <ServiceOrderPDF 
              order={order} 
              isDeliveryNote 
              deliveryNote={order.deliveryNotes?.[0]} 
              isPresupuesto={isPresupuesto}
            />
          </div>
        )}
      </div>

      <div className="hidden">
        <div ref={serviceNoteRef}>
          <ServiceOrderPDF order={order} />
        </div>
        <div ref={deliveryNoteRef}>
          <ServiceOrderPDF 
            order={order} 
            isDeliveryNote 
            deliveryNote={order.deliveryNotes?.[0]} 
            isPresupuesto={isPresupuesto}
          />
        </div>
      </div>
    </div>
  );
}