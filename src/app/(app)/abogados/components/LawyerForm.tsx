"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export function LawyerForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactInfo: '',
    fiscalInfo: '',
    bankInfo: '',
    documentsInfo: '',
    isActive: true,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder="Ingrese nombre"
            required
          />
        </div>

        <div>
          <Label htmlFor="lastName">Apellido *</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder="Ingrese apellido"
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="contactInfo">Datos de Contacto</Label>
        <Textarea
          id="contactInfo"
          value={formData.contactInfo}
          onChange={(e) => handleChange('contactInfo', e.target.value)}
          placeholder="Ingrese información de contacto (teléfono, email, dirección, etc.)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="fiscalInfo">Datos Fiscales</Label>
        <Textarea
          id="fiscalInfo"
          value={formData.fiscalInfo}
          onChange={(e) => handleChange('fiscalInfo', e.target.value)}
          placeholder="Ingrese información fiscal (RFC, CURP, etc.)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="bankInfo">Datos Bancarios</Label>
        <Textarea
          id="bankInfo"
          value={formData.bankInfo}
          onChange={(e) => handleChange('bankInfo', e.target.value)}
          placeholder="Ingrese información bancaria (banco, cuenta, CLABE, etc.)"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="documentsInfo">Documentos</Label>
        <Textarea
          id="documentsInfo"
          value={formData.documentsInfo}
          onChange={(e) => handleChange('documentsInfo', e.target.value)}
          placeholder="Ingrese información sobre documentos (cédula profesional, credencial, etc.)"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => handleChange('isActive', checked)}
        />
        <Label htmlFor="isActive">Abogado Activo</Label>
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