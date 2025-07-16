"use client"

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceOrder } from "./service-order";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { OrderTableCell } from "./order-table-cell";
import { Input } from "@/components/ui/input";
import {
  Eye,
  MoreHorizontal,
  Truck,
  Printer,
  CreditCard,
  Shield,
  Info,
  Trash2,
  AlertTriangle,
  Lock
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteServiceOrder } from "./actions";
import { toast } from "sonner";

interface OrderRowActionsProps {
  order: ServiceOrder;
}

export function OrderRowActions({ order }: OrderRowActionsProps) {
  const router = useRouter();
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [securityCode, setSecurityCode] = useState("");
  const [codeError, setCodeError] = useState(false);

  const REQUIRED_CODE = "12345678";

  const handleDelete = async () => {
    // Validate security code
    if (securityCode !== REQUIRED_CODE) {
      setCodeError(true);
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteServiceOrder(order.id);
      if (result.success) {
        toast.success("Orden eliminada correctamente");
        // No need to navigate away as the page will revalidate
      } else {
        toast.error(`Error al eliminar la orden: ${result.error}`);
      }
    } catch (error) {
      toast.error("Error al eliminar la orden");
      console.error("Error deleting order:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteAlertOpen(false);
      setSecurityCode("");
      setCodeError(false);
    }
  };

  const resetDialog = () => {
    setSecurityCode("");
    setCodeError(false);
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="opacity-70 hover:opacity-100 transition-opacity focus:ring-2 focus:ring-primary/20"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem 
            onClick={() => router.push(`/ordenes/${order.id}`)}
            className="flex items-center text-sm cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4" />
            <span>Ver detalles</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => window.open(`/ordenes/${order.id}/print`, '_blank')}
            className="flex items-center text-sm cursor-pointer"
          >
            <Printer className="mr-2 h-4 w-4" />
            <span>Imprimir</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          {order.status === "COMPLETED" && (
            <DropdownMenuItem 
              onClick={() => router.push(`/ordenes/${order.id}/delivery`)}
              className="flex items-center text-sm cursor-pointer"
            >
              <Truck className="mr-2 h-4 w-4" />
              <span>Crear nota de entrega</span>
            </DropdownMenuItem>
          )}
          {(order.paymentStatus === "PENDING" || order.paymentStatus === "PARTIAL") && (
            <DropdownMenuItem 
              onClick={() => router.push(`/ordenes/${order.id}#payment`)}
              className="flex items-center text-sm cursor-pointer"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Registrar pago</span>
            </DropdownMenuItem>
          )}
          
          {/* Warranty-related options */}
          {!OrderTableCell.isUnderWarranty(order) && (
            <DropdownMenuItem 
              onClick={() => router.push(`/ordenes/${order.id}?action=warranty`)}
              className="flex items-center text-sm cursor-pointer"
            >
              <Shield className="mr-2 h-4 w-4" />
              <span>Agregar garantía</span>
            </DropdownMenuItem>
          )}
          
          {OrderTableCell.isUnderWarranty(order) && (
            <DropdownMenuItem 
              onClick={() => router.push(`/ordenes/${order.id}?tab=warranty`)}
              className="flex items-center text-sm cursor-pointer"
            >
              <Info className="mr-2 h-4 w-4" />
              <span>Info de garantía</span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          
          {/* Delete option */}
          <DropdownMenuItem 
            onClick={() => {
              resetDialog();
              setIsDeleteAlertOpen(true);
            }}
            className="flex items-center text-sm text-destructive focus:text-destructive cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Eliminar orden</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={(open) => {
        setIsDeleteAlertOpen(open);
        if (!open) resetDialog();
      }}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> 
              ¿Estás seguro?
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-3 space-y-3">
              <p>
                Esta acción eliminará permanentemente la orden <span className="font-semibold">#{order.orderNumber}</span> y todos sus registros relacionados (pagos, asignaciones, etc.).
              </p>
              
              <div className="my-4 p-3 border border-destructive/20 bg-destructive/5 rounded-md">
                <p className="font-medium text-destructive">Esta acción no se puede deshacer.</p>
              </div>
              
              <div className="pt-2">
                <label htmlFor="security-code" className="block text-sm font-medium mb-1.5 flex items-center">
                  <Lock className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                  Ingresa el código de seguridad para confirmar:
                </label>
                <Input
                  id="security-code"
                  type="password"
                  placeholder="Código de seguridad"
                  value={securityCode}
                  onChange={(e) => {
                    setSecurityCode(e.target.value);
                    setCodeError(false);
                  }}
                  className={`w-full ${codeError ? 'border-destructive ring-1 ring-destructive' : ''}`}
                />
                {codeError && (
                  <p className="text-xs text-destructive mt-1">
                    Código incorrecto. Por favor, verifica e intenta nuevamente.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}