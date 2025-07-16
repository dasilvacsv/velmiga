import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// CAMBIO: Nuevas funciones para zona horaria de Ecuador (GMT-5)
export function getEcuadorDate(date?: Date | string): Date {
  const inputDate = date ? new Date(date) : new Date();
  
  // Ecuador está en GMT-5 (ECT - Ecuador Time)
  const ecuadorOffset = -5 * 60; // -5 horas en minutos
  const utc = inputDate.getTime() + (inputDate.getTimezoneOffset() * 60000);
  const ecuadorTime = new Date(utc + (ecuadorOffset * 60000));
  
  return ecuadorTime;
}

export function formatDateEcuador(date: Date | string): string {
  const ecuadorDate = getEcuadorDate(date);
  return ecuadorDate.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Guayaquil'
  });
}

export function formatDateTimeEcuador(date: Date | string): string {
  const ecuadorDate = getEcuadorDate(date);
  return ecuadorDate.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Guayaquil'
  });
}

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDateTime(date: Date | string) {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES'
  }).format(amount);
}

export function getPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case 'alta':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'media':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'baja':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'activo':
    case 'pendiente':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'en_progreso':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'completada':
    case 'cerrado':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'archivado':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200';
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateCaseNumber(prefix: string = 'CASO'): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

export function getTaskStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVO':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'EN_REVISION':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'APROBADA':
      return 'bg-gray-50 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

// Velmiga Brand Colors - Official Palette
export const VelmigaColors = {
  // Amarillos/Dorados principales
  primary: {
    50: '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308', // Color principal amarillo Velmiga
    600: '#ca8a04',
    700: '#a16207',
    800: '#854d0e',
    900: '#713f12',
  },

  // Verdes oficiales de la marca
  secondary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Verdes Velmiga
  accent: {
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#a3e635',
    500: '#84cc16', // Verde principal Velmiga
    600: '#65a30d',
    700: '#4d7c0f',
    800: '#365314',
    900: '#1a2e05',
  },

  // Tonos neutros de la marca
  neutral: {
    50: '#fafaf9',
    100: '#f5f5f4',
    200: '#e7e5e4',
    300: '#d6d3d1',
    400: '#a8a29e',
    500: '#78716c',
    600: '#57534e',
    700: '#44403c',
    800: '#292524',
    900: '#1c1917',
  }
};

// Funciones de utilidad para los colores de Velmiga
export function getVelmigaColor(shade: 'light' | 'medium' | 'dark' = 'medium') {
  switch (shade) {
    case 'light':
      return VelmigaColors.primary[300];
    case 'dark':
      return VelmigaColors.primary[700];
    default:
      return VelmigaColors.primary[500];
  }
}

export function getVelmigaGreen(shade: 'light' | 'medium' | 'dark' = 'medium') {
  switch (shade) {
    case 'light':
      return VelmigaColors.accent[300];
    case 'dark':
      return VelmigaColors.accent[700];
    default:
      return VelmigaColors.accent[500];
  }
}

// Funciones de validación y formato
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[+]?[0-9-()\s]+$/;
  return phoneRegex.test(phone);
}

export function formatPhone(phone: string): string {
  // Remove all non-digit characters
  const digitsOnly = phone.replace(/\D/g, '');

  // Format Venezuelan phone numbers
  if (digitsOnly.length === 11 && digitsOnly.startsWith('58')) {
    return `+${digitsOnly.slice(0, 2)} ${digitsOnly.slice(2, 6)} ${digitsOnly.slice(6)}`;
  }

  if (digitsOnly.length === 10) {
    return `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4)}`;
  }

  return phone;
}

export function formatCedula(cedula: string): string {
  // Remove all non-alphanumeric characters except hyphens
  const cleaned = cedula.replace(/[^a-zA-Z0-9-]/g, '');

  // Venezuelan cedula format V-12345678
  if (cleaned.length <= 10 && !cleaned.includes('-') && cleaned.match(/^[VEJ]?\d+$/)) {
    const letter = cleaned.match(/^[VEJ]/)?.[0] || 'V';
    const numbers = cleaned.replace(/^[VEJ]/, '');
    return `${letter}-${numbers}`;
  }

  return cleaned;
}

// Funciones de exportación
export function generateExcelFilename(type: string, dateRange?: { start: Date; end: Date }): string {
  const timestamp = formatDateEcuador(new Date()).replace(/\s+/g, '_');
  const dateRangeStr = dateRange
    ? `_${formatDateEcuador(dateRange.start)}_${formatDateEcuador(dateRange.end)}`.replace(/\s+/g, '_')
    : '';

  return `Velmiga_${type}${dateRangeStr}_${timestamp}.xlsx`;
}

export function generatePDFFilename(type: string, entityName?: string): string {
  const timestamp = formatDateEcuador(new Date()).replace(/\s+/g, '_');
  const entityStr = entityName ? `_${entityName.replace(/[^a-zA-Z0-9]/g, '_')}` : '';

  return `Velmiga_${type}${entityStr}_${timestamp}.pdf`;
}

// Funciones de fecha para calendario
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isTomorrow(date: Date): boolean {
  const tomorrow = addDays(new Date(), 1);
  return isSameDay(date, tomorrow);
}

export function isThisWeek(date: Date): boolean {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  const weekEnd = addDays(weekStart, 6);

  return date >= weekStart && date <= weekEnd;
}

// Función para crear texto de notificación de Google Calendar
export function createGoogleCalendarNotificationText(event: any): string {
  const eventDate = new Date(event.startDate);
  const tomorrow = addDays(new Date(), 1);

  if (isSameDay(eventDate, tomorrow)) {
    return `Recordatorio: Tienes un evento mañana - ${event.title}`;
  }

  return `Recordatorio: Tienes un evento el ${formatDate(eventDate)} - ${event.title}`;
}

// Función para obtener el color de prioridad usando la paleta Velmiga
export function getVelmigaTaskPriorityColor(priority: string) {
  switch (priority.toLowerCase()) {
    case 'alta':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'media':
      return `bg-yellow-50 text-yellow-700 border-yellow-200`;
    case 'baja':
      return `bg-gray-50 text-gray-700 border-gray-200`;
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

// Función para obtener el color de estado usando la paleta Velmiga
export function getVelmigaStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'activo':
    case 'pendiente':
      return `bg-blue-50 text-blue-700 border-blue-200`;
    case 'en_revision':
    case 'en_espera':
      return `bg-yellow-50 text-yellow-700 border-yellow-200`;
    case 'completada':
    case 'aprobada':
    case 'cerrado':
      return `bg-gray-50 text-gray-700 border-gray-200`;
    case 'archivado':
      return 'bg-red-50 text-red-700 border-red-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
}

export function generatePDFFilename2(prefix: string, caseName: string): string {
  const sanitizedCaseName = caseName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const timestamp = formatDateEcuador(new Date()).replace(/\s+/g, '_');
  return `${prefix}_${sanitizedCaseName}_${timestamp}.pdf`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate?: boolean
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) func(...args);
  };
}

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'hace unos segundos';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  }

  return formatDate(date);
}