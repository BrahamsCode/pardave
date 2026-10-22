import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight, Clock, Mail, Package, ShoppingCart, Wallet } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/utils";
import { Card, PageHeader } from "@/components/admin/page-header";
import { SalesChart, type DayPoint } from "@/components/admin/sales-chart";
import { StatusBadge } from "@/components/admin/status-badge";
import { ButtonLink } from "@/components/ui/button";

export const instant = false;
export const metadata: Metadata = { title: "Resumen" };

const DAYS = 14;
const LIMA_OFFSET_MS = 5 * 60 * 60 * 1000; // America/Lima es UTC-5 todo el año

/** Inicio del día de Lima (en UTC) para una fecha dada. */
function limaDayStart(date: Date) {
  const lima = new Date(date.getTime() - LIMA_OFFSET_MS);
  return new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate()) + LIMA_OFFSET_MS);
}

export default async function DashboardPage() {
  const user = await requireUser();
  await connection();

  const now = new Date();
  const today = limaDayStart(now);
  const limaNow = new Date(now.getTime() - LIMA_OFFSET_MS);
  const monthStart = new Date(Date.UTC(limaNow.getUTCFullYear(), limaNow.getUTCMonth(), 1) + LIMA_OFFSET_MS);
  const since = new Date(today.getTime() - (DAYS - 1) * 86400000);
  const thirtyDays = new Date(today.getTime() - 29 * 86400000);

  const [pending, monthOrders, monthRevenue, activeProducts, outOfStock, unread, customers, recent, daily, top] =
    await Promise.all([
      db.order.count({ where: { status: "PENDIENTE" } }),
      db.order.count({ where: { createdAt: { gte: monthStart }, status: { not: "CANCELADO" } } }),
      db.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: monthStart }, status: { not: "CANCELADO" } },
      }),
      db.product.count({ where: { active: true } }),
      db.product.count({ where: { active: true, inStock: false } }),
      db.contactMessage.count({ where: { read: false } }),
      db.customer.count(),
      db.order.findMany({ include: { customer: true }, orderBy: { number: "desc" }, take: 8 }),
      db.$queryRaw<{ d: string; t: number; n: number }[]>`
        SELECT to_char(("createdAt" - interval '5 hours')::date, 'YYYY-MM-DD') AS d,
               COALESCE(SUM(total), 0)::float AS t,
               COUNT(*)::int AS n
        FROM "Order"
        WHERE status <> 'CANCELADO' AND "createdAt" >= ${since}
        GROUP BY 1`,
      db.orderItem.groupBy({
        by: ["productName"],
        where: { order: { createdAt: { gte: thirtyDays }, status: { not: "CANCELADO" } } },
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { lineTotal: "desc" } },
        take: 5,
      }),
    ]);

  const byDay = new Map(daily.map((row) => [row.d, row]));
  const dayLabel = new Intl.DateTimeFormat("es-PE", { day: "numeric", month: "short", timeZone: "UTC" });
  const series: DayPoint[] = Array.from({ length: DAYS }, (_, i) => {
    const day = new Date(since.getTime() + i * 86400000 - LIMA_OFFSET_MS);
    const key = day.toISOString().slice(0, 10);
    const row = byDay.get(key);
    return { date: key, label: dayLabel.format(day), total: row?.t ?? 0, orders: row?.n ?? 0 };
  });
  const periodTotal = series.reduce((sum, d) => sum + d.total, 0);

  const kpis = [
    { label: "Pedidos pendientes", value: pending, href: "/admin/pedidos?estado=PENDIENTE", icon: Clock },
    { label: "Pedidos del mes", value: monthOrders, href: "/admin/pedidos", icon: ShoppingCart },
    { label: "Ventas del mes", value: formatPrice(Number(monthRevenue._sum.total ?? 0)), href: "/admin/pedidos", icon: Wallet },
    {
      label: "Productos activos",
      value: activeProducts,
      hint: outOfStock > 0 ? `${outOfStock} agotados` : "Todos con stock",
      href: "/admin/productos",
      icon: Package,
    },
  ];

  return (
    <>
      <PageHeader
        title={`Hola, ${user.name.split(" ")[0]}`}
        description={`Resumen del negocio al ${formatDate(now, true)}`}
        actions={
          <>
            <ButtonLink href="/admin/productos/nuevo" variant="outline" size="sm">Nuevo producto</ButtonLink>
            <ButtonLink href="/admin/pedidos" size="sm">Ver pedidos</ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ label, value, hint, href, icon: Icon }) => (
          <Link key={label} href={href} className="group rounded-2xl border border-line bg-white p-5 transition hover:border-brand-200 hover:shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted">{label}</p>
              <Icon className="h-5 w-5 text-brand-500" aria-hidden="true" />
            </div>
            <p className="mt-3 font-display text-3xl font-extrabold text-navy-950 tabular-nums">{value}</p>
            {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-bold text-ink">Ventas de los últimos {DAYS} días</h2>
            <p className="text-sm text-muted">
              Total <span className="font-bold text-ink tabular-nums">{formatPrice(periodTotal)}</span>
            </p>
          </div>
          <SalesChart data={series} />
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-ink">Más vendidos (30 días)</h2>
          {top.length === 0 ? (
            <p className="mt-6 text-sm text-muted">Aún no hay pedidos en este periodo.</p>
          ) : (
            <ol className="mt-4 divide-y divide-line">
              {top.map((row, index) => (
                <li key={row.productName} className="flex items-center gap-3 py-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface text-xs font-bold text-muted">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{row.productName}</span>
                  <span className="text-right text-xs text-muted tabular-nums">
                    <span className="block text-sm font-bold text-ink">{formatPrice(Number(row._sum.lineTotal ?? 0))}</span>
                    {row._sum.quantity} uds.
                  </span>
                </li>
              ))}
            </ol>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
            <Link href="/admin/clientes" className="rounded-xl bg-surface p-3 hover:bg-brand-50">
              <span className="block text-xs text-muted">Clientes</span>
              <span className="font-bold text-ink tabular-nums">{customers}</span>
            </Link>
            <Link href="/admin/mensajes" className="rounded-xl bg-surface p-3 hover:bg-brand-50">
              <span className="flex items-center gap-1 text-xs text-muted">
                <Mail className="h-3.5 w-3.5" aria-hidden="true" /> Mensajes sin leer
              </span>
              <span className="font-bold text-ink tabular-nums">{unread}</span>
            </Link>
          </div>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-bold text-ink">Últimos pedidos</h2>
          <Link href="/admin/pedidos" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:underline">
            Ver todos <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">
            Todavía no hay pedidos. Los pedidos enviados desde la web aparecerán aquí.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">Pedido</th>
                  <th className="px-5 py-3 font-semibold">Cliente</th>
                  <th className="px-5 py-3 font-semibold">Fecha</th>
                  <th className="px-5 py-3 font-semibold">Estado</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((order) => (
                  <tr key={order.id} className="hover:bg-surface/60">
                    <td className="px-5 py-3">
                      <Link href={`/admin/pedidos/${order.id}`} className="font-mono font-semibold text-brand-700 hover:underline">
                        {order.code}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-semibold text-ink">{order.customer.name}</span>
                      {order.customer.businessName && (
                        <span className="block text-xs text-muted">{order.customer.businessName}</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDate(order.createdAt, true)}</td>
                    <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-5 py-3 text-right font-bold tabular-nums">{formatPrice(Number(order.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
