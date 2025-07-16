import React from "react"
import { auth } from "@/features/auth"
import { redirect } from "next/navigation"
import { MainSidebar } from "./MainSidebar"

type NavItem = {
  title: string;
  url: string;
  icon: "LayoutDashboard" | "ClipboardList" | "Users" | "Shield" | "Receipt" | "Building" | "ShoppingBag" | "Wrench" | "Wallet";
  items?: { title: string; url: string; }[];
}

const allNavItems: NavItem[] = [
  {
    title: "Ordenes",
    url: "/ordenes/new",
    icon: "ClipboardList",
    items: [
      {
        title: "Nueva Orden",
        url: "/ordenes/new",
      },
      {
        title: "Lista de Ordenes",
        url: "/ordenes",
      },
    ]
  },
  {
    title: "Clientes",
    url: "/clientes",
    icon: "Users",
  },
  {
    title: "Sucursales",
    url: "/sucursales",
    icon: "Building",
  },
  {
    title: "Garantías",
    url: "/garantias",
    icon: "Shield",
  },
  {
    title: "Técnicos",
    url: "/tecnicos",
    icon: "Wrench",
  },
  {
    title: "Pagos",
    url: "/pagos",
    icon: "Wallet",
  }
];

export async function AppSidebar() {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Filter items based on role
  let filteredItems = [...allNavItems];
  
  // Only show Payments to ADMIN users
  if (session.user.role !== "ADMIN") {
    filteredItems = filteredItems.filter(item => item.title !== "Pagos");
  }
  
  if (session.user.role === "OPERATOR") {
    filteredItems = allNavItems
      .filter(item => 
        item.title === "Clientes" ||
        item.title === "Ordenes"
      );
  }

  const userInfo = {
    name: session.user.name || "",
    email: session.user.email || "",
    role: session.user.role || ""
  };

  return <MainSidebar items={filteredItems} user={userInfo} />;
}