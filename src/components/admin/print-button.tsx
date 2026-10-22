"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line bg-white px-3 text-sm font-semibold hover:bg-surface"
    >
      <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir
    </button>
  );
}
