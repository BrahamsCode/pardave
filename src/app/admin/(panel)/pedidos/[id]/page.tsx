import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/catalog";
import { formatDate, formatPrice, unitLabel, whatsappLink } from "@/lib/utils";
import { Card, PageHeader } from "@/components/admin/page-header";
import { OrderForm } from "@/components/admin/order-form";
import { PrintButton } from "@/components/admin/print-button";
import { StatusBadge } from "@/components/admin/status-badge";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";

export const instant = false;
export const metadata: Metadata = { title: "Detalle de pedido" };

export default async function OrderDetailPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  await requireUser();
  const { id } = await params;
  const [order, settings] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: { select: { slug: true } } }, orderBy: { id: "asc" } } },
    }),
    getSettings(),
  ]);
  if (!order) notFound();

  const subtotal = Number(order.subtotal);
  const total = Number(order.total);
  const c = order.customer;
  const message = `Hola ${c.name.split(" ")[0]}, te escribimos de ${settings.tradeName} por tu pedido ${order.code} (total ${formatPrice(total)}).`;

  return (
    <>
      <Link href="/admin/pedidos" className="text-sm font-semibold text-brand-600 hover:underline print:hidden">← Pedidos</Link>
      <div className="mt-3">
        <PageHeader
          title={`Pedido ${order.code}`}
          description={`Recibido el ${formatDate(order.createdAt, true)} · canal ${order.channel.toLowerCase()}`}
          actions={
            <div className="flex gap-2 print:hidden">
              <a
                href={whatsappLink(c.phone.startsWith("+") || c.phone.length > 9 ? c.phone : `51${c.phone}`, message)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#25D366] px-3 text-sm font-semibold text-white hover:brightness-95"
              >
                <WhatsAppIcon className="h-4 w-4" /> Escribir al cliente
              </a>
              <PrintButton />
            </div>
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-bold text-ink">Productos</h2>
              <StatusBadge status={order.status} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead className="bg-surface text-left text-xs tracking-wide text-muted uppercase">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Producto</th>
                    <th className="px-5 py-3 font-semibold">Presentación</th>
                    <th className="px-5 py-3 text-right font-semibold">P. unit.</th>
                    <th className="px-5 py-3 text-right font-semibold">Cant.</th>
                    <th className="px-5 py-3 text-right font-semibold">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-5 py-3">
                        {item.product ? (
                          <Link href={`/productos/${item.product.slug}`} target="_blank" className="font-semibold text-ink hover:text-brand-700">
                            {item.productName}
                          </Link>
                        ) : (
                          <span className="font-semibold text-ink">{item.productName}</span>
                        )}
                        {item.sku && <span className="block font-mono text-xs text-muted">{item.sku}</span>}
                      </td>
                      <td className="px-5 py-3 text-muted">{unitLabel(item.option)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{formatPrice(Number(item.unitPrice))}</td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums">{item.quantity}</td>
                      <td className="px-5 py-3 text-right font-bold tabular-nums">{formatPrice(Number(item.lineTotal))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-line text-sm">
                  <tr>
                    <td colSpan={4} className="px-5 pt-4 text-right text-muted">Subtotal</td>
                    <td className="px-5 pt-4 text-right tabular-nums">{formatPrice(subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-5 pt-1 text-right text-muted">Envío</td>
                    <td className="px-5 pt-1 text-right tabular-nums">{formatPrice(total - subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-5 pt-2 pb-5 text-right font-bold text-ink">Total</td>
                    <td className="px-5 pt-2 pb-5 text-right text-lg font-extrabold text-navy-950 tabular-nums">{formatPrice(total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          {order.notes && (
            <Card className="p-5">
              <h2 className="font-bold text-ink">Comentarios del cliente</h2>
              <p className="mt-2 text-sm whitespace-pre-line text-ink/80">{order.notes}</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-bold text-ink">Cliente</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Nombre" value={c.name} />
              <Row label="Empresa" value={c.businessName} />
              <Row label="Documento" value={[c.documentType, c.documentNumber].filter(Boolean).join(" ")} />
              <Row label="Teléfono" value={<a href={`tel:${c.phone}`} className="text-brand-700 hover:underline">{c.phone}</a>} />
              <Row label="Correo" value={c.email ? <a href={`mailto:${c.email}`} className="text-brand-700 hover:underline">{c.email}</a> : null} />
              <Row label="Entrega" value={order.deliveryMethod === "DELIVERY" ? `Delivery · ${order.address ?? ""}` : "Recojo en tienda"} />
            </dl>
          </Card>
          <Card className="p-5 print:hidden">
            <h2 className="mb-4 font-bold text-ink">Gestión</h2>
            <OrderForm id={order.id} status={order.status} internalNotes={order.internalNotes ?? ""} shipping={total - subtotal} />
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[6rem_1fr] gap-2">
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium break-words text-ink">{value}</dd>
    </div>
  );
}
