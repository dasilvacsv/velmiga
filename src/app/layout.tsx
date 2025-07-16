// RUTA: app/layout.tsx (CÓDIGO CORREGIDO)

import './globals.css'; // <-- ¡LA LÍNEA QUE FALTABA!
import { Poppins, Cinzel } from "next/font/google";
import { auth } from '@/features/auth';
import { cn } from "@/lib/utils";
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster as Sonner } from "sonner";

// Configuración de fuentes
const fontSans = Poppins({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

const fontCinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
});

export const metadata = {
  title: "Vilmega",
  description: "Sistema de gestión de Vilmega",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="es" className={cn(fontSans.variable, fontCinzel.variable)} suppressHydrationWarning>
      <body className="font-sans bg-background text-foreground">
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Sonner richColors position="top-right" />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}