'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { 
  Plus, Search, Filter, RefreshCw, Newspaper, Send, Eye, Clock, 
  FileText, TrendingUp, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

import { NewsWithRelations, User } from '@/lib/types';
import { 
  getNews, 
  deleteNews,
  publishNews,
  getNewsStats,
  getUsersForNews,
  searchNews
} from '@/features/novedades/actions'; // Asegúrate que la ruta a tus actions sea correcta

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NewsCard } from '@/features/novedades/components/NewsCard';
import { NewsForm } from '@/features/novedades/components/NewsForm';
import { NewsDetailModal } from '@/features/novedades/components/NewsDetailModal';

export default function NovedadesPage() {
  const [newsList, setNewsList] = useState<NewsWithRelations[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<any>({ total: 0, active: 0, inactive: 0, published: 0, drafts: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, startRefreshTransition] = useTransition();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsWithRelations | undefined>();
  const [selectedNews, setSelectedNews] = useState<NewsWithRelations | undefined>();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [searchTerm]);

  const loadData = async () => {
    try {
      // No establecemos setLoading a true aquí para no mostrar el esqueleto de carga en cada búsqueda
      if (loading) setLoading(true); 
      const [newsData, usersData, statsData] = await Promise.all([
        searchTerm ? searchNews(searchTerm) : getNews(),
        getUsersForNews(),
        getNewsStats()
      ]);
      setNewsList(newsData);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error("Error al cargar los datos", { 
        description: error instanceof Error ? error.message : "No se pudo obtener la información del servidor." 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    startRefreshTransition(async () => {
      await loadData();
      toast.success("Datos actualizados", {
        description: "La información se ha sincronizado correctamente.",
      });
    });
  };

  const handleCreate = () => {
    setEditingNews(undefined);
    setIsFormOpen(true);
  };

  const handleEdit = (news: NewsWithRelations) => {
    setEditingNews(news);
    setIsFormOpen(true);
  };

  const handleView = (news: NewsWithRelations) => {
    setSelectedNews(news);
    setIsDetailOpen(true);
  };

  const handleDelete = async (news: NewsWithRelations) => {
    toast(`¿Seguro que quieres eliminar "${news.title}"?`, {
      action: {
        label: "Confirmar",
        onClick: async () => {
          try {
            await deleteNews(news.id);
            await loadData();
            toast.success("Novedad eliminada");
          } catch (error) {
            toast.error("Error al eliminar", { description: error instanceof Error ? error.message : "No se pudo completar la acción." });
          }
        },
      },
      cancel: { label: "Cancelar" },
    });
  };

  const handlePublish = async (news: NewsWithRelations) => {
    try {
      await publishNews(news.id);
      await loadData();
      toast.success("Novedad publicada", { description: `"${news.title}" ahora es visible para todos.` });
    } catch (error) {
      toast.error("Error al publicar", { description: error instanceof Error ? error.message : "No se pudo publicar la novedad." });
    }
  };

  const filteredNews = newsList.filter(news => {
    const matchesCategory = categoryFilter === 'all' || news.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'published' && news.publishedAt && news.status === 'ACTIVE') ||
                          (statusFilter === 'draft' && (!news.publishedAt || news.status === 'INACTIVE'));
    return matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8 animate-in fade-in-0">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="animate-in slide-in-from-bottom-5" style={{ animationDelay: '100ms' }}>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Gestión de Novedades
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Administra anuncios, noticias y actualizaciones del despacho
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3 animate-in slide-in-from-bottom-5" style={{ animationDelay: '200ms' }}>
              <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing || loading} className="hover-lift">
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Button 
                onClick={handleCreate} 
                variant="orange" 
                className="px-6 py-3 text-base font-semibold hover-lift shadow-orange"
                disabled={loading || isRefreshing} // <-- LA SOLUCIÓN
              >
                <Plus className="h-5 w-5 mr-2" />
                Nueva Novedad
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 animate-in fade-in-0" style={{ animationDelay: '300ms' }}>
             {[
               { label: 'Total Novedades', value: stats.total, icon: FileText, color: 'from-blue-500 to-blue-600' },
               { label: 'Activas', value: stats.active, icon: TrendingUp, color: 'from-green-500 to-green-600' },
               { label: 'Publicadas', value: stats.published, icon: Send, color: 'from-purple-500 to-purple-600' },
               { label: 'Borradores', value: stats.drafts, icon: Eye, color: 'from-yellow-500 to-yellow-600' },
               { label: 'Inactivas', value: stats.inactive, icon: Clock, color: 'from-gray-500 to-gray-600' },
               { label: 'Este Mes', value: stats.thisMonth, icon: Calendar, color: 'from-orange-500 to-orange-600' },
             ].map((stat, index) => (
               <div key={stat.label} className="bg-white rounded-xl shadow-orange border border-gray-100 p-6 hover-lift animate-in fade-in-0" style={{ animationDelay: `${400 + index * 50}ms` }}>
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                     <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                   </div>
                   <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                     <stat.icon className="h-5 w-5 text-white" />
                   </div>
                 </div>
               </div>
             ))}
           </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-orange border border-gray-100 p-6 animate-in fade-in-0" style={{ animationDelay: '800ms' }}>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input type="text" placeholder="Buscar novedades por título, contenido o resumen..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 text-base"/>
              </div>
              <div className="flex space-x-3">
                {/* Categorías */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[160px] hover-lift">
                      <Filter className="h-4 w-4 mr-2" />
                      {categoryFilter === 'all' ? 'Todas las categorías' : categoryFilter.replace(/_/g, ' ')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-2">
                    <div className="space-y-1">
                        {[
                          { value: 'all', label: 'Todas las categorías' },
                          { value: 'GENERAL', label: 'General' },
                          { value: 'LEGAL_UPDATE', label: 'Actualización Legal' },
                          { value: 'FIRM_NEWS', label: 'Noticias del Despacho' },
                          { value: 'ANNOUNCEMENT', label: 'Anuncio' },
                          { value: 'TRAINING', label: 'Capacitación' },
                        ].map((option) => (
                          <button key={option.value} onClick={() => setCategoryFilter(option.value)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-orange-50 ${categoryFilter === option.value ? 'bg-orange-100 text-orange-900' : 'text-gray-700'}`}>
                            {option.label}
                          </button>
                        ))}
                    </div>
                  </PopoverContent>
                </Popover>
                {/* Estado */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-between min-w-[140px] hover-lift">
                      <Filter className="h-4 w-4 mr-2" />
                      {statusFilter === 'all' ? 'Todos' : statusFilter === 'published' ? 'Publicadas' : 'Borradores'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2">
                    <div className="space-y-1">
                      {[
                        { value: 'all', label: 'Todos los estados' },
                        { value: 'published', label: 'Publicadas' },
                        { value: 'draft', label: 'Borradores' },
                      ].map((option) => (
                        <button key={option.value} onClick={() => setStatusFilter(option.value)}
                          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors hover:bg-orange-50 ${statusFilter === option.value ? 'bg-orange-100 text-orange-900' : 'text-gray-700'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* News Grid */}
          <div className="animate-in fade-in-0" style={{ animationDelay: '900ms' }}>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {[...Array(6)].map((_, i) => (
                   <div key={i} className="bg-white rounded-xl shadow-orange border border-gray-100 p-6 animate-pulse">
                     <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div><div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div><div className="h-4 bg-gray-200 rounded w-full mb-2"></div><div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div><div className="flex justify-between"><div className="h-4 bg-gray-200 rounded w-1/4"></div><div className="h-4 bg-gray-200 rounded w-1/4"></div></div>
                   </div>
                 ))}
               </div>
            ) : filteredNews.length === 0 ? (
              <div className="bg-white rounded-xl shadow-orange border border-gray-100 p-12 text-center">
                <Newspaper className="h-16 w-16 text-gray-400 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-900 mb-2">{searchTerm ? 'No se encontraron novedades' : 'No hay novedades registradas'}</h3><p className="text-gray-600 mb-6">{searchTerm ? 'Intenta con otros términos de búsqueda o ajusta los filtros.' : 'Comienza creando tu primera novedad para mantener informado al equipo.'}</p>
                {!searchTerm && (<Button onClick={handleCreate} variant="orange"><Plus className="h-4 w-4 mr-2" />Crear Primera Novedad</Button>)}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNews.map((newsItem, index) => (
                  <div key={newsItem.id} className="animate-in fade-in-0" style={{ animationDelay: `${index * 100}ms` }}>
                    <NewsCard news={newsItem} onView={handleView} onEdit={handleEdit} onDelete={handleDelete} onPublish={handlePublish}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modals */}
          <NewsForm
            key={editingNews ? editingNews.id : 'new'}
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            onSuccess={loadData}
            news={editingNews}
            users={users}
          />

          {isDetailOpen && selectedNews && (
            <NewsDetailModal
              news={selectedNews}
              onClose={() => setIsDetailOpen(false)}
              onEdit={() => { setIsDetailOpen(false); handleEdit(selectedNews); }}
              onDelete={() => { setIsDetailOpen(false); handleDelete(selectedNews); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}