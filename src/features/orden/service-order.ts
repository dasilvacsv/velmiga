// Types for service orders

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  status: string;
  receivedDate: Date;
  totalAmount: string | number;
  paymentStatus: string;
  garantiaIlimitada?: boolean;
  garantiaStartDate?: Date | null;
  garantiaEndDate?: Date | null;
  conceptoOrden?: string | null;
  client: {
    name: string;
    phone?: string;
  };
  appliances: Appliance[];
  technicianAssignments: TechnicianAssignment[];
  createdByUser?: {
    id: string;
    fullName: string;
  };
}

export interface Appliance {
  falla: string | null;
  solucion: string | null;
  clientAppliance: {
    name: string;
    brand: {
      name: string;
    };
    applianceType: {
      name: string;
    };
  };
}

export interface TechnicianAssignment {
  technician: {
    name: string;
  };
  isActive: boolean;
}

export interface StatusOption {
  label: string;
  value: string;
  count: number;
}

export interface PaymentStatusOption {
  label: string;
  value: string;
  count: number;
}

export interface WarrantyOption {
  label: string;
  value: string;
  count: number;
}

export interface ApplianceTypeOption {
  label: string;
  value: string;
  count: number;
}

export interface FacetedFilters {
  status: StatusOption[];
  paymentStatus: PaymentStatusOption[];
  warranty: WarrantyOption[];
  appliance: ApplianceTypeOption[];
  createdBy: ApplianceTypeOption[];
  technician: ApplianceTypeOption[];
}