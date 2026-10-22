import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

type CatalogProduct = {
  sku: string;
  slug: string;
  name: string;
  presentation: string;
  category: string;
  brand: string | null;
  prices: { unit: string; price: number }[];
  variants: { label: string; price: number }[];
  image: string | null;
  inStock: boolean;
};

const catalog = JSON.parse(
  readFileSync(join(__dirname, "data", "catalog.json"), "utf8"),
) as { categories: { slug: string; name: string }[]; products: CatalogProduct[] };

const DESCRIPTIONS: Record<string, string> = {
  "material-medico": "Agujas, jeringas, gasas, guantes, sondas, catéteres y todo el descartable para clínicas y boticas.",
  galenicos: "Alcoholes, agua oxigenada, yodados, aceites y productos galénicos de laboratorio nacional.",
  "cuidado-personal": "Jabones, shampoo, desodorantes, cremas y artículos de higiene diaria.",
  belleza: "Tintes, cosmética, cuidado facial, accesorios de manicure y peinado.",
  bebes: "Tetinas, protectores mamarios, toallitas húmedas, hisopos y accesorios para el bebé.",
  "cuidado-oral": "Cepillos, pastas e hilo dental de las principales marcas.",
  "higiene-femenina": "Toallas higiénicas, protectores diarios, tampones y pañales para adulto.",
  "proteccion-solar": "Bloqueadores Bahía y repelentes Floresta en sachet y frasco.",
  inyectables: "Inyectables, vitaminas, sueros fisiológicos y soluciones estériles.",
  "salud-sexual": "Preservativos y lubricantes de marcas reconocidas.",
  diagnostico: "Termómetros, tensiómetros, oxímetros, pruebas rápidas y lancetas.",
  "sueros-bebidas": "Sueros de rehidratación oral, bebidas hidratantes y tés.",
  otc: "Productos de venta libre: ungüentos, supositorios, sales de rehidratación y parches.",
  suturas: "Suturas quirúrgicas Tagum: catgut, nylon, seda y ácido poliglicólico.",
};

const CATEGORY_ORDER = [
  "material-medico",
  "galenicos",
  "inyectables",
  "diagnostico",
  "suturas",
  "otc",
  "sueros-bebidas",
  "cuidado-personal",
  "higiene-femenina",
  "cuidado-oral",
  "bebes",
  "belleza",
  "proteccion-solar",
  "salud-sexual",
];

const FEATURED = [
  "alcohol-medicinal-70-alkofarma-1-lt",
  "guantes-de-nitrilo-alkhofar-talla-m-caja-x-100-unid",
  "jeringa-5-ml-alkhofar-caja-x-100-unid",
  "gasa-esteril-10-cm-x-10-cm-alkhofar-caja-x-20-sobres",
  "mascarilla-3-pliegues-display-alba-caja-x-50-unid",
  "cloruro-de-sodio-0-9-braun-1-lt",
  "termometro-digital-caja-x-10-unid",
  "oximetro-de-pulso-digital-unidad",
  "algodon-hidrofilo-ckf-100-gr",
  "bahia-frasco-spf-100-120-ml",
  "electroral-adulto-fresa-1-lt",
  "agua-oxigenada-10-vol-alkofarma-1-lt",
];

async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  // Para que sea seguro ejecutarlo en cada despliegue: el catálogo solo se carga si la base está
  // vacía, así no se pisan los cambios hechos desde el panel. SEED_FORCE=1 lo recarga a la fuerza.
  const existing = await db.product.count();
  const loadCatalog = existing === 0 || process.env.SEED_FORCE === "1";
  if (!loadCatalog) {
    console.log(`Catálogo ya cargado (${existing} productos); se omite. Usa SEED_FORCE=1 para recargarlo.`);
  } else {
    console.log("Limpiando catálogo…");
    await db.productPrice.deleteMany();
    await db.productVariant.deleteMany();
    await db.product.deleteMany({ where: { orderItems: { none: {} } } });

    const categoryIds = new Map<string, string>();
    const ordered = [...catalog.categories].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a.slug) - CATEGORY_ORDER.indexOf(b.slug),
    );
    for (const [index, category] of ordered.entries()) {
      const saved = await db.category.upsert({
        where: { slug: category.slug },
        create: {
          slug: category.slug,
          name: category.name,
          description: DESCRIPTIONS[category.slug],
          sortOrder: index,
        },
        update: { name: category.name, description: DESCRIPTIONS[category.slug], sortOrder: index },
      });
      categoryIds.set(category.slug, saved.id);
    }

    console.log(`Cargando ${catalog.products.length} productos…`);
    for (const product of catalog.products) {
      const data = {
        sku: product.sku,
        name: product.name,
        presentation: product.presentation || null,
        brand: product.brand,
        image: product.image,
        inStock: product.inStock,
        featured: FEATURED.includes(product.slug),
        priceFrom: Math.min(...product.prices.map((p) => p.price), ...product.variants.map((v) => v.price)),
        categoryId: categoryIds.get(product.category)!,
      };
      await db.product.upsert({
        where: { slug: product.slug },
        create: {
          ...data,
          slug: product.slug,
          prices: {
            create: product.prices.map((p, i) => ({ unit: p.unit, amount: p.price, sortOrder: i })),
          },
          variants: {
            create: product.variants.map((v, i) => ({ label: v.label, price: v.price, sortOrder: i })),
          },
        },
        update: {
          ...data,
          prices: {
            create: product.prices.map((p, i) => ({ unit: p.unit, amount: p.price, sortOrder: i })),
          },
          variants: {
            create: product.variants.map((v, i) => ({ label: v.label, price: v.price, sortOrder: i })),
          },
        },
      });
    }
  }

  // trim(): los campos de los paneles de hosting suelen colar un salto de línea o espacios.
  const email = (process.env.ADMIN_EMAIL ?? "admin@pardave.pe").trim().toLowerCase();
  const password = (process.env.ADMIN_PASSWORD ?? "Pardave2026!").trim();
  const passwordHash = await bcrypt.hash(password, 10);
  // ADMIN_PASSWORD_RESET=1 vuelve a fijar la contraseña del admin (útil si se olvidó);
  // sin esa variable no se toca, para respetar los cambios hechos desde el panel.
  const reset = process.env.ADMIN_PASSWORD_RESET === "1";
  await db.user.upsert({
    where: { email },
    create: { email, name: "Administrador", role: "ADMIN", passwordHash },
    update: reset ? { passwordHash, active: true } : {},
  });
  if (reset) console.log(`Contraseña del administrador ${email} restablecida.`);

  const settings: Record<string, string> = {
    companyName: "Inversiones Pardave E.I.R.L.",
    tradeName: "Corp. Farma Perú",
    email: "inversionespardave@gmail.com",
    whatsapp: "51999999999",
    phone: "+51 999 999 999",
    address: "Lima, Perú",
    hours: "Lunes a sábado de 8:00 a.m. a 6:00 p.m.",
    minOrder: "0",
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({ where: { key }, create: { key, value }, update: {} });
  }

  const count = await db.product.count();
  console.log(`Listo: ${count} productos. Admin: ${email}`);
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
