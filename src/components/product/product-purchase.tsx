"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Minus, Plus, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import type { ProductDetail } from "@/lib/catalog";
import { MAX_QUANTITY, useCart } from "@/components/cart/store";
import { Button, buttonClass } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";
import { cn, formatPrice, unitLabel, whatsappLink } from "@/lib/utils";

export function ProductPurchase({ product, whatsapp }: { product: ProductDetail; whatsapp: string }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [optionId, setOptionId] = useState(product.options[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const option = product.options.find((o) => o.id === optionId) ?? product.options[0];
  const isVariant = option?.kind === "variant";

  if (!option) return null;

  const total = option.amount * quantity;
  const message = `Hola, quisiera pedir:\n• ${quantity} × ${product.name} (${unitLabel(option.label)}) — ${formatPrice(option.amount)} c/u\nCódigo: ${product.sku}`;

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="text-sm font-bold text-ink">
          {isVariant ? "Elige la medida" : "Elige la presentación"}
        </legend>
        <div className={cn("mt-3 grid gap-2.5", product.options.length > 4 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {product.options.map((o) => {
            const selected = o.id === option.id;
            return (
              <label
                key={o.id}
                className={cn(
                  "relative flex cursor-pointer flex-col rounded-2xl border-2 px-4 py-3 transition",
                  selected ? "border-brand-500 bg-brand-50" : "border-line bg-white hover:border-brand-200",
                )}
              >
                <input
                  type="radio"
                  name="option"
                  value={o.id}
                  checked={selected}
                  onChange={() => setOptionId(o.id)}
                  className="sr-only"
                />
                <span className="text-sm font-semibold text-muted">{unitLabel(o.label)}</span>
                <span className="text-xl font-extrabold text-navy-900 tabular-nums">{formatPrice(o.amount)}</span>
                {selected && (
                  <Check className="absolute top-3 right-3 h-4.5 w-4.5 text-brand-600" aria-hidden="true" />
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex h-13 items-center rounded-2xl border border-line bg-white">
          <button
            type="button"
            className="grid h-full w-12 place-items-center text-ink disabled:opacity-40"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="Disminuir cantidad"
          >
            <Minus className="h-4 w-4" />
          </button>
          <input
            type="number"
            min={1}
            max={MAX_QUANTITY}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(MAX_QUANTITY, Number(e.target.value) || 1)))}
            className="h-full w-16 [appearance:textfield] border-x border-line text-center font-bold tabular-nums focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
            aria-label="Cantidad"
          />
          <button
            type="button"
            className="grid h-full w-12 place-items-center text-ink"
            onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY, q + 1))}
            aria-label="Aumentar cantidad"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <Button
          size="lg"
          className="flex-1"
          disabled={!product.inStock}
          onClick={() => {
            add(
              {
                productId: product.id,
                optionId: option.id,
                optionKind: option.kind,
                optionLabel: option.label,
                slug: product.slug,
                name: product.name,
                presentation: product.presentation,
                image: product.image,
                unitPrice: option.amount,
              },
              quantity,
            );
            setAdded(true);
            toast.success("Agregado al pedido", {
              description: `${quantity} × ${product.name} · ${unitLabel(option.label)}`,
              action: { label: "Ver pedido", onClick: () => router.push("/carrito") },
            });
          }}
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          {product.inStock ? `Agregar · ${formatPrice(total)}` : "Producto agotado"}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href={whatsappLink(whatsapp, message)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("outline", "md", "flex-1 border-[#25D366]/40 text-[#128C4A] hover:bg-[#25D366]/10")}
        >
          <WhatsAppIcon className="h-5 w-5" />
          Pedir este producto por WhatsApp
        </a>
        {added && (
          <Link href="/carrito" className={buttonClass("secondary", "md", "flex-1")}>
            Ir a mi pedido
          </Link>
        )}
      </div>
    </div>
  );
}
