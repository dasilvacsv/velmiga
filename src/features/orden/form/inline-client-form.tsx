"use client"


import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ClientForm } from "./create-client-form"

interface InlineClientFormProps {
  userId: string
  onSuccess: (newClientId: string, newClient: any) => void
  onCancel: () => void
}

export function InlineClientForm({
  userId,
  onSuccess,
  onCancel
}: InlineClientFormProps) {
  const handleSuccess = (newClientId?: string, newClient?: any) => {
    if (newClientId && newClient) {
      onSuccess(newClientId, newClient)
    }
  }

  // Create initial data with default values for fields we want to hide
  const initialData = {
    status: "active", // Set status default as active
    document: null,   // Set document as null
    latitude: null,   // Set latitude as null
    longitude: null   // Set longitude as null
  }

  return (
    <div className="container max-w-4xl">
      <div className="mb-6 flex items-center space-x-4">
        <Button 
          type="button" 
          variant="outline" 
          size="sm" 
          onClick={onCancel}
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a la Orden
        </Button>
        <h2 className="text-xl font-bold">Crear Nuevo Cliente</h2>
      </div>
      
      <Card className="bg-background shadow-sm rounded-lg border">
        <CardHeader className="pb-0">
          <CardTitle className="text-lg">Datos del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            userId={userId} 
            mode="create" 
            onSuccess={handleSuccess} 
            closeDialog={onCancel}
            showHeader={false}
            showFooter={true}
            initialData={initialData}
            hideFields={["document", "status", "latitude", "longitude"]}
          />
        </CardContent>
      </Card>
    </div>
  )
} 