import Form from "next/form";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function SearchForm({ className, defaultValue }: { className?: string; defaultValue?: string }) {
  return (
    <Form action="/productos" className={cn("relative", className)} role="search">
      <label htmlFor="site-search" className="sr-only">
        Buscar productos
      </label>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 h-4.5 w-4.5 -translate-y-1/2 text-muted"
        aria-hidden="true"
      />
      <input
        id="site-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Buscar jeringas, alcohol, guantes, gasas…"
        className="h-11 w-full rounded-xl border border-line bg-surface pr-4 pl-10 text-sm text-ink placeholder:text-muted/80 transition focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100 focus:outline-none"
      />
    </Form>
  );
}
