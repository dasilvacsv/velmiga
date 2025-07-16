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
import { deleteCity, getCities } from './actions';
import DeleteCard from '@/features/delete-module/common/DeleteCard';

type City = {
  id: string;
  name: string;
  zoneName: string;
  zoneId: string;
  createdAt: Date;
  inUse?: boolean;
};

export default function DeleteCities() {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch cities
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setIsLoading(true);
        const data = await getCities();
        setCities(data);
        setFilteredCities(data);
      } catch (error) {
        toast.error('Failed to load cities');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCities();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredCities(cities);
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = cities.filter(city => 
      city.name.toLowerCase().includes(lowerSearchTerm) ||
      city.zoneName.toLowerCase().includes(lowerSearchTerm)
    );
    setFilteredCities(filtered);
  }, [searchTerm, cities]);

  // Handle delete
  const handleDeleteClick = (city: City) => {
    setSelectedCity(city);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCity) return;

    try {
      setIsDeleting(true);
      const result = await deleteCity(selectedCity.id);
      
      if (result.success) {
        setCities(prev => prev.filter(c => c.id !== selectedCity.id));
        toast.success(`City "${selectedCity.name}" deleted successfully`);
      } else {
        toast.error(result.error || 'Failed to delete city');
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
    <DeleteCard title="Delete Cities" description="Delete cities that are no longer needed">
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Search cities or zones..."
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
      ) : filteredCities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? 'No cities match your search' : 'No cities found'}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>City Name</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCities.map((city) => (
              <TableRow key={city.id}>
                <TableCell className="font-medium">{city.name}</TableCell>
                <TableCell>{city.zoneName}</TableCell>
                <TableCell>{new Date(city.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteClick(city)}
                    disabled={city.inUse}
                    title={city.inUse ? "This city is in use and cannot be deleted" : "Delete city"}
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
        title="Delete City"
        description={`Are you sure you want to delete "${selectedCity?.name}" from zone "${selectedCity?.zoneName}"? This action cannot be undone.`}
        isLoading={isDeleting}
      />
    </DeleteCard>
  );
}