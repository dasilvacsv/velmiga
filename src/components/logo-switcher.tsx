// components/layout/LogoSwitcher.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from "@/lib/utils";

interface LogoSwitcherProps {
  className?: string;
}

export const LogoSwitcher: React.FC<LogoSwitcherProps> = ({ className = '' }) => {
  return (
    // Contenedor principal para el logo
    <div className={cn("relative flex items-center justify-center", className)}>
      <Image
        src="/vilmega.png" // Asegúrate de que vilmega.png esté en la carpeta /public
        alt="Vilmega Logo"
        width={55} // Ajusta el tamaño según sea necesario
        height={55}
        priority // Ayuda a que el logo cargue más rápido
        className="
          transition-all 
          duration-500 
          ease-in-out
          
          /* Efecto NEÓN usando el filtro drop-shadow y la variable --primary de tu CSS.
            Consiste en múltiples sombras superpuestas para crear el resplandor.
          */
          [filter:drop-shadow(0_0_2px_hsl(var(--primary)/0.8))_drop-shadow(0_0_8px_hsl(var(--primary)/0.5))]
          
          /* Efecto intensificado al pasar el cursor por encima */
          hover:[filter:drop-shadow(0_0_3px_hsl(var(--primary)))_drop-shadow(0_0_12px_hsl(var(--primary)/0.6))]
        "
      />
    </div>
  );
};

export default LogoSwitcher;