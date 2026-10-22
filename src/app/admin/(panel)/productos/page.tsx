import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Form from "next/form";
import { Download, PackageOpen, Pencil, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { formatPrice, unitLabel } from "@/lib/utils";
import { Card, PageHeader } from "@/components/admin/page-header";
import { FlagToggle } from "@/components/admin/flag-toggle";
import { Pagination } from "@/components/product/pagination";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";

export const instant = false;
export const metadata: Metadata = { title: "Productos" };

const PER_PAGE = 30;

function first(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/productos">) {
  await requireUser();
  const sp = await searchParams;
  const q = first(sp.q)?.trim() ?? "";
  const categoria = first(sp.categoria) ?? "";
  const estado = first(sp.estado) ?? "";
  const page = Math.max(1, Number(first(sp.pagina)) || 1);

  const where: Prisma.ProductWhereInput = {
    ...(categoria ? { categoryId: categoria } : {}),
    ...(estado === "activos" ? { active: true } : {}),
    ...(estado === "inactivos" ? { active: false } : {}),
    ...(estado === "agotados" ? { inStock: false } : {}),
    ...(estado === "destacados" ? { featured: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { brand: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, products, categories] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        prices: { orderBy: { sortOrder: "asc" } },
        _count: { select: { variants: true } },
      },
      orderBy: { sku: "asc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoria) params.set("categoria", categoria);
    if (estado) params.set("estado", estado);
    if (p > 1) params.set("pagina", String(p));
    const s = params.toString();
    return s ? `/admin/productos?${s}` : "/admin/productos";
  };

  return (
    <>
      <PageHeader
        title="Productos"
        description={`${total} productos encontrados`}
        actions={
          <>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- descarga de archivo */}
            <a href="/api/admin/export/productos" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm font-semibold hover:bg-surface">
              <Download className="h-4 w-4" aria-hidden="true" /> Exportar CSV
            </a>
            <ButtonLink href="/admin/productos/nuevo" size="sm">
              <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo producto
            </ButtonLink>
          </>
        }
      />

      <Card className="mb-4 p-4">
        <Form action="/admin/productos" className="grid gap-3 md:grid-cols-[1fr_14rem_12rem_auto]">
          <Input name="q" defaultValue={q} placeholder="Buscar por nombre, código o marca" aria-label="Buscar" />
          <Select name="categoria" defaultValue={categoria} aria-label="Categoría">
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select name="estado" defaultValue={estado} aria-label="Estado">
            <option value="">Todos los estados</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="agotados">Agotados</option>
            <option value="destacados">Destacados</option>
          </Select>
          <Button type="submit" variant="secondary">Filtrar</Button>
        </Form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="bg-surface text-left text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">Categoría</th>
                <th className="px-4 py-3 font-semibold">Precios</th>
                <th className="px-3 py-3 text-center font-semibold">Visible</th>
                <th className="px-3 py-3 text-center font-semibold">Stock</th>
                <th className="px-3 py-3 text-center font-semibold">Destacado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id} className={p.active ? "hover:bg-surface/60" : "bg-surface/40 opacity-70"}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface">
                        {p.image ? (
                          <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />
                        ) : (
                          <PackageOpen className="m-auto mt-3 h-5 w-5 text-muted/50" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/admin/productos/${p.id}`} className="line-clamp-1 font-semibold text-ink hover:text-brand-700">
                          {p.name}
                        </Link>
                        <p className="text-xs text-muted">
                          <span className="font-mono">{p.sku}</span>
                          {p.presentation ? ` · ${p.presentation}` : ""}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.category.name}</td>
                  <td className="px-4 py-3 text-xs tabular-nums">
                    {p.prices.map((x) => (
                      <span key={x.id} className="block">
                        {unitLabel(x.unit)} <b className="text-ink">{formatPrice(Number(x.amount))}</b>
                      </span>
                    ))}
                    {p._count.variants > 0 && <span className="block text-muted">{p._count.variants} medidas</span>}
                  </td>
                  <td className="px-3 py-3 text-center"><FlagToggle id={p.id} flag="active" value={p.active} label="Visible en la tienda" /></td>
                  <td className="px-3 py-3 text-center"><FlagToggle id={p.id} flag="inStock" value={p.inStock} label="Con stock" /></td>
                  <td className="px-3 py-3 text-center"><FlagToggle id={p.id} flag="featured" value={p.featured} label="Destacado en inicio" /></td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/productos/${p.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-brand-50 hover:text-brand-700" aria-label={`Editar ${p.name}`}>
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted">No hay productos con esos filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-6">
        <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PER_PAGE))} hrefFor={href} />
      </div>
    </>
  );
}
