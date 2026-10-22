import Link from "next/link";
import type { ProductCard as Product } from "@/lib/catalog";
import { formatPrice, unitLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProductImage } from "@/components/product/product-image";
import { QuickAdd } from "@/components/product/quick-add";

export function ProductCard({ product, priority }: { product: Product; priority?: boolean }) {
  const [main, ...rest] = product.options;
  const hasVariants = product.options.some((o) => o.kind === "variant");

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <Link href={`/productos/${product.slug}`} className="block" aria-label={product.name}>
        <ProductImage
          src={product.image}
          alt={product.name}
          priority={priority}
          sizes="(min-width: 1280px) 280px, (min-width: 768px) 30vw, 50vw"
        />
      </Link>
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
        {!product.inStock && <Badge tone="red">Agotado</Badge>}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between gap-2 text-[0.7rem] font-semibold tracking-wide text-muted uppercase">
          <span className="truncate">{product.brand ?? product.category.name}</span>
          <span className="shrink-0 tabular-nums opacity-70">{product.sku}</span>
        </div>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[0.95rem] leading-snug font-bold text-ink">
          <Link href={`/productos/${product.slug}`} className="hover:text-brand-700">
            {product.name}
          </Link>
        </h3>
        {product.presentation && <p className="text-xs text-muted">{product.presentation}</p>}

        <div className="mt-auto pt-2">
          {hasVariants ? (
            <p className="text-sm text-muted">
              Desde{" "}
              <span className="text-lg font-extrabold text-navy-900 tabular-nums">
                {formatPrice(product.priceFrom ?? 0)}
              </span>
              <span className="block text-xs">{product.options.length} medidas disponibles</span>
            </p>
          ) : main ? (
            <div>
              <p className="flex items-baseline gap-1.5">
                <span className="text-lg font-extrabold text-navy-900 tabular-nums">
                  {formatPrice(main.amount)}
                </span>
                <span className="text-xs font-semibold text-muted">/ {unitLabel(main.label)}</span>
              </p>
              {rest.length > 0 && (
                <p className="text-xs text-muted tabular-nums">
                  {rest.map((o) => `${unitLabel(o.label)} ${formatPrice(o.amount)}`).join(" · ")}
                </p>
              )}
            </div>
          ) : null}
        </div>

        <QuickAdd product={product} />
      </div>
    </article>
  );
}
