import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { users, clients, cases, tasks, casesToUsers, templates, documents, calendarEvents, news, movements, casePartes, taskComments } from '@/db/schema';

// Inferred types from schema
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Client = InferSelectModel<typeof clients>;
export type NewClient = InferInsertModel<typeof clients>;

export type Case = InferSelectModel<typeof cases>;
export type NewCase = InferInsertModel<typeof cases>;

export type Task = InferSelectModel<typeof tasks>;
export type NewTask = InferInsertModel<typeof tasks>;

export type Template = InferSelectModel<typeof templates>;
export type NewTemplate = InferInsertModel<typeof templates>;

export type Document = InferSelectModel<typeof documents>;
export type NewDocument = InferInsertModel<typeof documents>;

export interface CalendarEvent {
  id: string;
  caseId?: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  type: 'AUDIENCIA' | 'CITA_CON_CLIENTE' | 'VENCIMIENTO_LEGAL' | 'REUNION_INTERNA' | string;
  googleEventId?: string;
  emailNotification: boolean;
  notificationSent: boolean;
  createdAt?: Date;
  createdBy?: string;
}
export type NewCalendarEvent = InferInsertModel<typeof calendarEvents>;

export type CaseTeamMember = InferSelectModel<typeof casesToUsers>;
export type NewCaseTeamMember = InferInsertModel<typeof casesToUsers>;

export type CaseParte = InferSelectModel<typeof casePartes>;
export type NewCaseParte = InferInsertModel<typeof casePartes>;

export type TaskComment = InferSelectModel<typeof taskComments>;
export type NewTaskComment = InferInsertModel<typeof taskComments>;

// New types for novedades and movimientos
export type News = InferSelectModel<typeof news>;
export type NewNews = InferInsertModel<typeof news>;

export type Movement = InferSelectModel<typeof movements>;
export type NewMovement = InferInsertModel<typeof movements>;

// Extended types with relations
export type CaseWithRelations = Case & {
  client?: Client & {
    city?: { name: string };
    zone?: { name: string };
  };
  teamMembers?: (CaseTeamMember & { user?: User })[];
  tasks?: (Task & { assignedTo?: User })[];
  documents?: Document[];
  calendarEvents?: CalendarEvent[];
  partes?: CaseParte[];
  
  // MOVIMIENTOS AGREGADOS
  movements?: (Movement & { 
    createdByUser?: User 
  })[];
  
  // EVENTOS PRÓXIMOS AGREGADOS
  upcomingEvents?: CalendarEvent[]; 

  // CAMBIO: Agregar historial de estado interno
  internalStatusHistory?: any[];
};

export type ClientWithStats = Client & {
  _count?: {
    cases: number;
    activeCases: number;
  };
};

export type TaskWithRelations = Task & {
  case?: Case;
  assignedTo?: User;
  createdByUser?: User;
  comments?: (TaskComment & { createdByUser?: User })[];
};

// News with relations
export type NewsWithRelations = News & {
  createdByUser?: User;
  updatedByUser?: User;
};

// Movement with relations - TIPO MEJORADO
export type MovementWithUser = Movement & {
  createdByUser?: User;
};

// Calendar Event with relations - TIPO MEJORADO
export type CalendarEventWithUser = CalendarEvent & {
  case?: Case;
  createdByUser?: User;
};

// Updated TemplateVariable type with more comprehensive fields
export type TemplateVariable = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  source: 'client' | 'case' | 'user' | 'custom' | 'parte';
  description?: string;
  required?: boolean;
  category?: string;
  group?: string;
};

export type ProcessedTemplate = {
  content: string;
  variables: TemplateVariable[];
};

// Template variable groups for better organization
export type TemplateVariableGroup = {
  name: string;
  label: string;
  description: string;
  variables: TemplateVariable[];
  icon?: string;
  color?: string;
};

// Enhanced template processing options
export type TemplateProcessingOptions = {
  caseId?: string;
  clientId?: string;
  userId?: string;
  customVariables?: Record<string, any>;
  dateFormat?: 'short' | 'long' | 'full';
  includeTime?: boolean;
};

// Dashboard stats type
export type DashboardStats = {
  totalCases: number;
  activeCases: number;
  pendingTasks: number;
  upcomingEvents: number;
  recentActivities: Array<{
    id: string;
    type: 'case' | 'task' | 'event';
    title: string;
    description: string;
    timestamp: Date;
  }>;
};

// News stats type
export type NewsStats = {
  total: number;
  active: number;
  inactive: number;
  published: number;
  drafts: number;
  thisMonth: number;
};

// Movement stats type - TIPO MEJORADO
export type MovementStats = {
  total: number;
  caseCreated: number;
  caseUpdated: number;
  caseClosed: number;
  taskAssigned: number;
  taskCreated: number;
  taskStatusUpdated: number;  // NUEVO TIPO DE MOVIMIENTO
  taskCommentAdded: number;
  documentUploaded: number;
  clientAdded: number;
  userAssigned: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  // NUEVOS TIPOS DE MOVIMIENTOS
  caseStatusChanged: number;
  caseOfficialStatusChanged: number;
  caseInternalStatusChanged: number;
  eventCreated: number;
};

// Task Export Data type
export type TaskExportData = {
  id: string;
  caso: string;
  codigo: string;
  parteActiva: string;
  parteDemandada: string;
  estadoOficial: string;
  estadoInterno: string;
  tarea: string;
  asignadoA: string;
  prioridad: string;
  fechaAsignacion: string;
  fechaVencimiento: string;
  estado: string;
};

