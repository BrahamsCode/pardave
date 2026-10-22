"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { ImagePlus, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { saveProduct, type ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { submitWithoutReset } from "@/components/ui/submit";

export type ProductFormValues = {
  id?: string;
  name: string;
  sku: string;
  slug: string;
  presentation: string;
  brand: string;
  description: string;
  categoryId: string;
  stock: string;
  inStock: boolean;
  active: boolean;
  featured: boolean;
  image: string;
  prices: { unit: string; amount: string }[];
  variants: { label: string; price: string }[];
};

const UNITS = ["unidad", "docena", "caja", "cajón", "tira", "paquete", "pack", "display", "frasco", "par"];

let rowId = 0;
const withKeys = <T,>(rows: T[]) => rows.map((row) => ({ ...row, key: ++rowId }));

export function ProductForm({
  values,
  categories,
  brands,
}: {
  values: ProductFormValues;
  categories: { id: string; name: string }[];
  brands: string[];
}) {
  const [state, action, pending] = useActionState(saveProduct, { ok: false } as ActionState);
  const [prices, setPrices] = useState(() => withKeys(values.prices.length ? values.prices : [{ unit: "unidad", amount: "" }]));
  const [variants, setVariants] = useState(() => withKeys(values.variants));
  const [preview, setPreview] = useState(values.image);
  const e = state.errors ?? {};

  return (
    <form onSubmit={submitWithoutReset(action)} className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      {values.id && <input type="hidden" name="id" value={values.id} />}

      <div className="space-y-6">
        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="mb-4 font-bold text-ink">Información general</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre *" htmlFor="name" error={e.name} className="sm:col-span-2">
              <Input id="name" name="name" defaultValue={values.name} required aria-invalid={!!e.name} />
            </Field>
            <Field label="Código (SKU) *" htmlFor="sku" error={e.sku}>
              <Input id="sku" name="sku" defaultValue={values.sku} required className="font-mono" aria-invalid={!!e.sku} />
            </Field>
            <Field label="Categoría *" htmlFor="categoryId" error={e.categoryId}>
              <Select id="categoryId" name="categoryId" defaultValue={values.categoryId} required>
                <option value="">Elegir…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </Field>
            <Field label="Presentación" htmlFor="presentation" hint="Ej.: 120 ML, Caja x 100 unid">
              <Input id="presentation" name="presentation" defaultValue={values.presentation} />
            </Field>
            <Field label="Marca / laboratorio" htmlFor="brand">
              <Input id="brand" name="brand" defaultValue={values.brand} list="brand-list" />
              <datalist id="brand-list">
                {brands.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </Field>
            <Field label="Descripción" htmlFor="description" className="sm:col-span-2">
              <Textarea id="description" name="description" defaultValue={values.description} rows={4} />
            </Field>
            <Field label="URL (slug)" htmlFor="slug" error={e.slug} hint="Se genera a partir del nombre si lo dejas vacío." className="sm:col-span-2">
              <Input id="slug" name="slug" defaultValue={values.slug} className="font-mono" />
            </Field>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-bold text-ink">Precios por unidad de venta</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setPrices((r) => [...r, ...withKeys([{ unit: "docena", amount: "" }])])}>
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
          <p className="mb-4 text-xs text-muted">Precios en soles. Ej.: unidad S/ 2.50 y docena S/ 28.00.</p>
          {e.prices && <p className="mb-3 text-xs font-medium text-red-600">Agrega al menos un precio o una medida.</p>}
          <datalist id="unit-list">
            {UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
          <ul className="space-y-2">
            {prices.map((row) => (
              <li key={row.key} className="grid grid-cols-[1fr_9rem_auto] gap-2">
                <Input name="prices.unit" defaultValue={row.unit} list="unit-list" aria-label="Unidad de venta" placeholder="unidad" />
                <Input name="prices.amount" defaultValue={row.amount} type="number" step="0.01" min="0" inputMode="decimal" aria-label="Precio" placeholder="0.00" className="tabular-nums" />
                <Button type="button" variant="ghost" size="icon" aria-label="Quitar precio" onClick={() => setPrices((r) => r.filter((x) => x.key !== row.key))}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-bold text-ink">Medidas con precio propio</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setVariants((r) => [...r, ...withKeys([{ label: "", price: "" }])])}>
              <Plus className="h-4 w-4" /> Agregar medida
            </Button>
          </div>
          <p className="mb-4 text-xs text-muted">Opcional. Para suturas, sondas, bombillas, tallas, etc.</p>
          {variants.length === 0 ? (
            <p className="rounded-xl bg-surface px-4 py-3 text-sm text-muted">Sin medidas.</p>
          ) : (
            <ul className="space-y-2">
              {variants.map((row) => (
                <li key={row.key} className="grid grid-cols-[1fr_9rem_auto] gap-2">
                  <Input name="variants.label" defaultValue={row.label} aria-label="Medida" placeholder="Ej.: 3/0 DS25" />
                  <Input name="variants.price" defaultValue={row.price} type="number" step="0.01" min="0" inputMode="decimal" aria-label="Precio" placeholder="0.00" className="tabular-nums" />
                  <Button type="button" variant="ghost" size="icon" aria-label="Quitar medida" onClick={() => setVariants((r) => r.filter((x) => x.key !== row.key))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-2xl border border-line bg-white p-5">
          <h2 className="mb-4 font-bold text-ink">Imagen</h2>
          <div className="relative aspect-square overflow-hidden rounded-xl bg-surface">
            {preview ? (
              <Image src={preview} alt="Vista previa" fill sizes="320px" className="object-cover" unoptimized={preview.startsWith("blob:")} />
            ) : (
              <div className="grid h-full place-items-center text-muted/50">
                <ImagePlus className="h-12 w-12" aria-hidden="true" />
              </div>
            )}
          </div>
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-brand-300 bg-brand-50 px-3 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">
            <ImagePlus className="h-4 w-4" aria-hidden="true" />
            Subir imagen (JPG, PNG, WEBP · máx. 4 MB)
            <input
              type="file"
              name="imageFile"
              accept="image/jpeg,image/png,image/webp,image/avif"
              className="sr-only"
              onChange={(ev) => {
                const file = ev.target.files?.[0];
                if (file) setPreview(URL.createObjectURL(file));
              }}
            />
          </label>
          {e.image && <p className="mt-2 text-xs font-medium text-red-600">{e.image}</p>}
          <input type="hidden" name="image" value={values.image} />
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-white p-5">
          <h2 className="font-bold text-ink">Disponibilidad</h2>
          {[
            { name: "active", label: "Visible en la tienda", value: values.active },
            { name: "inStock", label: "Con stock disponible", value: values.inStock },
            { name: "featured", label: "Destacado en la página de inicio", value: values.featured },
          ].map((opt) => (
            <label key={opt.name} className="flex items-center justify-between gap-3 text-sm font-medium text-ink">
              {opt.label}
              <input type="checkbox" name={opt.name} defaultChecked={opt.value} className="h-5 w-5 rounded accent-brand-600" />
            </label>
          ))}
          <Field label="Stock (opcional)" htmlFor="stock" hint="Cantidad de referencia para control interno.">
            <Input id="stock" name="stock" type="number" min="0" defaultValue={values.stock} />
          </Field>
        </section>

        {state.message && !state.ok && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.message}</p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {values.id ? "Guardar cambios" : "Crear producto"}
        </Button>
      </div>
    </form>
  );
}
