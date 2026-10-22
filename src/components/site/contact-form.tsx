"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { sendContactMessage, type FormState } from "@/app/(site)/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { submitWithoutReset } from "@/components/ui/submit";

const initialState: FormState = { ok: false };

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialState);

  if (state.ok) {
    return (
      <div className="flex flex-col items-center rounded-3xl border border-mint-200 bg-mint-50 px-6 py-14 text-center">
        <CheckCircle2 className="h-12 w-12 text-mint-500" aria-hidden="true" />
        <p className="mt-4 text-lg font-bold text-ink">{state.message ?? "¡Gracias por escribirnos!"}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submitWithoutReset(formAction)} className="space-y-4" noValidate>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Sitio web</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre *" htmlFor="c-name" error={state.errors?.name}>
          <Input id="c-name" name="name" autoComplete="name" aria-invalid={!!state.errors?.name} />
        </Field>
        <Field label="Empresa o botica" htmlFor="c-company">
          <Input id="c-company" name="company" autoComplete="organization" />
        </Field>
        <Field label="Celular" htmlFor="c-phone" error={state.errors?.phone}>
          <Input id="c-phone" name="phone" type="tel" autoComplete="tel" aria-invalid={!!state.errors?.phone} />
        </Field>
        <Field label="Correo" htmlFor="c-email" error={state.errors?.email}>
          <Input id="c-email" name="email" type="email" autoComplete="email" aria-invalid={!!state.errors?.email} />
        </Field>
      </div>
      <Field label="Mensaje *" htmlFor="c-message" error={state.errors?.message}>
        <Textarea
          id="c-message"
          name="message"
          rows={5}
          placeholder="Cuéntanos qué productos necesitas, cantidades aproximadas o tu consulta."
          aria-invalid={!!state.errors?.message}
        />
      </Field>
      {state.message && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {state.message}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        {pending && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
        Enviar mensaje
      </Button>
    </form>
  );
}
