"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Eye, Edit, User, CreditCard, FileText } from "lucide-react";
import { LawyerForm } from "./components/LawyerForm";
import { getLawyers, createLawyer, updateLawyer, deleteLawyer } from "./actions";
import { toast } from "sonner";

export default function AbogadosPage() {
  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLawyer, setEditingLawyer] = useState(null);

  useEffect(() => {
    loadLawyers();
  }, []);

  const loadLawyers = async () => {
    try {
      const data = await getLawyers();
      setLawyers(data);
    } catch (error) {
      toast.error("Error al cargar abogados");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLawyer = async (formData) => {
    try {
      await createLawyer(formData);
      await loadLawyers();
      setIsFormOpen(false);
      toast.success("Abogado creado exitosamente");
    } catch (error) {
      toast.error("Error al crear abogado");
    }
  };

  const handleUpdateLawyer = async (formData) => {
    try {
      await updateLawyer(editingLawyer.id, formData);
      await loadLawyers();
      setEditingLawyer(null);
      toast.success("Abogado actualizado exitosamente");
    } catch (error) {
      toast.error("Error al actualizar abogado");
    }
  };

  const filteredLawyers = lawyers.filter(lawyer =>
    lawyer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lawyer.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Abogados</h1>
          <p className="text-muted-foreground">
            Gestiona la información de los abogados y proveedores
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Abogado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Abogado</DialogTitle>
            </DialogHeader>
            <LawyerForm
              onSubmit={handleCreateLawyer}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Abogados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o apellido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lawyers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLawyers.map((lawyer) => (
          <Card key={lawyer.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {lawyer.firstName} {lawyer.lastName}
                </CardTitle>
                <Badge variant={lawyer.isActive ? "default" : "secondary"}>
                  {lawyer.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lawyer.contactInfo && (
                  <div className="flex items-start">
                    <User className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Contacto</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {lawyer.contactInfo}
                      </p>
                    </div>
                  </div>
                )}
                
                {lawyer.fiscalInfo && (
                  <div className="flex items-start">
                    <FileText className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Datos Fiscales</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {lawyer.fiscalInfo}
                      </p>
                    </div>
                  </div>
                )}
                
                {lawyer.bankInfo && (
                  <div className="flex items-start">
                    <CreditCard className="h-4 w-4 mr-2 mt-1 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Datos Bancarios</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {lawyer.bankInfo}
                      </p>
                    </div>
                  </div>
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
                  onClick={() => setEditingLawyer(lawyer)}
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
      {editingLawyer && (
        <Dialog open={!!editingLawyer} onOpenChange={() => setEditingLawyer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Abogado</DialogTitle>
            </DialogHeader>
            <LawyerForm
              initialData={editingLawyer}
              onSubmit={handleUpdateLawyer}
              onCancel={() => setEditingLawyer(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}