// RUTA: app/(app)/layout.tsx (EL ANIDADO)

import Sidebar from "@/components/Sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // NO HAY <html>, <body>, NI PROVIDERS AQUÍ
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:pl-64">
        <div className="py-10 px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}