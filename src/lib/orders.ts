import "server-only";
import { db } from "@/lib/db";

export const ORDER_STATUS_LABEL = {
  PENDIENTE: "Pendiente",
  CONFIRMADO: "Confirmado",
  EN_PREPARACION: "En preparación",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
} as const;

export type OrderStatusKey = keyof typeof ORDER_STATUS_LABEL;

export async function getOrderByCode(code: string) {
  const order = await db.order.findUnique({
    where: { code },
    include: { customer: true, items: { orderBy: { id: "asc" } } },
  });
  if (!order) return null;
  return {
    ...order,
    subtotal: Number(order.subtotal),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
    })),
  };
}
