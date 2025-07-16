import { ImageSlider } from "@/features/core/image-slider";
import { cn } from "@/lib/utils";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // --- FONDO MEJORADO CON GRADIENTE SUTIL DEL TEMA ---
    <div
      className={cn(
        "min-h-screen w-full flex items-center justify-center p-4 lg:p-8",
        "bg-background bg-gradient-to-br from-background via-background to-primary/5"
      )}
    >
      {/* --- CONTENEDOR PRINCIPAL CON EFECTO "GLASS" --- */}
      <div
        className={cn(
          "w-full max-w-7xl mx-auto rounded-3xl shadow-2xl overflow-hidden flex",
          "bg-white/60 dark:bg-card/60 backdrop-blur-lg border border-white/20"
        )}
      >
        {/* Lado izquierdo - Slider de imágenes */}
        <div className="hidden lg:block w-1/2 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent z-10" />
          <ImageSlider />
        </div>

        {/* Lado derecho - Contenedor del formulario */}
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12">
          {/* Se eliminó el logo duplicado de aquí. 
              El logo ahora se renderiza directamente desde AuthForm.tsx. */}
          
          <main className="w-full max-w-md">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}