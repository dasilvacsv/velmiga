'use client';

import React from 'react';
import { Filter } from 'lucide-react';

export function TaskFilters() {
  return (
    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors">
      <Filter className="h-4 w-4" />
      Filtros
    </button>
  );
}