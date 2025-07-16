import React from 'react';
import Link from 'next/link';
import { Plus, UserPlus, FileText, Calendar } from 'lucide-react';

export function QuickActions() {
  const actions = [
    {
      label: 'Nuevo Caso',
      href: '/gestion/casos/nuevo',
      icon: <Plus className="h-4 w-4" />,
      className: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    {
      label: 'Nuevo Cliente',
      href: '/gestion/clientes/nuevo',
      icon: <UserPlus className="h-4 w-4" />,
      className: 'bg-green-600 hover:bg-green-700 text-white'
    },
    {
      label: 'Nueva Plantilla',
      href: '/gestion/plantillas/nueva',
      icon: <FileText className="h-4 w-4" />,
      className: 'bg-purple-600 hover:bg-purple-700 text-white'
    },
    {
      label: 'Nuevo Evento',
      href: '/gestion/calendario/nuevo',
      icon: <Calendar className="h-4 w-4" />,
      className: 'bg-amber-600 hover:bg-amber-700 text-white'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <h2 className="text-lg font-semibold text-slate-900">Acciones Rápidas</h2>
        <p className="text-slate-600 text-sm mt-1">Crear nuevos elementos</p>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 gap-3">
          {actions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={`inline-flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all hover:shadow-lg ${action.className}`}
            >
              {action.icon}
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}