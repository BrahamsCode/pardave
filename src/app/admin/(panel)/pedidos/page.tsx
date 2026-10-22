import type { Metadata } from "next";
import Link from "next/link";
import Form from "next/form";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { OrderStatus, Prisma } from "@/generated/prisma/client";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { Card, PageHeader } from "@/components/admin/page-header";
import { STATUS_OPTIONS, StatusBadge } from "@/components/admin/status-badge";
import { Pagination } from "@/components/product/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export const instant = false;
export const metadata: Metadata = { title: "Pedidos" };

const PER_PAGE = 25;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireUser();
  const sp = await searchParams;
  const q = first(sp.q)?.trim() ?? "";
  const estadoRaw = first(sp.estado) ?? "";
  const estado = STATUS_OPTIONS.some(([s]) => s === estadoRaw) ? (estadoRaw as OrderStatus) : undefined;
  const page = Math.max(1, Number(first(sp.pagina)) || 1);

  const where: Prisma.OrderWhereInput = {
    ...(estado ? { status: estado } : {}),
    ...(q
      ? {
          OR: [
            { code: { contains: q, mode: "insensitive" } },
            { customer: { name: { contains: q, mode: "insensitive" } } },
            { customer: { businessName: { contains: q, mode: "insensitive" } } },
            { customer: { phone: { contains: q } } },
          ],
        }
      : {}),
  };

  const [total, orders, counts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: { customer: true, _count: { select: { items: true } } },
      orderBy: { number: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countOf = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const all = counts.reduce((sum, c) => sum + c._count._all, 0);

  const href = (patch: { estado?: string; pagina?: number }) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const e = "estado" in patch ? patch.estado : estado;
    if (e) params.set("estado", e);
    if (patch.pagina && patch.pagina > 1) params.set("pagina", String(patch.pagina));
    const s = params.toString();
    return s ? `/admin/pedidos?${s}` : "/admin/pedidos";
  };

  return (
    <>
      <PageHeader
        title="Pedidos"
        description="Solicitudes recibidas desde la tienda web."
        actions={
          // eslint-disable-next-line @next/next/no-html-link-for-pages -- descarga de archivo
          <a href="/api/admin/export/pedidos" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm font-semibold hover:bg-surface">
            <Download className="h-4 w-4" aria-hidden="true" /> Exportar CSV
          </a>
        }
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {[["", "Todos", all] as const, ...STATUS_OPTIONS.map(([s, label]) => [s, label, countOf(s)] as const)].map(
          ([value, label, count]) => (
            <Link
              key={value || "all"}
              href={href({ estado: value || undefined })}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-semibold whitespace-nowrap",
                (estado ?? "") === value ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-ink hover:bg-surface",
              )}
            >
              {label}
              <span className="text-xs tabular-nums opacity-70">{count}</span>
            </Link>
          ),
        )}
      </div>

      <Card className="mb-4 p-4">
        <Form action="/admin/pedidos" className="flex gap-3">
          {estado && <input type="hidden" name="estado" value={estado} />}
          <Input name="q" defaultValue={q} placeholder="Buscar por código, cliente, empresa o teléfono" aria-label="Buscar pedidos" />
          <Button type="submit" variant="secondary">Buscar</Button>
        </Form>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="bg-surface text-left text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Pedido</th>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Entrega</th>
                <th className="px-5 py-3 font-semibold">Fecha</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface/60">
                  <td className="px-5 py-3">
                    <Link href={`/admin/pedidos/${o.id}`} className="font-mono font-semibold text-brand-700 hover:underline">{o.code}</Link>
                    <span className="block text-xs text-muted">{o._count.items} productos</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-semibold text-ink">{o.customer.name}</span>
                    <span className="block text-xs text-muted">{o.customer.businessName ?? o.customer.phone}</span>
                  </td>
                  <td className="px-5 py-3 text-muted">{o.deliveryMethod === "DELIVERY" ? "Delivery" : "Recojo"}</td>
                  <td className="px-5 py-3 text-muted">{formatDate(o.createdAt, true)}</td>
                  <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums">{formatPrice(Number(o.total))}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted">No hay pedidos con esos filtros.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-6">
        <Pagination page={page} pageCount={Math.max(1, Math.ceil(total / PER_PAGE))} hrefFor={(p) => href({ pagina: p })} />
      </div>
    </>
  );
}
