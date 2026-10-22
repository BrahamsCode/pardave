import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-navy-950 px-4 py-16">
      <div aria-hidden="true" className="absolute -top-40 -left-40 h-[30rem] w-[30rem] rounded-full bg-brand-600/30 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-40 -bottom-40 h-[30rem] w-[30rem] rounded-full bg-mint-500/25 blur-3xl" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo tone="light" />
        </div>
        <div className="rounded-3xl bg-white p-7 shadow-2xl shadow-black/30">
          <h1 className="text-xl font-extrabold text-ink">Panel de administración</h1>
          <p className="mt-1 mb-6 text-sm text-muted">Ingresa con tu cuenta para gestionar catálogo y pedidos.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-white/60">
          <Link href="/" className="hover:text-white">← Volver a la tienda</Link>
        </p>
      </div>
    </div>
  );
}
