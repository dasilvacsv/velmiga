"use client"

import { ApplianceType } from '@/features/appliance-types/types'
import { Brand } from '@/features/marcas/types'
import { useState } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Define interfaces
interface ClientAppliance {
  id: string
  name: string
  notes?: string | null
  brand: Brand
  applianceType: ApplianceType
  createdAt: Date | null
  updatedAt: Date | null
}

interface ClientApplianceListProps {
  appliances: ClientAppliance[]
  selectedApplianceId: string
  onSelectAppliance: (id: string) => void
}

export function ClientApplianceList({
  appliances,
  selectedApplianceId,
  onSelectAppliance
}: ClientApplianceListProps) {
  if (!appliances.length) {
    return (
      <div className="p-4 border rounded-lg bg-muted/10 text-center">
        <p className="text-sm text-muted-foreground">Este cliente no tiene electrodomésticos registrados</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium">Electrodomésticos del cliente</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {appliances.map((appliance) => (
          <div
            key={appliance.id}
            className={cn(
              "cursor-pointer rounded-lg border p-3 transition-colors",
              selectedApplianceId === appliance.id
                ? "border-primary bg-primary/5"
                : "hover:bg-accent"
            )}
            onClick={() => onSelectAppliance(appliance.id)}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h5 className="font-medium">{appliance.name}</h5>
                <div className="text-sm text-muted-foreground">
                  <p>{appliance.brand.name} | {appliance.applianceType.name}</p>
                  {appliance.notes && <p className="mt-1 text-xs italic">{appliance.notes}</p>}
                </div>
              </div>
              {selectedApplianceId === appliance.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 