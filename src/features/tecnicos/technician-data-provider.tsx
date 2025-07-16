"use client";

import { ReactNode, createContext, useContext } from "react";

interface TechnicianContextType {
  refetchTechnician: () => void;
}

const TechnicianContext = createContext<TechnicianContextType | undefined>(undefined);

export function TechnicianDataProvider({ 
  children, 
  refetchTechnician 
}: { 
  children: ReactNode;
  refetchTechnician: () => void;
}) {
  return (
    <TechnicianContext.Provider value={{ refetchTechnician }}>
      {children}
    </TechnicianContext.Provider>
  );
}

export function useTechnicianData() {
  const context = useContext(TechnicianContext);
  if (context === undefined) {
    throw new Error("useTechnicianData must be used within a TechnicianDataProvider");
  }
  return context;
}