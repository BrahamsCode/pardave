import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { SESSION_COOKIE, verifySession } from "@/lib/session-token";

function csv(rows: (string | number | null | undefined)[][]) {
  const cell = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "﻿" + rows.map((r) => r.map(cell).join(",")).join("\n");
}

export async function GET(_request: Request, ctx: RouteContext<"/api/admin/export/[type]">) {
  const session = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!session) return new Response("No autorizado", { status: 401 });
  const { type } = await ctx.params;

  let body: string;
  if (type === "productos") {
    const products = await db.product.findMany({
      include: { category: true, prices: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sku: "asc" },
    });
    body = csv([
      ["Código", "Nombre", "Presentación", "Marca", "Categoría", "Precios", "Medidas", "Activo", "Stock", "Destacado"],
      ...products.map((p) => [
        p.sku,
        p.name,
        p.presentation,
        p.brand,
        p.category.name,
        p.prices.map((x) => `${x.unit}: ${Number(x.amount).toFixed(2)}`).join(" | "),
        p.variants.map((x) => `${x.label}: ${Number(x.price).toFixed(2)}`).join(" | "),
        p.active ? "Sí" : "No",
        p.inStock ? "Disponible" : "Agotado",
        p.featured ? "Sí" : "No",
      ]),
    ]);
  } else if (type === "pedidos") {
    const orders = await db.order.findMany({ include: { customer: true, items: true }, orderBy: { number: "desc" } });
    body = csv([
      ["Código", "Fecha", "Estado", "Cliente", "Empresa", "Documento", "Teléfono", "Entrega", "Ítems", "Total (S/)"],
      ...orders.map((o) => [
        o.code,
        o.createdAt.toISOString(),
        o.status,
        o.customer.name,
        o.customer.businessName,
        [o.customer.documentType, o.customer.documentNumber].filter(Boolean).join(" "),
        o.customer.phone,
        o.deliveryMethod === "DELIVERY" ? `Delivery: ${o.address ?? ""}` : "Recojo",
        o.items.map((i) => `${i.quantity} x ${i.productName} (${i.option})`).join(" | "),
        Number(o.total).toFixed(2),
      ]),
    ]);
  } else {
    return new Response("No encontrado", { status: 404 });
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${type}-pardave.csv"`,
    },
  });
}
