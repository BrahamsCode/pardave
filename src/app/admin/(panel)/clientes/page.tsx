import type { Metadata } from "next";
import Form from "next/form";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import { formatDate, formatPrice } from "@/lib/utils";
import { Card, PageHeader } from "@/components/admin/page-header";
import { Pagination } from "@/components/product/pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

export const instant = false;
export const metadata: Metadata = { title: "Clientes" };

const PER_PAGE = 30;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function CustomersPage({ searchParams }: PageProps<"/admin/clientes">) {
  await requireUser();
  const sp = await searchParams;
  const q = first(sp.q)?.trim() ?? "";
  const page = Math.max(1, Number(first(sp.pagina)) || 1);
  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { businessName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { documentNumber: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [total, customers] = await Promise.all([
    db.customer.count({ where }),
    db.customer.findMany({
      where,
      include: { orders: { select: { total: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" } } },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
  ]);

  return (
    <>
      <PageHeader title="Clientes" description={`${total} clientes registrados a partir de sus pedidos.`} />
      <Card className="mb-4 p-4">
        <Form action="/admin/clientes" className="flex gap-3">
          <Input name="q" defaultValue={q} placeholder="Buscar por nombre, empresa, documento, teléfono o correo" aria-label="Buscar clientes" />
          <Button type="submit" variant="secondary">Buscar</Button>
        </Form>
      </Card>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-sm">
            <thead className="bg-surface text-left text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Cliente</th>
                <th className="px-5 py-3 font-semibold">Documento</th>
                <th className="px-5 py-3 font-semibold">Contacto</th>
                <th className="px-5 py-3 text-right font-semibold">Pedidos</th>
                <th className="px-5 py-3 text-right font-semibold">Comprado</th>
                <th className="px-5 py-3 font-semibold">Último pedido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((c) => {
                const valid = c.orders.filter((o) => o.status !== "CANCELADO");
                const spent = valid.reduce((sum, o) => sum + Number(o.total), 0);
                return (
                  <tr key={c.id} className="hover:bg-surface/60">
                    <td className="px-5 py-3">
                      <span className="font-semibold text-ink">{c.name}</span>
                      {c.businessName && <span className="block text-xs text-muted">{c.businessName}</span>}
                    </td>
                    <td className="px-5 py-3 text-muted">{[c.documentType, c.documentNumber].filter(Boolean).join(" ") || "—"}</td>
                    <td className="px-5 py-3">
                      <a href={`tel:${c.phone}`} className="text-brand-700 hover:underline">{c.phone}</a>
                      {c.email && <span className="block text-xs text-muted">{c.email}</span>}
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{c.orders.length}</td>
                    <td className="px-5 py-3 text-right font-bold tabular-nums">{formatPrice(spent)}</td>
                    <td className="px-5 py-3 text-muted">{c.orders[0] ? formatDate(c.orders[0].createdAt) : "—"}</td>
                  </tr>
                );
              })}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted">Aún no hay clientes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      <div className="mt-6">
        <Pagination
          page={page}
          pageCount={Math.max(1, Math.ceil(total / PER_PAGE))}
          hrefFor={(p) => `/admin/clientes?${new URLSearchParams({ ...(q ? { q } : {}), pagina: String(p) })}`}
        />
      </div>
    </>
  );
}
