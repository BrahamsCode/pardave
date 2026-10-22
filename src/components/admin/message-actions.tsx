"use client";

import { useTransition } from "react";
import { Check, RotateCcw, Trash2 } from "lucide-react";
import { deleteMessage, markMessage } from "@/app/admin/actions";

export function MessageActions({ id, read, canDelete }: { id: string; read: boolean; canDelete: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => markMessage(id, !read))}
        className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-semibold text-muted hover:bg-surface hover:text-ink"
      >
        {read ? <RotateCcw className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
        {read ? "Marcar no leído" : "Marcar leído"}
      </button>
      {canDelete && (
        <button
          type="button"
          disabled={pending}
          onClick={() => confirm("¿Eliminar este mensaje?") && start(() => deleteMessage(id))}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
          aria-label="Eliminar mensaje"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