// CAMBIO: Case Report Data type updated with internal status date/time
export type CaseReportData = {
  id: string; // Se mantiene el ID para usos internos como la key en React
  
  // --- CAMBIO: Se agrega 'caseNumber' para el "N° de Proceso" ---
  caseNumber: string;

  caso: string;
  codigoInterno: string;
  parteActiva: string;
  parteDemandada: string;
  estadoOficial: string;
  estadoInterno: string;
  fechaHoraEstadoInterno: string; // CAMBIO: Agregar fecha/hora del estado interno
  cliente: string;
  fechaApertura: string;
  fechaCierre: string;
  descripcion: string;
  autoridades: string;
  equipoLegal: string;
  tareasActivas: number;
  totalTareas: number;
  tareasDetalle: string;
  totalMovimientos: number;
};

// Auth types
export type AuthCredentials = {
  fullName: string;
  email: string;
  password: string;
};

// NextAuth extended types
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role?: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    profileImageUrl?: string | null;
    phone?: string | null;
    bio?: string | null;
    department?: string | null;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      role?: string;
      image?: string | null;
      profileImageUrl?: string | null;
      phone?: string | null;
      bio?: string | null;
      department?: string | null;
    };
  }
}

declare module "next-auth" {
  interface JWT {
    id: string;
    role: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
    profileImageUrl?: string | null;
    phone?: string | null;
    bio?: string | null;
    department?: string | null;
  }
}

// Activity Logger Types - TIPO MEJORADO
export interface ActivityLogData {
  type: Movement['type'];
  title: string;
  description: string;
  entityId?: string;
  entityType?: string;
  previousValue?: any;  // CAMBIADO A ANY PARA SOPORTAR OBJETOS
  newValue?: any;       // CAMBIADO A ANY PARA SOPORTAR OBJETOS
}

// Template-specific types for Excel migration support
export type ExcelFieldMapping = {
  excelColumn: string;
  variableName: string;
  displayName: string;
  dataType: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
  defaultValue?: any;
};

// Enhanced template stats for better analytics
export type TemplateStats = {
  totalTemplates: number;
  activeTemplates: number;
  inactiveTemplates: number;
  recentTemplates: number;
  totalVariablesUsed: number;
  averageVariablesPerTemplate: number;
  totalWords: number;
  averageWordsPerTemplate: number;
  mostUsedVariables: Array<{
    variable: string;
    count: number;
    percentage: number;
  }>;
  templatesByCategory: Record<string, number>;
  templatesCreatedThisMonth: number;
  templatesModifiedThisWeek: number;
};

// Template generation context for dynamic content
export type TemplateContext = {
  case?: CaseWithRelations;
  client?: Client;
  user?: User;
  partes?: CaseParte[];
  customData?: Record<string, any>;
  metadata?: {
    generatedAt: Date;
    generatedBy: string;
    templateId: string;
    templateVersion?: string;
  };
  // NUEVO CAMPO PARA MOVIMIENTOS
  movements?: MovementWithUser[];
};

// Excel import/export types
export interface ExcelCaseData {
  caseName: string;
  caseNumber?: string;
  codigoInterno?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  clientPhone2?: string;
  clientAddress?: string;
  clientDni?: string;
  clientType: 'PERSONA_NATURAL' | 'EMPRESA';
  description?: string;
  authorities?: string;
  estadoOficial?: string;
  estadoInterno?: string;
  openingDate?: string;
  // Partes Activas
  parteActivaFirstName?: string;
  parteActivaLastName?: string;
  parteActivaCedula?: string;
  parteActivaPhone?: string;
  parteActivaEmail?: string;
  parteActivaBienes?: string;
  // Partes Demandadas
  parteDemandadaFirstName?: string;
  parteDemandadaLastName?: string;
  parteDemandadaCedula?: string;
  parteDemandadaPhone?: string;
  parteDemandadaEmail?: string;
  parteDemandadaBienes?: string;
  // Tareas
  taskTitle?: string;
  taskDescription?: string;
  taskPriority?: 'ALTA' | 'MEDIA' | 'BAJA';
  taskDueDate?: string;
  assignedToEmail?: string;
  // Plantillas
  templateNames?: string; // Separado por comas
  // NUEVO CAMPO PARA MOVIMIENTOS
  totalMovimientos?: number;
}

export interface ProcessedExcelData {
  cases: ExcelCaseData[];
  templates: Partial<Template>[];
  errors: string[];
  statistics: {
    totalRows: number;
    validCases: number;
    validTemplates: number;
    errors: number;
  };
}

// Google Calendar Integration Types
export type GoogleCalendarConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
  expiryDate?: number;
};

export type GoogleCalendarEvent = {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
};

// Export/Report Types
export type ExportFormat = 'excel' | 'pdf' | 'csv';

export type ReportType = 'casos' | 'tareas' | 'movimientos' | 'calendario';

export type ExportOptions = {
  format: ExportFormat;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  columns?: string[];
  includeImages?: boolean;
  includeComments?: boolean;
  // NUEVA OPCIÓN PARA MOVIMIENTOS
  includeMovements?: boolean;
};

// NUEVO TIPO PARA MOVIMIENTOS EN PDF
export type MovementsPDFData = {
  case: CaseWithRelations;
  movements: MovementWithUser[];
};

// NUEVO TIPO PARA DETALLES DE MOVIMIENTOS
export type MovementDetail = {
  id: string;
  type: string;
  title: string;
  description: string;
  createdAt: Date;
  createdBy: string;
  createdByUser?: User;
  previousValue?: any;
  newValue?: any;
};