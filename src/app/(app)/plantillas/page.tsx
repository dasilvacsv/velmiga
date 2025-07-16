import React, { Suspense } from 'react';
import { getTemplates, getTemplateStats } from '@/features/plantillas/actions';
import { TemplatesClientPage } from '@/features/plantillas/components/TemplatesClientPage';

// Componente de esqueleto para una carga agradable
function LoadingSkeleton() {
    return (
        <div className="max-w-7xl mx-auto">
             <div className="mb-8">
                <div className="h-10 bg-slate-200 rounded w-1/2 mb-2 animate-pulse"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4 animate-pulse"></div>
             </div>
             <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
                <div className="h-12 bg-slate-200 rounded w-1/3 animate-pulse"></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse">
                        <div className="h-6 bg-slate-200 rounded mb-4 w-3/4"></div>
                        <div className="h-4 bg-slate-200 rounded mb-2"></div>
                        <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
                        <div className="h-10 bg-slate-100 rounded"></div>
                    </div>
                ))}
             </div>
        </div>
    )
}


export default async function PlantillasPage() {
  // Obtenemos todos los datos necesarios en el servidor
  const templates = await getTemplates();
  const stats = await getTemplateStats();

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <Suspense fallback={<LoadingSkeleton />}>
        {/* Pasamos todos los datos al componente de cliente para que los renderice */}
        <TemplatesClientPage initialTemplates={templates} stats={stats} />
      </Suspense>
    </div>
  );
}