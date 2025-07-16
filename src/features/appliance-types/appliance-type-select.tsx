"use client"

import { useState, useCallback } from "react"
import { PopoverSelect } from "@/components/popover-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PlusIcon, Settings, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ApplianceTypeDialog } from "./ApplianceTypeDialog"
import { getApplianceTypes } from "./actions"
import { ApplianceType } from "./types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface ApplianceTypeSelectProps {
  initialApplianceTypes: ApplianceType[]
  selectedApplianceTypeId: string
  onApplianceTypeSelect: (applianceTypeId: string, applianceType: ApplianceType) => void
  className?: string
}

export function ApplianceTypeSelect({
  initialApplianceTypes,
  selectedApplianceTypeId,
  onApplianceTypeSelect,
  className
}: ApplianceTypeSelectProps) {
  const { toast } = useToast()
  const [applianceTypes, setApplianceTypes] = useState<ApplianceType[]>(initialApplianceTypes)
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Refresh appliance types
  const refreshApplianceTypes = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getApplianceTypes()
      if (result.success && result.data) {
        setApplianceTypes(result.data)
        
        // If a new appliance type was added, it's likely the last one in the list
        if (result.data.length > 0 && result.data.length > applianceTypes.length) {
          const newApplianceType = result.data[result.data.length - 1]
          onApplianceTypeSelect(newApplianceType.id, newApplianceType)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch appliance types",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to load appliance types:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load appliance types"
      })
    } finally {
      setLoading(false)
    }
  }, [applianceTypes.length, onApplianceTypeSelect, toast])

  // Handle appliance type selection
  const handleApplianceTypeChange = (value: string) => {
    const selectedApplianceType = applianceTypes.find(applianceType => applianceType.id === value)
    if (selectedApplianceType) {
      onApplianceTypeSelect(value, selectedApplianceType)
    }
  }

  // Handle appliance type added
  const handleApplianceTypeAdded = async () => {
    // Refresh appliance types to get the newly added one
    await refreshApplianceTypes()
    
    // Close the dialog
    setShowAddDialog(false)
  }

  // Get selected appliance type
  const selectedApplianceType = selectedApplianceTypeId 
    ? applianceTypes.find(type => type.id === selectedApplianceTypeId)
    : null

  return (
    <>
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent 
          className="sm:max-w-[500px] p-0" 
          onClick={(e) => e.stopPropagation()}
        >
          <ApplianceTypeDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onApplianceTypeAdded={handleApplianceTypeAdded}
          />
        </DialogContent>
      </Dialog>

      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <PopoverSelect
              options={applianceTypes.map(applianceType => ({
                label: applianceType.name,
                value: applianceType.id,
                icon: <Settings className="h-4 w-4 mr-2 text-primary" />
              }))}
              value={selectedApplianceTypeId}
              onValueChange={handleApplianceTypeChange}
              placeholder={loading ? "Loading appliance types..." : "Select an appliance type"}
              disabled={loading}
              emptyMessage="No appliance types found"
              className="w-full transition-all"
            />
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={loading}
            onClick={() => setShowAddDialog(true)}
            className="h-10 w-10 transition-all hover:bg-primary/10 flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <PlusIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        {selectedApplianceType && (
          <motion.div 
            className="text-xs text-muted-foreground px-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="inline-flex items-center">
              <Settings className="w-3 h-3 mr-1 text-muted-foreground" />
              {selectedApplianceType.name}
            </span>
          </motion.div>
        )}
      </div>
    </>
  )
}