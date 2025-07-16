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
import { Search, Trash2, AlertCircle } from 'lucide-react';
import ConfirmationDialog from '@/features/delete-module/common/ConfirmationDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { deleteZone, getZones } from './actions';
import DeleteCard from '@/features/delete-module/common/DeleteCard';
import { Badge } from '@/components/ui/badge';

type Zone = {
  id: string;
  name: string;
  createdAt: Date;
  cityCount: number;
  inUse?: boolean;
};

export default function DeleteZones() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [filteredZones, setFilteredZones] = useState<Zone[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch zones
  useEffect(() => {
    const fetchZones = async () => {
      try {
        setIsLoading(true);
        const data = await getZones();
        setZones(data);
        setFilteredZones(data);
      } catch (error) {
        toast.error('Failed to load zones');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchZones();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredZones(zones);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = zones.filter(zone => 
      zone.name.toLowerCase().includes(lowerSearchTerm)
    );
    setFilteredZones(filtered);
  }, [searchTerm, zones]);

  // Handle delete
  const handleDeleteClick = (zone: Zone) => {
    setSelectedZone(zone);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedZone) return;

    try {
      setIsDeleting(true);
      const result = await deleteZone(selectedZone.id);
      
      if (result.success) {
        setZones(prev => prev.filter(z => z.id !== selectedZone.id));
        toast.success(`Zone "${selectedZone.name}" deleted successfully`);
      } else {
        toast.error(result.error || 'Failed to delete zone');
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
    <DeleteCard title="Delete Zones" description="Delete zones that are no longer needed">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Search zones..."
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
      ) : filteredZones.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No zones match your search' : 'No zones found'}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Cities</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredZones.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="font-medium">{zone.name}</TableCell>
                <TableCell>
                  {zone.cityCount > 0 ? (
                    <Badge variant="secondary" className="mr-2">
                      {zone.cityCount} {zone.cityCount === 1 ? 'city' : 'cities'}
                    </Badge>
                  ) : 'No cities'}
                </TableCell>
                <TableCell>{new Date(zone.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {zone.cityCount > 0 ? (
                    <div className="flex items-center justify-end gap-1">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="text-xs text-amber-600">Has cities</span>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteClick(zone)}
                      disabled={zone.inUse}
                      title={zone.inUse ? "This zone is in use and cannot be deleted" : "Delete zone"}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
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
        title="Delete Zone"
        description={`Are you sure you want to delete "${selectedZone?.name}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </DeleteCard>
  );
}