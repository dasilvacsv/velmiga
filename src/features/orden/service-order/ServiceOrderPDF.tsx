'use client'

import { formatDate, formatCurrency } from "@/lib/utils"
import { Document, Font, Page, StyleSheet, Text, View, Image } from '@react-pdf/renderer'
import { getLogoForDocument, getFormattedOrderCode, getStatusText, parseConceptoOrden } from './document-utils'

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
    padding: 25,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
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
    width: 100,
    height: 50,
    marginBottom: 8,
    objectFit: 'contain'
  },
  companyInfo: {
    fontSize: 8,
    marginTop: 3
  },
  createdBy: {
    fontSize: 11,
    fontWeight: 700,
    marginTop: 3
  },
  orderLabel: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 4
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 5
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 5
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: 600,
    marginRight: 0,
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: 4
  },
  statusValue: {
    fontSize: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 4
  },
  emptyTechnicianValue: {
    fontSize: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 4,
    width: 250,
    height: 40
  },
  ivaTag: {
    fontSize: 9,
    fontWeight: 600,
    backgroundColor: '#f8f9fa',
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 5
  },
  phone: {
    fontSize: 11,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 5
  },
  divider: {
    borderBottomWidth: 2,
    borderColor: '#1a1a1a',
    marginBottom: 10
  },
  section: {
    marginBottom: 8
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: 5,
    marginBottom: 0
  },
  sectionContent: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderTopWidth: 0
  },
  gridContainer: {
    flexDirection: 'row',
  },
  gridColumn: {
    width: '50%',
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
    padding: 3
  },
  gridColumnLast: {
    width: '50%',
    padding: 3
  },
  fieldRow: {
    flexDirection: 'row',
    marginBottom: 2
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 600,
    width: '30%'
  },
  fieldValue: {
    fontSize: 9,
    width: '70%'
  },
  table: {
    width: '100%'
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb'
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 700,
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#e5e7eb'
  },
  tableHeaderCellLast: {
    fontSize: 8,
    fontWeight: 700,
    padding: 4
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e5e7eb'
  },
  tableCell: {
    fontSize: 8,
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#e5e7eb'
  },
  emptyCell: {
    fontSize: 8,
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 20
  },
  emptyCellSingle: {
    fontSize: 8,
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 40
  },
  tableCellBold: {
    fontSize: 11,
    fontWeight: 700,
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#e5e7eb'
  },
  tableCellLast: {
    fontSize: 8,
    padding: 4
  },
  indexCell: {
    width: '5%',
    textAlign: 'center'
  },
  dateCell: {
    width: '10%'
  },
  diagnosticCell: {
    width: '60%'
  },
  amountCell: {
    width: '25%'
  },
  applianceCell: {
    width: '33%'
  },
  failureCell: {
    width: '67%'
  },
  guaranteeSection: {
    padding: 3
  },
  subSections: {
    flexDirection: 'row',
    gap: 8
  },
  subSection: {
    width: '48%'
  },
  subSectionTitle: {
    fontSize: 10,
    fontWeight: 600,
    marginBottom: 5
  },
  subSectionContent: {
    fontSize: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 3,
    backgroundColor: '#f9fafb',
    minHeight: 60
  },
  conditionsSection: {
    padding: 2
  },
  conditionsList: {
    fontSize: 7,
    marginLeft: 12
  },
  conditionsItem: {
    marginBottom: 0.5,
    fontSize: 6
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    marginBottom: 8,
    paddingHorizontal: 40
  },
  signatureBox: {
    width: '40%'
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderColor: '#000000',
    marginBottom: 3,
    paddingBottom: 15
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: 600,
    textAlign: 'center'
  },
  footer: {
    marginTop: 8
  },
  footerTitle: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: 5,
    fontSize: 9,
    fontWeight: 600,
    textAlign: 'center'
  },
  footerContent: {
    fontSize: 7,
    textAlign: 'center',
    marginTop: 5
  }
})

interface ServiceOrderPDFProps {
  order: any
}

