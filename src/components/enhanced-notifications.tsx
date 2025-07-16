'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  Clock, 
  Activity, 
  FileText, 
  CheckSquare, 
  Users, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  MapPin,
  User,
  Building,
  Archive,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from '@/components/ui/separator';
import { MovementWithRelations } from '@/lib/types';
import { getUnreadMovements, markMovementsAsRead } from '@/features/movimientos/actions';

interface EnhancedNotificationsProps {
  userId: string;
}

interface NotificationGroup {
  type: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  notifications: MovementWithRelations[];
}

export const EnhancedNotifications: React.FC<EnhancedNotificationsProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<MovementWithRelations[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);

  const loadNotifications = async () => {
    if (!userId) return;
    
    try {
      setLoadingNotifications(true);
      const unreadMovements = await getUnreadMovements(userId);
      setNotifications(unreadMovements);
      
      // Group notifications by type
      const groupedNotifications = groupNotificationsByType(unreadMovements);
      setGroups(groupedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const groupNotificationsByType = (movements: MovementWithRelations[]): NotificationGroup[] => {
    const typeGroups: { [key: string]: MovementWithRelations[] } = {};
    
    movements.forEach(movement => {
      if (!typeGroups[movement.type]) {
        typeGroups[movement.type] = [];
      }
      typeGroups[movement.type].push(movement);
    });

    return Object.entries(typeGroups).map(([type, notifications]) => ({
      type,
      title: getTypeTitle(type),
      count: notifications.length,
      icon: getTypeIcon(type),
      color: getTypeColor(type),
      notifications
    }));
  };

  const getTypeTitle = (type: string): string => {
    const titles: { [key: string]: string } = {
      'CASE_CREATED': 'Casos Nuevos',
      'CASE_UPDATED': 'Casos Actualizados',
      'CASE_CLOSED': 'Casos Cerrados',
      'TASK_ASSIGNED': 'Tareas Asignadas',
      'DOCUMENT_UPLOADED': 'Documentos Subidos',
      'CLIENT_ADDED': 'Clientes Nuevos',
      'USER_ASSIGNED': 'Usuarios Asignados'
    };
    return titles[type] || type;
  };

  const getTypeIcon = (type: string): React.ReactNode => {
    const icons: { [key: string]: React.ReactNode } = {
      'CASE_CREATED': <FileText className="w-4 h-4" />,
      'CASE_UPDATED': <Activity className="w-4 h-4" />,
      'CASE_CLOSED': <Archive className="w-4 h-4" />,
      'TASK_ASSIGNED': <CheckSquare className="w-4 h-4" />,
      'DOCUMENT_UPLOADED': <FileText className="w-4 h-4" />,
      'CLIENT_ADDED': <Building className="w-4 h-4" />,
      'USER_ASSIGNED': <Users className="w-4 h-4" />
    };
    return icons[type] || <Activity className="w-4 h-4" />;
  };

  const getTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'CASE_CREATED': 'text-green-600 bg-green-100 dark:bg-green-900/20',
      'CASE_UPDATED': 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      'CASE_CLOSED': 'text-gray-600 bg-gray-100 dark:bg-gray-900/20',
      'TASK_ASSIGNED': 'text-orange-600 bg-orange-100 dark:bg-orange-900/20',
      'DOCUMENT_UPLOADED': 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      'CLIENT_ADDED': 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/20',
      'USER_ASSIGNED': 'text-pink-600 bg-pink-100 dark:bg-pink-900/20'
    };
    return colors[type] || 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
  };

  const formatNotificationTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Ahora';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`;
    return `${Math.floor(diffMinutes / 1440)}d`;
  };

  const getNotificationLink = (notification: MovementWithRelations): string => {
    switch (notification.type) {
      case 'CASE_CREATED':
      case 'CASE_UPDATED':
      case 'CASE_CLOSED':
        return notification.entityId ? `/casos/${notification.entityId}` : '/casos';
      case 'TASK_ASSIGNED':
        return '/tareas';
      case 'CLIENT_ADDED':
        return '/clientes';
      default:
        return '/movimientos';
    }
  };

  const handleNotificationClick = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && userId) {
      // Mark as read when opening notifications
      await markMovementsAsRead(userId);
      // Refresh after marking as read
      setTimeout(loadNotifications, 500);
    }
  };

  // Load notifications on mount and periodically
  useEffect(() => {
    if (userId) {
      loadNotifications();
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const totalNotifications = notifications.length;

  return (
    <Popover open={showNotifications} onOpenChange={setShowNotifications}>
      <PopoverTrigger asChild>
        <button 
          className="relative p-2 rounded-xl text-gray-400 hover:text-blue-400 hover:bg-white/10 dark:hover:bg-gray-800/60 transition-all duration-300 hover:scale-105 group"
          onClick={handleNotificationClick}
        >
          {/* Efecto de bloom */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm rounded-xl"></div>
          
          <div className="relative z-10">
            <Bell className="w-5 h-5" />
            {totalNotifications > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 w-6 h-6 text-[10px] flex items-center justify-center p-0 animate-pulse bg-gradient-to-r from-orange-500 to-red-500 text-white border-2 border-white dark:border-gray-900 shadow-lg"
              >
                {totalNotifications > 99 ? '99+' : totalNotifications}
              </Badge>
            )}
          </div>
        </button>
      </PopoverTrigger>
      
      <PopoverContent className="w-96 p-0" align="end">
        <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/20 dark:border-gray-700/50">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Notificaciones
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {totalNotifications} nuevas actualizaciones
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {loadingNotifications && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadNotifications}
                  className="h-8 w-8 p-0 hover:bg-blue-500/20"
                >
                  <Activity className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Notification Groups */}
          <div className="max-h-96 overflow-y-auto">
            {totalNotifications === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Todo al día
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No hay notificaciones nuevas por el momento
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
                {groups.map((group) => (
                  <div key={group.type} className="p-4">
                    {/* Group Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${group.color}`}>
                          {group.icon}
                        </div>
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {group.title}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {group.count}
                        </Badge>
                      </div>
                    </div>

                    {/* Group Notifications */}
                    <div className="space-y-2">
                      {group.notifications.slice(0, 3).map((notification) => (
                        <Link
                          key={notification.id}
                          href={getNotificationLink(notification)}
                          className="block p-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 rounded-lg transition-all duration-200 group/item"
                          onClick={() => setShowNotifications(false)}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar className="w-8 h-8 flex-shrink-0">
                              <AvatarFallback className="bg-blue-500 text-white text-xs">
                                {notification.createdByUser?.firstName?.[0] || 'S'}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                                {notification.description}
                              </p>
                              <div className="flex items-center space-x-3 mt-2">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatNotificationTime(new Date(notification.createdAt))}
                                  </span>
                                </div>
                                {notification.createdByUser && (
                                  <>
                                    <span className="text-gray-400">•</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {notification.createdByUser.firstName} {notification.createdByUser.lastName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            
                            <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                          </div>
                        </Link>
                      ))}
                      
                      {group.notifications.length > 3 && (
                        <div className="text-center pt-2">
                          <Link
                            href="/movimientos"
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            onClick={() => setShowNotifications(false)}
                          >
                            Ver {group.notifications.length - 3} más de {group.title}
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {totalNotifications > 0 && (
            <div className="px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50 rounded-b-xl">
              <div className="flex items-center justify-between">
                <Link
                  href="/movimientos"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                  onClick={() => setShowNotifications(false)}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Ver todos los movimientos</span>
                </Link>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markMovementsAsRead(userId)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Marcar todo como leído
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EnhancedNotifications;