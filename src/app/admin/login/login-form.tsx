"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { login, type ActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { submitWithoutReset } from "@/components/ui/submit";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, { ok: false } as ActionState);
  const next = useSearchParams().get("next") ?? "";
  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Correo" htmlFor="email" error={state.errors?.email}>
        <Input id="email" name="email" type="email" autoComplete="username" required autoFocus defaultValue={state.values?.email} key={state.values?.email} />
      </Field>
      <Field label="Contraseña" htmlFor="password" error={state.errors?.password}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.message && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
        Ingresar
      </Button>
    </form>
  );
}
