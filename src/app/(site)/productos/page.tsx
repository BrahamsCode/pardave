import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PackageSearch, X } from "lucide-react";
import {
  getBrands,
  getCategories,
  searchProducts,
  type ProductQuery,
  type SortOption,
} from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product/product-card";
import { BrandSelect, SortSelect } from "@/components/product/catalog-controls";
import { Pagination } from "@/components/product/pagination";
import { CategoryIcon } from "@/components/product/category-icon";
import { SearchForm } from "@/components/site/search-form";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Catálogo de productos",
  description:
    "Catálogo completo de insumos médicos, material descartable, productos galénicos, higiene y cuidado personal con precios por unidad, docena y caja.",
};

const SORTS: SortOption[] = ["relevancia", "nombre", "precio-asc", "precio-desc"];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ProductosPage({ searchParams }: PageProps<"/productos">) {
  return (
    <div className="bg-surface">
      <Suspense fallback={<CatalogSkeleton />}>
        <Catalog searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Catalog({ searchParams }: { searchParams: PageProps<"/productos">["searchParams"] }) {
  const raw = await searchParams;
  const orden = first(raw.orden) as SortOption | undefined;
  const query: ProductQuery = {
    q: first(raw.q)?.slice(0, 80) || undefined,
    categoria: first(raw.categoria) || undefined,
    marca: first(raw.marca) || undefined,
    orden: orden && SORTS.includes(orden) ? orden : undefined,
    pagina: Number(first(raw.pagina)) || 1,
  };
  const params = {
    q: query.q,
    categoria: query.categoria,
    marca: query.marca,
    orden: query.orden,
  };

  const [result, categories, brands] = await Promise.all([
    searchProducts(query),
    getCategories(),
    getBrands(),
  ]);
  const active = categories.find((c) => c.slug === query.categoria);
  const totalProducts = categories.reduce((sum, c) => sum + c.productCount, 0);

  const href = (patch: Record<string, string | number | undefined>) => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, ...patch })) {
      if (value === undefined || value === "" || (key === "pagina" && Number(value) === 1)) continue;
      next.set(key, String(value));
    }
    const qs = next.toString();
    return qs ? `/productos?${qs}` : "/productos";
  };

  const title = active?.name ?? (query.q ? `Resultados para “${query.q}”` : "Catálogo de productos");

  return (
    <>
      <section className="border-b border-line bg-white">
        <div className="container-page py-8 sm:py-10">
          <nav aria-label="Ruta" className="text-sm text-muted">
            <Link href="/" className="hover:text-ink">Inicio</Link>
            <span className="mx-2">/</span>
            <Link href="/productos" className="hover:text-ink">Catálogo</Link>
            {active && (
              <>
                <span className="mx-2">/</span>
                <span className="text-ink">{active.name}</span>
              </>
            )}
          </nav>
          <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-muted">
                {active?.description ??
                  "Precios en soles. Elige la presentación que necesitas: unidad, docena, caja o cajón."}
              </p>
            </div>
            <SearchForm className="w-full lg:max-w-md" defaultValue={query.q} />
          </div>
        </div>
      </section>

      <div className="container-page grid gap-8 py-8 lg:grid-cols-[17rem_1fr]">
        <aside className="hidden lg:sticky lg:top-32 lg:block lg:self-start">
          <div className="rounded-2xl border border-line bg-white">
            <p className="px-4 py-3.5 font-bold text-ink">Categorías</p>
            <ul className="space-y-0.5 px-2 pb-3">
              <li>
                <CategoryLink href={href({ categoria: undefined, pagina: 1 })} active={!query.categoria} count={totalProducts}>
                  Todas las categorías
                </CategoryLink>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <CategoryLink
                    href={href({ categoria: category.slug, pagina: 1 })}
                    active={category.slug === query.categoria}
                    count={category.productCount}
                    icon={category.slug}
                  >
                    {category.name}
                  </CategoryLink>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 rounded-2xl border border-line bg-white p-4">
            <p className="mb-2 text-sm font-bold text-ink">Marca</p>
            <BrandSelect params={params} brands={brands} />
          </div>
        </aside>

        <section aria-label="Productos" className="min-w-0">
          <div className="mb-4 space-y-3 lg:hidden">
            <nav aria-label="Categorías" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {[{ slug: undefined, name: "Todas" }, ...categories].map((category) => {
                const isActive = category.slug === query.categoria;
                return (
                  <Link
                    key={category.slug ?? "todas"}
                    href={href({ categoria: category.slug, pagina: 1 })}
                    scroll={false}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "rounded-full border px-3.5 py-2 text-sm font-semibold whitespace-nowrap",
                      isActive ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-ink",
                    )}
                  >
                    {category.name}
                  </Link>
                );
              })}
            </nav>
            <BrandSelect params={params} brands={brands} />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted">
              <span className="font-bold text-ink tabular-nums">{result.total}</span>{" "}
              {result.total === 1 ? "producto" : "productos"}
              {result.pageCount > 1 && (
                <span className="tabular-nums"> · página {result.page} de {result.pageCount}</span>
              )}
            </p>
            <SortSelect params={params} />
          </div>

          {(query.q || query.marca || query.categoria) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {query.q && <FilterChip href={href({ q: undefined, pagina: 1 })}>Búsqueda: {query.q}</FilterChip>}
              {active && <FilterChip href={href({ categoria: undefined, pagina: 1 })}>{active.name}</FilterChip>}
              {query.marca && <FilterChip href={href({ marca: undefined, pagina: 1 })}>Marca: {query.marca}</FilterChip>}
              <Link href="/productos" className="text-sm font-semibold text-brand-600 hover:underline">
                Limpiar filtros
              </Link>
            </div>
          )}

          {result.products.length > 0 ? (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {result.products.map((product, index) => (
                <ProductCard key={product.id} product={product} priority={index < 4} />
              ))}
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center">
              <PackageSearch className="h-12 w-12 text-muted/60" aria-hidden="true" />
              <h2 className="mt-4 text-lg font-bold text-ink">No encontramos productos</h2>
              <p className="mt-1 max-w-md text-sm text-muted">
                Prueba con otra palabra (por ejemplo “jeringa”, “alcohol” o “gasa”) o quita algún filtro.
                También puedes consultarnos por WhatsApp.
              </p>
              <ButtonLink href="/productos" variant="outline" className="mt-6">
                Ver todo el catálogo
              </ButtonLink>
            </div>
          )}

          <div className="mt-10">
            <Pagination page={result.page} pageCount={result.pageCount} hrefFor={(p) => href({ pagina: p })} />
          </div>
        </section>
      </div>
    </>
  );
}

