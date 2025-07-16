"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings, Database, Mail, Shield, Bell,
  Globe, Clock, Save, RefreshCw, AlertTriangle,
  CheckCircle, Info, Zap, Lock, Eye, EyeOff,
  Key
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface SystemConfig {
  general: {
    siteName: string;
    siteDescription: string;
    timezone: string;
    language: string;
    maintenanceMode: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
    enableSSL: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireTwoFactor: boolean;
    allowPasswordReset: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    taskReminders: boolean;
    caseUpdates: boolean;
    systemAlerts: boolean;
    reminderHours: number;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    retentionDays: number;
    backupLocation: string;
  };
}

export function SystemConfiguration() {
  const [config, setConfig] = useState<SystemConfig>({
    general: {
      siteName: 'Vilmega Legal',
      siteDescription: 'Sistema de Gestión Legal Profesional',
      timezone: 'America/Caracas',
      language: 'es',
      maintenanceMode: false,
    },
    email: {
      smtpHost: '',
      smtpPort: '587',
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@Vilmega.legal',
      fromName: 'Vilmega Legal',
      enableSSL: true,
    },
    security: {
      sessionTimeout: 480, // 8 hours in minutes
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireTwoFactor: false,
      allowPasswordReset: true,
    },
    notifications: {
      emailNotifications: true,
      taskReminders: true,
      caseUpdates: true,
      systemAlerts: true,
      reminderHours: 24,
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      retentionDays: 30,
      backupLocation: 'cloud',
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLastSaved(new Date());
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      toast.error('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Email de prueba enviado exitosamente');
    } catch (error) {
      toast.error('Error al enviar email de prueba');
    }
  };

  const handleBackupNow = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('Backup creado exitosamente');
    } catch (error) {
      toast.error('Error al crear backup');
    }
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

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
              <div className="p-3 bg-green-100 rounded-xl">
                <Settings className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-green-800">
                  Configuración del Sistema
                </h1>
                <p className="text-slate-600">
                  Administrar configuraciones globales de Vilmega
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {lastSaved && (
                <div className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Guardado: {lastSaved.toLocaleTimeString()}
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-green-600 text-white hover:bg-green-700 gap-2"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Configuration Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:w-auto bg-slate-200/60 p-1 rounded-lg">
                <TabsTrigger value="general" className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm">General</TabsTrigger>
                <TabsTrigger value="email" className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm">Email</TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm">Seguridad</TabsTrigger>
                <TabsTrigger value="notifications" className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm">Notificaciones</TabsTrigger>
                <TabsTrigger value="backup" className="data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-sm">Backup</TabsTrigger>
            </TabsList>
            
            {/* General Settings */}
            <TabsContent value="general" className="space-y-6">
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Globe className="h-5 w-5" />
                    Configuración General
                  </CardTitle>
                  <CardDescription>
                    Configuraciones básicas del sistema
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="siteName">Nombre del Sistema</Label>
                      <Input id="siteName" value={config.general.siteName} onChange={(e) => updateConfig('general', 'siteName', e.target.value)} placeholder="Nombre del sistema"/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Zona Horaria</Label>
                      <Select value={config.general.timezone} onValueChange={(value) => updateConfig('general', 'timezone', value)}>
                        <SelectTrigger><SelectValue placeholder="Seleccionar zona horaria" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Caracas">Venezuela (UTC-4)</SelectItem>
                          <SelectItem value="America/New_York">Nueva York (UTC-5)</SelectItem>
                          <SelectItem value="America/Mexico_City">México (UTC-6)</SelectItem>
                          <SelectItem value="America/Bogota">Colombia (UTC-5)</SelectItem>
                          <SelectItem value="Europe/Madrid">España (UTC+1)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="siteDescription">Descripción del Sistema</Label>
                    <Textarea id="siteDescription" value={config.general.siteDescription} onChange={(e) => updateConfig('general', 'siteDescription', e.target.value)} placeholder="Descripción del sistema" rows={3}/>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <Label htmlFor="maintenanceMode" className="text-yellow-800 font-medium">Modo de Mantenimiento</Label>
                        <p className="text-sm text-yellow-700">Activar para realizar mantenimiento del sistema</p>
                      </div>
                    </div>
                    <Switch id="maintenanceMode" checked={config.general.maintenanceMode} onCheckedChange={(checked) => updateConfig('general', 'maintenanceMode', checked)} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Settings */}
            <TabsContent value="email" className="space-y-6">
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800"><Mail className="h-5 w-5" />Configuración de Email</CardTitle>
                  <CardDescription>Configurar servidor SMTP para envío de emails</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="smtpHost">Servidor SMTP</Label><Input id="smtpHost" value={config.email.smtpHost} onChange={(e) => updateConfig('email', 'smtpHost', e.target.value)} placeholder="smtp.gmail.com"/></div>
                    <div className="space-y-2"><Label htmlFor="smtpPort">Puerto SMTP</Label><Input id="smtpPort" value={config.email.smtpPort} onChange={(e) => updateConfig('email', 'smtpPort', e.target.value)} placeholder="587"/></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="smtpUser">Usuario SMTP</Label><Input id="smtpUser" value={config.email.smtpUser} onChange={(e) => updateConfig('email', 'smtpUser', e.target.value)} placeholder="usuario@gmail.com"/></div>
                    <div className="space-y-2"><Label htmlFor="smtpPassword">Contraseña SMTP</Label><div className="relative"><Input id="smtpPassword" type={showPasswords ? "text" : "password"} value={config.email.smtpPassword} onChange={(e) => updateConfig('email', 'smtpPassword', e.target.value)} placeholder="Contraseña del servidor"/><Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3" onClick={() => setShowPasswords(!showPasswords)}>{showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></div></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2"><Label htmlFor="fromEmail">Email Remitente</Label><Input id="fromEmail" value={config.email.fromEmail} onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)} placeholder="noreply@Vilmega.legal"/></div>
                    <div className="space-y-2"><Label htmlFor="fromName">Nombre Remitente</Label><Input id="fromName" value={config.email.fromName} onChange={(e) => updateConfig('email', 'fromName', e.target.value)} placeholder="Vilmega Legal"/></div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3"><Lock className="h-5 w-5 text-green-600" /><div><Label htmlFor="enableSSL" className="text-green-800 font-medium">Habilitar SSL/TLS</Label><p className="text-sm text-green-700">Conexión segura al servidor SMTP</p></div></div>
                    <Switch id="enableSSL" checked={config.email.enableSSL} onCheckedChange={(checked) => updateConfig('email', 'enableSSL', checked)}/>
                  </div>
                  <div className="flex gap-3"><Button onClick={handleTestEmail} variant="outline" className="border-green-300 text-green-700 hover:bg-green-100"><Mail className="h-4 w-4 mr-2" />Probar Configuración</Button></div>
                </CardContent>
              </Card>
            </TabsContent>
            
             {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-green-800"><Shield className="h-5 w-5" />Configuración de Seguridad</CardTitle><CardDescription>Configurar políticas de seguridad del sistema</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2"><Label htmlFor="sessionTimeout">Tiempo de Sesión (minutos)</Label><Input id="sessionTimeout" type="number" value={config.security.sessionTimeout} onChange={(e) => updateConfig('security', 'sessionTimeout', parseInt(e.target.value))} placeholder="480"/></div>
                            <div className="space-y-2"><Label htmlFor="maxLoginAttempts">Máx. Intentos de Login</Label><Input id="maxLoginAttempts" type="number" value={config.security.maxLoginAttempts} onChange={(e) => updateConfig('security', 'maxLoginAttempts', parseInt(e.target.value))} placeholder="5"/></div>
                            <div className="space-y-2"><Label htmlFor="passwordMinLength">Longitud Mín. Contraseña</Label><Input id="passwordMinLength" type="number" value={config.security.passwordMinLength} onChange={(e) => updateConfig('security', 'passwordMinLength', parseInt(e.target.value))} placeholder="8"/></div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-center gap-3"><Shield className="h-5 w-5 text-blue-600" /><div><Label htmlFor="requireTwoFactor" className="text-blue-800 font-medium">Autenticación de Dos Factores</Label><p className="text-sm text-blue-700">Requerir 2FA para todos los usuarios</p></div></div>
                                <Switch id="requireTwoFactor" checked={config.security.requireTwoFactor} onCheckedChange={(checked) => updateConfig('security', 'requireTwoFactor', checked)}/>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-center gap-3"><Key className="h-5 w-5 text-green-600" /><div><Label htmlFor="allowPasswordReset" className="text-green-800 font-medium">Permitir Recuperación de Contraseña</Label><p className="text-sm text-green-700">Los usuarios pueden restablecer sus contraseñas</p></div></div>
                                <Switch id="allowPasswordReset" checked={config.security.allowPasswordReset} onCheckedChange={(checked) => updateConfig('security', 'allowPasswordReset', checked)}/>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-green-800"><Bell className="h-5 w-5" />Configuración de Notificaciones</CardTitle><CardDescription>Configurar notificaciones automáticas del sistema</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200"><div className="flex items-center gap-3"><Mail className="h-5 w-5 text-blue-600" /><div><Label htmlFor="emailNotifications" className="text-blue-800 font-medium">Notificaciones por Email</Label><p className="text-sm text-blue-700">Enviar notificaciones por correo electrónico</p></div></div><Switch id="emailNotifications" checked={config.notifications.emailNotifications} onCheckedChange={(checked) => updateConfig('notifications', 'emailNotifications', checked)}/></div>
                            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200"><div className="flex items-center gap-3"><Clock className="h-5 w-5 text-yellow-600" /><div><Label htmlFor="taskReminders" className="text-yellow-800 font-medium">Recordatorios de Tareas</Label><p className="text-sm text-yellow-700">Enviar recordatorios de tareas pendientes</p></div></div><Switch id="taskReminders" checked={config.notifications.taskReminders} onCheckedChange={(checked) => updateConfig('notifications', 'taskReminders', checked)}/></div>
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200"><div className="flex items-center gap-3"><Info className="h-5 w-5 text-green-600" /><div><Label htmlFor="caseUpdates" className="text-green-800 font-medium">Actualizaciones de Casos</Label><p className="text-sm text-green-700">Notificar cambios en los casos</p></div></div><Switch id="caseUpdates" checked={config.notifications.caseUpdates} onCheckedChange={(checked) => updateConfig('notifications', 'caseUpdates', checked)}/></div>
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200"><div className="flex items-center gap-3"><AlertTriangle className="h-5 w-5 text-red-600" /><div><Label htmlFor="systemAlerts" className="text-red-800 font-medium">Alertas del Sistema</Label><p className="text-sm text-red-700">Notificar errores y alertas críticas</p></div></div><Switch id="systemAlerts" checked={config.notifications.systemAlerts} onCheckedChange={(checked) => updateConfig('notifications', 'systemAlerts', checked)}/></div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reminderHours">Horas de Anticipación para Recordatorios</Label>
                            <Select value={config.notifications.reminderHours.toString()} onValueChange={(value) => updateConfig('notifications', 'reminderHours', parseInt(value))}>
                                <SelectTrigger><SelectValue placeholder="Seleccionar horas" /></SelectTrigger>
                                <SelectContent><SelectItem value="1">1 hora</SelectItem><SelectItem value="6">6 horas</SelectItem><SelectItem value="12">12 horas</SelectItem><SelectItem value="24">24 horas</SelectItem><SelectItem value="48">48 horas</SelectItem><SelectItem value="72">72 horas</SelectItem></SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            
            {/* Backup Settings */}
            <TabsContent value="backup" className="space-y-6">
                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardHeader><CardTitle className="flex items-center gap-2 text-green-800"><Database className="h-5 w-5" />Configuración de Backup</CardTitle><CardDescription>Configurar respaldos automáticos del sistema</CardDescription></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-3"><Database className="h-5 w-5 text-green-600" /><div><Label htmlFor="autoBackup" className="text-green-800 font-medium">Backup Automático</Label><p className="text-sm text-green-700">Realizar respaldos automáticos del sistema</p></div></div>
                            <Switch id="autoBackup" checked={config.backup.autoBackup} onCheckedChange={(checked) => updateConfig('backup', 'autoBackup', checked)}/>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2"><Label htmlFor="backupFrequency">Frecuencia de Backup</Label><Select value={config.backup.backupFrequency} onValueChange={(value) => updateConfig('backup', 'backupFrequency', value)}><SelectTrigger><SelectValue placeholder="Seleccionar frecuencia" /></SelectTrigger><SelectContent><SelectItem value="hourly">Cada hora</SelectItem><SelectItem value="daily">Diario</SelectItem><SelectItem value="weekly">Semanal</SelectItem><SelectItem value="monthly">Mensual</SelectItem></SelectContent></Select></div>
                            <div className="space-y-2"><Label htmlFor="retentionDays">Días de Retención</Label><Input id="retentionDays" type="number" value={config.backup.retentionDays} onChange={(e) => updateConfig('backup', 'retentionDays', parseInt(e.target.value))} placeholder="30"/></div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="backupLocation">Ubicación de Backup</Label>
                            <Select value={config.backup.backupLocation} onValueChange={(value) => updateConfig('backup', 'backupLocation', value)}><SelectTrigger><SelectValue placeholder="Seleccionar ubicación" /></SelectTrigger><SelectContent><SelectItem value="local">Almacenamiento Local</SelectItem><SelectItem value="cloud">Nube (AWS S3)</SelectItem><SelectItem value="ftp">Servidor FTP</SelectItem><SelectItem value="google">Google Drive</SelectItem></SelectContent></Select>
                        </div>
                        <div className="flex gap-3 items-center">
                            <Button onClick={handleBackupNow} variant="outline" className="border-green-300 text-green-700 hover:bg-green-100"><Database className="h-4 w-4 mr-2" />Crear Backup Ahora</Button>
                            <Badge variant="outline" className="text-slate-600 border-slate-300">Último backup: Hace 2 horas</Badge>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}