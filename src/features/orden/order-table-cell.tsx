import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import { ServiceOrder, Appliance, TechnicianAssignment } from "./service-order";
import {
  Shield,
  Laptop,
  Users,
  XCircle,
  Clock,
  Sparkles
} from "lucide-react";

// Helper functions for warranty
export const isUnderWarranty = (order: ServiceOrder): boolean => {
  if (order.garantiaIlimitada) return true;
  
  if (order.garantiaEndDate) {
    const endDate = new Date(order.garantiaEndDate);
    const today = new Date();
    return endDate >= today;
  }
  
  return false;
};

export const daysLeftInWarranty = (order: ServiceOrder): number | null => {
  if (order.garantiaIlimitada) return null; // Unlimited warranty
  
  if (order.garantiaEndDate) {
    const endDate = new Date(order.garantiaEndDate);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  return null;
};

// Status options
export const statusOptions = [
  { label: "Pre-Orden", value: "PREORDER" },
  { label: "Pendiente", value: "PENDING" },
  { label: "Asignada", value: "ASSIGNED" },
  { label: "Reparando", value: "REPARANDO" },
  { label: "Aprobada", value: "APROBADO" },
  { label: "No Aprobada", value: "NO_APROBADO" },
  { label: "Pendiente Avisar", value: "PENDIENTE_AVISAR" },
  { label: "Presupuestada", value: "FACTURADO" },
  { label: "Completada", value: "COMPLETED" },
  { label: "Entregada", value: "DELIVERED" },
  { label: "Garantía Aplicada", value: "GARANTIA_APLICADA" },
  { label: "Cancelada", value: "CANCELLED" },
];

// Payment status options
export const paymentStatusOptions = [
  { label: "Pendiente", value: "PENDING" },
  { label: "Parcial", value: "PARTIAL" },
  { label: "Pagado", value: "PAID" },
  { label: "Cancelado", value: "CANCELLED" },
];

// Warranty options
export const warrantyOptions = [
  { label: "En Garantía", value: "active" },
  { label: "Garantía Ilimitada", value: "unlimited" },
  { label: "Sin Garantía", value: "none" },
  { label: "Garantía Próxima a Vencer", value: "expiring" },
];

// Status colors
export const getStatusColor = (status: string) => {
  switch (status) {
    case "PREORDER":
      return "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "IN_PROGRESS":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "REPARANDO":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    case "COMPLETED":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "DELIVERED":
      return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "APROBADO":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "NO_APROBADO":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "PENDIENTE_AVISAR":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "FACTURADO":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
    case "ENTREGA_GENERADA":
      return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    case "GARANTIA_APLICADA":
      return "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

// Payment status colors
export const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case "PAID":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    case "PARTIAL":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    case "CANCELLED":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  }
};

// Status text
export const getStatusText = (status: string) => {
  switch (status) {
    case "PREORDER":
      return "Pre-Orden";
    case "PENDING":
      return "Pendiente";
    case "ASSIGNED":
      return "Asignada";
    case "IN_PROGRESS":
      return "En Progreso";
    case "REPARANDO":
      return "Reparando";
    case "COMPLETED":
      return "Completada";
    case "DELIVERED":
      return "Entregada";
    case "CANCELLED":
      return "Cancelada";
    case "APROBADO":
      return "Aprobada";
    case "NO_APROBADO":
      return "No Aprobada";
    case "PENDIENTE_AVISAR":
      return "Pendiente Avisar";
    case "FACTURADO":
      return "Presupuestada";
    case "ENTREGA_GENERADA":
      return "Entrega Generada";
    case "GARANTIA_APLICADA":
      return "Garantía Aplicada";
    default:
      return status;
  }
};

// Payment status text
export const getPaymentStatusText = (status: string) => {
  switch (status) {
    case "PAID":
      return "Pagado";
    case "PARTIAL":
      return "Parcial";
    case "PENDING":
      return "Pendiente";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
};

// Order number cell with warranty badge
const OrderNumber = ({ order }: { order: ServiceOrder }) => (
  <div className="flex items-center gap-2">
    <Link 
      href={`/ordenes/${order.id}`} 
      className="font-medium hover:text-primary transition-colors"
      onClick={(e) => e.stopPropagation()}
    >
      #{order.orderNumber}
    </Link>
    {isUnderWarranty(order) && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="cursor-help">
              <Shield className="h-4 w-4 text-green-500" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="space-y-1">
              <p className="font-medium text-sm">Garantía Activa</p>
              {order.garantiaIlimitada ? (
                <p className="text-xs">Garantía Ilimitada</p>
              ) : (
                <p className="text-xs">
                  Vence: {order.garantiaEndDate ? formatDate(order.garantiaEndDate) : 'N/A'}
                  {daysLeftInWarranty(order) !== null && ` (${daysLeftInWarranty(order)} días)`}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )}
  </div>
);

// Appliances cell
const Appliances = ({ appliances }: { appliances: Appliance[] }) => {
  if (!appliances || appliances.length === 0) {
    return <span className="text-muted-foreground italic text-sm">Sin electrodoméstico</span>;
  }
  
  if (appliances.length === 1) {
    const appliance = appliances[0];
    return (
      <div className="flex flex-col">
        <span className="truncate">{appliance.clientAppliance.name}</span>
        <span className="text-xs text-muted-foreground truncate">
          {appliance.clientAppliance.brand.name} - {appliance.clientAppliance.applianceType.name}
        </span>
      </div>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help">
            <Badge variant="outline" className="bg-primary/5 border-primary/20">
              <Laptop className="h-3 w-3 mr-1" />
              {appliances.length}
            </Badge>
            <span className="truncate">Múltiples equipos</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[300px]">
          <ScrollArea className="h-[200px] pr-3">
            <div className="space-y-2">
              {appliances.map((appliance, i) => (
                <div key={i} className="space-y-1">
                  <p className="font-medium">{appliance.clientAppliance.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {appliance.clientAppliance.brand.name} - {appliance.clientAppliance.applianceType.name}
                  </p>
                  {appliance.falla && (
                    <p className="text-xs">
                      <span className="font-medium">Falla:</span> {appliance.falla}
                    </p>
                  )}
                  {i < appliances.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Technicians cell
const Technicians = ({ assignments }: { assignments: TechnicianAssignment[] }) => {
  const activeAssignments = assignments.filter((a) => a.isActive);
  
  if (!activeAssignments || activeAssignments.length === 0) {
    return <span className="text-muted-foreground italic text-sm">Sin asignar</span>;
  }
  
  if (activeAssignments.length === 1) {
    return <span className="truncate">{activeAssignments[0].technician.name}</span>;
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-help">
            <Badge variant="outline" className="bg-primary/5 border-primary/20">
              <Users className="h-3 w-3 mr-1" />
              {activeAssignments.length}
            </Badge>
            <span className="truncate">Múltiples técnicos</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-1">
            {activeAssignments.map((assignment, i) => (
              <p key={i} className="text-sm">{assignment.technician.name}</p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Status cell
const Status = ({ status }: { status: string }) => (
  <Badge variant="outline" className={`${getStatusColor(status)} min-w-[100px] justify-center`}>
    {getStatusText(status)}
  </Badge>
);

// Payment status cell
const PaymentStatus = ({ status }: { status: string }) => (
  <Badge variant="outline" className={`${getPaymentStatusColor(status)} min-w-[80px] justify-center`}>
    {getPaymentStatusText(status)}
  </Badge>
);

// Warranty cell
const Warranty = ({ order }: { order: ServiceOrder }) => {
  if (order.garantiaIlimitada) {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 min-w-[105px] justify-center">
        <Sparkles className="h-3 w-3 mr-1" />
        Ilimitada
      </Badge>
    );
  }
  
  if (order.garantiaEndDate) {
    const daysLeft = daysLeftInWarranty(order);
    
    // Warranty expired
    if (daysLeft !== null && daysLeft < 0) {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 min-w-[105px] justify-center">
          <XCircle className="h-3 w-3 mr-1" />
          Expirada
        </Badge>
      );
    }
    
    // Warranty expiring soon (less than 30 days)
    if (daysLeft !== null && daysLeft < 30) {
      return (
        <Badge variant="outline" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 min-w-[105px] justify-center">
          <Clock className="h-3 w-3 mr-1" />
          {daysLeft} días
        </Badge>
      );
    }
    
    // Active warranty
    return (
      <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 min-w-[105px] justify-center">
        <Shield className="h-3 w-3 mr-1" />
        Activa
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 min-w-[105px] justify-center">
      <XCircle className="h-3 w-3 mr-1" />
      Sin garantía
    </Badge>
  );
};

export const OrderTableCell = {
  OrderNumber,
  Appliances,
  Technicians,
  Status,
  PaymentStatus,
  Warranty,
  isUnderWarranty,
  daysLeftInWarranty,
  statusOptions,
  paymentStatusOptions,
  warrantyOptions,
  getStatusColor,
  getPaymentStatusColor,
  getStatusText,
  getPaymentStatusText,
};