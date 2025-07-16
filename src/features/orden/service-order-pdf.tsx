'use client'

import React from 'react';
import { formatDate, formatCurrency, formatOrderCode } from "@/lib/utils";
import Image from "next/image";
import { getLogoForDocument, getFormattedOrderCode, getStatusText, parseConceptoOrden } from './service-order/document-utils';

interface ServiceOrderPDFProps {
  order: any;
  isDeliveryNote?: boolean;
  deliveryNote?: any;
  isPresupuesto?: boolean;
}

const ServiceOrderPDF: React.FC<ServiceOrderPDFProps> = ({
  order,
  isDeliveryNote = false,
  deliveryNote,
  isPresupuesto = false
}) => {
  const activeTechnician = order.technicianAssignments?.find((assignment: any) => assignment.isActive);

  // Parse concepto orden using the utility function
  const { header: conceptHeader, text: conceptText, amount: conceptAmount, includeIVA: conceptIncludeIVA, totalAmount: conceptTotalAmount } = parseConceptoOrden(order.conceptoOrden);

  // Calculate amounts
  const amount = isDeliveryNote && deliveryNote?.amount
    ? Number(deliveryNote.amount)
    : order.presupuestoAmount
      ? Number(order.presupuestoAmount)
      : conceptAmount || 0;

  // Properly check if IVA should be included
  const shouldIncludeIVA = order.includeIVA === true;

  // Calculate IVA amount (16% of base amount)
  const ivaAmount = shouldIncludeIVA ? (amount * 0.16) : 0;

  // Calculate total - use conceptTotalAmount if available or calculate it
  const totalAmount = shouldIncludeIVA && conceptTotalAmount
    ? conceptTotalAmount
    : amount + ivaAmount;

  // Get the logo based on the sucursal of the order using utility function
  const logo = getLogoForDocument(order, isDeliveryNote, isPresupuesto);

  // Format date helper function
  const formatFormattedDate = (date: string | Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Format the order code if available using utility function
  const formattedOrderCode = getFormattedOrderCode(order);

  return (
    <div className="container mx-auto p-4 max-w-[210mm] bg-white text-[11px]" style={{ minHeight: '297mm' }}>
      {isDeliveryNote ? (
        // Delivery Note Layout
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 flex items-center">
              <Image
                src={logo}
                alt="Company Logo"
                width={150}
                height={60}
                className="object-contain mr-4"
              />
              <div className="text-xs space-y-1">
                <p className="font-semibold">Servicio técnico de línea blanca</p>
                <p>MULTISERVICE JAD 5.000, C.A.</p>
                <p>RIF: {order.company?.rif || "J-40411244-8"}</p>
                <p>multiservicejad5000@gmail.com</p>
                <p>Dirección: {order.company?.address || "Av. Libertador con Av. el Bosque, Centro Comercial el Bosque al lado de los Bomberos"}</p>
              </div>
            </div>
            <div className="text-right" style={{ width: "200px" }}>
              <p className="text-xs mb-2">CARACAS: {formatDate(order.createdAt)}</p>
              {shouldIncludeIVA && (
                <div className="flex items-center justify-end mt-2">
                  <span className="text-xs border border-gray-400 p-1 bg-gray-100 font-semibold">IVA (16%) INCLUIDO</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-base font-bold text-center mb-6">TELEFONOS: {order.company?.phones || "0212-7617671 / 0212-7635224 / 0412-0210824"}</p>
          
          <div className="border-b-2 border-gray-800 mb-6"></div>

          <div className="mb-8">
            <h2 className="text-xl font-bold text-center mb-6">
              {isPresupuesto ? "PRESUPUESTO" : "NOTA DE ENTREGA"} N° {formattedOrderCode}
            </h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-xs"><span className="font-semibold">CLIENTE:</span> {order.client?.name}</p>
                <p className="text-xs"><span className="font-semibold">DIRECCIÓN:</span> {order.client?.address}</p>
                <p className="text-xs"><span className="font-semibold">TELÉFONO:</span> {order.client?.phone}</p>
              </div>
              {activeTechnician?.technician?.name && (
                <div className="space-y-2">
                  <p className="text-xs"><span className="font-semibold">TÉCNICO:</span> {activeTechnician.technician.name}</p>
                  {order.reference && (
                    <p className="text-xs"><span className="font-semibold">REFERENCIA:</span> {order.reference}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">Descripción</th>
                  <th className="border border-gray-300 p-2 text-right w-32">Precio Unitario</th>
                  <th className="border border-gray-300 p-2 text-right w-32">Monto</th>
                </tr>
              </thead>
              <tbody>
                {order.appliances?.map((appliance: any, index: number) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">
                      <div className="font-bold">{appliance.clientAppliance?.name} {appliance.clientAppliance?.notes}</div>
                      {conceptHeader && <div className="mt-2">{conceptHeader}</div>}
                      {conceptText && <div className="whitespace-pre-line mt-1">{conceptText}</div>}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {amount ? formatCurrency(Number(amount)) : '-'}
                    </td>
                    <td className="border border-gray-300 p-2 text-right">
                      {amount ? formatCurrency(Number(amount)) : '-'}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={2} className="border border-gray-300 p-2 text-right font-bold">Sub-Total:</td>
                  <td className="border border-gray-300 p-2 text-right">{formatCurrency(amount)}</td>
                </tr>
                {shouldIncludeIVA && (
                  <tr>
                    <td colSpan={2} className="border border-gray-300 p-2 text-right font-bold bg-gray-50">
                      <span className="text-blue-600">IVA (16%):</span>
                    </td>
                    <td className="border border-gray-300 p-2 text-right bg-gray-50 text-blue-600">
                      {formatCurrency(ivaAmount)} 
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={2} className="border border-gray-300 p-2 text-right font-bold bg-gray-100">TOTAL:</td>
                  <td className="border border-gray-300 p-2 text-right font-bold bg-gray-100">
                    {formatCurrency(totalAmount)}
                    {shouldIncludeIVA && <span className="text-xs ml-1"></span>}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {(deliveryNote?.diagnostics || order.diagnostics) && (
            <div className="mb-8">
              <h3 className="font-bold mb-3">DIAGNÓSTICO TÉCNICO:</h3>
              <div className="border border-gray-300 p-3 whitespace-pre-line">
                {deliveryNote?.diagnostics || order.diagnostics}
              </div>
            </div>
          )}

          {order.garantiaStartDate && order.garantiaEndDate && (
            <div className="mb-8">
              <p className="font-bold mb-2">GARANTIA</p>
              <p className="text-xs">
                Válida desde {formatFormattedDate(order.garantiaStartDate)} hasta {formatFormattedDate(order.garantiaEndDate)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-10 mt-14 mb-10">
            <div className="text-center">
              <div className="border-t border-black pt-2">
                <p className="font-bold text-xs">FIRMA TÉCNICO</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-2">
                <p className="font-bold text-xs">FIRMA CLIENTE</p>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center text-xs">
            <div className="bg-gray-800 text-white p-2 font-bold text-xs mb-3">
              NOTA: La empresa "NO" se hace responsable por artículos dejados luego de Treinta (30) Días Continuos
              <br/>TRES MESES DE GARANTÍA
            </div>
            <div className="text-xs space-y-1">
              <p>CUENTA MERCANTIL: {order.company?.mercantilAccount || "01050083441083154664"} MULTISERVICE JAD 5000 CA J-40411244-8</p>
              <p>Banesco {order.company?.banescoAccount || "01340307413073086740"} {order.company?.owner || "JAVIER CHIRINOS"} CI {order.company?.ownerID || "19147522"}</p>
              <p>PAGO MOVIL: 0414-3987797 19147522 BANESCO 0134</p>
            </div>
          </div>
        </>
      ) : (
        // Service Note Layout
        <>
          <div className="flex justify-between items-center">
            <div className="flex-1 flex items-center">
              <Image
                src={logo}
                alt="Company Logo"
                width={150}
                height={60}
                className="object-contain mr-3"
              />
              <div className="text-xs">
                <p className="font-semibold">Servicio técnico de línea blanca</p>
                <p>MULTISERVICE JAD 5000 C.A.</p>
                <p>RIF: {order.company?.rif || "J-40411244-8"}</p>
                <p>multiservicejad5000@gmail.com</p>
                <p className='font-bold text-sm'>Creado por: {order.createdByUser?.fullName || 'N/A'}</p>
              </div>
            </div>
            <div className="text-right" style={{ width: "300px" }}>
              <h2 className="text-base font-bold text-black">Orden de Servicio</h2>
              <p className="text-base font-bold text-black">N° {formattedOrderCode}</p>
              <p className="text-xs text-gray-600">Fecha: {formatDate(order.createdAt)}</p>
              <div className="flex items-center justify-end mt-1">
                <span className="font-semibold text-xs bg-gray-800 text-white p-1 mr-1" style={{ minWidth: "80px" }}>Estado:</span>
                <span className="text-xs border border-gray-400 p-1" style={{ minWidth: "120px" }}>{getStatusText(order.status)}</span>
              </div>
              <div className="flex items-center justify-end mt-1">
                <span className="font-semibold text-xs bg-gray-800 text-white p-1 mr-1" style={{ minWidth: "80px" }}>Fecha agenda:</span>
                <span className="text-xs border border-gray-400 p-1 font-bold" style={{ minWidth: "120px" }}>
                  {order.fechaAgendado ? new Date(order.fechaAgendado).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : "-"}
                </span>
              </div>
              <div className="flex items-center justify-end mt-1">
                <span className="font-semibold text-xs bg-gray-800 text-white p-1 mr-1" style={{ minWidth: "80px" }}>Técnico:</span>
                <span className={`text-xs border border-gray-400 p-1 ${!activeTechnician?.technician?.name ? "min-h-[40px]" : ""}`} style={{ minWidth: "120px" }}>
                  {activeTechnician?.technician?.name || " "}
                </span>
              </div>
              {shouldIncludeIVA && (
                <div className="flex items-center justify-end mt-1">
                  <span className="text-xs border border-gray-400 p-1 bg-gray-100 font-semibold">IVA (16%) INCLUIDO</span>
                </div>
              )}
            </div>
          </div>
          
          <p className="text-base font-bold text-center">TELEFONOS: {order.company?.phones || "0212-7617671 / 0212-7635224 / 0412-0210824"}</p>
          
          <div className="border-b-2 border-gray-800 mb-3"></div>

          <div className="mb-3">
            <div className="bg-gray-800 text-white p-1 font-bold text-xs">
              INFORMACIÓN DEL CLIENTE
            </div>
            <div className="grid grid-cols-2 border border-gray-300 border-t-0">
              <div className="border-r border-gray-300 p-1">
                <div className="grid grid-cols-3 gap-1">
                  <p className="text-xs font-semibold">Nombre:</p>
                  <p className="text-xs col-span-2">{order.client?.name}</p>
                  
                  <p className="text-xs font-semibold">Teléfono:</p>
                  <p className="text-xs col-span-2">{order.client?.phone || "N/A"}</p>
                  
                  <p className="text-xs font-semibold">T. Fijo:</p>
                  <p className="text-xs col-span-2">{order.client?.phone2 || "N/A"}</p>
                </div>
              </div>
              <div className="p-1">
                <div className="grid grid-cols-3 gap-1">
                  <p className="text-xs font-semibold">Ciudad:</p>
                  <p className="text-xs col-span-2">{order.client?.city?.name || "N/A"}</p>
                  
                  <p className="text-xs font-semibold">Zona:</p>
                  <p className="text-xs col-span-2">{order.client?.zone?.name || "N/A"}</p>
                  
                  <p className="text-xs font-semibold">Dirección:</p>
                  <p className="text-xs col-span-2">{order.client?.address || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-3">
            <div className="bg-gray-800 text-white p-1 font-bold text-xs">
              DETALLE DE LA ORDEN
            </div>
            <div className="border border-gray-300 border-t-0">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-1 text-left border-b border-r border-gray-300 w-[50px] text-xs">Item</th>
                    <th className="p-1 text-left border-b border-r border-gray-300 w-1/3 text-xs">Artículo</th>
                    <th className="p-1 text-left border-b border-gray-300 text-xs">Falla indicada por el Cliente</th>
                  </tr>
                </thead>
                <tbody>
                  {order.appliances?.map((appliance: any, index: number) => (
                    <tr key={index} className={index > 0 ? "border-t border-gray-300" : ""}>
                      <td className="p-1 text-left border-r border-gray-300 text-xs text-center">
                        {index + 1}
                      </td>
                      <td className="p-1 text-left border-r border-gray-300 text-sm font-bold">
                        {appliance.clientAppliance?.name} {appliance.clientAppliance?.notes}
                      </td>
                      <td className="p-1 text-left text-xs">
                        <div className="whitespace-pre-line">{appliance.falla || "No especificada"}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-3">
            <div className="bg-gray-800 text-white p-1 font-bold text-xs">
              INFORME TÉCNICO
            </div>
            <div className="border border-gray-300 border-t-0">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-1 text-left border-b border-r border-gray-300 w-[30px] text-xs">Item</th>
                    <th className="p-1 text-left border-b border-r border-gray-300 w-[30px] text-xs">Fecha Reparación</th>
                    <th className="p-1 text-left border-b border-r border-gray-300  w-[300px] text-xs">Diagnóstico</th>
                    <th className="p-1 text-left border-b border-gray-300 text-xs w-[30px]">Monto Presupuestado</th>
                  </tr>
                </thead>
                <tbody>
                  {order.appliances?.map((appliance: any, index: number) => (
                    <tr key={index} className={index > 0 ? "border-t border-gray-300" : ""}>
                      <td className="p-1 text-left border-r border-gray-300 text-xs text-center">
                        {index + 1}
                      </td>
                      <td className="p-1 text-left border-r border-gray-300 text-xs">
                        {order.fechaReparacion ? formatFormattedDate(order.fechaReparacion) : " "}
                      </td>
                      <td className="p-1 text-left border-r border-gray-300 text-xs">
                        <div className="whitespace-pre-line">
                          {order.diagnostics || " "}
                        </div>
                      </td>
                      <td className="p-1 text-left text-xs">
                        {order.presupuestoAmount ? (
                          <div className="space-y-1">
                            {shouldIncludeIVA ? (
                              <>
                                <div className="border-b pb-1">Subtotal: {formatCurrency(Number(order.presupuestoAmount))}</div>
                                <div className="border-b pb-1 text-blue-600">IVA (16%): {formatCurrency(Number(order.presupuestoAmount) * 0.16)}</div>
                                <div className="pt-1 font-bold">Total: {formatCurrency(Number(order.presupuestoAmount) * 1.16)}</div>
                              </>
                            ) : (
                              formatCurrency(Number(order.presupuestoAmount))
                            )}
                          </div>
                        ) : (
                          ' '
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-3">
            <div className="bg-gray-800 text-white p-1 font-bold text-xs">
              GARANTÍA Y OBSERVACIONES
            </div>
            <div className="border border-gray-300 border-t-0 p-1">
              {(order.garantiaIlimitada || (order.garantiaStartDate && order.garantiaEndDate)) ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="font-semibold mb-1 text-xs">Estado de Garantía:</p>
                    <div className="border border-gray-200 p-1 bg-gray-50 text-xs">
                      {order.garantiaIlimitada ? (
                        <p>Garantía Ilimitada</p>
                      ) : (
                        <>
                          <p>Desde: {formatFormattedDate(order.garantiaStartDate)}</p>
                          <p>Hasta: {formatFormattedDate(order.garantiaEndDate)}</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold mb-1 text-xs">Observaciones:</p>
                    <div className="border border-gray-200 p-1 bg-gray-50 text-xs min-h-[120px]">
                      {conceptHeader ? `${conceptHeader} - ${conceptText}` : ""}
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="font-semibold mb-1 text-xs">Observaciones:</p>
                  <div className="border border-gray-200 p-1 bg-gray-50 text-xs min-h-[120px]">
                    {conceptHeader ? `${conceptHeader} - ${conceptText}` : ""}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mb-3">
            <div className="bg-gray-800 text-white p-1 font-bold text-xs">
              CONDICIONES DE SERVICIO
            </div>
            <div className="border border-gray-300 border-t-0 p-1">
              <ol className="list-decimal pl-4 text-[8px] space-y-0">
                <li>Todo Trabajo tendrá una garantía de 90 días.</li>
                <li>No se responde por trabajos no especificados en el contrato o presupuesto.</li>
                <li>Los repuestos y trabajos que aparezcan al desarmar el artefacto serán cobrados en forma adicional con su respectiva consulta al cliente.</li>
                <li>La presente orden es válida como contrato de trabajo.</li>
                <li>Todo artefacto que no sea retirado en un plazo de 30 días, la empresa cobrará el derecho a bodega más I.V.A.</li>
                <li>LA GARANTÍA NO SE HARÁ EFECTIVA SIN SU CORRESPONDIENTE FACTURA.</li>
                <li>La empresa no se responsabiliza por casos fortuitos o de fuerza mayor.</li>
                <li>Las mantenciones NO conllevan garantía.</li>
              </ol>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-14">
            <div className="text-center">
              <div className="border-t border-black pt-1">
                <p className="font-semibold text-black text-xs">FIRMA TÉCNICO</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-black pt-1">
                <p className="font-semibold text-black text-xs">FIRMA CLIENTE</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-3">
            <div className="bg-gray-800 text-white p-1 font-bold text-xs">
              NOTA: La empresa "NO" se hace responsable por artículos dejados luego de Treinta (30) Días Continuos
              <br/>TRES MESES DE GARANTÍA
            </div>
            <div className="text-xs mt-2">
              <p>CUENTA MERCANTIL: {order.company?.mercantilAccount || "01050083441083154664"} MULTISERVICE JAD 5000 CA J-40411244-8</p>
              <p>Banesco {order.company?.banescoAccount || "01340307413073086740"} {order.company?.owner || "JAVIER CHIRINOS"} CI {order.company?.ownerID || "19147522"}</p>
              <p>PAGO MOVIL: 0414-3987797 19147522 BANESCO 0134</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ServiceOrderPDF;