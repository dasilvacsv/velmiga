'use client'

import { formatDate } from "@/lib/utils"
import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { CaseReportData } from '@/lib/types'

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
    fontSize: 9,
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
  companyInfo: {
    fontSize: 9,
    marginTop: 2,
    color: '#4b5563'
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
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    padding: 8,
    marginBottom: 0
  },
  sectionContent: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopWidth: 0
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
    fontSize: 8,
    fontWeight: 700,
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    color: '#92400e',
    textAlign: 'center'
  },
  tableHeaderCellLast: {
    fontSize: 8,
    fontWeight: 700,
    padding: 6,
    color: '#92400e',
    textAlign: 'center'
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    minHeight: 30
  },
  tableCell: {
    fontSize: 7,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    justifyContent: 'center',
    textAlign: 'left'
  },
  tableCellLast: {
    fontSize: 7,
    padding: 4,
    justifyContent: 'center',
    textAlign: 'left'
  },
  // --- CAMBIO: Anchos de columna ajustados ---
  processNumberCell: { width: '10%' },
  caseCell: { width: '15%' },
  internalCodeCell: { width: '10%' },
  parteCell: { width: '11%' },
  statusCell: { width: '9%' },
  clientCell: { width: '11%' },
  dateCell: { width: '8%' },
  teamCell: { width: '10%' },
  tasksCell: { width: '5%' },
  
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
  }
})

interface CasesReportPDFProps {
  // Asegúrate que los datos que pasas a este componente incluyan 'caseNumber' y 'codigoInterno'
  reportData: CaseReportData[]
  totalCases: number
  activeCases: number
  closedCases: number
}

export function CasesReportPDF({ reportData, totalCases, activeCases, closedCases }: CasesReportPDFProps) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Reporte Avanzado de Casos</Text>
            <Text style={styles.subtitle}>Sistema Legal de Velmiga</Text>
            <Text style={styles.companyInfo}>Reporte generado el {formatDate(new Date())}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyInfo}>Total de casos: {totalCases}</Text>
            <Text style={styles.companyInfo}>Casos activos: {activeCases}</Text>
            <Text style={styles.companyInfo}>Casos cerrados: {closedCases}</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Resumen del Reporte</Text>
          <Text style={styles.summaryText}>
            Este reporte contiene {reportData.length} casos con información detallada sobre partes procesales, 
            estados, equipos legales y tareas asignadas.
          </Text>
        </View>

        {/* Cases Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CASOS REGISTRADOS</Text>
          <View style={styles.sectionContent}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                {/* --- CAMBIO: La columna "ID" ahora es "N° Proceso" --- */}
                <Text style={[styles.tableHeaderCell, styles.processNumberCell]}>N° Proceso</Text>
                <Text style={[styles.tableHeaderCell, styles.caseCell]}>Caso</Text>
                {/* --- CAMBIO: La columna "Código" ahora es "Cód. Interno" --- */}
                <Text style={[styles.tableHeaderCell, styles.internalCodeCell]}>Cód. Interno</Text>
                <Text style={[styles.tableHeaderCell, styles.parteCell]}>Parte Activa</Text>
                <Text style={[styles.tableHeaderCell, styles.parteCell]}>Parte Demandada</Text>
                <Text style={[styles.tableHeaderCell, styles.statusCell]}>Estado</Text>
                <Text style={[styles.tableHeaderCell, styles.clientCell]}>Cliente</Text>
                <Text style={[styles.tableHeaderCell, styles.dateCell]}>F. Apertura</Text>
                <Text style={[styles.tableHeaderCell, styles.teamCell]}>Equipo Legal</Text>
                <Text style={[styles.tableHeaderCellLast, styles.tasksCell]}>Tareas</Text>
              </View>
              
              {reportData.map((case_) => (
                <View key={case_.id} style={styles.tableRow}>
                  {/* --- CAMBIO: Se muestra 'caseNumber' en lugar del índice. Asegúrate de que 'caseNumber' exista en el objeto 'case_'. --- */}
                  <Text style={[styles.tableCell, styles.processNumberCell]}>
                    {case_.caseNumber || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, styles.caseCell]}>
                    {case_.caso}
                  </Text>
                  {/* --- CAMBIO: Se muestra 'codigoInterno' directamente. --- */}
                  <Text style={[styles.tableCell, styles.internalCodeCell]}>
                    {case_.codigoInterno || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, styles.parteCell]}>
                    {case_.parteActiva || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, styles.parteCell]}>
                    {case_.parteDemandada || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, styles.statusCell]}>
                    {case_.estadoOficial}
                  </Text>
                  <Text style={[styles.tableCell, styles.clientCell]}>
                    {case_.cliente || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCell, styles.dateCell]}>
                    {case_.fechaApertura}
                  </Text>
                  <Text style={[styles.tableCell, styles.teamCell]}>
                    {case_.equipoLegal || 'N/A'}
                  </Text>
                  <Text style={[styles.tableCellLast, styles.tasksCell]}>
                    {case_.tareasActivas}/{case_.totalTareas}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documento generado automáticamente por Velmiga
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