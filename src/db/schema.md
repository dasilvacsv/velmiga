### **Diagrama de Entidad-Relación (ERD) para el SGL**

Este modelo se centra en las entidades principales descritas en el PRD, asegurando que el sistema pueda manejar casos, clientes, usuarios, tareas, documentos y eventos del calendario de manera integrada.

#### **Entidades y Atributos Principales**

Aquí se describen las "tablas" principales de la base de datos. `PK` denota Clave Primaria y `FK` denota Clave Foránea.

**1. `Usuarios`**
Almacena la información de todos los usuarios del sistema, ya sean abogados, socios o administradores.
* `ID_Usuario` (PK) - Identificador único del usuario.
* `Nombre` - Nombre del usuario.
* `Apellido` - Apellido del usuario.
* `Email` - Correo electrónico para inicio de sesión y notificaciones.
* `Contraseña` - Hash de la contraseña.
* `ID_Rol` (FK) - Enlaza con la tabla `Roles` para definir permisos.
* `FechaCreacion`

**2. `Roles`**
Define los diferentes roles dentro del sistema para gestionar permisos.
* `ID_Rol` (PK) - Identificador único del rol.
* `NombreRol` - (Ej: "Socio / Director", "Abogado", "Asistente Legal").
* `DescripcionPermisos` - Descripción de lo que el rol puede hacer.

**3. `Clientes`**
Contiene la información de los clientes del despacho jurídico.
* `ID_Cliente` (PK) - Identificador único del cliente.
* `NombreCompleto` o `RazonSocial` - Nombre si es persona natural o razón social si es empresa.
* `TipoCliente` - (Ej: "Persona Natural", "Empresa").
* `DocumentoIdentidad` - (Cédula, RIF, etc.).
* `Email`
* `Telefono`
* `Direccion`

**4. `Casos`**
Es la entidad central que agrupa toda la información de un expediente legal.
* `ID_Caso` (PK) - Identificador único del caso (o número de expediente).
* `NombreCaso` - Un título descriptivo para el caso.
* `Descripcion` - Detalles y resumen del caso.
* `FechaApertura` - Cuándo se inició el caso.
* `FechaCierre` - Cuándo se cerró el caso (puede ser nulo).
* `Estado` - (Ej: "Activo", "Cerrado", "En Espera", "Archivado").
* `ID_Cliente` (FK) - Enlaza con el cliente al que pertenece el caso.

**5. `Tareas`**
Gestiona las actividades y pendientes asociados a un caso.
* `ID_Tarea` (PK) - Identificador único de la tarea.
* `Descripcion` - Qué se debe hacer en la tarea.
* `FechaVencimiento` - Fecha límite para completar la tarea.
* `Prioridad` - (Ej: "Alta", "Media", "Baja").
* `Estado` - (Ej: "Pendiente", "En Progreso", "Completada").
* `ID_Caso` (FK) - Enlaza con el caso al que pertenece la tarea.
* `ID_UsuarioAsignado` (FK) - Enlaza con el usuario responsable de la tarea.

**6. `Documentos`**
Almacena la referencia a los archivos y documentos de un caso.
* `ID_Documento` (PK) - Identificador único del documento.
* `NombreArchivo` - Nombre del archivo.
* `TipoArchivo` - (Ej: "PDF", "Word", "Imagen").
* `RutaAlmacenamiento` - URL o ruta en el servidor donde se guarda el archivo.
* `FechaCarga`
* `ID_Caso` (FK) - Enlaza con el caso al que pertenece el documento.
* `ID_UsuarioCarga` (FK) - Enlaza con el usuario que subió el documento.
* `ID_PlantillaOrigen` (FK, puede ser nulo) - Si el documento se generó desde una plantilla.

**7. `Plantillas`**
Contiene las plantillas de documentos estandarizados.
* `ID_Plantilla` (PK) - Identificador único de la plantilla.
* `NombrePlantilla` - Título de la plantilla (Ej: "Contrato de Servicios").
* `Contenido` - El cuerpo de la plantilla con campos dinámicos (Ej: `${cliente.nombre}`).
* `FechaCreacion`

**8. `EventosCalendario`**
Registra todas las citas, audiencias y fechas importantes.
* `ID_Evento` (PK) - Identificador único del evento.
* `Titulo` - Título del evento (Ej: "Audiencia Preliminar vs. Compañía X").
* `Descripcion` - Detalles adicionales del evento.
* `FechaInicio`
* `FechaFin`
* `TipoEvento` - (Ej: "Audiencia", "Cita con Cliente", "Vencimiento Legal").
* `ID_Caso` (FK) - Enlaza con el caso relacionado (si aplica).

**9. `Caso_Usuarios` (Tabla de Unión)**
Esta tabla es fundamental para manejar equipos de trabajo, ya que permite que **múltiples usuarios** trabajen en **múltiples casos**.
* `ID_Caso` (PK, FK) - Enlaza con la tabla `Casos`.
* `ID_Usuario` (PK, FK) - Enlaza con la tabla `Usuarios`.
* `RolEnCaso` - (Ej: "Abogado Principal", "Asistente", "Consultor").

---

#### **Relaciones y Cardinalidad**

* **Usuarios y Roles**: Un `Rol` puede tener muchos `Usuarios`, pero un `Usuario` tiene un solo `Rol`. (1:N)
* **Clientes y Casos**: Un `Cliente` puede tener muchos `Casos`, pero un `Caso` pertenece a un solo `Cliente`. (1:N)
* **Casos y Usuarios (Equipo Legal)**: Se utiliza la tabla de unión `Caso_Usuarios`. Un `Caso` puede tener muchos `Usuarios` (abogados) asignados, y un `Usuario` puede trabajar en muchos `Casos`. (N:M)
* **Casos y Tareas**: Un `Caso` puede tener múltiples `Tareas`, pero cada `Tarea` está asociada a un solo `Caso`. (1:N)
* **Usuarios y Tareas**: Un `Usuario` puede tener muchas `Tareas` asignadas, pero una `Tarea` se asigna a un solo `Usuario`. (1:N)
* **Casos y Documentos**: Un `Caso` puede tener muchos `Documentos`, pero un `Documento` pertenece a un solo `Caso`. (1:N)
* **Casos y EventosCalendario**: Un `Caso` puede tener muchos `Eventos`, pero un `Evento` está vinculado a un solo `Caso`. (1:N)
* **Plantillas y Documentos**: Una `Plantilla` puede ser el origen de muchos `Documentos`. Un `Documento` puede ser generado a partir de una (o ninguna) `Plantilla`. (1:N)

Este modelo de datos proporciona una base sólida y escalable para construir todas las funcionalidades descritas en el PRD, desde la gestión de casos y tareas hasta la generación de reportes y la automatización de documentos.