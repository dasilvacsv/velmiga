import React from 'react';
import { 
  Calendar, User, Eye, Edit3, Trash2, Send, 
  AlertCircle, Clock, FileText, Star 
} from 'lucide-react';
import { NewsWithRelations } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface NewsCardProps {
  news: NewsWithRelations;
  onView: (news: NewsWithRelations) => void;
  onEdit: (news: NewsWithRelations) => void;
  onDelete: (news: NewsWithRelations) => void;
  onPublish?: (news: NewsWithRelations) => void;
}

export function NewsCard({ news, onView, onEdit, onDelete, onPublish }: NewsCardProps) {
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
      case 'ALTA': return <Star className="h-4 w-4 text-red-500" />;
      case 'MEDIA': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const isPublished = news.publishedAt && news.status === 'ACTIVE';

  return (
    <div className="bg-white rounded-xl shadow-orange border border-gray-100 p-6 hover-lift group">
      <div className="flex items-start justify-between mb-4">
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
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-orange-600 transition-colors cursor-pointer"
          onClick={() => onView(news)}>
        {news.title}
      </h3>

      {news.summary && (
        <p className="text-gray-600 mb-4 line-clamp-3">
          {news.summary}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1" />
            {news.createdByUser ? `${news.createdByUser.firstName} ${news.createdByUser.lastName}` : 'Usuario'}
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {new Date(news.createdAt).toLocaleDateString('es-ES')}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(news)}
            className="hover:bg-orange-50 hover:text-orange-600"
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(news)}
            className="hover:bg-blue-50 hover:text-blue-600"
          >
            <Edit3 className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          {!isPublished && onPublish && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPublish(news)}
              className="hover:bg-green-50 hover:text-green-600"
            >
              <Send className="h-4 w-4 mr-1" />
              Publicar
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(news)}
            className="hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}