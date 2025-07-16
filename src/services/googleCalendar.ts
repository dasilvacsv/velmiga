import { google } from 'googleapis';

// Google Calendar configuration
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

interface GoogleCalendarEvent {
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
}

class GoogleCalendarService {
  private auth: any;
  private calendar: any;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Initialize OAuth2 client
      this.auth = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      // Set credentials if available
      if (process.env.GOOGLE_ACCESS_TOKEN && process.env.GOOGLE_REFRESH_TOKEN) {
        this.auth.setCredentials({
          access_token: process.env.GOOGLE_ACCESS_TOKEN,
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        });
      }

      this.calendar = google.calendar({ version: 'v3', auth: this.auth });
    } catch (error) {
      console.error('Error initializing Google Calendar auth:', error);
      throw new Error('Failed to initialize Google Calendar authentication');
    }
  }

  /**
   * Get OAuth2 authorization URL
   */
  getAuthUrl(): string {
    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
  }

  /**
   * Set credentials from authorization code
   */
  async setCredentials(code: string) {
    try {
      const { tokens } = await this.auth.getToken(code);
      this.auth.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error setting credentials:', error);
      throw new Error('Failed to set Google Calendar credentials');
    }
  }

  /**
   * Create a calendar event
   */
  async createEvent(eventData: {
    title: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    attendeeEmails?: string[];
    reminderMinutes?: number;
  }): Promise<string> {
    try {
      const endDate = eventData.endDate || new Date(eventData.startDate.getTime() + 60 * 60 * 1000); // Default 1 hour

      const event: GoogleCalendarEvent = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startDate.toISOString(),
          timeZone: 'America/Caracas', // Venezuela timezone
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone: 'America/Caracas',
        },
        reminders: {
          useDefault: false,
          overrides: [
            {
              method: 'email',
              minutes: eventData.reminderMinutes || 1440, // Default 24 hours (1440 minutes)
            },
            {
              method: 'popup',
              minutes: 30, // 30 minutes popup reminder
            },
          ],
        },
      };

      // Add attendees if provided
      if (eventData.attendeeEmails && eventData.attendeeEmails.length > 0) {
        event.attendees = eventData.attendeeEmails.map(email => ({ email }));
      }

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all', // Send email notifications to attendees
      });

      return response.data.id;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw new Error('Failed to create Google Calendar event');
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(eventId: string, eventData: {
    title?: string;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    attendeeEmails?: string[];
    reminderMinutes?: number;
  }): Promise<void> {
    try {
      // First, get the existing event
      const existingEvent = await this.calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });

      const updatedEvent = { ...existingEvent.data };

      // Update fields if provided
      if (eventData.title) updatedEvent.summary = eventData.title;
      if (eventData.description !== undefined) updatedEvent.description = eventData.description;
      
      if (eventData.startDate) {
        updatedEvent.start = {
          dateTime: eventData.startDate.toISOString(),
          timeZone: 'America/Caracas',
        };
      }

      if (eventData.endDate) {
        updatedEvent.end = {
          dateTime: eventData.endDate.toISOString(),
          timeZone: 'America/Caracas',
        };
      }

      if (eventData.reminderMinutes !== undefined) {
        updatedEvent.reminders = {
          useDefault: false,
          overrides: [
            {
              method: 'email',
              minutes: eventData.reminderMinutes,
            },
            {
              method: 'popup',
              minutes: 30,
            },
          ],
        };
      }

      if (eventData.attendeeEmails) {
        updatedEvent.attendees = eventData.attendeeEmails.map(email => ({ email }));
      }

      await this.calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: updatedEvent,
        sendUpdates: 'all',
      });
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw new Error('Failed to update Google Calendar event');
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw new Error('Failed to delete Google Calendar event');
    }
  }

  /**
   * List calendar events within a date range
   */
  async listEvents(startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const params: any = {
        calendarId: 'primary',
        orderBy: 'startTime',
        singleEvents: true,
        maxResults: 50,
      };

      if (startDate) {
        params.timeMin = startDate.toISOString();
      }

      if (endDate) {
        params.timeMax = endDate.toISOString();
      }

      const response = await this.calendar.events.list(params);
      return response.data.items || [];
    } catch (error) {
      console.error('Error listing Google Calendar events:', error);
      throw new Error('Failed to list Google Calendar events');
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();