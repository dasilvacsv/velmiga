"use client"
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import DeleteCard from '@/features/delete-module/common/DeleteCard';
import ConfirmationDialog from '@/features/delete-module/common/ConfirmationDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Brand } from '../marcas/types'; // Asumiendo archivo de tipos

export default function DeleteBrands() {
  const [state, setState] = useState({
    brands: [] as Brand[],
    searchTerm: '',
    selectedBrand: null as Brand | null,
    isLoading: true,
    isDeleting: false,
    isConfirmOpen: false
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/brands');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        
        setState(prev => ({
          ...prev,
          brands: data,
          isLoading: false
        }));
      } catch (error) {
        toast.error('Error cargando marcas');
        console.error('Fetch error:', error);
        setState(prev => ({...prev, isLoading: false}));
      }
    };
    
    fetchData();
  }, []);

  const handleDelete = async () => {
    if (!state.selectedBrand) return;
    
    setState(prev => ({...prev, isDeleting: true}));
    
    try {
      const response = await fetch(`/api/brands/${state.selectedBrand.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Error eliminando marca');
      }

      setState(prev => ({
        ...prev,
        brands: prev.brands.filter(b => b.id !== state.selectedBrand.id),
        isDeleting: false,
        isConfirmOpen: false
      }));
      
      toast.success(`Marca "${state.selectedBrand.name}" eliminada`);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error instanceof Error ? error.message : 'Error desconocido');
      setState(prev => ({...prev, isDeleting: false}));
    }
  };

  const filteredBrands = state.brands.filter(brand =>
    brand.name.toLowerCase().includes(state.searchTerm.toLowerCase())
  );

  return (
    <DeleteCard title="Eliminar Marcas" description="Gestión de marcas registradas">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar marcas..."
          className="pl-10"
          value={state.searchTerm}
          onChange={(e) => setState(prev => ({...prev, searchTerm: e.target.value}))}
        />
      </div>

      {state.isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {state.searchTerm ? 'No hay coincidencias' : 'No se encontraron marcas'}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Creado en</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrands.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell>{brand.name}</TableCell>
                <TableCell>
                  {new Date(brand.createdAt).toLocaleDateString('es-ES')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setState(prev => ({
                      ...prev,
                      selectedBrand: brand,
                      isConfirmOpen: true
                    }))}
                    disabled={brand.inUse}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmationDialog
        isOpen={state.isConfirmOpen}
        onClose={() => setState(prev => ({...prev, isConfirmOpen: false}))}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        description={`¿Estás seguro de eliminar la marca "${state.selectedBrand?.name}"?`}
        isLoading={state.isDeleting}
      />
    </DeleteCard>
  );
}