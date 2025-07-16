"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FileText, CheckSquare, Building, Activity,
  TrendingUp, AlertCircle, Clock, BarChart3, Shield,
  Settings, Database, Eye, UserCheck, Calendar,
  Zap, Target, Award, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSystemStats, getActivityLog, type SystemStats, type ActivityLog } from '../actions';
import { formatDate } from '@/lib/utils'; // Asegúrate de que esta utilidad exista
import Link from 'next/link';

export function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, activitiesData] = await Promise.all([
          getSystemStats(),
          getActivityLog(20)
        ]);
        setStats(statsData);
        setActivities(activitiesData);
      } catch (error) {
        console.error('Error loading admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {/* Loader en tonos grises con un toque dorado */}
          <div className="w-20 h-20 border-4 border-gray-200 rounded-full animate-spin border-t-amber-500 mx-auto mb-4"></div>
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-amber-300 rounded-full animate-ping mx-auto"></div>
          <div className="text-gray-700 font-medium">Cargando panel de administración...</div>
        </div>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CASE_CREATED': return FileText;
      case 'TASK_ASSIGNED': return CheckSquare;
      case 'USER_ASSIGNED': return Users;
      case 'CLIENT_ADDED': return Building;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    // Usamos colores específicos con fondos claros y texto oscuro
    switch (type) {
      case 'CASE_CREATED': return 'text-green-700 bg-green-100';
      case 'TASK_ASSIGNED': return 'text-blue-700 bg-blue-100';
      case 'USER_ASSIGNED': return 'text-purple-700 bg-purple-100';
      case 'CLIENT_ADDED': return 'text-orange-700 bg-orange-100'; // Ligeramente naranja para clientes
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans"> {/* Fondo general muy claro */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-200"> {/* Fondo blanco, borde y sombra sutil */}
              <Shield className="h-8 w-8 text-amber-600" /> {/* Icono principal en dorado */}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">
                Panel de Administración
              </h1>
              <p className="text-gray-600">
                Gestión completa del sistema Vilmega
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/usuarios">
              <Button className="bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 gap-2"> {/* Botón principal en dorado */}
                <Users className="h-4 w-4" />
                Gestionar Usuarios
              </Button>
            </Link>
            <Link href="/admin/configuracion">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 gap-2"> {/* Botón outline en gris */}
                <Settings className="h-4 w-4" />
                Configuración
              </Button>
            </Link>
            <Link href="/admin/reportes">
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100 gap-2"> {/* Botón outline en gris */}
                <BarChart3 className="h-4 w-4" />
                Reportes
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8"
          >
            {[
              { title: 'Usuarios', value: stats.totalUsers, icon: Users, color: 'amber', trend: '+5%' },
              { title: 'Casos', value: stats.totalCases, icon: FileText, color: 'green', trend: '+12%' },
              { title: 'Tareas', value: stats.totalTasks, icon: CheckSquare, color: 'blue', trend: '+8%' },
              { title: 'Clientes', value: stats.totalClients, icon: Building, color: 'purple', trend: '+15%' },
              { title: 'Plantillas', value: stats.totalTemplates, icon: Database, color: 'pink', trend: '+3%' },
              { title: 'Casos Activos', value: stats.activeCases, icon: TrendingUp, color: 'emerald', trend: '+7%' },
              { title: 'Tareas Pendientes', value: stats.pendingTasks, icon: Clock, color: 'orange', trend: '-2%' },
              { title: 'Actividad Reciente', value: stats.recentActivity, icon: Activity, color: 'indigo', trend: '+25%' },
            ].map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                >
                  <Card className="relative overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        {/* Eliminado gradiente - color sólido base para el icono */}
                        <div className={`p-2 rounded-lg bg-${stat.color}-100 group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className={`h-4 w-4 text-${stat.color}-600`} />
                        </div>
                        {/* Badge con color específico, sin borde para un look más limpio */}
                        <Badge className={`text-xs text-${stat.color}-600 bg-${stat.color}-100`}>
                          {stat.trend}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                        <div className="text-xs font-medium text-gray-600">{stat.title}</div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-96 bg-white border border-gray-200"> {/* TabsList en gris neutro */}
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-transparent flex items-center gap-2 text-gray-700 hover:text-gray-900" // TabsTrigger en dorado al activarse
            >
              <Eye className="h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-transparent flex items-center gap-2 text-gray-700 hover:text-gray-900" // TabsTrigger en dorado al activarse
            >
              <Activity className="h-4 w-4" />
              Actividad
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-sm data-[state=active]:border-transparent flex items-center gap-2 text-gray-700 hover:text-gray-900" // TabsTrigger en dorado al activarse
            >
              <Settings className="h-4 w-4" />
              Sistema
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Health */}
              <Card className="border border-gray-200 shadow-sm"> {/* Borde gris, sombra sutil */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800"> {/* Título en gris oscuro */}
                    <Zap className="h-5 w-5 text-amber-500" /> {/* Icono en dorado */}
                    Estado del Sistema
                  </CardTitle>
                  <CardDescription className="text-gray-600">Indicadores de salud del sistema</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">Base de Datos</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Operativo</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-green-800">Autenticación</span>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Operativo</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200"> {/* Fondo ambar claro */}
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="font-medium text-amber-800">Almacenamiento</span>
                    </div>
                    <Badge className="bg-amber-100 text-amber-800">Advertencia</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border border-gray-200 shadow-sm"> {/* Borde gris, sombra sutil */}
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800"> {/* Título en gris oscuro */}
                    <Target className="h-5 w-5 text-amber-500" /> {/* Icono en dorado */}
                    Métricas Clave
                  </CardTitle>
                  <CardDescription className="text-gray-600">Indicadores de rendimiento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stats && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Tasa de Casos Activos</span>
                        <span className="text-lg font-bold text-green-600"> {/* Verde para indicar "positivo" */}
                          {Math.round((stats.activeCases / Math.max(stats.totalCases, 1)) * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Tareas por Usuario</span>
                        <span className="text-lg font-bold text-amber-600"> {/* Dorado para métrica clave */}
                          {Math.round(stats.totalTasks / Math.max(stats.totalUsers, 1))}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Clientes por Caso</span>
                        <span className="text-lg font-bold text-blue-600"> {/* Azul para otra métrica */}
                          {(stats.totalClients / Math.max(stats.totalCases, 1)).toFixed(1)}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="border border-gray-200 shadow-sm"> {/* Borde gris, sombra sutil */}
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-800"> {/* Título en gris oscuro */}
                  <Activity className="h-5 w-5 text-amber-500" /> {/* Icono en dorado */}
                  Actividad Reciente del Sistema
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Últimas {activities.length} actividades registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.map((activity, index) => {
                    const IconComponent = getActivityIcon(activity.type);
                    const colorClass = getActivityColor(activity.type);

                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className={`p-2 rounded-lg ${colorClass}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-gray-900 truncate">
                              {activity.title}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {formatDate(activity.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`border-gray-300 text-gray-700 text-xs`}>
                              {activity.type}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              por {activity.userName}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Users className="h-5 w-5 text-amber-500" />
                    Gestión de Usuarios
                  </CardTitle>
                  <CardDescription className="text-gray-600">Administrar cuentas de usuario</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Total de usuarios</span>
                      <Badge className="bg-gray-100 text-gray-700">{stats?.totalUsers || 0}</Badge>
                    </div>
                    <Link href="/admin/usuarios">
                      <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Gestionar Usuarios
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <Settings className="h-5 w-5 text-amber-500" />
                    Configuración
                  </CardTitle>
                  <CardDescription className="text-gray-600">Configuración del sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Configuraciones</span>
                      <Badge className="bg-gray-100 text-gray-700">Activas</Badge>
                    </div>
                    <Link href="/admin/configuracion">
                      <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                        <Settings className="h-4 w-4 mr-2" />
                        Configurar Sistema
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <BarChart3 className="h-5 w-5 text-amber-500" />
                    Reportes
                  </CardTitle>
                  <CardDescription className="text-gray-600">Análisis y reportes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">Reportes disponibles</span>
                      <Badge className="bg-gray-100 text-gray-700">15</Badge>
                    </div>
                    <Link href="/admin/reportes">
                      <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Ver Reportes
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}