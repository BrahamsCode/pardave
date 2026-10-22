"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Loader2, Minus, PackageOpen, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { createOrder, type FormState } from "@/app/(site)/actions";
import { cartTotals, useCart } from "@/components/cart/store";
import { useHydrated } from "@/components/cart/use-hydrated";
import { Button, ButtonLink, buttonClass } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";
import { formatPrice, unitLabel, whatsappLink } from "@/lib/utils";
import { submitWithoutReset } from "@/components/ui/submit";

const initialState: FormState = { ok: false };

export function CartView({ whatsapp }: { whatsapp: string }) {
  const hydrated = useHydrated();
  const { items, setQuantity, remove, clear } = useCart();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createOrder, initialState);
  const [delivery, setDelivery] = useState<"RECOJO" | "DELIVERY">("RECOJO");
  const { count, subtotal } = cartTotals(items);

  useEffect(() => {
    if (state.ok && state.code) {
      clear();
      router.push(`/pedido/${state.code}`);
    }
  }, [state, clear, router]);

  if (!hydrated) {
    return (
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_26rem]" aria-busy="true">
        <div className="h-72 animate-pulse rounded-3xl bg-white" />
        <div className="h-96 animate-pulse rounded-3xl bg-white" />
      </div>
    );
  }

  if (items.length === 0 && !state.ok) {
    return (
      <div className="mt-8 flex flex-col items-center rounded-3xl border border-dashed border-line bg-white px-6 py-20 text-center">
        <ShoppingBag className="h-14 w-14 text-muted/50" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-bold text-ink">Tu pedido está vacío</h2>
        <p className="mt-2 max-w-md text-muted">
          Explora el catálogo y agrega los productos que necesitas. Puedes elegir unidad, docena o caja.
        </p>
        <ButtonLink href="/productos" className="mt-6" size="lg">
          Ir al catálogo
        </ButtonLink>
      </div>
    );
  }

  const waText = [
    "Hola, quisiera hacer este pedido:",
    ...items.map(
      (i) => `• ${i.quantity} × ${i.name} (${unitLabel(i.optionLabel)}) — ${formatPrice(i.unitPrice * i.quantity)}`,
    ),
    `Total referencial: ${formatPrice(subtotal)}`,
  ].join("\n");

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1fr_26rem]">
      <section aria-label="Productos del pedido" className="overflow-hidden rounded-3xl border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-bold text-ink">
            {count} {count === 1 ? "unidad" : "unidades"} · {items.length} {items.length === 1 ? "producto" : "productos"}
          </h2>
          <button type="button" onClick={clear} className="text-sm font-semibold text-red-600 hover:underline">
            Vaciar pedido
          </button>
        </div>
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 p-4 sm:p-5">
              <Link href={`/productos/${item.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-surface sm:h-24 sm:w-24">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                ) : (
                  <PackageOpen className="m-auto h-8 w-8 text-muted/50" aria-hidden="true" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <Link href={`/productos/${item.slug}`} className="line-clamp-2 font-bold text-ink hover:text-brand-700">
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted">
                    {unitLabel(item.optionLabel)} · {formatPrice(item.unitPrice)}
                    {item.presentation ? ` · ${item.presentation}` : ""}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 sm:justify-end">
                  <div className="flex h-10 items-center rounded-xl border border-line">
                    <button
                      type="button"
                      className="grid h-full w-9 place-items-center disabled:opacity-40"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label={`Disminuir ${item.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => setQuantity(item.key, Number(e.target.value) || 1)}
                      className="h-full w-14 [appearance:textfield] border-x border-line text-center text-sm font-bold tabular-nums focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
                      aria-label={`Cantidad de ${item.name}`}
                    />
                    <button
                      type="button"
                      className="grid h-full w-9 place-items-center"
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                      aria-label={`Aumentar ${item.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="w-24 text-right font-extrabold text-navy-900 tabular-nums">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                  <button
                    type="button"
                    onClick={() => remove(item.key)}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                    aria-label={`Quitar ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-line bg-surface/60 px-5 py-4">
          <Link href="/productos" className="text-sm font-semibold text-brand-600 hover:underline">
            ← Seguir agregando productos
          </Link>
        </div>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-32">
        <form onSubmit={submitWithoutReset(formAction)} className="rounded-3xl border border-line bg-white p-5 sm:p-6" noValidate>
          <input
            type="hidden"
            name="items"
            value={JSON.stringify(
              items.map((i) => ({
                productId: i.productId,
                optionId: i.optionId,
                optionKind: i.optionKind,
                quantity: i.quantity,
              })),
            )}
          />
          <h2 className="text-lg font-bold text-ink">Tus datos</h2>
          <div className="mt-4 space-y-4">
            <Field label="Nombre completo *" htmlFor="name" error={state.errors?.name}>
              <Input id="name" name="name" autoComplete="name" required aria-invalid={!!state.errors?.name} />
            </Field>
            <Field label="Botica, farmacia o empresa" htmlFor="businessName">
              <Input id="businessName" name="businessName" autoComplete="organization" />
            </Field>
            <div className="grid grid-cols-[7rem_1fr] gap-3">
              <Field label="Documento" htmlFor="documentType">
                <Select id="documentType" name="documentType" defaultValue="">
                  <option value="">—</option>
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                  <option value="CE">C.E.</option>
                </Select>
              </Field>
              <Field label="Número" htmlFor="documentNumber" error={state.errors?.documentNumber}>
                <Input id="documentNumber" name="documentNumber" inputMode="numeric" aria-invalid={!!state.errors?.documentNumber} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label="Celular / WhatsApp *" htmlFor="phone" error={state.errors?.phone}>
                <Input id="phone" name="phone" type="tel" autoComplete="tel" required aria-invalid={!!state.errors?.phone} />
              </Field>
              <Field label="Correo" htmlFor="email" error={state.errors?.email}>
                <Input id="email" name="email" type="email" autoComplete="email" aria-invalid={!!state.errors?.email} />
              </Field>
            </div>
            <fieldset>
              <legend className="text-sm font-semibold text-ink">Entrega</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {(["RECOJO", "DELIVERY"] as const).map((method) => (
                  <label
                    key={method}
                    className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
                      delivery === method ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-ink"
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value={method}
                      checked={delivery === method}
                      onChange={() => setDelivery(method)}
                      className="sr-only"
                    />
                    {method === "RECOJO" ? "Recojo en tienda" : "Delivery"}
                  </label>
                ))}
              </div>
            </fieldset>
            {delivery === "DELIVERY" && (
              <div className="grid gap-4">
                <Field label="Dirección de entrega *" htmlFor="address" error={state.errors?.address}>
                  <Input id="address" name="address" autoComplete="street-address" aria-invalid={!!state.errors?.address} />
                </Field>
                <Field label="Distrito" htmlFor="district">
                  <Input id="district" name="district" autoComplete="address-level2" />
                </Field>
              </div>
            )}
            <Field label="Comentarios" htmlFor="notes" hint="Horario de entrega, forma de pago, alternativas, etc.">
              <Textarea id="notes" name="notes" rows={3} className="min-h-20" />
            </Field>
          </div>

          <dl className="mt-6 space-y-2 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-muted">
              <dt>Envío</dt>
              <dd>Por coordinar</dd>
            </div>
            <div className="flex justify-between text-lg font-extrabold text-navy-950">
              <dt>Total referencial</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
          </dl>

          {state.message && !state.ok && (
            <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {state.message}
            </p>
          )}

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={pending || items.length === 0}>
            {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
            {pending ? "Enviando pedido…" : "Enviar pedido"}
          </Button>
          <p className="mt-3 text-center text-xs text-muted">
            No se realiza ningún cobro en línea. Te contactaremos para confirmar.
          </p>
        </form>

        <a
          href={whatsappLink(whatsapp, waText)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass("outline", "lg", "w-full border-[#25D366]/40 bg-white text-[#128C4A] hover:bg-[#25D366]/10")}
        >
          <WhatsAppIcon className="h-5 w-5" />
          Enviar pedido por WhatsApp
        </a>
      </aside>
    </div>
  );
}
