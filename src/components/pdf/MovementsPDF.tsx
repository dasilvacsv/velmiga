'use client'

import { formatDate, formatCurrency } from "@/lib/utils"
import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { CaseWithRelations } from '@/lib/types'

// Register fonts for better typography
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf' },
    { src: '/fonts/Inter-Medium.ttf', fontWeight: 500 },
    { src: '/fonts/Inter-SemiBold.ttf', fontWeight: 600 },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 700 }
  ]
})

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b'
  },
  headerLeft: {
    flexDirection: 'column',
    width: '60%'
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    width: '40%'
  },
  logo: {
    width: 80,
    height: 40,
    marginBottom: 8,
    objectFit: 'contain'
  },
  companyInfo: {
    fontSize: 9,
    marginTop: 2,
    color: '#4b5563'
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#f59e0b',
    marginBottom: 3
  },
  caseInfo: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 2
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    padding: 8,
    marginBottom: 0
  },
  sectionContent: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopWidth: 0,
    padding: 10
  },
  gridContainer: {
    flexDirection: 'row',
    marginBottom: 10
  },
  gridColumn: {
    width: '50%',
    paddingRight: 10
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 3
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 600,
    width: '40%',
    color: '#374151'
  },
  fieldValue: {
    fontSize: 9,
    width: '60%',
    color: '#1f2937'
  },
  table: {
    width: '100%'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderBottomWidth: 2,
    borderBottomColor: '#f59e0b'
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 700,
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    color: '#92400e'
  },
  tableHeaderCellLast: {
    fontSize: 9,
    fontWeight: 700,
    padding: 8,
    color: '#92400e'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 35
  },
  tableCell: {
    fontSize: 8,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    justifyContent: 'center'
  },
  tableCellLast: {
    fontSize: 8,
    padding: 6,
    justifyContent: 'center'
  },
  indexCell: {
    width: '8%',
    textAlign: 'center',
    backgroundColor: '#f9fafb'
  },
  dateCell: {
    width: '20%'
  },
  titleCell: {
    width: '25%'
  },
  descriptionCell: {
    width: '35%'
  },
  userCell: {
    width: '12%'
  },
  footer: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    textAlign: 'center'
  },
  footerText: {
    fontSize: 8,
    color: '#6b7280'
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 8,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#9ca3af'
  },
  summary: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 4,
    marginBottom: 15
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#92400e',
    marginBottom: 5
  },
  summaryText: {
    fontSize: 9,
    color: '#78350f'
  }
})

interface MovementsPDFProps {
  case_: CaseWithRelations
}

export function MovementsPDF({ case_ }: MovementsPDFProps) {
  const movements = case_.movements || []
  const totalMovements = movements.length

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Historial de Movimientos</Text>
            <Text style={styles.subtitle}>Vilmega</Text>
            <Text style={styles.companyInfo}>Reporte generado el {formatDate(new Date())}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.caseInfo}>Caso: {case_.caseName}</Text>
            <Text style={styles.caseInfo}>Expediente: {case_.caseNumber || 'No asignado'}</Text>
            <Text style={styles.caseInfo}>Estado: {case_.status}</Text>
            <Text style={styles.caseInfo}>Cliente: {case_.client?.name || 'No asignado'}</Text>
          </View>
        </View>

        {/* Case Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESUMEN DEL CASO</Text>
          <View style={styles.sectionContent}>
            <View style={styles.gridContainer}>
              <View style={styles.gridColumn}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Nombre del Caso:</Text>
                  <Text style={styles.fieldValue}>{case_.caseName}</Text>
                </View>
                {/* --- CAMBIO: Etiqueta "Número:" actualizada a "N° Proceso:" para mayor claridad y consistencia. --- */}
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>N° Proceso:</Text>
                  <Text style={styles.fieldValue}>{case_.caseNumber || 'No asignado'}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Estado Oficial:</Text>
                  <Text style={styles.fieldValue}>{case_.estadoOficial || case_.status}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Fecha de Apertura:</Text>
                  <Text style={styles.fieldValue}>{formatDate(case_.createdAt)}</Text>
                </View>
              </View>
              <View style={styles.gridColumn}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Cliente:</Text>
                  <Text style={styles.fieldValue}>{case_.client?.name || 'No asignado'}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Código Interno:</Text>
                  <Text style={styles.fieldValue}>{case_.codigoInterno || 'No asignado'}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Estado Interno:</Text>
                  <Text style={styles.fieldValue}>{case_.estadoInterno || 'No especificado'}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Autoridades:</Text>
                  <Text style={styles.fieldValue}>{case_.authorities || 'No especificadas'}</Text>
                </View>
              </View>
            </View>
            {case_.description && (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.fieldLabel}>Descripción:</Text>
                <Text style={[styles.fieldValue, { marginTop: 3 }]}>{case_.description}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Movements Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumen de Movimientos</Text>
          <Text style={styles.summaryText}>
            Total de movimientos registrados: {totalMovements}
          </Text>
          <Text style={styles.summaryText}>
            Período: {movements.length > 0 ? `${formatDate(movements[movements.length - 1].createdAt ?? '')} - ${formatDate(movements[0].createdAt ?? '')}` : 'No hay movimientos'}
          </Text>
        </View>

        {/* Movements Table */}
        {movements.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MOVIMIENTOS DETALLADOS</Text>
            <View style={styles.sectionContent}>
              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderCell, styles.indexCell]}>#</Text>
                  <Text style={[styles.tableHeaderCell, styles.dateCell]}>Fecha</Text>
                  <Text style={[styles.tableHeaderCell, styles.titleCell]}>Título</Text>
                  <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>Descripción</Text>
                  <Text style={[styles.tableHeaderCellLast, styles.userCell]}>Usuario</Text>
                </View>
                {movements.map((movement, index) => (
                  <View key={movement.id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.indexCell]}>
                      {movements.length - index}
                    </Text>
                    <Text style={[styles.tableCell, styles.dateCell]}>
                      {formatDate(movement.createdAt)}
                    </Text>
                    <Text style={[styles.tableCell, styles.titleCell]}>
                      {movement.title}
                    </Text>
                    <Text style={[styles.tableCell, styles.descriptionCell]}>
                      {movement.description || 'Sin descripción'}
                    </Text>
                    <Text style={[styles.tableCellLast, styles.userCell]}>
                      {movement.createdByUser?.firstName 
                        ? `${movement.createdByUser.firstName} ${movement.createdByUser.lastName}`
                        : 'Sistema'
                      }
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MOVIMIENTOS</Text>
            <View style={styles.sectionContent}>
              <Text style={{ textAlign: 'center', padding: 20, color: '#6b7280' }}>
                No hay movimientos registrados para este caso.
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documento generado automáticamente por Vilmega
          </Text>
          <Text style={styles.footerText}>
            {new Date().toLocaleString('es-ES')}
          </Text>
        </View>

        {/* Page Number */}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => (
          `Página ${pageNumber} de ${totalPages}`
        )} fixed />
      </Page>
    </Document>
  )
}