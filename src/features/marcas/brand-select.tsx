"use client"

import { useState, useCallback } from "react"
import { PopoverSelect } from "./popover-select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PlusIcon, Tag, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { BrandDialog } from "./BrandDialog"
import { getBrands } from "./actions"
import { Brand } from "./types"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface BrandSelectProps {
  initialBrands: Brand[]
  selectedBrandId: string
  onBrandSelect: (brandId: string, brand: Brand) => void
  className?: string
}

export function BrandSelect({
  initialBrands,
  selectedBrandId,
  onBrandSelect,
  className
}: BrandSelectProps) {
  const { toast } = useToast()
  const [brands, setBrands] = useState<Brand[]>(initialBrands)
  const [loading, setLoading] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)

  // Refresh brands
  const refreshBrands = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getBrands()
      if (result.success && result.data) {
        setBrands(result.data)
        
        // If a new brand was added, it's likely the last one in the list
        if (result.data.length > 0 && result.data.length > brands.length) {
          const newBrand = result.data[result.data.length - 1]
          onBrandSelect(newBrand.id, newBrand)
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to fetch brands",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Failed to load brands:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load brands"
      })
    } finally {
      setLoading(false)
    }
  }, [brands.length, onBrandSelect, toast])

  // Handle brand selection
  const handleBrandChange = (value: string) => {
    const selectedBrand = brands.find(brand => brand.id === value)
    if (selectedBrand) {
      onBrandSelect(value, selectedBrand)
    }
  }

  // Handle brand added
  const handleBrandAdded = async () => {
    // Refresh brands to get the newly added one
    await refreshBrands()
    
    // Close the dialog
    setShowAddDialog(false)
  }

  // Get selected brand
  const selectedBrand = selectedBrandId 
    ? brands.find(brand => brand.id === selectedBrandId)
    : null

  return (
    <>
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent 
          className="sm:max-w-[500px] p-0" 
          onClick={(e) => e.stopPropagation()}
        >
          <BrandDialog
            open={showAddDialog}
            onOpenChange={setShowAddDialog}
            onBrandAdded={handleBrandAdded}
          />
        </DialogContent>
      </Dialog>

      <div className={cn("space-y-2", className)}>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <PopoverSelect
              options={brands.map(brand => ({
                label: brand.name,
                value: brand.id,
                icon: <Tag className="h-4 w-4 mr-2 text-primary" />
              }))}
              value={selectedBrandId}
              onValueChange={handleBrandChange}
              placeholder={loading ? "Loading brands..." : "Select a brand"}
              disabled={loading}
              emptyMessage="No brands found"
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

        {selectedBrand && (
          <motion.div 
            className="text-xs text-muted-foreground px-1"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="inline-flex items-center">
              <Tag className="w-3 h-3 mr-1 text-muted-foreground" />
              {selectedBrand.name}
            </span>
          </motion.div>
        )}
      </div>
    </>
  )
}