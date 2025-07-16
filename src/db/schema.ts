// Archivo: src/schema.ts

import {
  varchar, uuid, text, pgTable, date, pgEnum, timestamp,
  boolean, decimal, integer, unique
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- ENUMS for Vilmega Management System ---

// Corresponds to 'Autenticación y Roles: Sistema de inicio de sesión seguro con tres niveles de permisos (Administrador, Coordinador/Ejecutivo, Abogado).'
export const VILMEGA_ROLE_ENUM = pgEnum("vilmega_role", ["ADMINISTRATOR", "COORDINATOR", "LAWYER"]);

// Expedientes can be 'En atención', 'En trámite', or 'Cancelados'.
// 'Cerrado' is a common final status for cases, which can be inferred.
export const EXPEDIENTE_STATUS_ENUM = pgEnum("expediente_status", ["EN_ATENCION", "EN_TRAMITE", "CANCELADO", "CERRADO"]);

// 'Clasificación es Gestoría?' implies a classification type.
// 'Tiene una clasificación legal.' implies a legal classification.
export const CLASSIFICATION_TYPE_ENUM = pgEnum("classification_type", ["LEGAL", "GESTORIA"]);

// 'Conductor está 'Detenido'?' or 'Liberado'
export const CONDUCTOR_STATUS_ENUM = pgEnum("conductor_status", ["DETENIDO", "LIBERADO"]);

// 'Vehículo está 'Detenido'?' or 'Liberado'
export const VEHICLE_STATUS_ENUM = pgEnum("vehicle_status", ["DETENIDO", "LIBERADO"]);

// Payment statuses from 'Nómina de Abogados' ("Pagado")
// and 'Nómina de Clientes' ("Se solicita pago", "Facturado", "Pagado parcial", "Pagado").
export const PAYMENT_STATUS_ENUM = pgEnum("payment_status", ["SOLICITADO", "PAGADO_PARCIAL", "PAGADO", "FACTURADO"]);

// 'Forma de pago' for clients.
export const PAYMENT_METHOD_ENUM = pgEnum("payment_method", ["TRANSFERENCIA", "CHEQUE", "EFECTIVO", "OTRO"]); // Example, not explicitly in PRD

// --- TABLES ---

/**
 * Users Table: Stores user accounts for Administrators, Coordinators, and Lawyers.
 * Defined by 'Autenticación y Roles'.
 */
export const users = pgTable("users", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // Passwords stored securely (hashed)
  role: VILMEGA_ROLE_ENUM("role").notNull(),
  isActive: boolean("is_active").default(true).notNull(), // Common practice for user management
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Clients Table: Stores information about Vilmega's clients.
 * Managed in 'Módulo de Administración -> Perfiles -> Clientes'.
 */
export const clients = pgTable("clients", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  businessName: varchar("business_name", { length: 255 }), // Razón social
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }), // Assumed contact info
  address: text("address"), // Assumed contact info
  paymentMethod: PAYMENT_METHOD_ENUM("payment_method"), // Forma de pago
  feeSchedule: text("fee_schedule"), // Tabuladores de honorarios
  vehicleDatabaseRef: text("vehicle_database_ref"), // Bases de datos de vehículos
  billingCutoffDate: date("billing_cutoff_date"), // Genera recordatorios en las fechas de corte de cada cliente
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Lawyers Table: Stores information about lawyers/providers.
 * Managed in 'Módulo de Administración -> Perfiles -> Abogados/Proveedores'.
 */
export const lawyers = pgTable("lawyers", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  contactInfo: text("contact_info"), // Datos de contacto
  fiscalInfo: text("fiscal_info"), // Datos fiscales
  bankInfo: text("bank_info"), // Datos bancarios
  documentsInfo: text("documents_info"), // Documents (simple text field for references)
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Internal Personnel Table: Stores information about Vilmega's internal staff.
 * Managed in 'Módulo de Administración -> Perfiles -> Personal Interno'.
 */
export const internalPersonnel = pgTable("internal_personnel", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'set null' }).unique(), // Links to user account for system roles
  firstName: varchar("first_name", { length: 255 }).notNull(), // Datos personales
  lastName: varchar("last_name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }), // Puesto
  salary: decimal("salary", { precision: 10, scale: 2 }), // Salario
  bonuses: decimal("bonuses", { precision: 10, scale: 2 }), // Bonos
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Cases/Expedientes Table: The core entity for managing claims/files.
 * Creation and initial management is done in 'Módulo: Cabina'.
 */
export const expedientes = pgTable("expedientes", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  expedienteNumber: varchar("expediente_number", { length: 100 }).notNull(), // 'se genera un número de expediente consecutivo (e.g., 0001/2025).'
  clientId: uuid("client_id").references(() => clients.id, { onDelete: 'restrict' }).notNull(),
  lawyerId: uuid("lawyer_id").references(() => lawyers.id, { onDelete: 'set null' }), // Abogado asignado
  coordinatorId: uuid("coordinator_id").references(() => users.id, { onDelete: 'restrict' }).notNull(), // The user who registered it
  status: EXPEDIENTE_STATUS_ENUM("status").default("EN_ATENCION").notNull(), // 'El estatus por defecto es "En atención".'
  classificationType: CLASSIFICATION_TYPE_ENUM("classification_type"), // 'Clasificación es 'Gestoría'?' or 'Tiene una clasificación legal.'
  gestionType: varchar("gestion_type", { length: 255 }), // 'Habilita campo Tipo de Gestoria'
  driverName: varchar("driver_name", { length: 255 }), // Llena Datos del Conductor
  driverStatus: CONDUCTOR_STATUS_ENUM("driver_status"),
  detentionDateTime: timestamp("detention_date_time", { withTimezone: true }), // 'Muestra campos de fecha/hora de detención'
  releaseDateTime: timestamp("release_date_time", { withTimezone: true }), // 'Muestra campos de fecha/hora de liberación'
  vehicleStatus: VEHICLE_STATUS_ENUM("vehicle_status"),
  vehicleDetentionDate: date("vehicle_detention_date"), // 'Muestra campo de fecha de detención'
  vehicleReleaseDate: date("vehicle_release_date"), // 'Muestra campo de fecha de liberación'
  oficioAttachmentRequired: boolean("oficio_attachment_required").default(false), // 'Habilita campo para adjuntar oficio'
  adjusterName: varchar("adjuster_name", { length: 255 }), // 'Llena Datos del Ajustador'
  description: text("description"), // 'Completa Descripción'
  location: varchar("location", { length: 255 }), // 'Ubicación'
  assignmentType: varchar("assignment_type", { length: 255 }), // 'Selecciona Tipo de Asignación' - Could be an ENUM/lookup table defined in system settings
  reportTime: timestamp("report_time", { withTimezone: true }).defaultNow().notNull(), // 'Hora de reporte'
  assignmentTime: timestamp("assignment_time", { withTimezone: true }), // 'Hora de asignación'
  contactTime: timestamp("contact_time", { withTimezone: true }), // 'Hora de contacto'
  municipality: varchar("municipality", { length: 255 }), // 'Municipio'
  state: varchar("state", { length: 255 }), // 'Estado'
  timeInCabinaSeconds: integer("time_in_cabina_seconds"), // 'mide el tiempo que un expediente pasa en cabina.'
  transitionToTramiteDateTime: timestamp("transition_to_tramite_date_time", { withTimezone: true }), // 'Al cambiar a "Trámite", se registra la fecha y hora del cambio.'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    expedienteNumberUnique: unique("expediente_number_unique").on(table.expedienteNumber),
  };
});


