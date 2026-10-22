"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { cartTotals, useCart } from "@/components/cart/store";
import { useHydrated } from "@/components/cart/use-hydrated";

export function CartButton() {
  const items = useCart((s) => s.items);
  const hydrated = useHydrated();
  const { count } = cartTotals(items);
  const visible = hydrated && count > 0;

  return (
    <Link
      href="/carrito"
      className="relative inline-flex h-11 items-center gap-2 rounded-xl whitespace-nowrap bg-navy-900 px-3.5 text-sm font-semibold text-white transition hover:bg-navy-800"
      aria-label={visible ? `Ver pedido, ${count} productos` : "Ver pedido"}
    >
      <ShoppingBag className="h-5 w-5" aria-hidden="true" />
      <span className="hidden sm:inline">Mi pedido</span>
      {visible && (
        <span className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-lime-400 px-1 text-[0.7rem] font-extrabold text-navy-950 tabular-nums ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
