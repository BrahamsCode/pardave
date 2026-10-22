import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;

  const pages = new Set([1, pageCount, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  const base =
    "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border px-3 text-sm font-semibold tabular-nums transition";

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5" aria-label="Paginación">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={cn(base, "border-line bg-white hover:bg-surface")} aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : null}
      {sorted.map((p, index) => (
        <span key={p} className="flex items-center gap-1.5">
          {index > 0 && p - sorted[index - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              base,
              p === page ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white hover:bg-surface",
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={cn(base, "border-line bg-white hover:bg-surface")} aria-label="Página siguiente">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : null}
    </nav>
  );
}
