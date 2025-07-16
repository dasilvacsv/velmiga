import React from 'react';
import { 
  TrendingUp, Users, Calendar, AlertCircle, FileText, Scale, Download
} from 'lucide-react';
import { CaseWithRelations, Client, User } from '@/lib/types';
import { 
  getCasesPaginated, 
  getClientsForCases,
  getCaseStats,
  getUsersForTeam
} from '@/features/casos/actions';
import { CasesClientPage } from '@/features/casos/components/CasesClientPage';
import { Button } from '@/components/ui/button';

export default async function CasosPage() {
  console.log("LOG: CasosPage - Renderización de la página de casos iniciada.");

  try {
    console.log("LOG: CasosPage - Iniciando Promise.all para la carga de datos.");
    
    // Load initial data with pagination
    const [casesData, clientsData, usersData, statsData] = await Promise.all([
      getCasesPaginated({ limit: 20, offset: 0 }), // Load first page
      getClientsForCases(),
      getUsersForTeam(),
      getCaseStats()
    ]);

    console.log("LOG: CasosPage - Promise.all de carga de datos finalizada exitosamente.");
    console.log("LOG: CasosPage - Datos cargados: Casos (" + casesData?.length + "), Clientes (" + clientsData?.length + "), Usuarios (" + usersData?.length + "), Stats (" + (statsData ? 'OK' : 'Falló') + ")");

    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-6 py-4">
          <div className="space-y-4">
            {/* Compact Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-600 to-yellow-700 rounded-lg flex items-center justify-center shadow-md">
                  <Scale className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 font-inter">
                    Velmiga - Gestión de Casos Legales
                  </h1>
                  <p className="text-xs text-gray-600">
                    Sistema profesional de gestión legal con carga optimizada
                  </p>
                </div>
              </div>
            </div>

            {/* Compact Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total', value: statsData.total, icon: FileText, color: 'from-amber-600 to-yellow-700' },
                { label: 'Activos', value: statsData.active, icon: TrendingUp, color: 'from-green-600 to-emerald-700' },
                { label: 'En Espera', value: statsData.pending, icon: AlertCircle, color: 'from-yellow-600 to-amber-700' },
                { label: 'Cerrados', value: statsData.closed, icon: Calendar, color: 'from-gray-600 to-slate-700' },
              ].map((stat, index) => (
                <div 
                  key={stat.label} 
                  className="bg-white rounded-lg shadow-sm border border-amber-100 p-3 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">{stat.label}</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                      <stat.icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Client Component for Interactive Features with Virtual Scrolling */}
            <CasesClientPage 
              initialCases={casesData}
              clients={clientsData}
              users={usersData}
              stats={statsData}
            />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("ERROR LOG: CasosPage - Error CAUGHT durante la carga de datos de la página:", error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-700">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Error al cargar la página de casos</h2>
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