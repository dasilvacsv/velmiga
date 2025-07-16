import nodemailer from 'nodemailer';
import { CalendarEvent } from '@/lib/types';

interface EmailNotificationOptions {
  to: string[];
  subject: string;
  text: string;
  html: string;
}

class EmailNotificationService {
  private transporter!: nodemailer.Transporter;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    // Configure email transporter (using Gmail as example)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD, // Use App Password for Gmail
      },
    });
  }

  /**
   * Send email notification
   */
  async sendEmail(options: EmailNotificationOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `Vilmega <${process.env.EMAIL_USER}>`,
        to: options.to.join(', '),
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email notification');
    }
  }

  /**
   * Send event reminder notification
   */
  async sendEventReminder(event: CalendarEvent, recipients: string[]): Promise<void> {
    const eventDate = new Date(event.startDate);
    const formattedDate = eventDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = `Recordatorio: ${event.title} - Mañana`;
    
    const text = `
Estimado/a,

Este es un recordatorio de que tiene un evento programado para mañana:

Evento: ${event.title}
Fecha y Hora: ${formattedDate}
Tipo: ${this.getEventTypeLabel(event.type)}
${event.description ? `Descripción: ${event.description}` : ''}

Por favor, asegúrese de estar preparado/a para este evento.

Saludos cordiales,
Vilmega
    `.trim();

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #f97316); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .event-details { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .event-title { font-size: 18px; font-weight: bold; color: #92400e; margin-bottom: 10px; }
            .detail-row { margin: 8px 0; }
            .label { font-weight: bold; color: #374151; }
            .footer { background: #f9fafb; padding: 15px; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 8px 8px; }
            .reminder-badge { background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚖️ Vilmega</h1>
                <span class="reminder-badge">Recordatorio de Evento</span>
            </div>
            <div class="content">
                <h2>Recordatorio: Evento Programado para Mañana</h2>
                <p>Estimado/a,</p>
                <p>Este es un recordatorio de que tiene un evento importante programado para mañana.</p>
                
                <div class="event-details">
                    <div class="event-title">${event.title}</div>
                    <div class="detail-row">
                        <span class="label">📅 Fecha y Hora:</span> ${formattedDate}
                    </div>
                    <div class="detail-row">
                        <span class="label">📋 Tipo:</span> ${this.getEventTypeLabel(event.type)}
                    </div>
                    ${event.description ? `
                    <div class="detail-row">
                        <span class="label">📝 Descripción:</span> ${event.description}
                    </div>
                    ` : ''}
                </div>

                <p>Por favor, asegúrese de estar preparado/a para este evento y tener toda la documentación necesaria.</p>
                
                <p><em>Este es un recordatorio automático generado por el Vilmega.</em></p>
            </div>
            <div class="footer">
                Vilmega - Gestión Jurídica Integral
            </div>
        </div>
    </body>
    </html>
    `;

    await this.sendEmail({
      to: recipients,
      subject,
      text,
      html,
    });
  }

  /**
   * Send new event notification
   */
  async sendNewEventNotification(event: CalendarEvent, recipients: string[]): Promise<void> {
    const eventDate = new Date(event.startDate);
    const formattedDate = eventDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = `Nuevo evento programado: ${event.title}`;
    
    const text = `
Se ha programado un nuevo evento:

Evento: ${event.title}
Fecha y Hora: ${formattedDate}
Tipo: ${this.getEventTypeLabel(event.type)}
${event.description ? `Descripción: ${event.description}` : ''}

Recibirá un recordatorio 24 horas antes del evento.

Vilmega
    `.trim();

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; }
            .event-details { background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .event-title { font-size: 18px; font-weight: bold; color: #065f46; margin-bottom: 10px; }
            .detail-row { margin: 8px 0; }
            .label { font-weight: bold; color: #374151; }
            .footer { background: #f9fafb; padding: 15px; text-align: center; color: #6b7280; font-size: 12px; border-radius: 0 0 8px 8px; }
            .new-badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚖️ Vilmega</h1>
                <span class="new-badge">Nuevo Evento</span>
            </div>
            <div class="content">
                <h2>Nuevo Evento Programado</h2>
                <p>Se ha programado un nuevo evento en el calendario:</p>
                
                <div class="event-details">
                    <div class="event-title">${event.title}</div>
                    <div class="detail-row">
                        <span class="label">📅 Fecha y Hora:</span> ${formattedDate}
                    </div>
                    <div class="detail-row">
                        <span class="label">📋 Tipo:</span> ${this.getEventTypeLabel(event.type)}
                    </div>
                    ${event.description ? `
                    <div class="detail-row">
                        <span class="label">📝 Descripción:</span> ${event.description}
                    </div>
                    ` : ''}
                </div>

                <p>Recibirá un recordatorio automático 24 horas antes del evento.</p>
            </div>
            <div class="footer">
                Vilmega - Gestión Jurídica Integral
            </div>
        </div>
    </body>
    </html>
    `;

    await this.sendEmail({
      to: recipients,
      subject,
      text,
      html,
    });
  }

  private getEventTypeLabel(type: string): string {
    const typeLabels: Record<string, string> = {
      'AUDIENCIA': 'Audiencia Judicial',
      'CITA_CON_CLIENTE': 'Cita con Cliente',
      'REUNION_INTERNA': 'Reunión Interna',
      'VENCIMIENTO_LEGAL': 'Vencimiento Legal'
    };
    return typeLabels[type] || type;
  }
}

export const emailNotificationService = new EmailNotificationService();