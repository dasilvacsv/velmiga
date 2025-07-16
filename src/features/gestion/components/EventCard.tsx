import React from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { CalendarEvent } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

interface EventCardProps {
  event: CalendarEvent;
}

const getEventTypeIcon = (type: string) => {
  switch (type) {
    case 'AUDIENCIA':
      return <Users className="h-4 w-4 text-blue-600" />;
    case 'CITA_CON_CLIENTE':
      return <MapPin className="h-4 w-4 text-green-600" />;
    case 'REUNION_INTERNA':
      return <Users className="h-4 w-4 text-purple-600" />;
    default:
      return <Calendar className="h-4 w-4 text-slate-600" />;
  }
};

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'AUDIENCIA':
      return 'bg-blue-50 border-blue-200 text-blue-800';
    case 'CITA_CON_CLIENTE':
      return 'bg-green-50 border-green-200 text-green-800';
    case 'REUNION_INTERNA':
      return 'bg-purple-50 border-purple-200 text-purple-800';
    default:
      return 'bg-slate-50 border-slate-200 text-slate-800';
  }
};

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            {getEventTypeIcon(event.type)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">{event.title}</h3>
            {event.description && (
              <p className="text-sm text-slate-600 line-clamp-2">{event.description}</p>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
          {event.type.replace('_', ' ')}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Clock className="h-4 w-4" />
          <span>{formatDateTime(event.startDate)}</span>
        </div>
        
        {event.endDate && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Clock className="h-4 w-4" />
            <span>Hasta: {formatDateTime(event.endDate)}</span>
          </div>
        )}
      </div>
    </div>
  );
}