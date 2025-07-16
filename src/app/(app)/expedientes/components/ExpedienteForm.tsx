"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getClients, getLawyers } from "../actions";

export function ExpedienteForm({ initialData, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    clientId: '',
    lawyerId: '',
    classificationType: '',
    gestionType: '',
    driverName: '',
    driverStatus: '',
    vehicleStatus: '',
    adjusterName: '',
    description: '',
    location: '',
    municipality: '',
    state: '',
    ...initialData
  });

  const [clients, setClients] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsData, lawyersData] = await Promise.all([
        getClients(),
        getLawyers()
      ]);
      setClients(clientsData);
      setLawyers(lawyersData);
    } catch (error) {
      console.error('Error loading data:', error);
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="clientId">Cliente *</Label>
          <Select value={formData.clientId} onValueChange={(value) => handleChange('clientId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar cliente" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.companyName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="lawyerId">Abogado Asignado</Label>
          <Select value={formData.lawyerId} onValueChange={(value) => handleChange('lawyerId', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar abogado" />
            </SelectTrigger>
            <SelectContent>
              {lawyers.map((lawyer) => (
                <SelectItem key={lawyer.id} value={lawyer.id}>
                  {lawyer.firstName} {lawyer.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="classificationType">Tipo de Clasificación</Label>
          <Select value={formData.classificationType} onValueChange={(value) => handleChange('classificationType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LEGAL">Legal</SelectItem>
              <SelectItem value="GESTORIA">Gestoría</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="gestionType">Tipo de Gestión</Label>
          <Input
            id="gestionType"
            value={formData.gestionType}
            onChange={(e) => handleChange('gestionType', e.target.value)}
            placeholder="Ingrese tipo de gestión"
          />
        </div>

        <div>
          <Label htmlFor="driverName">Nombre del Conductor</Label>
          <Input
            id="driverName"
            value={formData.driverName}
            onChange={(e) => handleChange('driverName', e.target.value)}
            placeholder="Ingrese nombre del conductor"
          />
        </div>

        <div>
          <Label htmlFor="driverStatus">Estado del Conductor</Label>
          <Select value={formData.driverStatus} onValueChange={(value) => handleChange('driverStatus', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DETENIDO">Detenido</SelectItem>
              <SelectItem value="LIBERADO">Liberado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="vehicleStatus">Estado del Vehículo</Label>
          <Select value={formData.vehicleStatus} onValueChange={(value) => handleChange('vehicleStatus', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DETENIDO">Detenido</SelectItem>
              <SelectItem value="LIBERADO">Liberado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="adjusterName">Nombre del Ajustador</Label>
          <Input
            id="adjusterName"
            value={formData.adjusterName}
            onChange={(e) => handleChange('adjusterName', e.target.value)}
            placeholder="Ingrese nombre del ajustador"
          />
        </div>

        <div>
          <Label htmlFor="location">Ubicación</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="Ingrese ubicación"
          />
        </div>

        <div>
          <Label htmlFor="municipality">Municipio</Label>
          <Input
            id="municipality"
            value={formData.municipality}
            onChange={(e) => handleChange('municipality', e.target.value)}
            placeholder="Ingrese municipio"
          />
        </div>

        <div>
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => handleChange('state', e.target.value)}
            placeholder="Ingrese estado"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Ingrese descripción del expediente"
          rows={4}
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