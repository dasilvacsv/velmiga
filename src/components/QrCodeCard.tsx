import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  QrCode, 
  Share2, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  User, 
  UserCheck,
  Loader2 
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { sendWhatsappMessageWithQR } from "@/features/whatsapp/actions";
import { toast } from "@/hooks/use-toast";

interface QRCodeCardProps {
  serviceOrderId: string;
  orderNumber: string;
  baseUrl: string;
  clientPhone?: string;
  technicians?: Array<{ name: string; phone: string }>;
  bossPhone?: string;
}

export function QRCodeCard({
  serviceOrderId,
  orderNumber,
  baseUrl,
  clientPhone,
  technicians = [],
  bossPhone = "+584121924476",
}: QRCodeCardProps) {
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const qrRef = useRef<SVGSVGElement>(null);
  
  const qrUrl = `${baseUrl}/ordenes/${serviceOrderId}`;

  const getQRCodeAsBase64 = async (): Promise<string> => {
  if (!qrRef.current) return '';
  
  const svgElement = qrRef.current;
  const svgString = new XMLSerializer().serializeToString(svgElement);
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Aumentar resolución
  const scale = 4;
  canvas.width = 200 * scale;
  canvas.height = 200 * scale;
  
  if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(svgString);
    
    // Esperar a que cargue la imagen
    return new Promise((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png')); // Mantener el prefijo
      };
    });
  }
  
  return Promise.resolve('');
};
  
  const handleWhatsAppShare = async (phone: string) => {
    try {
      setIsSending(true);
      
      const qrBase64 = await getQRCodeAsBase64();
      const message = `🔧 *ORDEN DE SERVICIO #${orderNumber}* 🔧\n\n` +
        `Puedes ver los detalles de la orden escaneando el código QR adjunto o haciendo clic en el siguiente enlace:\n\n` +
        `${qrUrl}`;
      
      const result = await sendWhatsappMessageWithQR(phone, message, qrBase64);
      
      if (result.success) {
        toast({
          title: "Éxito",
          description: "Código QR enviado correctamente",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error sending QR code:', error);
      toast({
        title: "Error",
        description: "Error al enviar el código QR",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const activeTechnicians = technicians.filter(tech => tech.phone);

  return (
    <Card className="overflow-hidden border-l-4 border-l-violet-500 dark:border-l-violet-400">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <QrCode className="h-5 w-5 text-violet-500 dark:text-violet-400" />
          Código QR de la Orden
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center space-y-4 py-4">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <QRCodeSVG 
            ref={qrRef}
            value={qrUrl} 
            size={200}
            level="H"
            includeMargin={true}
            bgColor="#FFFFFF"
            fgColor="#0ab45a"
          />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Escanee este código para acceder a los detalles de la orden
        </p>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3">
        <Button
          variant="outline"
          className="w-full justify-center"
          onClick={() => setShowShareOptions(!showShareOptions)}
        >
          {showShareOptions ? (
            <>
              <ChevronUp className="mr-2 h-4 w-4" />
              <span>Ocultar opciones de compartir</span>
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              <span>Compartir código QR</span>
            </>
          )}
        </Button>
        
        <AnimatePresence>
          {showShareOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full space-y-2 overflow-hidden"
            >
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 dark:hover:text-green-400"
                onClick={() => handleWhatsAppShare(bossPhone)}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg
                    className="mr-2 h-4 w-4 text-green-600 dark:text-green-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.9 11.9l-1.05 3.9 4-1.05A8 8 0 0 0 20 12.06a8 8 0 0 0-2.4-5.74zm-5.55 12.2a6.55 6.55 0 0 1-3.4-.93l-.25-.15-2.5.65.67-2.43-.16-.25a6.59 6.59 0 0 1 10.07-8.4 6.62 6.62 0 0 1 2 4.95A6.64 6.64 0 0 1 12.05 18.52zm3.9-4.87c-.2-.1-1.2-.6-1.4-.67s-.33-.1-.47.1-.52.67-.65.8-.24.15-.43.05a5.8 5.8 0 0 1-1.57-.97 5.82 5.82 0 0 1-1.1-1.36c-.1-.2 0-.3.1-.4s.2-.24.32-.37a1.32 1.32 0 0 0 .22-.37.41.41 0 0 0-.02-.38c-.05-.1-.47-1.13-.64-1.55s-.33-.35-.47-.35-.26 0-.4.02a.8.8 0 0 0-.57.27 2.4 2.4 0 0 0-.74 1.77 4.18 4.18 0 0 0 .85 2.2 9.51 9.51 0 0 0 3.64 3.24c.5.22.9.35 1.2.45.5.16.96.14 1.32.08.4-.05 1.23-.5 1.4-.98s.18-.9.13-1c-.05-.08-.18-.13-.38-.23z" />
                  </svg>
                )}
                <User className="h-4 w-4 mr-2" />
                Enviar al Jefe
              </Button>
              
              {clientPhone && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 dark:hover:text-green-400"
                  onClick={() => handleWhatsAppShare(clientPhone)}
                  disabled={isSending}
                >
                  {isSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg
                      className="mr-2 h-4 w-4 text-green-600 dark:text-green-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.9 11.9l-1.05 3.9 4-1.05A8 8 0 0 0 20 12.06a8 8 0 0 0-2.4-5.74zm-5.55 12.2a6.55 6.55 0 0 1-3.4-.93l-.25-.15-2.5.65.67-2.43-.16-.25a6.59 6.59 0 0 1 10.07-8.4 6.62 6.62 0 0 1 2 4.95A6.64 6.64 0 0 1 12.05 18.52zm3.9-4.87c-.2-.1-1.2-.6-1.4-.67s-.33-.1-.47.1-.52.67-.65.8-.24.15-.43.05a5.8 5.8 0 0 1-1.57-.97 5.82 5.82 0 0 1-1.1-1.36c-.1-.2 0-.3.1-.4s.2-.24.32-.37a1.32 1.32 0 0 0 .22-.37.41.41 0 0 0-.02-.38c-.05-.1-.47-1.13-.64-1.55s-.33-.35-.47-.35-.26 0-.4.02a.8.8 0 0 0-.57.27 2.4 2.4 0 0 0-.74 1.77 4.18 4.18 0 0 0 .85 2.2 9.51 9.51 0 0 0 3.64 3.24c.5.22.9.35 1.2.45.5.16.96.14 1.32.08.4-.05 1.23-.5 1.4-.98s.18-.9.13-1c-.05-.08-.18-.13-.38-.23z" />
                    </svg>
                  )}
                  <User className="h-4 w-4 mr-2" />
                  Enviar al Cliente
                </Button>
              )}
              
              {activeTechnicians.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm" 
                      className="w-full justify-start hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950/30 dark:hover:text-green-400"
                      disabled={isSending}
                    >
                      {isSending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <svg
                          className="mr-2 h-4 w-4 text-green-600 dark:text-green-400"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M17.6 6.32A7.85 7.85 0 0 0 12.05 4a7.94 7.94 0 0 0-6.9 11.9l-1.05 3.9 4-1.05A8 8 0 0 0 20 12.06a8 8 0 0 0-2.4-5.74zm-5.55 12.2a6.55 6.55 0 0 1-3.4-.93l-.25-.15-2.5.65.67-2.43-.16-.25a6.59 6.59 0 0 1 10.07-8.4 6.62 6.62 0 0 1 2 4.95A6.64 6.64 0 0 1 12.05 18.52zm3.9-4.87c-.2-.1-1.2-.6-1.4-.67s-.33-.1-.47.1-.52.67-.65.8-.24.15-.43.05a5.8 5.8 0 0 1-1.57-.97 5.82 5.82 0 0 1-1.1-1.36c-.1-.2 0-.3.1-.4s.2-.24.32-.37a1.32 1.32 0 0 0 .22-.37.41.41 0 0 0-.02-.38c-.05-.1-.47-1.13-.64-1.55s-.33-.35-.47-.35-.26 0-.4.02a.8.8 0 0 0-.57.27 2.4 2.4 0 0 0-.74 1.77 4.18 4.18 0 0 0 .85 2.2 9.51 9.51 0 0 0 3.64 3.24c.5.22.9.35 1.2.45.5.16.96.14 1.32.08.4-.05 1.23-.5 1.4-.98s.18-.9.13-1c-.05-.08-.18-.13-.38-.23z" />
                        </svg>
                      )}
                      <Users className="h-4 w-4 mr-2" />
                      Enviar a Técnicos
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0">
                    <div className="py-1">
                      {activeTechnicians.map((tech, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm" 
                          className="w-full justify-start rounded-none"
                          onClick={() => handleWhatsAppShare(tech.phone)}
                          disabled={isSending}
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          {tech.name}
                        </Button>
                      ))}
                      {activeTechnicians.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          No hay técnicos asignados
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardFooter>
    </Card>
  );
}