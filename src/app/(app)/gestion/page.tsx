import React, { Suspense } from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckSquare, 
  FileText, 
  Users, 
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats } from '@/features/gestion/actions';
import { DashboardCard } from '@/features/gestion/components/DashboardCard';
import { RecentActivity } from '@/features/gestion/components/RecentActivity';
import { QuickActions } from '@/features/gestion/components/QuickActions';

async function DashboardStats() {
  const stats = await getDashboardStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <DashboardCard
        title="Casos Totales"
        value={stats.totalCases}
        icon={<BarChart3 className="h-6 w-6 text-blue-600" />}
        trend={{ value: 12, isPositive: true }}
        className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200"
      />
      <DashboardCard
        title="Casos Activos"
        value={stats.activeCases}
        icon={<FileText className="h-6 w-6 text-green-600" />}
        trend={{ value: 8, isPositive: true }}
        className="bg-gradient-to-br from-green-50 to-green-100 border-green-200"
      />
      <DashboardCard
        title="Tareas Pendientes"
        value={stats.pendingTasks}
        icon={<CheckSquare className="h-6 w-6 text-amber-600" />}
        trend={{ value: 3, isPositive: false }}
        className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200"
      />
      <DashboardCard
        title="Eventos Próximos"
        value={stats.upcomingEvents}
        icon={<Calendar className="h-6 w-6 text-purple-600" />}
        trend={{ value: 5, isPositive: true }}
        className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200"
      />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
            <div className="w-8 h-4 bg-slate-200 rounded"></div>
          </div>
          <div className="w-16 h-8 bg-slate-200 rounded mb-2"></div>
          <div className="w-24 h-4 bg-slate-200 rounded"></div>
        </div>
      ))}
    </div>
  );
}

export default function GestionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Centro de Gestión Legal
              </h1>
              <p className="text-slate-600">
                Panel principal para la administración de casos, tareas y documentos legales
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                <Clock className="h-4 w-4" />
                Últimas 24h
              </button>
              <Link
                href="/gestion/casos/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
              >
                <Plus className="h-4 w-4" />
                Nuevo Caso
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <Suspense fallback={<LoadingSkeleton />}>
          <DashboardStats />
        </Suspense>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Access Modules */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Módulos de Gestión
                </h2>
                <p className="text-slate-600 mt-1">Acceso rápido a las funcionalidades principales</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tasks Module */}
                  <Link
                    href="/gestion/tareas"
                    className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 hover:shadow-lg hover:shadow-blue-200/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                        <CheckSquare className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Gestión de Tareas</h3>
                    <p className="text-slate-600 text-sm">Administra y asigna tareas del equipo legal</p>
                  </Link>

                  {/* Calendar Module */}
                  <Link
                    href="/gestion/calendario"
                    className="group relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 hover:shadow-lg hover:shadow-purple-200/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                        <Calendar className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Calendario Legal</h3>
                    <p className="text-slate-600 text-sm">Programa audiencias y eventos importantes</p>
                  </Link>

                  {/* Workflows Module */}
                  <Link
                    href="/gestion/flujos-de-trabajo"
                    className="group relative bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200 hover:shadow-lg hover:shadow-green-200/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-green-600 rounded-lg group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Flujos de Trabajo</h3>
                    <p className="text-slate-600 text-sm">Automatiza procesos legales estándar</p>
                  </Link>

                  {/* Templates Module */}
                  <Link
                    href="/gestion/plantillas"
                    className="group relative bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200 hover:shadow-lg hover:shadow-amber-200/50 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Plantillas</h3>
                    <p className="text-slate-600 text-sm">Crea y gestiona plantillas de documentos</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <QuickActions />
            
            {/* Recent Activity */}
            <Suspense fallback={
              <div className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded mb-4 w-3/4"></div>
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-lg"></div>
                  ))}
                </div>
              </div>
            }>
              <RecentActivity />
            </Suspense>
          </div>
        </div>

        {/* Alert Section */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-900 mb-1">Recordatorio</h3>
              <p className="text-amber-800 text-sm">
                Revisa las tareas pendientes y los eventos próximos para mantener al día todos los casos activos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}