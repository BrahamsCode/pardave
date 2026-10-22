import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { getSettings } from "@/lib/catalog";
import { getOrderByCode, ORDER_STATUS_LABEL } from "@/lib/orders";
import { formatDate, formatPrice, unitLabel, whatsappLink } from "@/lib/utils";
import { buttonClass, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";

export const metadata: Metadata = {
  title: "Pedido recibido",
  robots: { index: false },
};

export default function PedidoPage({ params }: PageProps<"/pedido/[code]">) {
  return (
    <div className="bg-surface py-12">
      <div className="container-page max-w-3xl">
        <Suspense fallback={<div className="h-96 animate-pulse rounded-3xl bg-white" />}>
          <OrderSummary params={params} />
        </Suspense>
      </div>
    </div>
  );
}

async function OrderSummary({ params }: { params: PageProps<"/pedido/[code]">["params"] }) {
  const { code } = await params;
  const [order, settings] = await Promise.all([getOrderByCode(decodeURIComponent(code)), getSettings()]);
  if (!order) notFound();

  const message = [
    `Hola, acabo de enviar el pedido ${order.code} desde la web:`,
    ...order.items.map((i) => `• ${i.quantity} × ${i.productName} (${unitLabel(i.option)})`),
    `Total referencial: ${formatPrice(order.total)}`,
    `A nombre de: ${order.customer.name}`,
  ].join("\n");

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-card">
      <div className="bg-gradient-to-br from-mint-500 to-brand-600 px-6 py-10 text-center text-white sm:px-10">
        <CheckCircle2 className="mx-auto h-14 w-14" aria-hidden="true" />
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">¡Pedido recibido!</h1>
        <p className="mt-2 text-white/85">
          Gracias, {order.customer.name.split(" ")[0]}. Te contactaremos para confirmar stock, total y entrega.
        </p>
        <p className="mt-5 inline-flex rounded-full bg-white/15 px-4 py-1.5 font-mono text-sm font-bold tracking-wide">
          {order.code}
        </p>
      </div>

      <div className="p-6 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>Registrado el {formatDate(order.createdAt, true)}</span>
          <Badge tone="amber">{ORDER_STATUS_LABEL[order.status]}</Badge>
        </div>
        <table className="mt-6 w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="pb-2 font-semibold">Producto</th>
              <th className="pb-2 text-right font-semibold">Cant.</th>
              <th className="pb-2 text-right font-semibold">Importe</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3 pr-3">
                  <span className="font-semibold text-ink">{item.productName}</span>
                  <span className="block text-xs text-muted">
                    {unitLabel(item.option)} · {formatPrice(item.unitPrice)}
                  </span>
                </td>
                <td className="py-3 text-right tabular-nums">{item.quantity}</td>
                <td className="py-3 text-right font-semibold tabular-nums">{formatPrice(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="pt-4 text-right font-bold text-ink">Total referencial</td>
              <td className="pt-4 text-right text-lg font-extrabold text-navy-950 tabular-nums">
                {formatPrice(order.total)}
              </td>
            </tr>
          </tfoot>
        </table>

        <dl className="mt-8 grid gap-4 rounded-2xl bg-surface p-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-muted">Entrega</dt>
            <dd className="mt-0.5 text-ink">
              {order.deliveryMethod === "DELIVERY" ? `Delivery · ${order.address}` : "Recojo en tienda"}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-muted">Contacto</dt>
            <dd className="mt-0.5 text-ink">{order.customer.phone}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappLink(settings.whatsapp, message)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClass("mint", "lg", "flex-1")}
          >
            <WhatsAppIcon className="h-5 w-5" />
            Avisar por WhatsApp
          </a>
          <ButtonLink href="/productos" variant="outline" size="lg" className="flex-1">
            Seguir comprando
          </ButtonLink>
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          Guarda tu código <strong className="text-ink">{order.code}</strong> para cualquier consulta.{" "}
          <Link href="/contacto" className="font-semibold text-brand-600 hover:underline">
            ¿Necesitas ayuda?
          </Link>
        </p>
      </div>
    </div>
  );
}
