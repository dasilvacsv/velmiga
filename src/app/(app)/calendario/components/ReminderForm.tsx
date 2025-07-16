"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getExpedientes } from "../actions";

export function ReminderForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    expedienteId: '',
    reminderDate: '',
    description: '',
    ...initialData
  });

  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExpedientes();
  }, []);

  const loadExpedientes = async () => {
    try {
      const data = await getExpedientes();
      setExpedientes(data);
    } catch (error) {
      console.error('Error loading expedientes:', error);
    }
  };

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
        <Label htmlFor="expedienteId">Expediente *</Label>
        <Select value={formData.expedienteId} onValueChange={(value) => handleChange('expedienteId', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar expediente" />
          </SelectTrigger>
          <SelectContent>
            {expedientes.map((exp) => (
              <SelectItem key={exp.id} value={exp.id}>
                {exp.expedienteNumber} - {exp.clientName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="reminderDate">Fecha del Recordatorio *</Label>
        <Input
          id="reminderDate"
          type="date"
          value={formData.reminderDate}
          onChange={(e) => handleChange('reminderDate', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descripción *</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Ingrese descripción del recordatorio"
          rows={3}
          required
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