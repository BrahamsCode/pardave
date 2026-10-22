"use server";

import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, deleteSession, requireAdmin, requireUser } from "@/lib/auth";
import { CATALOG_TAG, SETTINGS_TAG } from "@/lib/catalog";
import { slugify } from "@/lib/utils";
import { uploadDir } from "@/lib/uploads";
import type { OrderStatus } from "@/generated/prisma/client";

export type ActionState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Valores a conservar en el formulario tras un error (React lo reinicia al enviar). */
  values?: Record<string, string>;
};

function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) errors[String(issue.path[0] ?? "form")] ??= issue.message;
  return errors;
}

/* ---------------------------------- Sesión --------------------------------- */

const loginSchema = z.object({
  email: z.email("Correo no válido").transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export async function login(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  const values = { email: String(formData.get("email") ?? "") };
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error), values };

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid = user && user.active && (await bcrypt.compare(parsed.data.password, user.passwordHash));
  if (!valid) return { ok: false, message: "Correo o contraseña incorrectos.", values };

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession({ userId: user.id, role: user.role });

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logout() {
  await deleteSession();
  redirect("/admin/login");
}

/* -------------------------------- Productos -------------------------------- */

const money = z.coerce.number().gt(0, "Ingresa un precio mayor a 0").max(999999);

const productSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre").max(200),
  sku: z.string().trim().min(2, "Ingresa el código").max(40),
  slug: z.string().trim().max(90).optional(),
  presentation: z.string().trim().max(160).optional(),
  brand: z.string().trim().max(80).optional(),
  description: z.string().trim().max(4000).optional(),
  categoryId: z.string().min(1, "Elige una categoría"),
  stock: z.union([z.literal(""), z.coerce.number().int().min(0)]).optional(),
  inStock: z.boolean(),
  active: z.boolean(),
  featured: z.boolean(),
  image: z.string().max(300).optional(),
  prices: z.array(z.object({ unit: z.string().trim().min(1).max(40), amount: money })).max(10),
  variants: z.array(z.object({ label: z.string().trim().min(1).max(80), price: money })).max(60),
});

