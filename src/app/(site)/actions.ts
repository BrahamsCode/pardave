"use server";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/db";

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
  code?: string;
};

const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d+]/g, ""))
  .pipe(z.string().regex(/^\+?\d{6,15}$/, "Ingresa un teléfono válido"));

const orderSchema = z
  .object({
    name: z.string().trim().min(2, "Ingresa tu nombre").max(120),
    businessName: z.string().trim().max(160).optional(),
    documentType: z.enum(["", "DNI", "RUC", "CE"]).optional(),
    documentNumber: z.string().trim().max(20).optional(),
    phone: phoneSchema,
    email: z.union([z.literal(""), z.email("Correo no válido")]).optional(),
    deliveryMethod: z.enum(["RECOJO", "DELIVERY"]),
    address: z.string().trim().max(300).optional(),
    district: z.string().trim().max(80).optional(),
    notes: z.string().trim().max(1000).optional(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          optionId: z.string().min(1),
          optionKind: z.enum(["price", "variant"]),
          quantity: z.number().int().min(1).max(9999),
        }),
      )
      .min(1, "Tu pedido está vacío")
      .max(150, "Demasiados productos en un solo pedido"),
  })
  .superRefine((data, ctx) => {
    if (data.deliveryMethod === "DELIVERY" && !data.address) {
      ctx.addIssue({ code: "custom", path: ["address"], message: "Ingresa la dirección de entrega" });
    }
    if (data.documentType === "RUC" && data.documentNumber && !/^\d{11}$/.test(data.documentNumber)) {
      ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "El RUC tiene 11 dígitos" });
    }
    if (data.documentType === "DNI" && data.documentNumber && !/^\d{8}$/.test(data.documentNumber)) {
      ctx.addIssue({ code: "custom", path: ["documentNumber"], message: "El DNI tiene 8 dígitos" });
    }
  });

function fieldErrors(error: z.ZodError) {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

const optional = (value: string | undefined) => (value ? value : null);

export async function createOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { ok: false, message: "No pudimos leer tu pedido. Recarga la página e inténtalo de nuevo." };
  }

  const parsed = orderSchema.safeParse({
    name: formData.get("name"),
    businessName: formData.get("businessName") || undefined,
    documentType: formData.get("documentType") || "",
    documentNumber: formData.get("documentNumber") || undefined,
    phone: formData.get("phone"),
    email: formData.get("email") || "",
    deliveryMethod: formData.get("deliveryMethod"),
    address: formData.get("address") || undefined,
    district: formData.get("district") || undefined,
    notes: formData.get("notes") || undefined,
    items,
  });
  if (!parsed.success) {
    return { ok: false, message: "Revisa los datos marcados.", errors: fieldErrors(parsed.error) };
  }
  const data = parsed.data;

  // Los precios se toman siempre de la base de datos, nunca del navegador.
  const products = await db.product.findMany({
    where: { id: { in: data.items.map((i) => i.productId) }, active: true },
    include: { prices: true, variants: true },
  });
  const lines: {
    productId: string;
    productName: string;
    sku: string;
    option: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[] = [];
  for (const item of data.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) {
      return { ok: false, message: "Algún producto ya no está disponible. Revisa tu pedido." };
    }
    const option =
      item.optionKind === "price"
        ? product.prices.find((p) => p.id === item.optionId)
        : product.variants.find((v) => v.id === item.optionId);
    if (!option) {
      return { ok: false, message: `La presentación de “${product.name}” cambió. Vuelve a agregarlo.` };
    }
    const label = "unit" in option ? option.unit : option.label;
    const unitPrice = Number("amount" in option ? option.amount : option.price);
    lines.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      option: label,
      unitPrice,
      quantity: item.quantity,
      lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
    });
  }
  const subtotal = Math.round(lines.reduce((sum, l) => sum + l.lineTotal, 0) * 100) / 100;

  const customerData = {
    name: data.name,
    businessName: optional(data.businessName),
    documentType: optional(data.documentType),
    documentNumber: optional(data.documentNumber),
    email: optional(data.email),
    address: optional(data.address),
    district: optional(data.district),
  };

  const order = await db.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { phone: data.phone },
      create: { ...customerData, phone: data.phone },
      update: customerData,
    });
    const created = await tx.order.create({
      data: {
        code: `TMP-${randomBytes(8).toString("hex")}`,
        customerId: customer.id,
        channel: "WEB",
        deliveryMethod: data.deliveryMethod,
        address: data.deliveryMethod === "DELIVERY" ? [data.address, data.district].filter(Boolean).join(", ") : null,
        notes: optional(data.notes),
        subtotal,
        total: subtotal,
        items: { create: lines },
      },
    });
    const suffix = randomBytes(3).toString("hex").toUpperCase();
    return tx.order.update({
      where: { id: created.id },
      data: { code: `PD-${String(created.number).padStart(5, "0")}-${suffix}` },
    });
  });

  return { ok: true, code: order.code };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Ingresa tu nombre").max(120),
  company: z.string().trim().max(160).optional(),
  email: z.union([z.literal(""), z.email("Correo no válido")]).optional(),
  phone: z.union([z.literal(""), phoneSchema]).optional(),
  message: z.string().trim().min(10, "Cuéntanos un poco más (mínimo 10 caracteres)").max(2000),
});

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  if (formData.get("website")) return { ok: true }; // trampa anti-spam

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    company: formData.get("company") || undefined,
    email: formData.get("email") || "",
    phone: formData.get("phone") || "",
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false, message: "Revisa los datos marcados.", errors: fieldErrors(parsed.error) };
  }
  if (!parsed.data.email && !parsed.data.phone) {
    return {
      ok: false,
      message: "Déjanos un correo o un teléfono para responderte.",
      errors: { phone: "Ingresa un teléfono o un correo" },
    };
  }

  await db.contactMessage.create({
    data: {
      name: parsed.data.name,
      company: optional(parsed.data.company),
      email: optional(parsed.data.email),
      phone: optional(parsed.data.phone),
      message: parsed.data.message,
    },
  });
  return { ok: true, message: "¡Gracias! Recibimos tu mensaje y te responderemos pronto." };
}
