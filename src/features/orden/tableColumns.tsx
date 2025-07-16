import { type ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency, formatDate } from "@/lib/utils";
import { OrderTableCell } from "./order-table-cell";
import { OrderRowActions } from "./order-row-actions";
import { ServiceOrder } from "./service-order";

export function getTableColumns(): ColumnDef<ServiceOrder>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "orderNumber",
      header: "Número",
      cell: ({ row }) => (
        <OrderTableCell.OrderNumber order={row.original} />
      ),
    },
    {
      accessorKey: "client.name",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="max-w-[120px] md:max-w-[180px] truncate font-medium">
          {row.original.client.name}
        </div>
      ),
    },
    {
      accessorKey: "client.phone",
      header: "Teléfono",
      cell: ({ row }) => (
        <div className="truncate font-medium">
          {row.original.client.phone || '-'}
        </div>
      ),
    },
    {
      accessorKey: "appliances",
      header: "Electrodoméstico",
      cell: ({ row }) => (
        <OrderTableCell.Appliances appliances={row.original.appliances} />
      ),
      filterFn: (row, columnId, filterValue) => {
        const appliances = row.original.appliances;
        if (!appliances || appliances.length === 0) return false;
        
        if (Array.isArray(filterValue)) {
          return appliances.some(appliance => 
            filterValue.includes(appliance.clientAppliance.applianceType.name)
          );
        } else {
          return appliances.some(appliance => 
            appliance.clientAppliance.applianceType.name === filterValue
          );
        }
      },
    },
    {
      accessorKey: "technicianAssignments",
      header: "Técnico",
      cell: ({ row }) => (
        <OrderTableCell.Technicians assignments={row.original.technicianAssignments} />
      ),
      filterFn: (row, columnId, filterValue) => {
        const assignments = row.original.technicianAssignments;
        if (!assignments || assignments.length === 0) return false;
        
        const activeAssignments = assignments.filter(a => a.isActive);
        if (activeAssignments.length === 0) return false;
        
        if (Array.isArray(filterValue)) {
          return activeAssignments.some(assignment => 
            filterValue.includes(assignment.technician.name)
          );
        } else {
          return activeAssignments.some(assignment => 
            assignment.technician.name === filterValue
          );
        }
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => (
        <OrderTableCell.Status status={row.getValue("status") as string} />
      ),
      filterFn: (row, columnId, filterValue) => {
        const value = row.getValue(columnId) as string;
        
        if (Array.isArray(filterValue)) {
          return filterValue.includes(value);
        }
        return value === filterValue;
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Pago",
      cell: ({ row }) => (
        <OrderTableCell.PaymentStatus status={row.getValue("paymentStatus") as string} />
      ),
      filterFn: (row, columnId, filterValue) => {
        const value = row.getValue(columnId) as string;
        
        if (Array.isArray(filterValue)) {
          return filterValue.includes(value);
        }
        return value === filterValue;
      },
    },
    {
      accessorKey: "totalAmount",
      header: "Monto",
      cell: ({ row }) => formatCurrency(Number(row.getValue("totalAmount")) || 0),
    },
    {
      accessorKey: "receivedDate",
      header: "Fecha Recepción",
      cell: ({ row }) => formatDate(row.getValue("receivedDate") as Date),
      filterFn: (row, columnId, filterValue) => {
        const date = row.getValue(columnId) as Date;
        const [start, end] = filterValue as [Date, Date];
        
        if (!start || !end) return true;
        
        const rowDate = new Date(date);
        rowDate.setHours(0, 0, 0, 0);
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        
        return rowDate >= startDate && rowDate <= endDate;
      },
    },
    {
      accessorKey: "fechaAgendado",
      header: "Fecha Agenda",
      cell: ({ row }) => {
        const dateValue = row.getValue("fechaAgendado") as Date | null;
        if (!dateValue) return "-";
        
        return dateValue.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
      filterFn: (row, columnId, filterValue) => {
        const date = row.getValue(columnId) as Date | null;
        if (!date) return false;
        
        const [start, end] = filterValue as [Date, Date];
        if (!start || !end) return true;
        
        const rowDate = new Date(date);
        rowDate.setHours(0, 0, 0, 0);
        
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        
        return rowDate >= startDate && rowDate <= endDate;
      },
    },
    {
      accessorKey: "fechaCaptacion",
      header: "Fecha Captación",
      cell: ({ row }) => {
        const dateValue = row.getValue("fechaCaptacion") as Date | null;
        if (!dateValue) return "-";
        
        return dateValue.toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
      filterFn: (row, columnId, filterValue) => {
        const date = row.getValue(columnId) as Date | null;
        if (!date) return false;
        
        const [start, end] = filterValue as [Date, Date];
        if (!start || !end) return true;
        
        const rowDate = new Date(date);
        rowDate.setHours(0, 0, 0, 0);
        
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        
        return rowDate >= startDate && rowDate <= endDate;
      },
    },
    {
      accessorKey: "warranty",
      header: "Garantía",
      cell: ({ row }) => (
        <OrderTableCell.Warranty order={row.original} />
      ),
      filterFn: (row, columnId, filterValue) => {
        const order = row.original;
        
        if (Array.isArray(filterValue)) {
          return filterValue.some(value => {
            switch (value) {
              case "active":
                return OrderTableCell.isUnderWarranty(order);
              case "unlimited":
                return !!order.garantiaIlimitada;
              case "none":
                return !order.garantiaEndDate && !order.garantiaIlimitada;
              case "expiring":
                if (!order.garantiaEndDate || order.garantiaIlimitada) return false;
                const daysLeft = OrderTableCell.daysLeftInWarranty(order);
                return daysLeft !== null && daysLeft > 0 && daysLeft < 30;
              default:
                return false;
            }
          });
        }
        
        switch (filterValue) {
          case "active":
            return OrderTableCell.isUnderWarranty(order);
          case "unlimited":
            return !!order.garantiaIlimitada;
          case "none":
            return !order.garantiaEndDate && !order.garantiaIlimitada;
          case "expiring":
            if (!order.garantiaEndDate || order.garantiaIlimitada) return false;
            const daysLeft = OrderTableCell.daysLeftInWarranty(order);
            return daysLeft !== null && daysLeft > 0 && daysLeft < 30;
          default:
            return true;
        }
      },
    },
    {
      accessorKey: "createdByUser.fullName",
      header: "Creado Por",
      cell: ({ row }) => {
        return row.original.createdByUser?.fullName || "N/A";
      },
      filterFn: (row, columnId, filterValue) => {
        const value = row.original.createdByUser?.fullName;
        if (!value) return false;
        
        if (Array.isArray(filterValue)) {
          return filterValue.includes(value);
        }
        return value === filterValue;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <OrderRowActions order={row.original} />
      ),
    },
  ];
}

function getColumnWidth(columnId: string): string {
  switch (columnId) {
    case "select": return "60px";
    case "orderNumber": return "120px";
    case "client.name": return "200px";
    case "client.phone": return "150px";
    case "appliances": return "200px";
    case "technicianAssignments": return "150px";
    case "status": return "120px";
    case "paymentStatus": return "120px";
    case "totalAmount": return "120px";
    case "receivedDate": return "150px";
    case "fechaAgendado": return "150px";
    case "fechaCaptacion": return "150px";
    case "warranty": return "120px";
    case "createdByUser.fullName": return "150px";
    case "actions": return "100px";
    default: return "auto";
  }
}

export { getColumnWidth };