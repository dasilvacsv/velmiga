import React from 'react';
import { 
  CheckSquare
} from 'lucide-react';
import { TaskWithRelations, User as UserType, CaseWithRelations } from '@/lib/types';
import { 
  getUsersForTeam,
  getCases
  
} from '@/features/gestion/actions';
import { 
  getTasksPaginated, 
  getTaskStats
} from '@/features/tareas/actions';
import { TasksClientPage } from '@/features/tareas/components/TasksClientPage';

export default async function TareasPage() {
  console.log("LOG: TareasPage - Renderización de la página de tareas iniciada.");

  try {
    console.log("LOG: TareasPage - Iniciando Promise.all para la carga de datos.");
    
    // Load initial data with pagination
    const [tasksData, usersData, casesData, statsData] = await Promise.all([
      getTasksPaginated({ limit: 20, offset: 0 }), // Load first page
      getUsersForTeam(),
      getCases(),
      getTaskStats()
    ]);

    console.log("LOG: TareasPage - Promise.all de carga de datos finalizada exitosamente.");
    console.log("LOG: TareasPage - Datos cargados: Tareas (" + tasksData?.length + "), Usuarios (" + usersData?.length + "), Casos (" + casesData?.length + "), Stats (" + (statsData ? 'OK' : 'Falló') + ")");

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <div className="max-w-[1800px] mx-auto px-3 sm:px-4 lg:px-6 py-6">
          <div className="space-y-6 animate-in fade-in-0">
            {/* Compact Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="animate-in slide-up" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-green-700 rounded-xl flex items-center justify-center shadow-md">
                    <CheckSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-green-600 bg-clip-text text-transparent font-raleway">
                      Velmiga - Gestión de Tareas
                    </h1>
                    <p className="text-sm text-gray-600">
                      Sistema de asignación y seguimiento de tareas legales con carga optimizada
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 animate-in slide-up" style={{ animationDelay: '200ms' }}>
              {[
                { label: 'Total', value: statsData.total, icon: CheckSquare, color: 'from-emerald-500 to-green-600' },
                { label: 'Activas', value: statsData.activo, icon: CheckSquare, color: 'from-blue-500 to-blue-600' },
                { label: 'En Revisión', value: statsData.enRevision, icon: CheckSquare, color: 'from-amber-500 to-yellow-600' },
                { label: 'Aprobadas', value: statsData.aprobada, icon: CheckSquare, color: 'from-green-500 to-emerald-600' },
                { label: 'Vencidas', value: statsData.overdue, icon: CheckSquare, color: 'from-red-500 to-rose-600' },
              ].map((stat, index) => (
                <div 
                  key={stat.label} 
                  className="bg-white rounded-lg shadow-sm border border-emerald-100 p-4 hover-lift"
                  style={{ animationDelay: `${300 + index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                      <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Client Component for Interactive Features with Virtual Scrolling */}
            <TasksClientPage 
              initialTasks={tasksData}
              users={usersData}
              cases={casesData}
              stats={statsData}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("ERROR LOG: TareasPage - Error CAUGHT durante la carga de datos de la página:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-700">
        <div className="text-center">
          <CheckSquare className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error al cargar la página de tareas</h2>
          <p className="mb-4">Por favor, intente de nuevo más tarde o contacte a soporte.</p>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left bg-white p-4 rounded border max-w-2xl mx-auto">
              <summary className="cursor-pointer font-medium">Detalles del error (desarrollo)</summary>
              <pre className="mt-2 text-sm text-red-600 overflow-auto">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}