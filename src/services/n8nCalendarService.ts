/**
 * N8N Calendar Service
 * Maneja la integración con Google Calendar a través de webhooks de n8n
 * utilizando autenticación por Header 'Authorization: Bearer'.
 * VERSIÓN FINAL Y CORREGIDA con manejo de errores robusto.
 */

// Define las interfaces para un tipado estricto
interface N8nWebhookEvent {
  title: string;
  description?: string;
  startDate: string; // ISO string
  endDate?: string; // ISO string
  attendeeEmails?: string[];
  reminderMinutes?: number;
  eventType?: string;
  caseId?: string;
  userId: string;
}

interface N8nResponse {
  success: boolean;
  googleEventId?: string;
  error?: string;
  data?: any; // Para cualquier dato adicional que devuelva n8n
  [key: string]: any; // Permite otras propiedades en la respuesta de n8n
}

class N8nCalendarService {
  private readonly baseUrl: string;
  private readonly webhookSecret: string;

  constructor() {
    // Leemos las variables de entorno una sola vez al iniciar el servicio
    this.baseUrl = process.env.N8N_WEBHOOK_BASE_URL || '';
    this.webhookSecret = process.env.N8N_WEBHOOK_SECRET || '';

    if (!this.baseUrl || !this.webhookSecret) {
      console.warn('Advertencia: Las variables de entorno de n8n (N8N_WEBHOOK_BASE_URL, N8N_WEBHOOK_SECRET) no están configuradas.');
    }
  }

  /**
   * Método privado y genérico para realizar todas las peticiones a n8n.
   * Centraliza la lógica de construcción de URL, headers y manejo de errores.
   */
  private async _request(path: string, method: 'POST' | 'PUT' | 'DELETE', body?: Record<string, any>): Promise<N8nResponse> {
    if (!this.baseUrl) {
      const errorMsg = 'N8N_WEBHOOK_BASE_URL no está configurada.';
      console.error(errorMsg);
      return { success: false, error: errorMsg };
    }

    const webhookUrl = `${this.baseUrl}/webhook/${path}`;

    try {
      const response = await fetch(webhookUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          // Este es el cambio clave: usamos el header estándar 'Authorization'
          'Authorization': `Bearer ${this.webhookSecret}`,
        },
        // El body ya no contiene el 'secret'
        body: body ? JSON.stringify(body) : undefined,
      });

      // Primero verificamos si la respuesta HTTP fue exitosa (status 2xx)
      if (!response.ok) {
        // Si no lo fue, es un error. Leemos la respuesta como texto plano
        // para no fallar si no es JSON, que es lo que causa el error original.
        const errorText = await response.text();
        throw new Error(`Error de n8n (${response.status}): ${errorText}`);
      }
      
      // Si la respuesta es exitosa, ahora sí la procesamos como JSON.
      return await response.json();

    } catch (error) {
      console.error(`Error en la llamada a n8n (${webhookUrl}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido al contactar con n8n',
      };
    }
  }

  /**
   * Crear evento en Google Calendar a través de n8n
   */
  async createGoogleCalendarEvent(eventData: Omit<N8nWebhookEvent, 'eventType'> & { eventType: string }): Promise<N8nResponse> {
    return this._request('create-calendar-event', 'POST', eventData);
  }

  /**
   * Actualizar evento en Google Calendar
   */
  async updateGoogleCalendarEvent(
    googleEventId: string,
    eventData: Partial<Omit<N8nWebhookEvent, 'userId'>>
  ): Promise<N8nResponse> {
    const payload = { googleEventId, ...eventData };
    return this._request('update-calendar-event', 'PUT', payload);
  }

  /**
   * Eliminar evento de Google Calendar
   */
  async deleteGoogleCalendarEvent(googleEventId: string): Promise<N8nResponse> {
    const payload = { googleEventId };
    return this._request('delete-calendar-event', 'DELETE', payload);
  }
  
  /**
   * Sincronizar eventos desde Google Calendar
   */
  async syncEventsFromGoogle(userId: string): Promise<N8nResponse> {
    const payload = { userId };
    return this._request('sync-calendar-events', 'POST', payload);
  }
}

// Exportamos una única instancia de la clase (patrón Singleton) para usar en toda la aplicación
export const n8nCalendarService = new N8nCalendarService();