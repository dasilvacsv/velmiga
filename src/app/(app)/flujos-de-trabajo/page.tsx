import React from 'react';
import { Workflow, Plus, Play, Pause, Settings, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { WorkflowCard } from '@/features/gestion/components/WorkFlowCard';
import { WorkflowStats } from '@/features/gestion/components/WorkFlowStats';

const mockWorkflows = [
  {
    id: '1',
    name: 'Proceso de Onboarding de Cliente',
    description: 'Flujo automatizado para la incorporación de nuevos clientes',
    status: 'active',
    steps: 8,
    completionRate: 92,
    lastRun: new Date('2024-01-15'),
    totalRuns: 156
  },
  {
    id: '2',
    name: 'Preparación de Audiencia',
    description: 'Checklist y recordatorios para preparación de audiencias',
    status: 'active',
    steps: 12,
    completionRate: 88,
    lastRun: new Date('2024-01-14'),
    totalRuns: 89
  },
  {
    id: '3',
    name: 'Cierre de Caso',
    description: 'Proceso completo para el cierre formal de casos legales',
    status: 'draft',
    steps: 15,
    completionRate: 0,
    lastRun: null,
    totalRuns: 0
  }
];

export default function FlujosDeTrabajoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-green-600" />
                Flujos de Trabajo
              </h1>
              <p className="text-slate-600">
                Automatiza procesos legales estándar y mejora la eficiencia del equipo
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
                <Settings className="h-4 w-4" />
                Configuración
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20">
                <Plus className="h-4 w-4" />
                Nuevo Flujo
              </button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <WorkflowStats />

        {/* Workflows Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {mockWorkflows.map(workflow => (
            <WorkflowCard key={workflow.id} workflow={workflow} />
          ))}
        </div>

        {/* Featured Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
              <Workflow className="h-5 w-5 text-green-600" />
              Plantillas de Flujos Predefinidos
            </h2>
            <p className="text-slate-600 mt-1">Flujos listos para usar en tu práctica legal</p>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: 'Gestión de Contratos',
                  description: 'Revisión, negociación y firma de contratos',
                  steps: 10,
                  category: 'Contractual'
                },
                {
                  name: 'Litigio Civil',
                  description: 'Proceso completo desde demanda hasta sentencia',
                  steps: 25,
                  category: 'Litigio'
                },
                {
                  name: 'Due Diligence',
                  description: 'Investigación exhaustiva para M&A',
                  steps: 18,
                  category: 'Corporativo'
                },
                {
                  name: 'Registro de Marca',
                  description: 'Proceso de registro de propiedad intelectual',
                  steps: 12,
                  category: 'IP'
                },
                {
                  name: 'Cumplimiento Regulatorio',
                  description: 'Verificación de compliance empresarial',
                  steps: 15,
                  category: 'Compliance'
                },
                {
                  name: 'Estructuración Societaria',
                  description: 'Creación y estructuración de empresas',
                  steps: 20,
                  category: 'Corporativo'
                }
              ].map((template, index) => (
                <div key={index} className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow group cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-green-600 transition-colors">
                        {template.name}
                      </h3>
                      <p className="text-sm text-slate-600 mb-2">{template.description}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {template.steps} pasos
                        </span>
                        <span className="px-2 py-1 bg-white rounded-full text-slate-600 font-medium">
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button className="w-full mt-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors group-hover:border-green-300 group-hover:text-green-700">
                    Usar Plantilla
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}