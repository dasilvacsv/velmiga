import React from 'react';
import { getTemplateById } from '@/features/plantillas/actions';
import { TemplateDetailClient } from '@/features/plantillas/components/TemplateDetailClient';
import { FileText, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface TemplateDetailPageProps {
  params: {
    id: string;
  };
}

// Esta es una página de servidor que obtiene los datos iniciales
export default async function TemplateDetailPage({ params }: TemplateDetailPageProps) {
  const template = await getTemplateById(params.id);

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <FileText className="h-16 w-16 text-slate-300 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800">Plantilla no encontrada</h2>
        <p className="text-slate-500 mt-2">
          La plantilla que buscas no existe o ha sido eliminada.
        </p>
        <Link href="/plantillas">
          <span className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
             <ChevronLeft className="h-4 w-4" />
             Volver a Plantillas
          </span>
        </Link>
      </div>
    );
  }

  // Pasamos los datos al componente de cliente que manejará la edición
  return <TemplateDetailClient initialTemplate={template} />;
}