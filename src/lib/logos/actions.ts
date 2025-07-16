"use server"

import fs from 'fs';
import path from 'path';

export interface Logo {
  name: string;
  path: string;
  url: string;
}

/**
 * Fetches all available logos from the public/logos directory
 */
export async function getLogos(): Promise<{ success: boolean; data?: Logo[]; error?: string }> {
  try {
    const logoDirectory = path.join(process.cwd(), 'public', 'logos');
    
    // Check if directory exists
    if (!fs.existsSync(logoDirectory)) {
      return { 
        success: false, 
        error: 'Directorio de logos no encontrado' 
      };
    }
    
    // Read directory contents
    const files = fs.readdirSync(logoDirectory);
    
    // Filter for image files
    const imageFiles = files.filter(file => {
      const extension = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(extension);
    });
    
    // Create logo objects with paths and names
    const logos = imageFiles.map(file => ({
      name: file.replace(/\.[^/.]+$/, ""), // Remove file extension for display name
      path: `/logos/${file}`,
      url: `/logos/${file}`
    }));
    
    return { success: true, data: logos };
  } catch (error) {
    console.error('Error fetching logos:', error);
    return { 
      success: false, 
      error: 'Error al obtener logos' 
    };
  }
}