/**
 * Bitacora Entries Table: Logs comments and costs related to case follow-up.
 * Managed in 'Módulo: Cabina -> Pestaña: Seguimiento -> Bitácora'.
 */
export const bitacoraEntries = pgTable("bitacora_entries", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  expedienteId: uuid("expediente_id").references(() => expedientes.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'restrict' }).notNull(), // 'Cada entrada registra automáticamente: usuario, perfil, fecha y hora.'
  comment: text("comment").notNull(), // Comentario
  recordedCost: decimal("recorded_cost", { precision: 10, scale: 2 }), // 'se puede registrar un costo asociado (audiencia, viáticos, etc.)'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // 'Cada entrada registra automáticamente: fecha y hora.'
});

/**
 * Document Types Table: Configurable types for documents.
 * 'Un combo permite clasificar el documento (Parte de accidente, oficio de liberación, etc.).'.
 */
export const documentTypes = pgTable("document_types", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  typeName: varchar("type_name", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Documents Table: Stores metadata for uploaded files.
 * Managed in 'Módulo: Cabina -> Pestaña: Seguimiento -> Documentos'.
 */
export const documents = pgTable("documents", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  expedienteId: uuid("expediente_id").references(() => expedientes.id, { onDelete: 'cascade' }).notNull(),
  documentTypeId: uuid("document_type_id").references(() => documentTypes.id, { onDelete: 'restrict' }).notNull(), // Clasificación del documento
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path").notNull(), // 'Permite cargar archivos de cualquier tipo (PDF, JPG, XML, etc.).' (This is the storage location)
  uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, { onDelete: 'restrict' }).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Third Parties Table: Stores information on third parties involved in an expediente.
 * Managed in 'Módulo: Cabina -> Pestaña: Seguimiento -> Datos Adicionales -> información de terceros'.
 */
export const thirdParties = pgTable("third_parties", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  expedienteId: uuid("expediente_id").references(() => expedientes.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Assumed fields for third party
  contactInfo: text("contact_info"), // Assumed fields for third party
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Workshops Table: Stores information on workshops involved in an expediente.
 * Managed in 'Módulo: Cabina -> Pestaña: Seguimiento -> Datos Adicionales -> taller'.
 */
export const workshops = pgTable("workshops", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  expedienteId: uuid("expediente_id").references(() => expedientes.id, { onDelete: 'cascade' }).notNull(),
  name: varchar("name", { length: 255 }).notNull(), // Assumed fields for workshop
  contactInfo: text("contact_info"), // Assumed fields for workshop
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Lawyer Payments Table: Tracks payments requested for lawyers.
 * Managed in 'Módulo: Administración -> Nómina -> Nómina de Abogados'.
 */
export const lawyerPayments = pgTable("lawyer_payments", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  expedienteId: uuid("expediente_id").references(() => expedientes.id, { onDelete: 'cascade' }).notNull(),
  lawyerId: uuid("lawyer_id").references(() => lawyers.id, { onDelete: 'restrict' }).notNull(),
  amountRequested: decimal("amount_requested", { precision: 10, scale: 2 }).notNull(), // 'registrar un costo asociado (audiencia, viáticos, etc.), que se enviará a administración.'
  paymentStatus: PAYMENT_STATUS_ENUM("payment_status").default("SOLICITADO").notNull(), // 'Un botón de "Pagado" actualiza el estatus'
  paymentDate: timestamp("payment_date", { withTimezone: true }),
  requestedByUserId: uuid("requested_by_user_id").references(() => users.id, { onDelete: 'restrict' }).notNull(), // 'Solicitar pagos para abogados.'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Client Billing Table: Manages invoicing and payments from clients.
 * Managed in 'Módulo: Administración -> Nómina -> Nómina de Clientes'.
 */
export const clientBilling = pgTable("client_billing", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  expedienteId: uuid("expediente_id").references(() => expedientes.id, { onDelete: 'cascade' }).notNull(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: 'restrict' }).notNull(),
  amountDue: decimal("amount_due", { precision: 10, scale: 2 }).notNull(), // Amount to bill
  billingStatus: PAYMENT_STATUS_ENUM("billing_status").default("SOLICITADO").notNull(), // 'Se solicita pago", "Facturado", "Pagado parcial", "Pagado".'
  invoiceNumber: varchar("invoice_number", { length: 255 }), // 'Al marcar como "Facturado", se solicitan los datos de la factura.'
  invoiceDate: date("invoice_date"),
  paymentDate: timestamp("payment_date", { withTimezone: true }),
  partialPaymentAmount: decimal("partial_payment_amount", { precision: 10, scale: 2 }), // For 'Pagado parcial' status
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * System Settings Table: Stores configurable options like "Combos" and view configurations.
 * Managed in 'Módulo: Administración -> Ajustes'.
 */
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  settingKey: varchar("setting_key", { length: 255 }).notNull().unique(), // 'Permite al administrador agregar o quitar opciones de las listas desplegables (combos)'
  settingValue: text("setting_value"), // Store as JSON string (e.g., for array of combo options)
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Coordinator View Configurations: Defines what expedientes each coordinator can access.
 * Managed in 'Módulo: Administración -> Ajustes -> Configuración de Vistas'.
 */
export const coordinatorViewConfigurations = pgTable("coordinator_view_configurations", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  coordinatorUserId: uuid("coordinator_user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  filterType: varchar("filter_type", { length: 100 }).notNull(), // e.g., 'por cliente', 'por estado', 'por abogado'
  filterValue: varchar("filter_value", { length: 255 }).notNull(), // The ID or name of the entity to filter by
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
  return {
    // Ensures unique configuration for a specific coordinator and filter type/value combination
    uniqueConfig: unique("coordinator_filter_unique").on(table.coordinatorUserId, table.filterType, table.filterValue),
  };
});

/**
 * Expediente Reminders / Notifications: For programmed follow-ups.
 * Managed in 'Módulo: Mis Expedientes -> Notificaciones de Seguimiento'.
 */
export const expedienteReminders = pgTable("expediente_reminders", {
  id: uuid("id").notNull().primaryKey().defaultRandom(),
  expedienteId: uuid("expediente_id").references(() => expedientes.id, { onDelete: 'cascade' }).notNull(),
  reminderDate: date("reminder_date").notNull(), // 'notifica los seguimientos programados para el día.'
  description: text("description"), // Description of the reminder
  isDismissed: boolean("is_dismissed").default(false).notNull(), // 'Al agregar una bitácora, la notificación se elimina.'
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: 'restrict' }).notNull(), // User who set the reminder
});

// --- RELATIONS ---

export const usersRelations = relations(users, ({ one, many }) => ({
  // A user can be the coordinator who registered many expedientes
  registeredExpedientes: many(expedientes, { relationName: 'registeredByCoordinator' }),
  // A user can make many bitacora entries
  bitacoraEntries: many(bitacoraEntries),
  // A user can upload many documents
  uploadedDocuments: many(documents),
  // A user can request many lawyer payments
  requestedLawyerPayments: many(lawyerPayments),
  // A user might be linked to an internal personnel profile
  internalPersonnelProfile: one(internalPersonnel, {
    fields: [users.id],
    references: [internalPersonnel.userId],
  }),
  // A user (Administrator) can set up many coordinator view configurations
  coordinatorViewConfigurations: many(coordinatorViewConfigurations),
  // A user can create many expediente reminders
  createdExpedienteReminders: many(expedienteReminders),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  // A client can have many expedientes
  expedientes: many(expedientes),
  // A client can have many billing entries
  clientBillingEntries: many(clientBilling),
}));

export const lawyersRelations = relations(lawyers, ({ many }) => ({
  // A lawyer can be assigned to many expedientes
  assignedExpedientes: many(expedientes),
  // A lawyer can have many payment requests
  lawyerPaymentEntries: many(lawyerPayments),
}));

export const internalPersonnelRelations = relations(internalPersonnel, ({ one }) => ({
  // An internal personnel record belongs to one user account
  userAccount: one(users, {
    fields: [internalPersonnel.userId],
    references: [users.id],
  }),
}));

export const expedientesRelations = relations(expedientes, ({ one, many }) => ({
  // An expediente belongs to one client
  client: one(clients, {
    fields: [expedientes.clientId],
    references: [clients.id],
  }),
  // An expediente can be assigned to one lawyer
  assignedLawyer: one(lawyers, {
    fields: [expedientes.lawyerId],
    references: [lawyers.id],
  }),
  // An expediente is registered by one coordinator
  registeredByCoordinator: one(users, {
    fields: [expedientes.coordinatorId],
    references: [users.id],
    relationName: 'registeredByCoordinator'
  }),
  // An expediente can have many bitacora entries
  bitacoraEntries: many(bitacoraEntries),
  // An expediente can have many documents
  documents: many(documents),
  // An expediente can have many third parties
  thirdParties: many(thirdParties),
  // An expediente can have many workshops
  workshops: many(workshops),
  // An expediente can have many lawyer payment requests
  lawyerPayments: many(lawyerPayments),
  // An expediente can have many client billing entries
  clientBillingEntries: many(clientBilling),
  // An expediente can have many reminders
  reminders: many(expedienteReminders),
}));

export const bitacoraEntriesRelations = relations(bitacoraEntries, ({ one }) => ({
  // A bitacora entry belongs to one expediente
  expediente: one(expedientes, {
    fields: [bitacoraEntries.expedienteId],
    references: [expedientes.id],
  }),
  // A bitacora entry is made by one user
  user: one(users, {
    fields: [bitacoraEntries.userId],
    references: [users.id],
  }),
}));

export const documentTypesRelations = relations(documentTypes, ({ many }) => ({
  // A document type can be used by many documents
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  // A document belongs to one expediente
  expediente: one(expedientes, {
    fields: [documents.expedienteId],
    references: [expedientes.id],
  }),
  // A document has one document type
  documentType: one(documentTypes, {
    fields: [documents.documentTypeId],
    references: [documentTypes.id],
  }),
  // A document is uploaded by one user
  uploadedByUser: one(users, {
    fields: [documents.uploadedByUserId],
    references: [users.id],
  }),
}));

export const thirdPartiesRelations = relations(thirdParties, ({ one }) => ({
  // A third party record belongs to one expediente
  expediente: one(expedientes, {
    fields: [thirdParties.expedienteId],
    references: [expedientes.id],
  }),
}));

export const workshopsRelations = relations(workshops, ({ one }) => ({
  // A workshop record belongs to one expediente
  expediente: one(expedientes, {
    fields: [workshops.expedienteId],
    references: [expedientes.id],
  }),
}));

export const lawyerPaymentsRelations = relations(lawyerPayments, ({ one }) => ({
  // A lawyer payment entry belongs to one expediente
  expediente: one(expedientes, {
    fields: [lawyerPayments.expedienteId],
    references: [expedientes.id],
  }),
  // A lawyer payment entry is for one lawyer
  lawyer: one(lawyers, {
    fields: [lawyerPayments.lawyerId],
    references: [lawyers.id],
  }),
  // A lawyer payment entry is requested by one user
  requestedByUser: one(users, {
    fields: [lawyerPayments.requestedByUserId],
    references: [users.id],
  }),
}));

export const clientBillingRelations = relations(clientBilling, ({ one }) => ({
  // A client billing entry belongs to one expediente
  expediente: one(expedientes, {
    fields: [clientBilling.expedienteId],
    references: [expedientes.id],
  }),
  // A client billing entry is for one client
  client: one(clients, {
    fields: [clientBilling.clientId],
    references: [clients.id],
  }),
}));

export const coordinatorViewConfigurationsRelations = relations(coordinatorViewConfigurations, ({ one }) => ({
  // A coordinator view configuration belongs to one coordinator user
  coordinatorUser: one(users, {
    fields: [coordinatorViewConfigurations.coordinatorUserId],
    references: [users.id],
  }),
}));

export const expedienteRemindersRelations = relations(expedienteReminders, ({ one }) => ({
  // An expediente reminder belongs to one expediente
  expediente: one(expedientes, {
    fields: [expedienteReminders.expedienteId],
    references: [expedientes.id],
  }),
  // An expediente reminder is created by one user
  createdByUser: one(users, {
    fields: [expedienteReminders.createdByUserId],
    references: [users.id],
  }),
}));