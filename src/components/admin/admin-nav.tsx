"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderTree,
  LayoutDashboard,
  Mail,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ADMIN_LINKS = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/pedidos", label: "Pedidos", icon: ShoppingCart },
  { href: "/admin/productos", label: "Productos", icon: Package },
  { href: "/admin/categorias", label: "Categorías", icon: FolderTree },
  { href: "/admin/clientes", label: "Clientes", icon: Users },
  { href: "/admin/mensajes", label: "Mensajes", icon: Mail },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
] as const;

export function AdminNav({ orientation = "vertical" }: { orientation?: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Panel"
      className={cn(orientation === "vertical" ? "grid gap-1" : "flex gap-1 overflow-x-auto px-4 pb-3")}
    >
      {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition",
              active ? "bg-white/10 text-white" : "text-white/65 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className={cn("h-5 w-5", active ? "text-lime-400" : "")} aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
