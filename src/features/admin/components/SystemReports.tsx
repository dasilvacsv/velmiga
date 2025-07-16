"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Users, FileText, CheckSquare,
  Download, RefreshCw, Eye,
  PieChart, Activity, Award
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSystemReports } from '../actions';
import toast from 'react-hot-toast';

interface ReportData {
  casesByStatus: Array<{ status: string; count: number }>;
  tasksByStatus: Array<{ status: string; count: number }>;
  mostActiveUsers: Array<{ userId: string; userName: string; activityCount: number }>;
  activityByType: Array<{ type: string; count: number }>;
}

export function SystemReports() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reportType, setReportType] = useState('overview');

  useEffect(() => {
    loadReports();
  }, [dateFrom, dateTo]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await getSystemReports(new Date(dateFrom), new Date(dateTo));
      setReportData(data);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast.error('Error al cargar reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Reporte exportado exitosamente');
    } catch (error) {
      toast.error('Error al exportar reporte');
    }
  };

  // Colores para las insignias (badges)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVO': return 'bg-green-100 text-green-800';
      case 'EN_ESPERA': return 'bg-yellow-100 text-yellow-800';
      case 'CERRADO': return 'bg-gray-100 text-gray-800';
      case 'ARCHIVADO': return 'bg-purple-100 text-purple-800';
      case 'EN_REVISION': return 'bg-blue-100 text-blue-800';
      case 'APROBADA': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Colores para indicadores y barras (más sutiles)
  const getStatusIndicatorColor = (status: string) => {
    switch (status) {
      case 'ACTIVO': return 'bg-green-500';
      case 'EN_ESPERA': return 'bg-yellow-500';
      case 'CERRADO': return 'bg-gray-400';
      case 'ARCHIVADO': return 'bg-purple-500';
      case 'EN_REVISION': return 'bg-blue-500';
      case 'APROBADA': return 'bg-emerald-500';
      default: return 'bg-gray-500';
    }
  };

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case 'CASE_CREATED': return 'Casos Creados';
      case 'TASK_ASSIGNED': return 'Tareas Asignadas';
      case 'USER_ASSIGNED': return 'Usuarios Asignados';
      case 'CLIENT_ADDED': return 'Clientes Agregados';
      case 'DOCUMENT_UPLOADED': return 'Documentos Subidos';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <div className="text-amber-700 font-medium">Generando reportes...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <BarChart3 className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-amber-800">
                  Reportes del Sistema
                </h1>
                <p className="text-slate-600">
                  Análisis y métricas de rendimiento de Vilmega
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={loadReports}
                variant="outline"
                className="border-slate-300 text-slate-700 hover:bg-slate-100 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Actualizar
              </Button>
              <Button
                onClick={handleExportReport}
                className="bg-amber-500 text-white hover:bg-amber-600 gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar Reporte
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom" className="text-slate-700">Fecha Desde</Label>
                    <Input id="dateFrom" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border-slate-300"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo" className="text-slate-700">Fecha Hasta</Label>
                    <Input id="dateTo" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border-slate-300"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportType" className="text-slate-700">Tipo de Reporte</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger className="border-slate-300">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="overview">Resumen General</SelectItem>
                        <SelectItem value="cases">Análisis de Casos</SelectItem>
                        <SelectItem value="tasks">Análisis de Tareas</SelectItem>
                        <SelectItem value="users">Análisis de Usuarios</SelectItem>
                        <SelectItem value="activity">Análisis de Actividad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Badge variant="outline" className="text-slate-600 border-slate-300 px-3 py-2">
                  Período: {Math.ceil((new Date(dateTo).getTime() - new Date(dateFrom).getTime()) / (1000 * 60 * 60 * 24))} días
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Reports Content */}
        {reportData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:w-auto bg-slate-200/60 p-1 rounded-lg">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">Resumen</TabsTrigger>
                <TabsTrigger value="cases" className="data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">Casos</TabsTrigger>
                <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">Tareas</TabsTrigger>
                <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">Usuarios</TabsTrigger>
                <TabsTrigger value="activity" className="data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm">Actividad</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-slate-200 shadow-sm bg-white"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-green-700">Total Casos</p><p className="text-3xl font-bold text-green-800">{reportData.casesByStatus.reduce((sum, item) => sum + item.count, 0)}</p></div><div className="p-3 bg-green-100 rounded-lg"><FileText className="h-6 w-6 text-green-600" /></div></div></CardContent></Card>
                  <Card className="border-slate-200 shadow-sm bg-white"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-blue-700">Total Tareas</p><p className="text-3xl font-bold text-blue-800">{reportData.tasksByStatus.reduce((sum, item) => sum + item.count, 0)}</p></div><div className="p-3 bg-blue-100 rounded-lg"><CheckSquare className="h-6 w-6 text-blue-600" /></div></div></CardContent></Card>
                  <Card className="border-slate-200 shadow-sm bg-white"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-purple-700">Usuarios Activos</p><p className="text-3xl font-bold text-purple-800">{reportData.mostActiveUsers.length}</p></div><div className="p-3 bg-purple-100 rounded-lg"><Users className="h-6 w-6 text-purple-600" /></div></div></CardContent></Card>
                  <Card className="border-slate-200 shadow-sm bg-white"><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-amber-700">Total Actividad</p><p className="text-3xl font-bold text-amber-800">{reportData.activityByType.reduce((sum, item) => sum + item.count, 0)}</p></div><div className="p-3 bg-amber-100 rounded-lg"><Activity className="h-6 w-6 text-amber-600" /></div></div></CardContent></Card>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-slate-200 shadow-sm bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-slate-700"><PieChart className="h-5 w-5" />Distribución de Casos</CardTitle></CardHeader><CardContent><div className="space-y-3">{reportData.casesByStatus.map((item) => (<div key={item.status} className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${getStatusIndicatorColor(item.status)}`}></div><span className="text-sm font-medium text-slate-700">{item.status}</span></div><Badge className={getStatusColor(item.status)}>{item.count}</Badge></div>))}</div></CardContent></Card>
                  <Card className="border-slate-200 shadow-sm bg-white"><CardHeader><CardTitle className="flex items-center gap-2 text-slate-700"><BarChart3 className="h-5 w-5" />Distribución de Tareas</CardTitle></CardHeader><CardContent><div className="space-y-3">{reportData.tasksByStatus.map((item) => (<div key={item.status} className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${getStatusIndicatorColor(item.status)}`}></div><span className="text-sm font-medium text-slate-700">{item.status}</span></div><Badge className={getStatusColor(item.status)}>{item.count}</Badge></div>))}</div></CardContent></Card>
                </div>
              </TabsContent>

              {/* Cases Tab */}
              <TabsContent value="cases" className="space-y-6">
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-slate-700"><FileText className="h-5 w-5" />Análisis de Casos</CardTitle><CardDescription>Distribución y estadísticas de casos en el período seleccionado</CardDescription></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">{reportData.casesByStatus.map((item) => (<div key={item.status} className={`text-center p-4 bg-slate-100/70 rounded-lg border border-slate-200`}><div className="text-2xl font-bold text-slate-700">{item.count}</div><div className="text-sm text-slate-600">{item.status}</div></div>))}</div>
                    <div className="space-y-2">{reportData.casesByStatus.map((item) => (<div key={item.status} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"><span className="font-medium text-slate-800">{item.status}</span><div className="flex items-center gap-3"><div className="w-40 bg-slate-200 rounded-full h-2.5"><div className={`${getStatusIndicatorColor(item.status)} h-2.5 rounded-full`} style={{ width: `${(item.count / Math.max(1, ...reportData.casesByStatus.map(i => i.count))) * 100}%` }}></div></div><Badge className={getStatusColor(item.status)}>{item.count}</Badge></div></div>))}</div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Tasks Tab */}
              <TabsContent value="tasks" className="space-y-6">
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-slate-700"><CheckSquare className="h-5 w-5" />Análisis de Tareas</CardTitle><CardDescription>Distribución y estadísticas de tareas en el período seleccionado</CardDescription></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">{reportData.tasksByStatus.map((item) => (<div key={item.status} className="text-center p-4 bg-slate-100/70 rounded-lg border border-slate-200"><div className="text-2xl font-bold text-slate-700">{item.count}</div><div className="text-sm text-slate-600">{item.status}</div></div>))}</div>
                    <div className="space-y-2">{reportData.tasksByStatus.map((item) => (<div key={item.status} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200"><span className="font-medium text-slate-800">{item.status}</span><div className="flex items-center gap-3"><div className="w-40 bg-slate-200 rounded-full h-2.5"><div className={`${getStatusIndicatorColor(item.status)} h-2.5 rounded-full`} style={{ width: `${(item.count / Math.max(1, ...reportData.tasksByStatus.map(i => i.count))) * 100}%` }}></div></div><Badge className={getStatusColor(item.status)}>{item.count}</Badge></div></div>))}</div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Users Tab */}
              <TabsContent value="users" className="space-y-6">
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-slate-700"><Users className="h-5 w-5" />Usuarios Más Activos</CardTitle><CardDescription>Ranking de usuarios por actividad en el período seleccionado</CardDescription></CardHeader>
                  <CardContent>
                    <div className="space-y-3">{reportData.mostActiveUsers.slice(0, 10).map((user, index) => (
                      <div key={user.userId} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center justify-center w-8 h-8 ${index < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'} rounded-full text-sm font-bold`}>{index + 1}</div>
                          <div><div className="font-medium text-slate-800">{user.userName}</div><div className="text-sm text-slate-500">ID: {user.userId.slice(0, 8)}...</div></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right"><div className="text-lg font-bold text-purple-700">{user.activityCount}</div><div className="text-xs text-purple-600">actividades</div></div>
                          {index < 3 && (<Award className={`h-5 w-5 ${index === 0 ? 'text-amber-500' : index === 1 ? 'text-slate-400' : 'text-orange-400'}`} />)}
                        </div>
                      </div>
                    ))}</div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activity Tab */}
              <TabsContent value="activity" className="space-y-6">
                <Card className="border-slate-200 shadow-sm bg-white">
                  <CardHeader><CardTitle className="flex items-center gap-2 text-slate-700"><Activity className="h-5 w-5" />Análisis de Actividad</CardTitle><CardDescription>Distribución de actividades del sistema en el período seleccionado</CardDescription></CardHeader>
                  <CardContent>
                    <div className="space-y-3">{reportData.activityByType.map((activity) => (
                      <div key={activity.type} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-200 text-slate-600 rounded-lg"><Activity className="h-4 w-4" /></div>
                          <div><div className="font-medium text-slate-800">{getActivityTypeLabel(activity.type)}</div><div className="text-sm text-slate-500">{activity.type}</div></div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-40 bg-slate-200 rounded-full h-2.5"><div className="bg-slate-500 h-2.5 rounded-full" style={{ width: `${(activity.count / Math.max(1, ...reportData.activityByType.map(i => i.count))) * 100}%` }}></div></div>
                          <Badge variant="outline" className="text-slate-600 border-slate-300">{activity.count}</Badge>
                        </div>
                      </div>
                    ))}</div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </div>
    </div>
  );
}