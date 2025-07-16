## 1. Clientes
- Add a lot of filters with calendario, zona, etc on clientes
- On cliente register zona to be like categorysleect and those selects, u will create city and set on the select popover and just the same for zona so we will have a growing List of Zonas and Ciudades and if it doesnt exist they can just create it like i do with those popovers where u set name
- on Clients list, now that electrodomesticos belong to them render like this: Cliente, Electrodomestico[0] first electrodomestico he has even if he has 10 and u can see more getting inside of it

## 2. Electrodomésticos
- Handle multiple electrodomesticos flow will be pretty much like osuna one, where Clientes/Electrodomesticos will have a table to put the electrodomesticos if u see beneficiarios from osuna is pretty much the same, make electrodomesticos simpler, just choose brand type, optional serial and number and it will add to table
- Make it possible to add more electrodomesticos and like when is more than one u will put like this: Select electrodomestico assigned, set item, falla just as my system of adminpro does (see ref.png)
- Excel paste to program work properly, will also set the electrodomesticos and falla
- We need a way we can generate a QR that goes to electrodomestico X this way we can create tickets for electrodomesticos and go directly to page/electrodomestico/xxxxxxxx we will set it to use base url put it in a var first that it generates a QR with ling so easy to scan

## 3. Órdenes
- Estados de orden flow:
  - Pueden crear orden o preorden (switch)
  - Status inicial: "Orden Recibida"
  - Luego "Asignado a Tecnico (Pendiente por reporte)"
  - 3 opciones después:
    1. Aprobado: Ingresa monto presupuesto (presupuestoAmount)
    2. No Aprobado: Pago pendiente revision (default 5)
    3. Pendiente por Avisar: Set presupuestoAmount, status pendienteafter
  - Facturado: Confirmar/actualizar monto, set conceptoOrden
- We need a direct way to set diagnostico and the things we set when we edit
- tener una parte donde se pueda ver el monto presupuestado y poder cambialo

## 4. Técnicos
- We need a way the asign tecnico, we can have like a table where we can assign them
- dar de baja will just put on stopReason field of db, the reason and when u click it will say yea this stopped bc this and add another one
- Set role of Tecnico, where we can have a list like bundlecategory, brand etc, where u can find on popover and if not exist just create the role
- See on tecnicos ordenes asignadas for them just like we see orders for electrodomesticos

## 5. Garantías
- Section called ordenes/garantias
- Fields: garantia start, garantia end
- SetGarantia function:
  - Set months (auto calculates end date)
  - Unlimited option (endDate = null, garantia_ilimitada = true)
- Print guarantee Time on nota de entrega
- Admin only feature

## 6. Configuración
- Config of NotadeEntrega, config of Orden de servicio panel where they can change the info that will be rendered
- When clicking on nota de entrega part, set concepto with unlimited space field (conceptoEntrega)
- ConceptoOrden format:
  - Header (subrayado)
  - Text with namespace support
  - JSON-B storage

## 7. UI/UX
- Render on page the createdBy and updatedby
- Agregar filtros tipo calendario como el que tenia yo de ff, filtros etc