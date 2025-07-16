'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Settings, CheckCircle, AlertTriangle, Clock, FolderSync as Sync, Shield, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  checkSyncPermissions, 
  getUserRole, 
  syncEventsFromGoogle,
  getCalendarStats 
} from '@/features/calendario/actions';
import { useToast } from '@/hooks/use-toast';

interface CalendarSyncPanelProps {
  userId: string;
}

interface SyncStatus {
  hasPermissions: boolean;
  userRole: string;
  lastSync?: Date;
  syncEnabled: boolean;
  eventCount: {
    today: number;
    thisWeek: number;
    total: number;
  };
}

export function CalendarSyncPanel({ userId }: CalendarSyncPanelProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    hasPermissions: false,
    userRole: 'ABOGADO',
    syncEnabled: false,
    eventCount: { today: 0, thisWeek: 0, total: 0 }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  // Cargar estado inicial
  useEffect(() => {
    const loadSyncStatus = async () => {
      try {
        const [permissions, role, stats] = await Promise.all([
          checkSyncPermissions(userId),
          getUserRole(userId),
          getCalendarStats()
        ]);

        setSyncStatus({
          hasPermissions: permissions,
          userRole: role,
          syncEnabled: permissions,
          eventCount: stats,
          lastSync: new Date() // Esto vendría de tu configuración
        });
      } catch (error) {
        console.error('Error loading sync status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSyncStatus();
  }, [userId]);

  const handleSyncEvents = async () => {
    if (!syncStatus.hasPermissions) {
      toast({
        title: "Sin permisos",
        description: "No tiene permisos para sincronizar eventos con Google Calendar",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncEventsFromGoogle();
      
      if (result.success) {
        toast({
          title: "Sincronización completada",
          description: `Se sincronizaron ${result.syncedEvents} eventos desde Google Calendar`,
          variant: "success"
        });
        
        // Actualizar estadísticas
        const newStats = await getCalendarStats();
        setSyncStatus(prev => ({
          ...prev,
          eventCount: newStats,
          lastSync: new Date()
        }));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Error de sincronización",
        description: (error as Error).message || "No se pudo completar la sincronización",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SOCIO': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'ADMIN': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ABOGADO': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'ASISTENTE': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="animate-spin">
              <RefreshCw className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm text-gray-600">Cargando configuración...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sync className="h-5 w-5 text-amber-600" />
                Sincronización con Google Calendar
              </CardTitle>
              <CardDescription>
                Configuración y estado de la integración con Google Calendar
              </CardDescription>
            </div>
            <Badge className={getRoleColor(syncStatus.userRole)}>
              <Shield className="h-3 w-3 mr-1" />
              {syncStatus.userRole}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Permission Status */}
          <Alert className={syncStatus.hasPermissions ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}>
            {syncStatus.hasPermissions ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
            <AlertDescription className={syncStatus.hasPermissions ? "text-green-800" : "text-amber-800"}>
              {syncStatus.hasPermissions ? (
                "Tienes permisos para sincronizar eventos con Google Calendar. Los eventos que crees se añadirán automáticamente a tu calendario de Google."
              ) : (
                "Como usuario con rol de " + syncStatus.userRole + ", puedes ver y crear eventos, pero solo los usuarios con rol de SOCIO o ADMIN pueden sincronizar con Google Calendar."
              )}
            </AlertDescription>
          </Alert>

          {/* Sync Controls */}
          {syncStatus.hasPermissions && (
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={syncStatus.syncEnabled} 
                    onCheckedChange={(checked) => 
                      setSyncStatus(prev => ({ ...prev, syncEnabled: checked }))
                    }
                  />
                  <span className="text-sm font-medium text-amber-900">
                    Sincronización automática
                  </span>
                </div>
              </div>
              <Button
                onClick={handleSyncEvents}
                disabled={isSyncing}
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sincronizar ahora
                  </>
                )}
              </Button>
            </div>
          )}

          <Separator />

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{syncStatus.eventCount.today}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Hoy
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{syncStatus.eventCount.thisWeek}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" />
                Esta semana
              </div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{syncStatus.eventCount.total}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                Total
              </div>
            </div>
          </div>

          {/* Last Sync Info */}
          {syncStatus.lastSync && (
            <div className="text-xs text-gray-500 text-center pt-2 border-t">
              Última sincronización: {syncStatus.lastSync.toLocaleString('es-ES')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            Configuración de n8n
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>Para configurar la integración:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>Configura un workflow en n8n con los webhooks necesarios</li>
              <li>Conecta n8n con tu cuenta de Google Calendar</li>
              <li>Configura las variables de entorno N8N_WEBHOOK_BASE_URL y N8N_WEBHOOK_SECRET</li>
              <li>Los eventos se sincronizarán automáticamente</li>
            </ol>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-amber-800 text-xs">
                <strong>Nota:</strong> Solo los usuarios con rol de SOCIO o ADMIN pueden sincronizar eventos. 
                Todos los usuarios pueden ver el calendario y crear eventos locales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}