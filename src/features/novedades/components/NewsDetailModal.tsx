import React from 'react';
import { X, Calendar, User, Edit3, Trash2, Star, AlertCircle, Clock } from 'lucide-react';
import { NewsWithRelations } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface NewsDetailModalProps {
  news: NewsWithRelations;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function NewsDetailModal({ news, onClose, onEdit, onDelete }: NewsDetailModalProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'LEGAL_UPDATE': return 'bg-blue-100 text-blue-800';
      case 'FIRM_NEWS': return 'bg-green-100 text-green-800';
      case 'ANNOUNCEMENT': return 'bg-orange-100 text-orange-800';
      case 'TRAINING': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'LEGAL_UPDATE': return 'Actualización Legal';
      case 'FIRM_NEWS': return 'Noticias del Despacho';
      case 'ANNOUNCEMENT': return 'Anuncio';
      case 'TRAINING': return 'Capacitación';
      default: return 'General';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'ALTA': return <Star className="h-5 w-5 text-red-500" />;
      case 'MEDIA': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const isPublished = news.publishedAt && news.status === 'ACTIVE';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(news.category)}`}>
              {getCategoryLabel(news.category)}
            </span>
            {getPriorityIcon(news.priority)}
            {isPublished ? (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                Publicado
              </span>
            ) : (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                Borrador
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {news.title}
          </h1>

          <div className="flex items-center space-x-6 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>
                {news.createdByUser ? `${news.createdByUser.firstName} ${news.createdByUser.lastName}` : 'Usuario'}
              </span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                Creado el {new Date(news.createdAt).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
            {news.publishedAt && (
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  Publicado el {new Date(news.publishedAt).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>

          {news.summary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Resumen</h3>
              <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                {news.summary}
              </p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contenido</h3>
            <div className="prose max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {news.content}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={onEdit}
            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            onClick={onDelete}
            className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}