function CategoryLink({
  href,
  active,
  count,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  icon?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition",
        active ? "bg-brand-50 font-bold text-brand-700" : "text-ink/80 hover:bg-surface hover:text-ink",
      )}
    >
      {icon ? (
        <CategoryIcon slug={icon} className="h-4 w-4 shrink-0 opacity-70" />
      ) : (
        <span className="h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className="flex-1">{children}</span>
      <span className="text-xs text-muted tabular-nums">{count}</span>
    </Link>
  );
}

function FilterChip({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 py-1 pr-2 pl-3 text-xs font-semibold text-white hover:bg-navy-800"
    >
      {children}
      <X className="h-3.5 w-3.5" aria-label="Quitar filtro" />
    </Link>
  );
}

function CatalogSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando catálogo">
      <div className="border-b border-line bg-white">
        <div className="container-page py-10">
          <div className="h-4 w-40 animate-pulse rounded bg-surface" />
          <div className="mt-5 h-9 w-72 animate-pulse rounded-lg bg-surface" />
          <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-surface" />
        </div>
      </div>
      <div className="container-page grid gap-8 py-8 lg:grid-cols-[17rem_1fr]">
        <div className="hidden h-[28rem] animate-pulse rounded-2xl bg-white lg:block" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="aspect-[3/5] animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    </div>
  );
}
