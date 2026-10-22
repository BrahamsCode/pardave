"use client";

import { useActionState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { updateOrder, type ActionState } from "@/app/admin/actions";
import { STATUS_OPTIONS, type Status } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { submitWithoutReset } from "@/components/ui/submit";

export function OrderForm({
  id,
  status,
  internalNotes,
  shipping,
}: {
  id: string;
  status: Status;
  internalNotes: string;
  shipping: number;
}) {
  const [state, action, pending] = useActionState(updateOrder, { ok: false } as ActionState);
  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
    else if (state.message) toast.error(state.message);
  }, [state]);

  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4">
      <input type="hidden" name="id" value={id} />
      <Field label="Estado" htmlFor="status">
        <Select id="status" name="status" defaultValue={status}>
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </Field>
      <Field label="Costo de envío (S/)" htmlFor="shipping" hint="Se suma al subtotal para el total final.">
        <Input id="shipping" name="shipping" type="number" step="0.01" min="0" defaultValue={shipping.toFixed(2)} />
      </Field>
      <Field label="Notas internas" htmlFor="internalNotes" hint="Solo visibles en el panel.">
        <Textarea id="internalNotes" name="internalNotes" rows={4} defaultValue={internalNotes} />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Guardar
      </Button>
    </form>
  );
}
