"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Settings, Trash2, Edit, Database } from "lucide-react";
import { SettingForm } from "./components/SettingForm";
import { getSystemSettings, updateSystemSetting, createSystemSetting, deleteSystemSetting } from "./actions";
import { toast } from "sonner";

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await getSystemSettings();
      setSettings(data);
    } catch (error) {
      toast.error("Error al cargar configuración");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSetting = async (formData) => {
    try {
      await createSystemSetting(formData);
      await loadSettings();
      setIsFormOpen(false);
      toast.success("Configuración creada exitosamente");
    } catch (error) {
      toast.error("Error al crear configuración");
    }
  };

  const handleUpdateSetting = async (formData) => {
    try {
      await updateSystemSetting(editingSetting.id, formData);
      await loadSettings();
      setEditingSetting(null);
      toast.success("Configuración actualizada exitosamente");
    } catch (error) {
      toast.error("Error al actualizar configuración");
    }
  };

  const handleDeleteSetting = async (id) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta configuración?")) {
      try {
        await deleteSystemSetting(id);
        await loadSettings();
        toast.success("Configuración eliminada exitosamente");
      } catch (error) {
        toast.error("Error al eliminar configuración");
      }
    }
  };

  const getSettingsByCategory = (category) => {
    return settings.filter(setting => setting.settingKey.startsWith(category));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuración General</h1>
          <p className="text-muted-foreground">
            Gestiona la configuración del sistema y opciones
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Configuración
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nueva Configuración</DialogTitle>
            </DialogHeader>
            <SettingForm
              onSubmit={handleCreateSetting}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="combos">Combos/Listas</TabsTrigger>
          <TabsTrigger value="document-types">Tipos de Documentos</TabsTrigger>
          <TabsTrigger value="notifications">Notificaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración General del Sistema
              </CardTitle>
              <CardDescription>
                Ajustes básicos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getSettingsByCategory("general").map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{setting.settingKey}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                      <p className="text-sm text-blue-600 mt-1">{setting.settingValue}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSetting(setting)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSetting(setting.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="combos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Combos y Listas Desplegables
              </CardTitle>
              <CardDescription>
                Gestiona las opciones de listas desplegables del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getSettingsByCategory("combo").map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{setting.settingKey}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {setting.settingValue.split(',').map((option, index) => (
                          <Badge key={index} variant="secondary">
                            {option.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSetting(setting)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSetting(setting.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="document-types">
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Documentos</CardTitle>
              <CardDescription>
                Gestiona los tipos de documentos disponibles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getSettingsByCategory("document").map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{setting.settingKey}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                      <p className="text-sm text-blue-600 mt-1">{setting.settingValue}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSetting(setting)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSetting(setting.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>
                Gestiona las configuraciones de notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getSettingsByCategory("notification").map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{setting.settingKey}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                      <p className="text-sm text-blue-600 mt-1">{setting.settingValue}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingSetting(setting)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSetting(setting.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {editingSetting && (
        <Dialog open={!!editingSetting} onOpenChange={() => setEditingSetting(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Configuración</DialogTitle>
            </DialogHeader>
            <SettingForm
              initialData={editingSetting}
              onSubmit={handleUpdateSetting}
              onCancel={() => setEditingSetting(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}