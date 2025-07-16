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
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#1a1a1a',
    backgroundColor: '#ffffff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '70%'
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    width: '30%'
  },
  logo: {
    width: 100,
    height: 50,
    marginRight: 15,
    objectFit: 'contain'
  },
  companyInfoContainer: {
    marginLeft: 10
  },
  companyInfo: {
    fontSize: 8,
    marginBottom: 2
  },
  companyAddress: {
    fontSize: 8,
    marginTop: 2,
    width: '80%'
  },
  phones: {
    fontSize: 11,
    fontWeight: 700,
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 10
  },
  divider: {
    borderBottomWidth: 2,
    borderColor: '#1a1a1a',
    marginBottom: 20
  },
  noteLabel: {
    fontSize: 16,
    fontWeight: 700,
    marginBottom: 8,
    textAlign: 'center'
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
    marginRight: 5
  },
  statusValue: {
    fontSize: 10
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
  clientSection: {
    marginTop: 20,
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: '#f8f9fa',
    padding: 5,
    marginBottom: 8
  },
  clientInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  clientField: {
    flexDirection: 'row',
    width: '50%',
    marginBottom: 5
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: 600,
    width: 60
  },
  fieldValue: {
    fontSize: 9
  },
  technicianField: {
    flexDirection: 'row',
    marginBottom: 5
  },
  table: {
    marginBottom: 15
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 5
  },
  tableHeaderCell: {
    fontSize: 10,
    fontWeight: 600
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    padding: 5
  },
  descriptionCell: {
    width: '60%',
    fontSize: 9
  },
  priceCell: {
    width: '20%',
    fontSize: 9,
    textAlign: 'right'
  },
  amountCell: {
    width: '20%',
    fontSize: 9,
    textAlign: 'right'
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    padding: 5
  },
  totalLabel: {
    width: '80%',
    textAlign: 'right',
    fontSize: 10,
    fontWeight: 600
  },
  totalValue: {
    width: '20%',
    textAlign: 'right',
    fontSize: 10
  },
  ivaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    padding: 5,
    backgroundColor: '#f8f9fa'
  },
  finalTotal: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#e5e7eb',
    padding: 5,
    backgroundColor: '#f8f9fa'
  },
  finalTotalLabel: {
    width: '80%',
    textAlign: 'right',
    fontSize: 10,
    fontWeight: 700
  },
  finalTotalValue: {
    width: '20%',
    textAlign: 'right',
    fontSize: 10,
    fontWeight: 700
  },
  diagnosticsSection: {
    marginTop: 20,
    marginBottom: 20
  },
  diagnosticsTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 5
  },
  diagnosticsContent: {
    fontSize: 9,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 8
  },
  warrantySection: {
    marginBottom: 20
  },
  warrantyTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 5
  },
  warrantyContent: {
    fontSize: 9
  },
  signaturesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    marginBottom: 30
  },
  signatureBox: {
    width: '40%'
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderColor: '#000000',
    marginBottom: 5,
    paddingBottom: 20
  },
  signatureLabel: {
    fontSize: 10,
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

interface DeliveryNotePDFProps {
  order: any
  deliveryNote?: any
  isPresupuesto?: boolean
}

export function DeliveryNotePDF({ order, deliveryNote, isPresupuesto = false }: DeliveryNotePDFProps) {
  const activeTechnician = order.technicianAssignments?.find((assignment: any) => assignment.isActive)

  // Parse concept data
  const concept = parseConceptoOrden(order.conceptoOrden)

  // Calculate amounts
  const amount = deliveryNote?.amount
    ? Number(deliveryNote.amount)
    : order.presupuestoAmount
      ? Number(order.presupuestoAmount)
      : concept.amount || 0

  // Properly check if IVA should be included
  const shouldIncludeIVA = order.includeIVA === true

  // Calculate IVA amount (16% of base amount)
  const ivaAmount = shouldIncludeIVA ? (amount * 0.16) : 0

  // Calculate total - use concept total if available or calculate it
  const totalAmount = shouldIncludeIVA && concept.totalAmount
    ? concept.totalAmount
    : amount + ivaAmount

  // Get the logo based on the sucursal of the client or order using utility function
  const logo = getLogoForDocument(order, true, isPresupuesto)

  // Format the order code using utility function
  const formattedOrderCode = getFormattedOrderCode(order)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image src={logo} style={styles.logo} />
            <View style={styles.companyInfoContainer}>
              <Text style={styles.companyInfo}>Servicio técnico de línea blanca</Text>
              <Text style={styles.companyInfo}>MULTISERVICE JAD 5.000, C.A.</Text>
              <Text style={styles.companyInfo}>RIF: {order.company?.rif || "J-40411244-8"}</Text>
              <Text style={styles.companyInfo}>multiservicejad5000@gmail.com</Text>
              <Text style={styles.companyAddress}>
                Dirección: {order.company?.address || "Av. Libertador con Av. el Bosque, Centro Comercial el Bosque al lado de los Bomberos"}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.companyInfo}>CARACAS: {formatDate(order.createdAt)}</Text>
            {shouldIncludeIVA && (
              <Text style={styles.ivaTag}>IVA (16%) INCLUIDO</Text>
            )}
          </View>
        </View>

        <Text style={styles.phones}>
          TELEFONOS: {order.company?.phones || "0212-7617671 / 0212-7635224 / 0412-0210824"}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.noteLabel}>
          {isPresupuesto ? "PRESUPUESTO" : "NOTA DE ENTREGA"} N° {formattedOrderCode}
        </Text>

        <View style={styles.clientSection}>
          <View style={styles.clientInfo}>
            <View style={[styles.clientField, { marginBottom: 8 }]}>
              <Text style={styles.fieldLabel}>CLIENTE:</Text>
              <Text style={styles.fieldValue}>{order.client?.name}</Text>
            </View>
            <View style={[styles.clientField, { marginBottom: 8 }]}>
              <Text style={styles.fieldLabel}>DIRECCIÓN:</Text>
              <Text style={styles.fieldValue}>{order.client?.address}</Text>
            </View>
            <View style={[styles.clientField, { marginBottom: 8 }]}>
              <Text style={styles.fieldLabel}>TELÉFONO:</Text>
              <Text style={styles.fieldValue}>{order.client?.phone}</Text>
            </View>
            {activeTechnician?.technician?.name && (
              <>
                <View style={[styles.technicianField, { marginBottom: 8 }]}>
                  <Text style={styles.fieldLabel}>TÉCNICO:</Text>
                  <Text style={styles.fieldValue}>{activeTechnician.technician.name}</Text>
                </View>
                {order.reference && (
                  <View style={styles.technicianField}>
                    <Text style={styles.fieldLabel}>REFERENCIA:</Text>
                    <Text style={styles.fieldValue}>{order.reference}</Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Table section */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.descriptionCell]}>Descripción</Text>
            <Text style={[styles.tableHeaderCell, styles.priceCell]}>Precio Unitario</Text>
            <Text style={[styles.tableHeaderCell, styles.amountCell]}>Monto</Text>
          </View>
          
          {order.appliances?.map((appliance: any, index: number) => (
            <View key={`app-${index}`} style={styles.tableRow}>
              <View style={styles.descriptionCell}>
                <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 2 }}>
                  {appliance.clientAppliance?.name} {appliance.clientAppliance?.notes}
                </Text>
                {concept.header && <Text style={{ fontSize: 9, marginBottom: 2 }}>{concept.header}</Text>}
                {concept.text && <Text style={{ fontSize: 9 }}>{concept.text}</Text>}
              </View>
              <Text style={styles.priceCell}>
                {amount ? formatCurrency(Number(amount)) : '-'}
              </Text>
              <Text style={styles.amountCell}>
                {amount ? formatCurrency(Number(amount)) : '-'}
              </Text>
            </View>
          ))}
          
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sub-Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(amount)}</Text>
          </View>
          
          {shouldIncludeIVA && (
            <View style={styles.ivaRow}>
              <Text style={[styles.totalLabel, { color: '#2563eb' }]}>IVA (16%):</Text>
              <Text style={[styles.totalValue, { color: '#2563eb' }]}>
                {formatCurrency(ivaAmount)}
              </Text>
            </View>
          )}
          
          <View style={styles.finalTotal}>
            <Text style={styles.finalTotalLabel}>TOTAL:</Text>
            <Text style={styles.finalTotalValue}>
              {formatCurrency(totalAmount)}
            </Text>
          </View>
        </View>

        {(deliveryNote?.diagnostics || order.diagnostics) && (
          <View style={styles.diagnosticsSection}>
            <Text style={styles.diagnosticsTitle}>DIAGNÓSTICO TÉCNICO:</Text>
            <Text style={styles.diagnosticsContent}>
              {deliveryNote?.diagnostics || order.diagnostics}
            </Text>
          </View>
        )}

        {(order.garantiaStartDate && order.garantiaEndDate) && (
          <View style={styles.warrantySection}>
            <Text style={styles.warrantyTitle}>GARANTIA</Text>
            <Text style={styles.warrantyContent}>
              Válida desde {formatDate(order.garantiaStartDate)} hasta {formatDate(order.garantiaEndDate)}
            </Text>
          </View>
        )}

        <View style={styles.signaturesSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>FIRMA TÉCNICO</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}></View>
            <Text style={styles.signatureLabel}>FIRMA CLIENTE</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>
            NOTA: La empresa "NO" se hace responsable por artículos dejados luego de Treinta (30) Días Continuos{'\n'}
            TRES MESES DE GARANTÍA
          </Text>
          <View style={styles.footerContent}>
            <Text>CUENTA MERCANTIL: {order.company?.mercantilAccount || "01050083441083154664"} MULTISERVICE JAD 5000 CA J-40411244-8</Text>
            <Text>Banesco {order.company?.banescoAccount || "01340307413073086740"} {order.company?.owner || "JAVIER CHIRINOS"} CI {order.company?.ownerID || "19147522"}</Text>
            <Text>PAGO MOVIL: 0414-3987797 19147522 BANESCO 0134</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}