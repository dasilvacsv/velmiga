import React from 'react';
import { Play, Pause, Settings, BarChart3, Clock, CheckCircle } from 'lucide-react';

interface WorkflowCardProps {
  workflow: {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'draft' | 'paused';
    steps: number;
    completionRate: number;
    lastRun: Date | null;
    totalRuns: number;
  };
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'draft':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="h-3 w-3" />;
      case 'paused':
        return <Pause className="h-3 w-3" />;
      default:
        return <Settings className="h-3 w-3" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{workflow.name}</h3>
          <p className="text-sm text-slate-600 line-clamp-2">{workflow.description}</p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(workflow.status)}`}>
            {getStatusIcon(workflow.status)}
            {workflow.status}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-600">Pasos</span>
          </div>
          <div className="text-lg font-bold text-slate-900">{workflow.steps}</div>
        </div>
        
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-slate-600" />
            <span className="text-xs font-medium text-slate-600">Éxito</span>
          </div>
          <div className="text-lg font-bold text-slate-900">{workflow.completionRate}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      {workflow.status === 'active' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Tasa de Completación</span>
            <span className="text-xs font-medium text-slate-900">{workflow.completionRate}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${workflow.completionRate}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <Clock className="h-3 w-3" />
          {workflow.lastRun ? (
            <span>Último: {workflow.lastRun.toLocaleDateString()}</span>
          ) : (
            <span>Sin ejecutar</span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          {workflow.totalRuns} ejecuciones
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4">
        <button className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
          Editar
        </button>
        <button className="flex-1 py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
          {workflow.status === 'active' ? 'Ver Detalles' : 'Activar'}
        </button>
      </div>
    </div>
  );
}