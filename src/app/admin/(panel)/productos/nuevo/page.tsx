import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getBrandNames, getCategoryOptions, getNextSku } from "@/lib/admin-data";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const instant = false;
export const metadata: Metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  await requireUser();
  const [categories, brands, sku] = await Promise.all([getCategoryOptions(), getBrandNames(), getNextSku()]);
  return (
    <>
      <Link href="/admin/productos" className="text-sm font-semibold text-brand-600 hover:underline">← Productos</Link>
      <div className="mt-3">
        <PageHeader title="Nuevo producto" description="Completa los datos y define sus precios." />
      </div>
      <ProductForm
        categories={categories}
        brands={brands}
        values={{
          name: "",
          sku,
          slug: "",
          presentation: "",
          brand: "",
          description: "",
          categoryId: "",
          stock: "",
          inStock: true,
          active: true,
          featured: false,
          image: "",
          prices: [],
          variants: [],
        }}
      />
    </>
  );
}
