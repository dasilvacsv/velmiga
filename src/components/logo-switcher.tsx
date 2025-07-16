// LogoSwitcher.tsx (MODIFICADO CON COLOR ACENTUADO)
'use client';

import React from 'react';
import Image from 'next/image';

interface LogoConfig {
  id: string;
  name: string;
  path: string;
  width: number;
  height: number;
}


interface LogoSwitcherProps {
  className?: string;
  iconOnly?: boolean;
  iconSizeClass?: string;
}

export const LogoSwitcher: React.FC<LogoSwitcherProps> = ({ className = '', iconOnly = false, iconSizeClass = 'w-12 h-12' }) => {
 

  const logoContent = (
    <div className={`relative flex items-center justify-center bg-gray-800 dark:bg-black rounded-full p-1.5 shadow-lg ${iconSizeClass}`}>
    </div>
  );

  if (iconOnly) {
    return logoContent;
  }

  return (
    <div className={`flex items-center gap-x-4 ${className}`}>
      {logoContent}

      {/* --- GRADIENTE DE COLOR MEJORADO AQUÍ --- */}
      <span
        className="
          font-cinzel
          text-3xl
          font-bold
          tracking-wider
          bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-500 /* <-- GRADIENTE MÁS RICO Y ACENTUADO */
          bg-clip-text
          text-transparent
          [text-shadow:_0_2px_3px_rgb(0_0_0_/_25%)] /* <-- Sombra ligeramente más intensa */
          dark:[text-shadow:_0_2px_4px_rgb(0_0_0_/_50%)]
        "
      >
        Velmiga
      </span>
      
    </div>
  );
};

export default LogoSwitcher;