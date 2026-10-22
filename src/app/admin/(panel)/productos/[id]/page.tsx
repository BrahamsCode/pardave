import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, Trash2 } from "lucide-react";
import { deleteProduct } from "@/app/admin/actions";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getBrandNames, getCategoryOptions } from "@/lib/admin-data";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";

export const instant = false;
export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProductPage({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const { guardado } = await searchParams;
  const [product, categories, brands] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: { prices: { orderBy: { sortOrder: "asc" } }, variants: { orderBy: { sortOrder: "asc" } } },
    }),
    getCategoryOptions(),
    getBrandNames(),
  ]);
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/productos" className="text-sm font-semibold text-brand-600 hover:underline">← Productos</Link>
      <div className="mt-3">
        <PageHeader
          title={product.name}
          description={<span className="font-mono">{product.sku}</span>}
          actions={
            <>
              <Link
                href={`/productos/${product.slug}`}
                target="_blank"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm font-semibold hover:bg-surface"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> Ver en tienda
              </Link>
              {user.role === "ADMIN" && (
                <form action={deleteProduct.bind(null, product.id)}>
                  <Button type="submit" variant="outline" size="sm" className="text-red-600 hover:border-red-200 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Eliminar
                  </Button>
                </form>
              )}
            </>
          }
        />
      </div>
      {guardado && (
        <p className="mb-6 flex items-center gap-2 rounded-xl bg-mint-50 px-4 py-3 text-sm font-semibold text-mint-700">
          <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Cambios guardados. La tienda ya muestra la versión actualizada.
        </p>
      )}
      <ProductForm
        key={product.updatedAt.toISOString()}
        categories={categories}
        brands={brands}
        values={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          slug: product.slug,
          presentation: product.presentation ?? "",
          brand: product.brand ?? "",
          description: product.description ?? "",
          categoryId: product.categoryId,
          stock: product.stock === null ? "" : String(product.stock),
          inStock: product.inStock,
          active: product.active,
          featured: product.featured,
          image: product.image ?? "",
          prices: product.prices.map((p) => ({ unit: p.unit, amount: Number(p.amount).toFixed(2) })),
          variants: product.variants.map((v) => ({ label: v.label, price: Number(v.price).toFixed(2) })),
        }}
      />
    </>
  );
}