export function ServiceOrderPDF({ order }: ServiceOrderPDFProps) {
  const activeTechnician = order.technicianAssignments?.find((assignment: any) => assignment.isActive)
  const shouldIncludeIVA = order.includeIVA === true

  const { header: conceptHeader, text: conceptText } = parseConceptoOrden(order.conceptoOrden)

  // Get the logo from the client's branch if available
  const logo = getLogoForDocument(order, false)

  // Format the order code
  const formattedOrderCode = getFormattedOrderCode(order)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image src={logo} style={{ width: 100, height: 50, objectFit: 'contain' }} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.companyInfo}>Servicio técnico de línea blanca</Text>
                <Text style={styles.companyInfo}>MULTISERVICE JAD 5000 C.A.</Text>
                <Text style={styles.companyInfo}>RIF: J-40411244-8</Text>
                <Text style={styles.companyInfo}>multiservicejad5000@gmail.com</Text>
                <Text style={styles.createdBy}>Creado por: {order.createdByUser?.fullName || 'N/A'}</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.orderLabel}>Orden de Servicio</Text>
            <Text style={styles.orderNumber}>N° {formattedOrderCode}</Text>
            <Text style={styles.companyInfo}>Fecha: {formatDate(order.createdAt)}</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Estado:</Text>
              <Text style={styles.statusValue}>{getStatusText(order.status)}</Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Fecha agenda:</Text>
              <Text style={styles.statusValue}>
                {order.fechaAgendado ? new Date(order.fechaAgendado).toLocaleString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : "-"}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Técnico:</Text>
              <Text style={activeTechnician?.technician?.name ? styles.statusValue : styles.emptyTechnicianValue}>
                {activeTechnician?.technician?.name || " "}
              </Text>
            </View>
            {shouldIncludeIVA && (
              <Text style={styles.ivaTag}>IVA (16%) INCLUIDO</Text>
            )}
          </View>
        </View>

        <Text style={styles.phone}>TELEFONOS: 0212-7617671 / 0212-7635224 / 0412-0210824</Text>
        
        <View style={styles.divider} />

        {/* Client Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMACIÓN DEL CLIENTE</Text>
          <View style={styles.sectionContent}>
            <View style={styles.gridContainer}>
              <View style={styles.gridColumn}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Nombre:</Text>
                  <Text style={styles.fieldValue}>{order.client?.name}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Teléfono:</Text>
                  <Text style={styles.fieldValue}>{order.client?.phone || "N/A"}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>T. Fijo:</Text>
                  <Text style={styles.fieldValue}>{order.client?.phone2 || order.client?.landline || "N/A"}</Text>
                </View>
              </View>
              <View style={styles.gridColumnLast}>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Ciudad:</Text>
                  <Text style={styles.fieldValue}>{order.client?.city?.name || "N/A"}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Zona:</Text>
                  <Text style={styles.fieldValue}>{order.client?.zone?.name || "N/A"}</Text>
                </View>
                <View style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>Dirección:</Text>
                  <Text style={styles.fieldValue}>{order.client?.address || "N/A"}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Order Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLE DE LA ORDEN</Text>
          <View style={styles.sectionContent}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.indexCell]}>Item</Text>
                <Text style={[styles.tableHeaderCell, styles.applianceCell]}>Artículo</Text>
                <Text style={[styles.tableHeaderCellLast, styles.failureCell]}>Falla indicada por el Cliente</Text>
              </View>
              {order.appliances?.map((appliance: any, index: number) => (
                <View key={`appliance-${index}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.indexCell]}>{index + 1}</Text>
                  <Text style={[styles.tableCellBold, styles.applianceCell]}>
                    {appliance.clientAppliance?.name}
                  </Text>
                  <Text style={[styles.tableCellLast, styles.failureCell]}>
                    {appliance.falla || "No especificada"}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Technical Report Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORME TÉCNICO</Text>
          <View style={styles.sectionContent}>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, styles.indexCell]}>Item</Text>
                <Text style={[styles.tableHeaderCell, styles.dateCell]}>Fecha Reparación</Text>
                <Text style={[styles.tableHeaderCell, styles.diagnosticCell]}>Diagnóstico</Text>
                <Text style={[styles.tableHeaderCellLast, styles.amountCell]}>Monto Presupuestado</Text>
              </View>
              {order.appliances?.map((appliance: any, index: number) => (
                <View key={`report-${index}`} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.indexCell]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, styles.dateCell]}>
                    {order.completedDate ? formatDate(order.completedDate) : " "}
                  </Text>
                  <Text style={[
                    order.appliances?.length === 1 && !order.diagnostics 
                      ? styles.emptyCellSingle 
                      : styles.emptyCell, 
                    styles.diagnosticCell
                  ]}>
                    {order.diagnostics || " "}
                  </Text>
                  <Text style={[styles.tableCellLast, styles.amountCell]}>
                    {order.presupuestoAmount ? (
                      shouldIncludeIVA ? (
                        `Subtotal: ${formatCurrency(Number(order.presupuestoAmount))}\nIVA (16%): ${formatCurrency(Number(order.presupuestoAmount) * 0.16)}\nTotal: ${formatCurrency(Number(order.presupuestoAmount) * 1.16)}`
                      ) : (
                        formatCurrency(Number(order.presupuestoAmount))
                      )
                    ) : ' '}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Warranty and Observations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GARANTÍA Y OBSERVACIONES</Text>
          <View style={styles.sectionContent}>
            <View style={styles.guaranteeSection}>
              {(order.garantiaIlimitada || (order.garantiaStartDate && order.garantiaEndDate)) ? (
                <View style={styles.subSections}>
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Estado de Garantía:</Text>
                    <View style={styles.subSectionContent}>
                      {order.garantiaIlimitada ? (
                        <Text>Garantía Ilimitada</Text>
                      ) : (
                        <Text>
                          Desde: {formatDate(order.garantiaStartDate)}{'\n'}
                          Hasta: {formatDate(order.garantiaEndDate)}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>Observaciones:</Text>
                    <View style={styles.subSectionContent}>
                      <Text>{conceptHeader ? `${conceptHeader} - ${conceptText}` : " "}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={styles.subSectionTitle}>Observaciones:</Text>
                  <View style={[styles.subSectionContent, { minHeight: 30 }]}>
                    <Text>{conceptHeader ? `${conceptHeader} - ${conceptText}` : " "}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Terms of Service Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONDICIONES DE SERVICIO</Text>
          <View style={styles.sectionContent}>
            <View style={styles.conditionsSection}>
              <View style={styles.conditionsList}>
                <Text style={styles.conditionsItem}>1. Todo Trabajo tendrá una garantía de 90 días.</Text>
                <Text style={styles.conditionsItem}>2. No se responde por trabajos no especificados en el contrato o presupuesto.</Text>
                <Text style={styles.conditionsItem}>3. Los repuestos y trabajos que aparezcan al desarmar el artefacto serán cobrados en forma adicional con su respectiva consulta al cliente.</Text>
                <Text style={styles.conditionsItem}>4. La presente orden es válida como contrato de trabajo.</Text>
                <Text style={styles.conditionsItem}>5. Todo artefacto que no sea retirado en un plazo de 30 días, la empresa cobrará el derecho a bodega más I.V.A.</Text>
                <Text style={styles.conditionsItem}>6. LA GARANTÍA NO SE HARÁ EFECTIVA SIN SU CORRESPONDIENTE FACTURA.</Text>
                <Text style={styles.conditionsItem}>7. La empresa no se responsabiliza por casos fortuitos o de fuerza mayor.</Text>
                <Text style={styles.conditionsItem}>8. Las mantenciones NO conllevan garantía.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Signatures Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>FIRMA TÉCNICO</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>FIRMA CLIENTE</Text>
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>
            NOTA: La empresa "NO" se hace responsable por artículos dejados luego de Treinta (30) Días{'\n'}
            TRES MESES DE GARANTÍA
          </Text>
          <View style={styles.footerContent}>
            <Text>CUENTA MERCANTIL: 01050083441083154664 MULTISERVICE JAD 5000 CA J-40411244-8</Text>
            <Text>Banesco 01340307413073086740 JAVIER CHIRINOS CI 19147522</Text>
            <Text>PAGO MOVIL: 0414-3987797 19147522 BANESCO 0134</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}