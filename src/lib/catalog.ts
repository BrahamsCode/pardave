import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

/** Etiqueta de caché que invalida todo el catálogo público. */
export const CATALOG_TAG = "catalog";
export const SETTINGS_TAG = "settings";

export const PAGE_SIZE = 24;

export type PriceOption = {
  id: string;
  kind: "price" | "variant";
  label: string;
  amount: number;
};

export type ProductCard = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  presentation: string | null;
  brand: string | null;
  image: string | null;
  inStock: boolean;
  priceFrom: number | null;
  options: PriceOption[];
  category: { slug: string; name: string };
};

export type ProductDetail = ProductCard & {
  description: string | null;
  categoryId: string;
};

export type CategorySummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  productCount: number;
};

export type SortOption = "relevancia" | "nombre" | "precio-asc" | "precio-desc";

export type ProductQuery = {
  q?: string;
  categoria?: string;
  marca?: string;
  orden?: SortOption;
  pagina?: number;
};

const cardInclude = {
  category: { select: { slug: true, name: true } },
  prices: { orderBy: { sortOrder: "asc" } },
  variants: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.ProductInclude;

type ProductWithOptions = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

function toCard(product: ProductWithOptions): ProductCard {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    presentation: product.presentation,
    brand: product.brand,
    image: product.image,
    inStock: product.inStock,
    priceFrom: product.priceFrom === null ? null : Number(product.priceFrom),
    category: product.category,
    options: [
      ...product.prices.map((price) => ({
        id: price.id,
        kind: "price" as const,
        label: price.unit,
        amount: Number(price.amount),
      })),
      ...product.variants.map((variant) => ({
        id: variant.id,
        kind: "variant" as const,
        label: variant.label,
        amount: Number(variant.price),
      })),
    ],
  };
}

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function searchWhere(query: ProductQuery): Prisma.ProductWhereInput {
  const terms = (query.q ?? "")
    .trim()
    .split(/\s+/)
    .filter((term) => term.length > 0)
    .slice(0, 6);

  return {
    active: true,
    ...(query.categoria ? { category: { slug: query.categoria } } : {}),
    ...(query.marca ? { brand: { equals: query.marca, mode: "insensitive" } } : {}),
    AND: terms.map((term) => {
      const variants = Array.from(new Set([term, stripAccents(term)]));
      return {
        OR: variants.flatMap((value) => [
          { name: { contains: value, mode: "insensitive" as const } },
          { brand: { contains: value, mode: "insensitive" as const } },
          { presentation: { contains: value, mode: "insensitive" as const } },
          { sku: { contains: value, mode: "insensitive" as const } },
        ]),
      };
    }),
  };
}

function searchOrder(sort: SortOption | undefined): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "nombre":
      return [{ name: "asc" }];
    case "precio-asc":
      return [{ priceFrom: { sort: "asc", nulls: "last" } }, { name: "asc" }];
    case "precio-desc":
      return [{ priceFrom: { sort: "desc", nulls: "last" } }, { name: "asc" }];
    default:
      return [{ featured: "desc" }, { inStock: "desc" }, { category: { sortOrder: "asc" } }, { sku: "asc" }];
  }
}

export async function searchProducts(query: ProductQuery) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const page = Math.max(1, Math.floor(query.pagina ?? 1));
  const where = searchWhere(query);
  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      include: cardInclude,
      orderBy: searchOrder(query.orden),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return {
    products: products.map(toCard),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function getCategories(): Promise<CategorySummary[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });
  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    productCount: category._count.products,
  }));
}

export async function getBrands(): Promise<{ name: string; count: number }[]> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const rows = await db.product.groupBy({
    by: ["brand"],
    where: { active: true, brand: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { brand: "desc" } },
  });
  return rows.map((row) => ({ name: row.brand!, count: row._count._all }));
}

export async function getFeaturedProducts(limit = 8) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const products = await db.product.findMany({
    where: { active: true, featured: true },
    include: cardInclude,
    orderBy: { sku: "asc" },
    take: limit,
  });
  return products.map(toCard);
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const product = await db.product.findFirst({
    where: { slug, active: true },
    include: cardInclude,
  });
  if (!product) return null;
  return { ...toCard(product), description: product.description, categoryId: product.categoryId };
}

export async function getRelatedProducts(categoryId: string, excludeId: string, limit = 4) {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const products = await db.product.findMany({
    where: { active: true, categoryId, id: { not: excludeId }, inStock: true },
    include: cardInclude,
    orderBy: [{ featured: "desc" }, { sku: "asc" }],
    take: limit,
  });
  return products.map(toCard);
}

export async function getProductSlugs() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const products = await db.product.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true },
  });
  return products;
}

export async function getCatalogStats() {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours");

  const [products, categories, brands] = await Promise.all([
    db.product.count({ where: { active: true } }),
    db.category.count(),
    db.product.findMany({
      where: { active: true, brand: { not: null } },
      distinct: ["brand"],
      select: { brand: true },
    }),
  ]);
  return { products, categories, brands: brands.length };
}

export type StoreSettings = {
  companyName: string;
  tradeName: string;
  email: string;
  whatsapp: string;
  phone: string;
  address: string;
  hours: string;
  minOrder: string;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  companyName: "Inversiones Pardave E.I.R.L.",
  tradeName: "Corp. Farma Perú",
  email: "inversionespardave@gmail.com",
  whatsapp: "51999999999",
  phone: "+51 999 999 999",
  address: "Lima, Perú",
  hours: "Lunes a sábado de 8:00 a.m. a 6:00 p.m.",
  minOrder: "0",
};

export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");

  const rows = await db.setting.findMany();
  const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return { ...DEFAULT_SETTINGS, ...values };
}
