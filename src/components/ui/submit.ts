"use client";

import { startTransition, type FormEvent } from "react";

/**
 * Envía el formulario a una acción de `useActionState` sin que React reinicie los campos.
 * Así, si el servidor devuelve errores de validación, el usuario no pierde lo que escribió.
 */
export function submitWithoutReset(action: (formData: FormData) => void) {
  return (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    startTransition(() => action(formData));
  };
}
