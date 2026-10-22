import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BadgeCheck, CircleAlert, PackageOpen, ShieldCheck, Truck } from "lucide-react";
import {
  getProductBySlug,
  getProductSlugs,
  getRelatedProducts,
  getSettings,
} from "@/lib/catalog";
import { formatPrice, unitLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/product-card";
import { ProductPurchase } from "@/components/product/product-purchase";

export async function generateStaticParams() {
  const products = await getProductSlugs();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: PageProps<"/productos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado" };
  const price = product.priceFrom !== null ? ` desde ${formatPrice(product.priceFrom)}` : "";
  return {
    title: product.name,
    description: `${product.name}${product.presentation ? ` · ${product.presentation}` : ""}${price}. ${product.category.name} en Inversiones Pardave.`,
    openGraph: product.image ? { images: [{ url: product.image, width: 520, height: 520 }] } : undefined,
    alternates: { canonical: `/productos/${product.slug}` },
  };
}

export default function ProductPage({ params }: PageProps<"/productos/[slug]">) {
  return (
    <Suspense fallback={<ProductSkeleton />}>
      <ProductContent params={params} />
    </Suspense>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-surface pb-16" aria-busy="true">
      <div className="container-page py-6">
        <div className="h-4 w-64 animate-pulse rounded bg-white" />
      </div>
      <div className="container-page">
        <div className="grid gap-8 rounded-[2rem] border border-line bg-white p-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-surface" />
          <div className="space-y-4">
            <div className="h-6 w-40 animate-pulse rounded bg-surface" />
            <div className="h-10 w-full animate-pulse rounded bg-surface" />
            <div className="h-24 w-full animate-pulse rounded-2xl bg-surface" />
          </div>
        </div>
      </div>
    </div>
  );
}

async function ProductContent({ params }: { params: PageProps<"/productos/[slug]">["params"] }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [related, settings] = await Promise.all([
    getRelatedProducts(product.categoryId, product.id),
    getSettings(),
  ]);
  const hasVariants = product.options.some((o) => o.kind === "variant");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    image: product.image ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: product.category.name,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "PEN",
      lowPrice: Math.min(...product.options.map((o) => o.amount)),
      highPrice: Math.max(...product.options.map((o) => o.amount)),
      offerCount: product.options.length,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="bg-surface pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="container-page py-6">
        <nav aria-label="Ruta" className="flex flex-wrap items-center gap-x-2 text-sm text-muted">
          <Link href="/" className="hover:text-ink">Inicio</Link>
          <span>/</span>
          <Link href="/productos" className="hover:text-ink">Catálogo</Link>
          <span>/</span>
          <Link href={`/productos?categoria=${product.category.slug}`} className="hover:text-ink">
            {product.category.name}
          </Link>
        </nav>
      </div>

      <div className="container-page">
        <div className="grid gap-8 rounded-[2rem] border border-line bg-white p-4 shadow-card sm:p-8 lg:grid-cols-2 lg:gap-12">
          <div className="relative overflow-hidden rounded-3xl bg-surface">
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                width={520}
                height={520}
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="aspect-square h-auto w-full object-cover"
              />
            ) : (
              <div className="grid aspect-square place-items-center text-muted/50">
                <PackageOpen className="h-20 w-20" aria-hidden="true" />
              </div>
            )}
            {!product.inStock && (
              <Badge tone="red" className="absolute top-4 left-4 text-sm">Agotado</Badge>
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">{product.category.name}</Badge>
              {product.brand && <Badge tone="mint">{product.brand}</Badge>}
              <span className="text-xs font-semibold text-muted tabular-nums">Código {product.sku}</span>
            </div>
            <h1 className="mt-4 font-display text-3xl leading-tight font-extrabold tracking-tight text-navy-950 sm:text-4xl">
              {product.name}
            </h1>
            {product.presentation && (
              <p className="mt-2 text-base font-medium text-muted">{product.presentation}</p>
            )}
            {product.description && (
              <p className="mt-4 leading-relaxed text-ink/80">{product.description}</p>
            )}

            <div className="mt-6 border-t border-line pt-6">
              <ProductPurchase product={product} whatsapp={settings.whatsapp} />
            </div>

            <ul className="mt-8 grid gap-3 text-sm text-muted sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-mint-500" aria-hidden="true" />
                Producto original
              </li>
              <li className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-mint-500" aria-hidden="true" />
                Precio por volumen
              </li>
              <li className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-mint-500" aria-hidden="true" />
                Delivery o recojo
              </li>
            </ul>
            <p className="mt-6 flex gap-2 rounded-2xl bg-surface p-4 text-xs leading-relaxed text-muted">
              <CircleAlert className="h-4 w-4 shrink-0 text-brand-500" aria-hidden="true" />
              Precios en soles, referenciales y sujetos a stock. Confirmamos disponibilidad y total final
              al procesar tu pedido.
            </p>
          </div>
        </div>

        {hasVariants && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-line bg-white">
            <h2 className="border-b border-line px-6 py-4 text-lg font-bold text-ink">Medidas y precios</h2>
            <table className="w-full text-sm">
              <thead className="bg-surface text-left text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-6 py-3 font-semibold">Medida</th>
                  <th className="px-6 py-3 font-semibold">Presentación</th>
                  <th className="px-6 py-3 text-right font-semibold">Precio unitario</th>
                </tr>
              </thead>
              <tbody>
                {product.options.map((option) => (
                  <tr key={option.id} className="border-t border-line">
                    <td className="px-6 py-3 font-semibold text-ink">{unitLabel(option.label)}</td>
                    <td className="px-6 py-3 text-muted">{product.presentation}</td>
                    <td className="px-6 py-3 text-right font-bold text-navy-900 tabular-nums">
                      {formatPrice(option.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-navy-950">
                También en {product.category.name}
              </h2>
              <Link
                href={`/productos?categoria=${product.category.slug}`}
                className="text-sm font-semibold text-brand-600 hover:underline"
              >
                Ver todos
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
