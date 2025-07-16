import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface EmptyStateProps {
  hasActiveFilters: boolean;
  resetFilters: () => void;
}

export function EmptyState({ hasActiveFilters, resetFilters }: EmptyStateProps) {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
      </motion.div>
      <motion.p 
        className="text-muted-foreground font-medium text-lg"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        No se encontraron resultados
      </motion.p>
      <motion.p 
        className="text-sm text-muted-foreground/70 mt-1 mb-4"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {hasActiveFilters 
          ? "Intenta con otros criterios de búsqueda o limpia los filtros" 
          : "No hay órdenes que coincidan con los criterios de búsqueda"}
      </motion.p>
      {hasActiveFilters && (
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <Button 
            onClick={resetFilters}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Limpiar filtros
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}