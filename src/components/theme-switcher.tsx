'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Sparkles, 
  Droplets,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeMode {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
}

const THEME_MODES: ThemeMode[] = [
  {
    id: 'light',
    name: 'Modo Claro',
    icon: <Sun className="w-4 h-4" />,
    description: 'Interfaz clara y minimalista'
  },
  {
    id: 'dark',
    name: 'Modo Oscuro',
    icon: <Moon className="w-4 h-4" />,
    description: 'Interfaz oscura y elegante'
  },
  {
    id: 'glass',
    name: 'Modo Vidrio',
    icon: <Droplets className="w-4 h-4" />,
    description: 'Efecto glassmorphism con transparencias'
  },
  {
    id: 'system',
    name: 'Sistema',
    icon: <Monitor className="w-4 h-4" />,
    description: 'Sigue la configuración del sistema'
  }
];

interface ThemeSwitcherProps {
  className?: string;
  iconClass?: string;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  className = '', 
  iconClass = 'w-4 h-4' 
}) => {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [currentMode, setCurrentMode] = useState('system');
  const [glassMode, setGlassMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Load saved preferences
    const savedMode = localStorage.getItem('theme-mode') || 'system';
    const savedGlass = localStorage.getItem('glass-mode') === 'true';
    
    setCurrentMode(savedMode);
    setGlassMode(savedGlass);
    
    // Apply glass mode class to document
    if (savedGlass) {
      document.documentElement.classList.add('glass-mode');
    }
  }, []);

  const handleThemeChange = (mode: string) => {
    if (mode === 'glass') {
      setGlassMode(true);
      setCurrentMode('glass');
      localStorage.setItem('glass-mode', 'true');
      localStorage.setItem('theme-mode', 'glass');
      document.documentElement.classList.add('glass-mode');
      setTheme('light'); // Glass mode works better with light base
    } else {
      setGlassMode(false);
      setCurrentMode(mode);
      localStorage.setItem('glass-mode', 'false');
      localStorage.setItem('theme-mode', mode);
      document.documentElement.classList.remove('glass-mode');
      setTheme(mode);
    }
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className={className}>
        <Monitor className={iconClass} />
      </Button>
    );
  }

  const getCurrentIcon = () => {
    if (glassMode) return <Droplets className={iconClass} />;
    
    switch (resolvedTheme) {
      case 'light':
        return <Sun className={iconClass} />;
      case 'dark':
        return <Moon className={iconClass} />;
      default:
        return <Monitor className={iconClass} />;
    }
  };

  const getCurrentTheme = () => {
    return THEME_MODES.find(mode => mode.id === currentMode) || THEME_MODES[3];
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`${className} relative overflow-hidden transition-all duration-300 hover:scale-105`}
        >
          {/* Efecto de bloom con colores Velmiga */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-green-600/20 opacity-0 hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
          <div className="relative z-10">
            {getCurrentIcon()}
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/20 dark:border-gray-700/50"
      >
        <DropdownMenuLabel className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Tema y Apariencia</span>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {THEME_MODES.map((mode) => (
          <DropdownMenuItem
            key={mode.id}
            onClick={() => handleThemeChange(mode.id)}
            className={`flex items-start space-x-3 px-3 py-2 cursor-pointer transition-all duration-200 ${
              currentMode === mode.id
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
            }`}
          >
            <div className="mt-0.5 text-amber-600">
              {mode.icon}
            </div>
            <div className="flex-1">
              <div className="font-medium text-sm">{mode.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {mode.description}
              </div>
            </div>
            {currentMode === mode.id && (
              <div className="mt-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              </div>
            )}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        {/* Indicador del tema actual */}
        <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-2">
            <Eye className="w-3 h-3" />
            <span>Actual: {getCurrentTheme().name}</span>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;