"use client"

import { ApplianceType } from '@/features/appliance-types/types'
import { Brand } from '@/features/marcas/types'
import React, { useState, useMemo, useEffect } from 'react'
import { PopoverClientSelect } from '@/features/clients/popover-client-select'
import { PopoverApplianceSelect } from '@/features/appliances/popover-appliance-select'
import { ApplianceIssueForm } from './appliance-issue-form'
import { OrdenFormActions } from './orden-form-actions'
import { useRouter } from 'next/navigation'
import { InlineClientForm } from './inline-client-form'
import { Button } from '@/components/ui/button'
import { DateTimePicker } from "@/components/ui/date-time-picker";

// Define a type for clientAppliance that includes brand and applianceType
interface ClientAppliance {
  id: string
  name: string
  notes?: string | null
  brand: Brand
  applianceType: ApplianceType
  createdAt: Date | null
  updatedAt: Date | null
}

// Define a type for client that includes appliances
interface ClientWithAppliances {
  id: string
  name: string
  document: string | null
  phone: string | null
  phone2: string | null
  whatsapp: string | null
  email: string | null
  status: string
  address: string | null
  appliances: ClientAppliance[]
}

interface OrdenFormProps {
  brands: Brand[]
  applianceTypes: ApplianceType[]
  userId: string
  clients: ClientWithAppliances[]
}

export function OrdenForm({ brands, applianceTypes, userId, clients: initialClients }: OrdenFormProps) {
  const router = useRouter()
  // Keep a local state of clients that can be updated when a new one is created
  const [clients, setClients] = useState<ClientWithAppliances[]>(initialClients)
  
  // Client and appliance selection
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [selectedApplianceId, setSelectedApplianceId] = useState<string>("")
  
  // Store the entire selected appliance object
  const [applianceObject, setApplianceObject] = useState<ClientAppliance | null>(null)
  
  // Form fields
  const [falla, setFalla] = useState<string>("")
  const [isPreOrder, setIsPreOrder] = useState<boolean>(false) // False = Order (default), True = PreOrder
  const [fechaAgendado, setFechaAgendado] = useState<Date | null>(null);
  
  // State to control showing the client form
  const [showingClientForm, setShowingClientForm] = useState(false)
  
  // Find the selected client from the clients array
  const selectedClient = clients.find(client => client.id === selectedClientId)
  
  // Find the selected appliance from the selected client or use the stored object
  const selectedAppliance = useMemo(() => {
    if (applianceObject) return applianceObject;
    if (!selectedClient || !selectedApplianceId) return null;
    return selectedClient.appliances.find(appliance => appliance.id === selectedApplianceId) || null;
  }, [selectedClient, selectedApplianceId, applianceObject]);
  
  // Reset appliance selection when client changes
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId)
    setSelectedApplianceId("")
    setApplianceObject(null)
    setFalla("")
  }
  
  // Handle appliance selection with both id and object
  const handleApplianceChange = (id: string, appliance: any) => {
    console.log("Appliance selected:", { id, appliance });
    if (id && appliance) {
      setSelectedApplianceId(id);
      setApplianceObject(appliance);
    } else if (id) {
      setSelectedApplianceId(id);
      // The appliance object will be populated via the useEffect
    }
  }
  
  // Handle when a new client is created
  const handleNewClient = (newClientId: string, newClient: any) => {
    // Add empty appliances array if not present
    const clientWithAppliances = {
      ...newClient,
      appliances: newClient.appliances || []
    }
    
    // Add the new client to our local list
    setClients(prevClients => [...prevClients, clientWithAppliances])
    
    // Select the new client
    handleClientChange(newClientId)
    
    // Hide the client form
    setShowingClientForm(false)
    
    // Refresh the page to get the updated client list with server data
    router.refresh()
  }
  
  // Check if form is valid for submission - allow it to be valid with just an ID and falla
  const isFormValid = !!selectedClientId && !!selectedApplianceId && !!falla;
  
  // Show the client form
  const showClientForm = () => {
    setShowingClientForm(true)
  }
  
  // Hide the client form
  const hideClientForm = () => {
    setShowingClientForm(false)
  }
  
  // Debug output to check states
  useEffect(() => {
    console.log("Current state:", {
      clientId: selectedClientId,
      applianceId: selectedApplianceId,
      appliance: applianceObject,
      hasSelectedAppliance: !!selectedAppliance
    });
  }, [selectedClientId, selectedApplianceId, applianceObject, selectedAppliance]);
  
  // Add this useEffect to immediately show the appliance form when selectedApplianceId changes
  useEffect(() => {
    if (selectedApplianceId) {
      // Force immediate re-render of children components when applianceId changes
      console.log("Appliance selected with ID:", selectedApplianceId);
      
      // If we don't have the appliance object yet but have an ID, try to find it in the client's appliances
      if (!applianceObject && selectedClient) {
        const foundAppliance = selectedClient.appliances.find(
          app => app.id === selectedApplianceId
        );
        
        if (foundAppliance) {
          console.log("Found appliance in client data:", foundAppliance);
          setApplianceObject(foundAppliance);
        }
      }
    } else {
      // Reset appliance object when ID is cleared
      setApplianceObject(null);
    }
  }, [selectedApplianceId, selectedClient, applianceObject]);
  
  // Safety mechanism to clear falla when no appliance is selected
  useEffect(() => {
    if (!selectedApplianceId) {
      setFalla("");
    }
  }, [selectedApplianceId]);
  
  if (showingClientForm) {
    return (
      <InlineClientForm
        userId={userId}
        onSuccess={handleNewClient}
        onCancel={hideClientForm}
      />
    )
  }
  
  return (
    <div>
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-medium mb-2">Información del Cliente</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Seleccione un cliente para crear una orden de servicio
          </p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">Cliente</label>
                </div>
                <PopoverClientSelect
                  clients={clients}
                  value={selectedClientId}
                  onValueChange={handleClientChange}
                  placeholder="Buscar y seleccionar cliente"
                  userId={userId}
                  showAddClientForm={showClientForm}
                  onClientCreated={handleNewClient}
                />
              </div>
            </div>

          </div>
        </div>
        
        {selectedClient && (
          <div>
            <h3 className="text-lg font-medium mb-2">Electrodoméstico</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Seleccione el electrodoméstico para crear la orden
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">Electrodoméstico</label>
                </div>
                <PopoverApplianceSelect
                  clientId={selectedClientId}
                  userId={userId}
                  value={selectedApplianceId}
                  onValueChange={handleApplianceChange}
                  placeholder="Seleccionar electrodoméstico"
                  brands={brands}
                  applianceTypes={applianceTypes}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Display the ApplianceIssueForm if either we have a complete appliance object or at least an appliance ID */}
        {(selectedAppliance || selectedApplianceId) && (
          <div>
            <ApplianceIssueForm
              falla={falla}
              setFalla={setFalla}
              isPreOrder={isPreOrder}
              setIsPreOrder={setIsPreOrder}
              clientApplianceName={selectedAppliance?.name || "Electrodoméstico Seleccionado"}
              fechaAgendado={fechaAgendado}
              setFechaAgendado={setFechaAgendado}
            />

          </div>
        )}
        
        <OrdenFormActions
          clientId={selectedClientId}
          applianceId={selectedApplianceId}
          userId={userId}
          isValid={isFormValid}
          isPreOrder={isPreOrder}
          falla={falla}
          fechaAgendado={fechaAgendado}
        />
      </div>
    </div>
  )
}
