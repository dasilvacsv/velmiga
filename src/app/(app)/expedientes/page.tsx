"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Filter, Eye, Edit, Calendar, FileText } from "lucide-react";
import { ExpedienteForm } from "./components/ExpedienteForm";
import { getExpedientes, createExpediente, updateExpediente, deleteExpediente } from "./actions";
import { toast } from "sonner";

export default function ExpedientesPage() {
  const [expedientes, setExpedientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpediente, setEditingExpediente] = useState(null);

  useEffect(() => {
    loadExpedientes();
  }, []);

  const loadExpedientes = async () => {
    try {
      const data = await getExpedientes();
      setExpedientes(data);
    } catch (error) {
      toast.error("Error al cargar expedientes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpediente = async (formData) => {
    try {
      await createExpediente(formData);
      await loadExpedientes();
      setIsFormOpen(false);
      toast.success("Expediente creado exitosamente");
    } catch (error) {
      toast.error("Error al crear expediente");
    }
  };

  const handleUpdateExpediente = async (formData) => {
    try {
      await updateExpediente(editingExpediente.id, formData);
      await loadExpedientes();
      setEditingExpediente(null);
      toast.success("Expediente actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar expediente");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "EN_ATENCION":
        return "bg-blue-100 text-blue-800";
      case "EN_TRAMITE":
        return "bg-yellow-100 text-yellow-800";
      case "CERRADO":
        return "bg-green-100 text-green-800";
      case "CANCELADO":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredExpedientes = expedientes.filter(exp => {
    const matchesSearch = exp.expedienteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || exp.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
          <h1 className="text-3xl font-bold tracking-tight">Expedientes</h1>
          <p className="text-muted-foreground">
            Gestiona todos los expedientes del sistema
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Expediente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Expediente</DialogTitle>
            </DialogHeader>
            <ExpedienteForm
              onSubmit={handleCreateExpediente}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por número o cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos</SelectItem>
                  <SelectItem value="EN_ATENCION">En Atención</SelectItem>
                  <SelectItem value="EN_TRAMITE">En Trámite</SelectItem>
                  <SelectItem value="CERRADO">Cerrado</SelectItem>
                  <SelectItem value="CANCELADO">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expedientes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredExpedientes.map((expediente) => (
          <Card key={expediente.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{expediente.expedienteNumber}</CardTitle>
                <Badge className={getStatusColor(expediente.status)}>
                  {expediente.status}
                </Badge>
              </div>
              <CardDescription>{expediente.clientName}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(expediente.createdAt).toLocaleDateString()}
                </div>
                {expediente.description && (
                  <p className="text-sm line-clamp-2">{expediente.description}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingExpediente(expediente)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingExpediente && (
        <Dialog open={!!editingExpediente} onOpenChange={() => setEditingExpediente(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Expediente</DialogTitle>
            </DialogHeader>
            <ExpedienteForm
              initialData={editingExpediente}
              onSubmit={handleUpdateExpediente}
              onCancel={() => setEditingExpediente(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}