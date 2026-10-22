"use client";

import { useActionState, useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { deleteCategory, saveCategory, type ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { submitWithoutReset } from "@/components/ui/submit";

type Category = { id: string; name: string; slug: string; description: string | null; sortOrder: number; count: number };

export function CategoryManager({ categories, canDelete }: { categories: Category[]; canDelete: boolean }) {
  const [editing, setEditing] = useState<Category | null>(null);
  const [state, action, pending] = useActionState(async (prev: ActionState, formData: FormData) => {
    const result = await saveCategory(prev, formData);
    if (result.ok) {
      toast.success(result.message);
      setEditing(null);
    }
    return result;
  }, { ok: false } as ActionState);
  const [deleting, startDelete] = useTransition();

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-5 py-3 font-semibold">Orden</th>
              <th className="px-5 py-3 font-semibold">Categoría</th>
              <th className="px-5 py-3 text-right font-semibold">Productos</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {categories.map((c) => (
              <tr key={c.id} className={editing?.id === c.id ? "bg-brand-50" : "hover:bg-surface/60"}>
                <td className="px-5 py-3 text-muted tabular-nums">{c.sortOrder}</td>
                <td className="px-5 py-3">
                  <span className="font-semibold text-ink">{c.name}</span>
                  <span className="block font-mono text-xs text-muted">/{c.slug}</span>
                </td>
                <td className="px-5 py-3 text-right tabular-nums">{c.count}</td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" onClick={() => setEditing(c)} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-brand-50 hover:text-brand-700" aria-label={`Editar ${c.name}`}>
                      <Pencil className="h-4 w-4" />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => {
                          if (!confirm(`¿Eliminar la categoría “${c.name}”?`)) return;
                          startDelete(async () => {
                            const result = await deleteCategory(c.id);
                            if (result.ok) toast.success(result.message);
                            else toast.error(result.message);
                          });
                        }}
                        className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600"
                        aria-label={`Eliminar ${c.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form key={editing?.id ?? "new"} onSubmit={submitWithoutReset(action)} className="h-fit space-y-4 rounded-2xl border border-line bg-white p-5 xl:sticky xl:top-10">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink">{editing ? "Editar categoría" : "Nueva categoría"}</h2>
          {editing && (
            <button type="button" onClick={() => setEditing(null)} className="text-muted hover:text-ink" aria-label="Cancelar edición">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {editing && <input type="hidden" name="id" value={editing.id} />}
        <Field label="Nombre *" htmlFor="cat-name" error={state.errors?.name}>
          <Input id="cat-name" name="name" defaultValue={editing?.name} required />
        </Field>
        <Field label="Descripción" htmlFor="cat-desc">
          <Textarea id="cat-desc" name="description" defaultValue={editing?.description ?? ""} rows={3} />
        </Field>
        <Field label="Orden de aparición" htmlFor="cat-order">
          <Input id="cat-order" name="sortOrder" type="number" min="0" defaultValue={editing?.sortOrder ?? categories.length} />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {editing ? "Guardar cambios" : "Crear categoría"}
        </Button>
      </form>
    </div>
  );
}
