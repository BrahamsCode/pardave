"use client";

import Link from "next/link";
import { ShoppingCart, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import type { ProductCard } from "@/lib/catalog";
import { useCart } from "@/components/cart/store";
import { buttonClass } from "@/components/ui/button";
import { unitLabel } from "@/lib/utils";

/** Botón de la tarjeta: agrega directo si hay una sola opción, si no lleva al detalle. */
export function QuickAdd({ product }: { product: ProductCard }) {
  const add = useCart((s) => s.add);

  if (!product.inStock) {
    return (
      <span className={buttonClass("outline", "sm", "mt-2 w-full cursor-not-allowed opacity-60")}>
        Sin stock
      </span>
    );
  }

  if (product.options.length !== 1) {
    return (
      <Link href={`/productos/${product.slug}`} className={buttonClass("outline", "sm", "mt-2 w-full")}>
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Elegir presentación
      </Link>
    );
  }

  const option = product.options[0];
  return (
    <button
      type="button"
      className={buttonClass("primary", "sm", "mt-2 w-full")}
      onClick={() => {
        add({
          productId: product.id,
          optionId: option.id,
          optionKind: option.kind,
          optionLabel: option.label,
          slug: product.slug,
          name: product.name,
          presentation: product.presentation,
          image: product.image,
          unitPrice: option.amount,
        });
        toast.success("Agregado al pedido", {
          description: `${product.name} · ${unitLabel(option.label)}`,
        });
      }}
    >
      <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      Agregar
    </button>
  );
}
