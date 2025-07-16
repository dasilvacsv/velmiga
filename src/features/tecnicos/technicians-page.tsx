"use client"

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TechniciansTable } from "@/features/tecnicos/technicians-table";
import { TechniciansWithWarranty } from "@/features/tecnicos/technicians-with-warranty";
import { columns } from "@/features/tecnicos/columns";
import { Technician } from "@/features/tecnicos/columns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TechniciansPageProps {
  initialTechnicians: Technician[] | null;
  initialTechniciansWithWarranty: any[] | null;
  initialError?: string;
  initialWarrantyError?: string;
}

export function TechniciansPage({
  initialTechnicians,
  initialTechniciansWithWarranty,
  initialError,
  initialWarrantyError,
}: TechniciansPageProps) {  
  const [data, setData] = useState<Technician[] | null>(initialTechnicians);
  const [techniciansWithWarranty, setTechniciansWithWarranty] = useState<any[] | null>(initialTechniciansWithWarranty);
  const [error, setError] = useState<string | undefined>(initialError);
  const [warrantyError, setWarrantyError] = useState<string | undefined>(initialWarrantyError);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const handleRefresh = async () => {
    setIsLoading(true);
    
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.location.reload();
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Técnicos</h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RotateCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isLoading ? "Actualizando..." : "Actualizar datos"}
        </Button>
      </div>
      
      <Tabs 
        defaultValue="general" 
        className="w-full"
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="mb-4">
        <TabsTrigger value="general">Listado General</TabsTrigger>
          <TabsTrigger value="warranties">Gestión de Garantías</TabsTrigger>
        </TabsList>
        
                
        <TabsContent value="general">
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="ml-4"
                >
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <TechniciansTable 
              columns={columns} 
              data={data || []} 
              isLoading={isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="warranties">
          {warrantyError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {warrantyError}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="ml-4"
                >
                  Reintentar
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <TechniciansWithWarranty 
              technicians={techniciansWithWarranty || []} 
              isLoading={isLoading}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}