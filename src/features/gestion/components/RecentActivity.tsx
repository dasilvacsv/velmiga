import React from 'react';
import { Clock, FileText, CheckSquare, Calendar } from 'lucide-react';
import { getDashboardStats } from '@/features/gestion/actions';

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'task':
      return <CheckSquare className="h-4 w-4 text-blue-600" />;
    case 'event':
      return <Calendar className="h-4 w-4 text-purple-600" />;
    case 'case':
      return <FileText className="h-4 w-4 text-green-600" />;
    default:
      return <Clock className="h-4 w-4 text-slate-600" />;
  }
};

export async function RecentActivity() {
  const stats = await getDashboardStats();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Clock className="h-5 w-5 text-slate-600" />
          Actividad Reciente
        </h2>
        <p className="text-slate-600 text-sm mt-1">Últimas actualizaciones del sistema</p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity, index) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                <div className="p-2 bg-slate-100 rounded-lg flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {activity.timestamp.toLocaleDateString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No hay actividad reciente</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}