"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrand } from "./actions"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { Tag, X, Check, AlertCircle } from "lucide-react"

interface BrandDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onBrandAdded: () => void
}

export function BrandDialog({
  open,
  onOpenChange,
  onBrandAdded,
}: BrandDialogProps) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const { toast } = useToast()

  const resetForm = () => {
    setName("")
    setShowSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const result = await createBrand({
        name,
      })

      if (result.success) {
        setShowSuccess(true)
        setTimeout(() => {
          onBrandAdded()
          onOpenChange(false)
          resetForm()
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Error creating brand:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!loading) {
        onOpenChange(newOpen)
        if (!newOpen) resetForm()
      }
    }}>
      <DialogContent className="sm:max-w-[425px] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Tag className="w-5 h-5 text-primary" />
            Add New Brand
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div 
              key="success"
              className="flex items-center justify-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 mb-2">
                  <Check className="w-8 h-8 text-green-600 dark:text-green-300" />
                </div>
                <h3 className="text-lg font-medium">Brand Added Successfully!</h3>
                <p className="text-muted-foreground text-sm">
                  Your new brand has been created
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="grid gap-6 py-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="flex items-center gap-2 text-sm font-medium"
                  >
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    Brand Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full transition-all focus-visible:ring-2 focus-visible:ring-primary"
                    placeholder="Enter brand name"
                    required
                  />
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-md border border-blue-100 dark:border-blue-900 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Adding a brand will make it available for selection when creating or editing appliances.
                  </p>
                </div>
              </div>

              <DialogFooter className="gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    resetForm()
                  }}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="relative"
                >
                  {loading ? (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </motion.div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Add Brand
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}