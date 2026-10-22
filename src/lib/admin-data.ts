import "server-only";
import { db } from "@/lib/db";

export async function getCategoryOptions() {
  return db.category.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
}

export async function getBrandNames() {
  const rows = await db.product.findMany({
    where: { brand: { not: null } },
    distinct: ["brand"],
    select: { brand: true },
    orderBy: { brand: "asc" },
  });
  return rows.map((r) => r.brand!);
}

export async function getNextSku() {
  const last = await db.product.findFirst({
    where: { sku: { startsWith: "PDV-" } },
    orderBy: { sku: "desc" },
    select: { sku: true },
  });
  const n = last ? Number(last.sku.slice(4)) + 1 : 1;
  return `PDV-${String(n).padStart(4, "0")}`;
}
