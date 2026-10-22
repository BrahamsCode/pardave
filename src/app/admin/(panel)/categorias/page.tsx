import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryManager } from "@/components/admin/category-manager";

export const instant = false;
export const metadata: Metadata = { title: "Categorías" };

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return (
    <>
      <PageHeader title="Categorías" description="Organiza las líneas de producto que se muestran en la tienda." />
      <CategoryManager
        canDelete={user.role === "ADMIN"}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          sortOrder: c.sortOrder,
          count: c._count.products,
        }))}
      />
    </>
  );
}
