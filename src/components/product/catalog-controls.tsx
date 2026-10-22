"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Select } from "@/components/ui/field";

type Params = Record<string, string | undefined>;

function buildHref(params: Params, patch: Params) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch, pagina: undefined })) {
    if (value) next.set(key, value);
  }
  const query = next.toString();
  return query ? `/productos?${query}` : "/productos";
}

export function SortSelect({ params }: { params: Params }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="orden" className="text-sm font-medium whitespace-nowrap text-muted">
        Ordenar por
      </label>
      <Select
        id="orden"
        value={params.orden ?? "relevancia"}
        onChange={(e) =>
          startTransition(() =>
            router.push(buildHref(params, { orden: e.target.value === "relevancia" ? undefined : e.target.value }), {
              scroll: false,
            }),
          )
        }
        className="h-10 w-auto min-w-44"
      >
        <option value="relevancia">Relevancia</option>
        <option value="nombre">Nombre (A–Z)</option>
        <option value="precio-asc">Precio: menor a mayor</option>
        <option value="precio-desc">Precio: mayor a menor</option>
      </Select>
      {pending && <Loader2 className="h-4 w-4 animate-spin text-muted" aria-label="Cargando" />}
    </div>
  );
}

export function BrandSelect({ params, brands }: { params: Params; brands: { name: string; count: number }[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  return (
    <Select
      aria-label="Filtrar por marca"
      value={params.marca ?? ""}
      onChange={(e) =>
        startTransition(() => router.push(buildHref(params, { marca: e.target.value || undefined }), { scroll: false }))
      }
    >
      <option value="">Todas las marcas</option>
      {brands.map((brand) => (
        <option key={brand.name} value={brand.name}>
          {brand.name} ({brand.count})
        </option>
      ))}
    </Select>
  );
}
