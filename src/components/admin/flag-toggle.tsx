"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { toggleProductFlag } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

export function FlagToggle({
  id,
  flag,
  value,
  label,
}: {
  id: string;
  flag: "active" | "featured" | "inStock";
  value: boolean;
  label: string;
}) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={label}
      title={label}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          try {
            await toggleProductFlag(id, flag, !optimistic);
          } catch {
            toast.error("No se pudo actualizar");
          }
        })
      }
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
        optimistic ? (flag === "featured" ? "bg-lime-500" : "bg-mint-500") : "bg-line",
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow transition",
          optimistic ? "translate-x-5.5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
