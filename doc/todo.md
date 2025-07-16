

## `[P0 - CRÍTICO]` Tareas Inmediatas para la Versión del Lunes

Estos son los elementos indispensables para que el cliente pueda empezar a trabajar y migrar desde Excel.

### 1. Re-diseño de la Vista Principal del Caso
El diseño actual requiere demasiado scroll. Se debe implementar una vista tipo "dashboard", posiblemente en dos columnas, que muestre la información más crítica sin necesidad de desplazarse.

- **Información Fundamental (Visible al instante):**
    - `[ ]` **ID del Caso** (`Número de Proceso`).
    - `[ ]` **Autoridades Competentes**.
    - `[ ]` **Estado Interno** (El estado personalizado del despacho, ej: "Sacar copias").
    - `[ ]` **Estado del Caso** (El estado oficial en el juzgado).
    - `[ ]` **Tareas Pendientes** (Un resumen o listado rápido de las tareas activas para ese caso).
    - `[ ]` **Partes Involucradas** (Nombres del actor y demandado principal).

### 2. Módulo de Tareas Simplificado
El cliente rechazó la idea de un Kanban complejo. Necesita un sistema de tareas simple pero potente basado en una tabla filtrable.

- **Creación de Tarea (Campos Requeridos):**
    - `[ ]` Caso asociado.
    - `[ ]` Fecha de Asignación (automática).
    - `[ ]` Fecha de Vencimiento.
    - `[ ]` Persona Asignada (seleccionar de una lista de usuarios).
    - `[ ]` Espacio para la descripción de la tarea.

- **Estados de la Tarea (Flujo Específico):**
    - `[ ]` Implementar los siguientes 3 estados:
        1.  **Activo** (Estado por defecto al crear/asignar).
        2.  **En Revisión** (La tarea fue completada por el asignado, pero espera aprobación).
        3.  **Aprobada** (La tarea fue revisada y aceptada).

- **Funcionalidad de Comentarios en Tareas:**
    - `[ ]` Permitir agregar múltiples comentarios a una tarea.
    - `[ ]` Cada comentario debe registrar automáticamente: **quién** lo hizo, la **fecha** y la **hora**.

- **Filtros y Reportes de Tareas:**
    - `[ ]` La vista principal de tareas debe ser una tabla con capacidades de filtrado avanzadas (similar a una tabla dinámica).
    - `[ ]` Permitir filtrar por: `Persona Asignada`, `Estado`, `Caso`, `Fecha de Vencimiento`, etc.
    - `[ ]` Permitir combinar filtros (ej: Tareas de 'Ari Jaramillo' que estén 'En Revisión').
    - `[ ]` **Esencial:** Añadir una función para **exportar la vista filtrada a un reporte** (ej: Excel/PDF).

### 3. Gestión de Partes del Caso (Activa y Pasiva)
Es crucial poder registrar a todas las personas involucradas en un caso, no solo al cliente principal.

- **Funcionalidad "Gestionar Partes":**
    - `[ ]` Dentro de un caso, crear una sección para añadir/gestionar `Parte Activa` y `Parte Demandada`.
    - `[ ]` Permitir añadir **múltiples personas** a cada categoría.

- **Campos Requeridos por Persona:**
    - `[ ]` Nombre (campo separado).
    - `[ ]` Apellido (campo separado para poder filtrar).
    - `[ ]` **Cédula** (campo de texto, muy importante).
    - `[ ]` Número de Teléfono (debe ser click-to-call en la UI).
    - `[ ]` Correo Electrónico.

- **Campo "Bienes" / "Medidas":**
    - `[ ]` Añadir un campo para las partes (especialmente demandados) llamado `Bienes`.
    - `[ ]` Debe ser una opción **Sí/No**.
    - `[ ]` Si la respuesta es "Sí", debe habilitarse un campo de texto para **comentarios** donde se describa el bien y su ubicación.

---

## `[P1 - ALTO]` Branding y Configuración General

Estos cambios son necesarios para alinear el sistema con la identidad del cliente.

- **Branding:**
    - `[ ]` Cambiar el nombre del sistema de "Case Tracking" a **"Vilmega"**.
    - `[ ]` Reemplazar el logo actual con el que proveerá el cliente.
    - `[ ]` **Aplicar la paleta de colores enviada por el cliente** (tonos verde oliva, dorados, blancos). El naranja y negro actual debe ser eliminado.
    - `[ ]` Cambiar la fuente de los títulos/encabezados a **"Raleway"**. Mantener una fuente de alta legibilidad (como Arial) para el cuerpo del texto y los datos.

- **Acceso para el Cliente:**
    - `[ ]` Enviar el link de acceso al sistema actual para que el cliente pueda explorarlo y dar feedback previo a la reunión del sábado.

---

## `[P2 - MEDIO]` Mejoras y Preparación para el Futuro

Tareas importantes pero que pueden ajustarse después de la entrega inicial del lunes.

### 1. Módulo de Plantillas de Documentos
El módulo está avanzado pero necesita una adición clave.

- **Variables:**
    - `[ ]` Asegurarse de que **TODOS los campos del Excel** y los nuevos campos (datos de las partes activas/pasivas) estén disponibles como **variables seleccionables** en el editor de plantillas. Esto incluye:
        - `Número de Proceso`
        - `Autoridades`
        - `Cédula` (de todas las partes)
        - `Nombre Completo` (de todas las partes)
        - etc.

### 2. Importación de Datos / Migración desde Excel
El cliente no puede subir 300 casos manualmente. Es un punto crítico de fricción.

- **Investigación y Plan de Acción:**
    - `[ ]` Analizar la viabilidad de un **importador masivo vía archivo Excel/CSV**.
    - `[ ]` **Como Mínimo Viable (MVP):** Diseñar una estructura de datos y una interfaz que facilite el **copiado y pegado** desde una hoja de cálculo estructurada para crear registros rápidamente (ej: crear un cliente, luego un caso, etc.).
    - `[ ]` Definir y entregar al cliente una **plantilla de Excel** con la estructura exacta que el sistema necesitará, para que ella pueda empezar a organizar su información.

### 3. Timeline de Actualizaciones del Caso
- `[ ]` En la vista principal del caso, mostrar una línea de tiempo de actualizaciones.
- `[ ]` Por defecto, mostrar solo las **últimas 2 o 3 actualizaciones** para no ocupar espacio.
- `[ ]` Incluir un botón o enlace de "Ver historial completo".

---

## `[DEFERIDO]` Tareas para Fase 2 (Post-Lanzamiento)

Estas funcionalidades se discutieron pero se acordó posponerlas para no retrasar el lanzamiento inicial.

- `[ ]` **Módulo de Flujos de Trabajo (`Workflows`):**
    - El cliente no entiende su utilidad en este momento.
    - **Acción:** Mantener el código base pero **ocultar la funcionalidad de la interfaz de usuario**. Se re-evaluará en una segunda fase.

- `[ ]` **Notificaciones por WhatsApp:**
    - Se considera una funcionalidad valiosa pero fuera del alcance del proyecto actual.
    - **Acción:** Se tratará como una **cotización aparte** en el futuro.