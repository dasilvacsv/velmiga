"use client"

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Search, Trash2 } from 'lucide-react';
import ConfirmationDialog from '@/features/delete-module/common/ConfirmationDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { deleteApplianceType, getApplianceTypes } from './actions';
import DeleteCard from '@/features/delete-module/common/DeleteCard';

type ApplianceType = {
  id: string;
  name: string;
  createdAt: Date;
  inUse?: boolean;
};

export default function DeleteApplianceTypes() {
  const [types, setTypes] = useState<ApplianceType[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<ApplianceType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ApplianceType | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch appliance types
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setIsLoading(true);
        const data = await getApplianceTypes();
        setTypes(data);
        setFilteredTypes(data);
      } catch (error) {
        toast.error('Failed to load appliance types');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTypes();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredTypes(types);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = types.filter(type => 
      type.name.toLowerCase().includes(lowerSearchTerm)
    );
    setFilteredTypes(filtered);
  }, [searchTerm, types]);

  // Handle delete
  const handleDeleteClick = (type: ApplianceType) => {
    setSelectedType(type);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedType) return;

    try {
      setIsDeleting(true);
      const result = await deleteApplianceType(selectedType.id);
      
      if (result.success) {
        setTypes(prev => prev.filter(t => t.id !== selectedType.id));
        toast.success(`Appliance type "${selectedType.name}" deleted successfully`);
      } else {
        toast.error(result.error || 'Failed to delete appliance type');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error(error);
    } finally {
      setIsDeleting(false);
      setIsConfirmOpen(false);
    }
  };

  return (
    <DeleteCard title="Delete Appliance Types" description="Delete appliance types that are no longer needed">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Search appliance types..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-full h-12" />
          ))}
        </div>
      ) : filteredTypes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No appliance types match your search' : 'No appliance types found'}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTypes.map((type) => (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell>{new Date(type.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteClick(type)}
                    disabled={type.inUse}
                    title={type.inUse ? "This appliance type is in use and cannot be deleted" : "Delete appliance type"}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Appliance Type"
        description={`Are you sure you want to delete "${selectedType?.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </DeleteCard>
  );
}