async function saveUpload(file: File) {
  const types: Record<string, string> = {
    "image/webp": "webp",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/avif": "avif",
  };
  const ext = types[file.type];
  if (!ext) throw new Error("Formato de imagen no permitido (usa JPG, PNG, WEBP o AVIF)");
  if (file.size > 4 * 1024 * 1024) throw new Error("La imagen supera los 4 MB");
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${ext}`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(join(uploadDir(), name), Buffer.from(await file.arrayBuffer()));
  return `/api/uploads/${name}`;
}

function readRows<T extends string>(formData: FormData, prefix: string, keys: readonly T[]) {
  const first = formData.getAll(`${prefix}.${keys[0]}`);
  return first
    .map((_, i) => Object.fromEntries(keys.map((k) => [k, String(formData.getAll(`${prefix}.${k}`)[i] ?? "")])))
    .filter((row) => Object.values(row).some((v) => v !== "")) as Record<T, string>[];
}

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = String(formData.get("id") ?? "") || null;

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    slug: formData.get("slug") || undefined,
    presentation: formData.get("presentation") || undefined,
    brand: formData.get("brand") || undefined,
    description: formData.get("description") || undefined,
    categoryId: formData.get("categoryId"),
    stock: formData.get("stock") ?? "",
    inStock: formData.get("inStock") === "on",
    active: formData.get("active") === "on",
    featured: formData.get("featured") === "on",
    image: formData.get("image") || undefined,
    prices: readRows(formData, "prices", ["unit", "amount"] as const),
    variants: readRows(formData, "variants", ["label", "price"] as const),
  });
  if (!parsed.success) return { ok: false, message: "Revisa los campos marcados.", errors: fieldErrors(parsed.error) };
  const data = parsed.data;
  if (data.prices.length === 0 && data.variants.length === 0) {
    return { ok: false, message: "Agrega al menos un precio o una medida.", errors: { prices: "Requerido" } };
  }

  let image = data.image ?? null;
  const file = formData.get("imageFile");
  if (file instanceof File && file.size > 0) {
    try {
      image = await saveUpload(file);
    } catch (error) {
      return { ok: false, message: (error as Error).message, errors: { image: (error as Error).message } };
    }
  }

  const slug = slugify(data.slug || `${data.name} ${data.presentation ?? ""}`);
  const clash = await db.product.findFirst({
    where: { OR: [{ slug }, { sku: data.sku }], NOT: id ? { id } : undefined },
    select: { slug: true, sku: true },
  });
  if (clash) {
    return clash.sku === data.sku
      ? { ok: false, message: "Ya existe un producto con ese código.", errors: { sku: "Código en uso" } }
      : { ok: false, message: "Ya existe un producto con esa URL.", errors: { slug: "URL en uso" } };
  }

  const all = [...data.prices.map((p) => p.amount), ...data.variants.map((v) => v.price)];
  const fields = {
    name: data.name,
    sku: data.sku,
    slug,
    presentation: data.presentation ?? null,
    brand: data.brand ?? null,
    description: data.description ?? null,
    categoryId: data.categoryId,
    stock: data.stock === "" || data.stock === undefined ? null : data.stock,
    inStock: data.inStock,
    active: data.active,
    featured: data.featured,
    image,
    priceFrom: Math.min(...all),
  };
  const prices = data.prices.map((p, i) => ({ unit: p.unit.toLowerCase(), amount: p.amount, sortOrder: i }));
  const variants = data.variants.map((v, i) => ({ label: v.label, price: v.price, sortOrder: i }));

  const saved = await db.$transaction(async (tx) => {
    if (id) {
      await tx.productPrice.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      return tx.product.update({
        where: { id },
        data: { ...fields, prices: { create: prices }, variants: { create: variants } },
      });
    }
    return tx.product.create({ data: { ...fields, prices: { create: prices }, variants: { create: variants } } });
  });

  updateTag(CATALOG_TAG);
  redirect(`/admin/productos/${saved.id}?guardado=1`);
}

export async function toggleProductFlag(id: string, flag: "active" | "featured" | "inStock", value: boolean) {
  await requireUser();
  await db.product.update({ where: { id }, data: { [flag]: value } });
  updateTag(CATALOG_TAG);
  refresh();
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const used = await db.orderItem.count({ where: { productId: id } });
  if (used > 0) {
    // Con pedidos históricos se desactiva en lugar de borrar.
    await db.product.update({ where: { id }, data: { active: false } });
  } else {
    await db.product.delete({ where: { id } });
  }
  updateTag(CATALOG_TAG);
  redirect("/admin/productos");
}

/* -------------------------------- Categorías ------------------------------- */

const categorySchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre").max(80),
  description: z.string().trim().max(400).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = String(formData.get("id") ?? "") || null;
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    sortOrder: formData.get("sortOrder") || 0,
  });
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const slug = slugify(parsed.data.name);
  const clash = await db.category.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) return { ok: false, errors: { name: "Ya existe una categoría con ese nombre" } };

  const data = { ...parsed.data, description: parsed.data.description ?? null };
  if (id) await db.category.update({ where: { id }, data });
  else await db.category.create({ data: { ...data, slug } });

  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: id ? "Categoría actualizada" : "Categoría creada" };
}

export async function deleteCategory(id: string): Promise<ActionState> {
  await requireAdmin();
  const count = await db.product.count({ where: { categoryId: id } });
  if (count > 0) return { ok: false, message: `Tiene ${count} productos. Muévelos antes de eliminarla.` };
  await db.category.delete({ where: { id } });
  updateTag(CATALOG_TAG);
  refresh();
  return { ok: true, message: "Categoría eliminada" };
}

/* --------------------------------- Pedidos --------------------------------- */

const STATUSES = ["PENDIENTE", "CONFIRMADO", "EN_PREPARACION", "ENVIADO", "ENTREGADO", "CANCELADO"] as const;

export async function updateOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  if (!STATUSES.includes(status as (typeof STATUSES)[number])) return { ok: false, message: "Estado inválido" };
  const internalNotes = String(formData.get("internalNotes") ?? "").slice(0, 2000) || null;
  const shipping = Number(formData.get("shipping") ?? 0);

  const order = await db.order.findUnique({ where: { id }, select: { subtotal: true } });
  if (!order) return { ok: false, message: "Pedido no encontrado" };
  const extra = Number.isFinite(shipping) && shipping >= 0 ? shipping : 0;

  await db.order.update({
    where: { id },
    data: { status, internalNotes, total: Math.round((Number(order.subtotal) + extra) * 100) / 100 },
  });
  refresh();
  return { ok: true, message: "Pedido actualizado" };
}

/* -------------------------------- Mensajes --------------------------------- */

export async function markMessage(id: string, read: boolean) {
  await requireUser();
  await db.contactMessage.update({ where: { id }, data: { read } });
  refresh();
}

export async function deleteMessage(id: string) {
  await requireAdmin();
  await db.contactMessage.delete({ where: { id } });
  refresh();
}

/* ------------------------------ Configuración ------------------------------ */

const settingsSchema = z.object({
  companyName: z.string().trim().min(2).max(160),
  tradeName: z.string().trim().max(160),
  email: z.email("Correo no válido"),
  whatsapp: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().regex(/^\d{9,15}$/, "Número con código de país, p. ej. 51987654321")),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(200),
  hours: z.string().trim().max(120),
});

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: "Revisa los campos.", errors: fieldErrors(parsed.error) };
  await db.$transaction(
    Object.entries(parsed.data).map(([key, value]) =>
      db.setting.upsert({ where: { key }, create: { key, value }, update: { value } }),
    ),
  );
  updateTag(SETTINGS_TAG);
  refresh();
  return { ok: true, message: "Configuración guardada" };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Ingresa tu contraseña actual"),
    next: z.string().min(8, "Mínimo 8 caracteres").max(100),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { path: ["confirm"], message: "No coincide" });

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const current = await requireUser();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const user = await db.user.findUniqueOrThrow({ where: { id: current.id } });
  if (!(await bcrypt.compare(parsed.data.current, user.passwordHash))) {
    return { ok: false, errors: { current: "Contraseña incorrecta" } };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.next, 10) } });
  return { ok: true, message: "Contraseña actualizada" };
}

const userSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre").max(80),
  email: z.email("Correo no válido").transform((v) => v.toLowerCase()),
  password: z.string().min(8, "Mínimo 8 caracteres").max(100),
  role: z.enum(["ADMIN", "STAFF"]),
});

export async function createUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (await db.user.findUnique({ where: { email: parsed.data.email } })) {
    return { ok: false, errors: { email: "Ya existe un usuario con ese correo" } };
  }
  await db.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      role: parsed.data.role,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });
  refresh();
  return { ok: true, message: "Usuario creado" };
}

export async function toggleUser(id: string, active: boolean) {
  const admin = await requireAdmin();
  if (admin.id === id) return;
  await db.user.update({ where: { id }, data: { active } });
  refresh();
}
