import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { Logo } from "@/components/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { UserMenu } from "@/components/admin/user-menu";

/** El panel depende de la sesión en cada petición: se permite que bloquee la navegación. */
export const instant = false;

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen flex-1">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-navy-950 p-4 lg:flex">
        <Link href="/admin" className="px-2 py-3">
          <Logo tone="light" />
        </Link>
        <div className="mt-6 flex-1 overflow-y-auto">
          <AdminNav />
        </div>
        <Link
          href="/"
          target="_blank"
          className="mb-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Ver tienda
        </Link>
        <div className="border-t border-white/10 pt-4">
          <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-white/5" />}>
            <UserMenu />
          </Suspense>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 bg-navy-950 lg:hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href="/admin">
              <Logo tone="light" />
            </Link>
            <div className="w-40">
              <Suspense>
                <UserMenu />
              </Suspense>
            </div>
          </div>
          <AdminNav orientation="horizontal" />
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
