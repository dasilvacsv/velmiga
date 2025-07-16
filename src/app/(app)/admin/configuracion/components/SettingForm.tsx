"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function SettingForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    settingKey: '',
    settingValue: '',
    description: '',
    ...initialData
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="settingKey">Clave de Configuración *</Label>
        <Input
          id="settingKey"
          value={formData.settingKey}
          onChange={(e) => handleChange('settingKey', e.target.value)}
          placeholder="Ej: combo.tipos_gestion"
          required
        />
      </div>

      <div>
        <Label htmlFor="settingValue">Valor *</Label>
        <Textarea
          id="settingValue"
          value={formData.settingValue}
          onChange={(e) => handleChange('settingValue', e.target.value)}
          placeholder="Ingrese el valor de la configuración"
          rows={3}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Describe para qué sirve esta configuración"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear'}
        </Button>
      </div>
    </form>
  );
}