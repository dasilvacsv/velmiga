"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export function ClientForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    companyName: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
    paymentMethod: '',
    feeSchedule: '',
    vehicleDatabaseRef: '',
    billingCutoffDate: '',
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
          <Label htmlFor="companyName">Nombre de la Empresa *</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            placeholder="Ingrese nombre de la empresa"
            required
          />
        </div>

        <div>
          <Label htmlFor="businessName">Razón Social</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => handleChange('businessName', e.target.value)}
            placeholder="Ingrese razón social"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Ingrese email"
          />
        </div>

        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Ingrese teléfono"
          />
        </div>

        <div>
          <Label htmlFor="paymentMethod">Forma de Pago</Label>
          <Select value={formData.paymentMethod} onValueChange={(value) => handleChange('paymentMethod', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar forma de pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRANSFERENCIA">Transferencia</SelectItem>
              <SelectItem value="CHEQUE">Cheque</SelectItem>
              <SelectItem value="EFECTIVO">Efectivo</SelectItem>
              <SelectItem value="OTRO">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="billingCutoffDate">Fecha de Corte de Facturación</Label>
          <Input
            id="billingCutoffDate"
            type="date"
            value={formData.billingCutoffDate}
            onChange={(e) => handleChange('billingCutoffDate', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Dirección</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Ingrese dirección completa"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="feeSchedule">Tabuladores de Honorarios</Label>
        <Textarea
          id="feeSchedule"
          value={formData.feeSchedule}
          onChange={(e) => handleChange('feeSchedule', e.target.value)}
          placeholder="Ingrese información sobre tabuladores de honorarios"
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="vehicleDatabaseRef">Referencia de Base de Datos de Vehículos</Label>
        <Textarea
          id="vehicleDatabaseRef"
          value={formData.vehicleDatabaseRef}
          onChange={(e) => handleChange('vehicleDatabaseRef', e.target.value)}
          placeholder="Ingrese información sobre bases de datos de vehículos"
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => handleChange('isActive', checked)}
        />
        <Label htmlFor="isActive">Cliente Activo</Label>
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