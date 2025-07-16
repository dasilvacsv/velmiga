// components/layout/Sidebar.tsx

"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Users,
  Briefcase,
  DollarSign,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Gavel, // Icono para Abogados
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeSwitcher } from "./theme-switcher";
import { LogoSwitcher } from "./logo-switcher";
import { cn } from "@/lib/utils";

// Definimos la estructura de un enlace de navegación
type NavLink = {
  title: string;
  path: string;
  icon: React.ReactNode;
  roles: Array<"ADMINISTRATOR" | "COORDINATOR" | "LAWYER">;
  subItems?: Omit<NavLink, "roles" | "subItems">[];
};

// Navegación basada en el schema.ts y roles (sin Calendario)
const navigationLinks: NavLink[] = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
    roles: ["ADMINISTRATOR", "COORDINATOR", "LAWYER"],
  },
  {
    title: "Expedientes",
    path: "/expedientes",
    icon: <FileText className="h-5 w-5" />,
    roles: ["ADMINISTRATOR", "COORDINATOR", "LAWYER"],
  },
  {
    title: "Clientes",
    path: "/clientes",
    icon: <Users className="h-5 w-5" />,
    roles: ["ADMINISTRATOR", "COORDINATOR"],
  },
  {
    title: "Abogados",
    path: "/abogados",
    icon: <Gavel className="h-5 w-5" />,
    roles: ["ADMINISTRATOR", "COORDINATOR"],
  },
  {
    title: "Administración",
    path: "#", // La ruta principal no es navegable
    icon: <Briefcase className="h-5 w-5" />,
    roles: ["ADMINISTRATOR"],
    subItems: [
      {
        title: "Nóminas y Pagos",
        path: "/admin/finanzas",
        icon: <DollarSign className="h-5 w-5" />,
      },
      {
        title: "Gestión de Usuarios",
        path: "/admin/usuarios",
        icon: <Users className="h-5 w-5" />,
      },
      {
        title: "Configuración General",
        path: "/admin/configuracion",
        icon: <Settings className="h-5 w-5" />,
      },
    ],
  },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const userRole = session?.user?.role as NavLink["roles"][0] | undefined;
  const userInitials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("") || "U";

  const handleSignOut = () => signOut({ callbackUrl: "/sign-in" });

  const renderNavLinks = (isMobile = false) => {
    return navigationLinks
      .filter((link) => userRole && link.roles.includes(userRole))
      .map((link) =>
        link.subItems ? (
          <CollapsibleNavItem key={link.title} link={link} pathname={pathname} />
        ) : (
          <Link
            key={link.title}
            href={link.path}
            onClick={() => isMobile && setMobileMenuOpen(false)}
            className={cn(
              "flex items-center gap-x-3 rounded-md p-3 text-sm font-medium transition-colors",
              pathname.startsWith(link.path)
                ? "bg-primary/10 text-primary font-semibold" // Fondo sutil y texto de color primario para el enlace activo
                : "text-foreground/70 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5" // Texto normal y hover sutil
            )}
          >
            {link.icon}
            <span>{link.title}</span>
          </Link>
        )
      );
  };

  return (
    <>
      {/* --- Sidebar para Desktop --- */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-white px-6 pb-4 dark:bg-gray-900 dark:border-gray-800">
          <div className="flex h-16 shrink-0 items-center">
            <LogoSwitcher />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {renderNavLinks()}
                </ul>
              </li>
              <li className="mt-auto">
                <ThemeSwitcher />
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* --- Header para Móvil (reemplaza la navbar anterior) --- */}
      <header className="lg:hidden sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-border bg-white px-4 shadow-sm dark:bg-gray-900 dark:border-gray-800 sm:gap-x-6 sm:px-6">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-foreground"
          onClick={() => setMobileMenuOpen(true)}
        >
          <span className="sr-only">Abrir menú</span>
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-x-4">
          <ThemeSwitcher />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="-m-1.5 flex items-center p-1.5">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{session?.user?.name}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleSignOut}
                className="cursor-pointer text-red-500 focus:text-red-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Contenido del menú móvil */}
      {isMobileMenuOpen && (
        <div className="relative z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-gray-900/80"
            onClick={() => setMobileMenuOpen(false)}
          ></div>
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 dark:bg-gray-900">
                <div className="flex h-16 shrink-0 items-center">
                  <LogoSwitcher />
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                      <ul role="list" className="-mx-2 space-y-1">
                        {renderNavLinks(true)}
                      </ul>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Componente auxiliar para los items desplegables
const CollapsibleNavItem = ({
  link,
  pathname,
}: {
  link: NavLink;
  pathname: string;
}) => {
  const [isOpen, setIsOpen] = useState(
    link.subItems?.some((item) => pathname.startsWith(item.path)) ?? false
  );

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-x-3 rounded-md p-3 text-left text-sm font-medium text-foreground/70 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
      >
        {link.icon}
        <span className="flex-1">{link.title}</span>
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      {isOpen && (
        <ul className="mt-1 space-y-1 pl-6">
          {link.subItems?.map((subItem) => (
            <li key={subItem.title}>
              <Link
                href={subItem.path}
                className={cn(
                  "block rounded-md py-2 pr-2 pl-9 text-sm leading-6 transition-colors",
                  pathname.startsWith(subItem.path)
                    ? "text-primary font-semibold"
                    : "text-foreground/70 hover:bg-black/5 hover:text-foreground dark:hover:bg-white/5"
                )}
              >
                {subItem.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Sidebar;