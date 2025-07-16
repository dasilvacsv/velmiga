import React from 'react';
import { TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export function WorkflowStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <span className="text-sm font-medium text-slate-600">Flujos Activos</span>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-1">12</div>
        <div className="text-sm text-green-600 font-medium">+2 este mes</div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-slate-600">Completados</span>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-1">847</div>
        <div className="text-sm text-blue-600 font-medium">Este mes</div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <span className="text-sm font-medium text-slate-600">Tiempo Promedio</span>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-1">4.2h</div>
        <div className="text-sm text-amber-600 font-medium">Por flujo</div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <AlertCircle className="h-5 w-5 text-purple-600" />
          </div>
          <span className="text-sm font-medium text-slate-600">Tasa de Éxito</span>
        </div>
        <div className="text-2xl font-bold text-slate-900 mb-1">94%</div>
        <div className="text-sm text-purple-600 font-medium">+3% vs mes anterior</div>
      </div>
    </div>
  );
}