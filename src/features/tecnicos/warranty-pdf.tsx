import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';

const styles = StyleSheet.create({
  // --- CONFIGURACIÓN GLOBAL CON ESPACIO AJUSTADO ---
  page: {
    paddingHorizontal: 23,
    paddingVertical: 23,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
    fontSize: 8,
  },
  header: {
    marginBottom: 14,
    paddingBottom: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  title: {
    fontSize: 18,
    marginBottom: 7,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 8,
    textAlign: 'center',
    color: '#6c6c6c',
  },
  // --- RESUMEN GENERAL CON ESPACIO AJUSTADO ---
  summaryContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 9,
    color: '#0f172a',
  },
  totalStats: {
    flexDirection: 'row',
    paddingVertical: 5,
    marginBottom: 9,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 7,
    color: '#64748b',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  technicianDistribution: {
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  distributionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  multiColumnContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  multiColumnItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '50%',
    paddingVertical: 1.5,
    paddingRight: 8,
  },
  technicianName: {
    fontSize: 8,
  },
  technicianCount: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  // --- SECCIÓN DE TÉCNICO INDIVIDUAL CON ESPACIO AJUSTADO ---
  technicianSection: { // Eliminado breakInside de aquí
    marginBottom: 26,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e8e8e8',
  },
  technicianHeader: {
    fontSize: 12,
    paddingBottom: 4,
    marginBottom: 5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  technicianStatsLine: {
    flexDirection: 'row',
    fontSize: 8,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f1f1',
  },
  statText: {
    marginRight: 9,
    alignItems: 'center',
  },
  bold: {
    fontWeight: 'bold',
  },
  priorityCountBaja: {
    color: '#059669',
    fontWeight: 'bold',
  },
  priorityCountMedia: {
    color: '#d97706',
    fontWeight: 'bold',
  },
  priorityCountAlta: {
    color: '#dc2626',
    fontWeight: 'bold',
  },
  // --- ESTILOS PARA LA TABLA DE ÓRDENES ---
  orderTableContainer: {
    marginTop: 8, // Espacio antes de la tabla
  },
  orderTable: {
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  orderTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc', // Un fondo suave para el encabezado
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 0.5,
    alignItems: 'center',
    textAlign: 'center', // Centrar texto del encabezado
    fontWeight: 'bold', // Corregido: usar fontWeight para negrita
    height: 20, // Altura fija para el encabezado
  },
  orderTableRow: {
    flexDirection: 'row',
    borderBottomColor: '#e0e0e0',
    borderBottomWidth: 0.5,
    alignItems: 'center',
    minHeight: 18, // Altura mínima para las filas de datos
  },
  orderTableCellHeader: {
    fontSize: 7.5, // Tamaño de fuente ligeramente más pequeño para encabezados
    padding: 3,
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    fontWeight: 'bold', // fontWeight para negrita
  },
  orderTableCell: {
    fontSize: 7, // Tamaño de fuente para celdas de datos
    padding: 3,
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  // Anchos de columna (ajustables)
  colNumero: { width: '12%', flexGrow: 1.2 },
  colCliente: { width: '22%', flexGrow: 2.2 },
  colElectrodomestico: { width: '26%', flexGrow: 2.6 },
  colTelefono: { width: '15%', flexGrow: 1.5 },
  colDireccion: { width: '25%', flexGrow: 2.5 },

  // --- FOOTER Y OTROS ---
  footer: {
    position: 'absolute',
    bottom: 19,
    left: 23,
    right: 23,
    fontSize: 7,
    textAlign: 'center',
    color: '#888',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 19,
    right: 23,
    fontSize: 7,
  },
  noData: {
    padding: 10,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 8,
    fontStyle: 'italic',
  },
});

interface WarrantyOrder {
  id: string | number;
  orderNumber: string;
  client?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  appliances: Array<{
    clientAppliance?: {
      name: string;
      brand: {
        name: string;
      };
    };
  }>;
}

interface Technician {
  id: string | number;
  name: string;
  warrantyCount: number;
  priorityStats: {
    baja: number;
    media: number;
    alta: number;
  };
  warrantyOrders: WarrantyOrder[];
}

interface WarrantyPDFProps {
  technicians: Technician[];
}

// Función auxiliar para truncar texto
const truncateText = (text: string | undefined, maxLength: number): string => {
  if (!text) return 'N/A';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};


export function WarrantyPDF({ technicians }: WarrantyPDFProps) {
  const totalWarranties = technicians.reduce((sum, tech) => sum + tech.warrantyCount, 0);
  const totalBaja = technicians.reduce((sum, tech) => sum + tech.priorityStats.baja, 0);
  const totalMedia = technicians.reduce((sum, tech) => sum + tech.priorityStats.media, 0);
  const totalAlta = technicians.reduce((sum, tech) => sum + tech.priorityStats.alta, 0);

  const sortedTechnicians = [...technicians].sort((a, b) => b.warrantyCount - a.warrantyCount);

  // Longitudes máximas para truncamiento en celdas de tabla
  const MAX_TABLE_CELL_CLIENT_LENGTH = 20;
  const MAX_TABLE_CELL_APPLIANCE_LENGTH = 25;
  const MAX_TABLE_CELL_ADDRESS_LENGTH = 28;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* --- ENCABEZADO --- */}
        <View style={styles.header}>
          <Text style={styles.title}>Reporte de Garantías</Text>
          <Text style={styles.subtitle}>
            Generado el {format(new Date(), 'dd/MM/yyyy HH:mm')} hrs
          </Text>
        </View>

        {/* --- RESUMEN GENERAL --- */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Resumen General</Text>
          <View style={styles.totalStats}>
            <View style={styles.statBox}><Text style={styles.statNumber}>{totalWarranties}</Text><Text style={styles.statLabel}>Total</Text></View>
            <View style={styles.statBox}><Text style={[styles.statNumber, { color: '#059669' }]}>{totalBaja}</Text><Text style={styles.statLabel}>Baja</Text></View>
            <View style={styles.statBox}><Text style={[styles.statNumber, { color: '#d97706' }]}>{totalMedia}</Text><Text style={styles.statLabel}>Media</Text></View>
            <View style={styles.statBox}><Text style={[styles.statNumber, { color: '#dc2626' }]}>{totalAlta}</Text><Text style={styles.statLabel}>Alta</Text></View>
          </View>
          <View style={styles.technicianDistribution}>
            <Text style={styles.distributionTitle}>Distribución por Técnico</Text>
            <View style={styles.multiColumnContainer}>
              {sortedTechnicians.map(tech => (
                <View key={tech.id} style={styles.multiColumnItem}>
                  <Text style={styles.technicianName}>{truncateText(tech.name, 25)}</Text>
                  <Text style={styles.technicianCount}>{tech.warrantyCount}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* --- SECCIONES POR TÉCNICO --- */}
        {sortedTechnicians.map(technician => (
          <View key={technician.id} style={styles.technicianSection} wrap={false}> {/* Añadido wrap={false} aquí */}
            <Text style={styles.technicianHeader}>{technician.name}</Text>
            <View style={styles.technicianStatsLine}>
              <Text style={styles.statText}><Text style={styles.bold}>Total:</Text> {technician.warrantyCount}</Text>
              <Text style={styles.statText}>
                <Text style={styles.bold}>Baja:</Text> <Text style={styles.priorityCountBaja}>{technician.priorityStats.baja}</Text>
              </Text>
              <Text style={styles.statText}>
                <Text style={styles.bold}>Media:</Text> <Text style={styles.priorityCountMedia}>{technician.priorityStats.media}</Text>
              </Text>
              <Text style={styles.statText}>
                <Text style={styles.bold}>Alta:</Text> <Text style={styles.priorityCountAlta}>{technician.priorityStats.alta}</Text>
              </Text>
            </View>

            {/* --- TABLA DE ÓRDENES DEL TÉCNICO --- */}
            {technician.warrantyOrders.length > 0 ? (
              <View style={styles.orderTableContainer}>
                <View style={styles.orderTable}>
                  {/* Encabezado de la Tabla */}
                  <View style={styles.orderTableHeader} fixed>
                    <Text style={[styles.orderTableCellHeader, styles.colNumero]}>Número</Text>
                    <Text style={[styles.orderTableCellHeader, styles.colCliente]}>Cliente</Text>
                    <Text style={[styles.orderTableCellHeader, styles.colElectrodomestico]}>Electrodoméstico</Text>
                    <Text style={[styles.orderTableCellHeader, styles.colTelefono]}>Teléfono</Text>
                    <Text style={[styles.orderTableCellHeader, styles.colDireccion]}>Dirección</Text>
                  </View>

                  {/* Filas de Datos de la Tabla */}
                  {technician.warrantyOrders.map((order) => (
                    <View key={order.id} style={styles.orderTableRow}>
                      <Text style={[styles.orderTableCell, styles.colNumero]}>{order.orderNumber}</Text>
                      <Text style={[styles.orderTableCell, styles.colCliente]}>
                        {truncateText(order.client?.name, MAX_TABLE_CELL_CLIENT_LENGTH)}
                      </Text>
                      <Text style={[styles.orderTableCell, styles.colElectrodomestico]}>
                        {truncateText(order.appliances[0]?.clientAppliance
                          ? `${order.appliances[0].clientAppliance.name} - ${order.appliances[0].clientAppliance.brand.name}`
                          : undefined, MAX_TABLE_CELL_APPLIANCE_LENGTH)}
                      </Text>
                      <Text style={[styles.orderTableCell, styles.colTelefono]}>{order.client?.phone || 'N/A'}</Text>
                      <Text style={[styles.orderTableCell, styles.colDireccion]}>
                        {truncateText(order.client?.address, MAX_TABLE_CELL_ADDRESS_LENGTH)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text style={styles.noData}>No hay órdenes asignadas.</Text>
            )}
          </View>
        ))}

        {/* --- PIE DE PÁGINA --- */}
        <Text style={styles.footer} fixed>
          Reporte generado automáticamente.
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Pág ${pageNumber}/${totalPages}`
        )} fixed />
      </Page>
    </Document>
  );
}
