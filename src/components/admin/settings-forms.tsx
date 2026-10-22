"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import {
  changePassword,
  createUser,
  saveSettings,
  toggleUser,
  type ActionState,
} from "@/app/admin/actions";
import type { StoreSettings } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { submitWithoutReset } from "@/components/ui/submit";

function useToastState(state: ActionState, onOk?: () => void) {
  const done = useRef(onOk);
  useEffect(() => {
    if (state.ok && state.message) {
      toast.success(state.message);
      done.current?.();
    } else if (!state.ok && state.message) toast.error(state.message);
  }, [state]);
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {children}
    </Button>
  );
}

export function StoreSettingsForm({ settings, disabled }: { settings: StoreSettings; disabled: boolean }) {
  const [state, action, pending] = useActionState(saveSettings, { ok: false } as ActionState);
  useToastState(state);
  const e = state.errors ?? {};
  const fields: { name: keyof StoreSettings; label: string; hint?: string }[] = [
    { name: "companyName", label: "Razón social" },
    { name: "tradeName", label: "Nombre comercial" },
    { name: "email", label: "Correo de contacto" },
    { name: "whatsapp", label: "WhatsApp (con código de país)", hint: "Ej.: 51987654321 — recibe los pedidos" },
    { name: "phone", label: "Teléfono visible" },
    { name: "address", label: "Dirección" },
    { name: "hours", label: "Horario de atención" },
  ];
  return (
    <form onSubmit={submitWithoutReset(action)} className="space-y-4">
      <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.name} label={f.label} htmlFor={`s-${f.name}`} error={e[f.name]} hint={f.hint}>
            <Input id={`s-${f.name}`} name={f.name} defaultValue={settings[f.name]} />
          </Field>
        ))}
      </fieldset>
      {disabled ? (
        <p className="text-sm text-muted">Solo un administrador puede cambiar estos datos.</p>
      ) : (
        <Submit pending={pending}>Guardar configuración</Submit>
      )}
    </form>
  );
}

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(changePassword, { ok: false } as ActionState);
  useToastState(state, () => formRef.current?.reset());
  const e = state.errors ?? {};
  return (
    <form ref={formRef} onSubmit={submitWithoutReset(action)} className="space-y-4">
      <Field label="Contraseña actual" htmlFor="current" error={e.current}>
        <Input id="current" name="current" type="password" autoComplete="current-password" />
      </Field>
      <Field label="Nueva contraseña" htmlFor="next" error={e.next}>
        <Input id="next" name="next" type="password" autoComplete="new-password" />
      </Field>
      <Field label="Repite la nueva contraseña" htmlFor="confirm" error={e.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" />
      </Field>
      <Submit pending={pending}>Cambiar contraseña</Submit>
    </form>
  );
}

type UserRow = { id: string; name: string; email: string; role: "ADMIN" | "STAFF"; active: boolean; lastLoginAt: string | null };

export function UsersManager({ users, currentId }: { users: UserRow[]; currentId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(createUser, { ok: false } as ActionState);
  const [toggling, start] = useTransition();
  useToastState(state, () => formRef.current?.reset());
  const e = state.errors ?? {};

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-line rounded-xl border border-line">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="flex items-center gap-2 font-semibold text-ink">
                {u.name}
                <Badge tone={u.role === "ADMIN" ? "navy" : "neutral"}>{u.role === "ADMIN" ? "Administrador" : "Personal"}</Badge>
                {!u.active && <Badge tone="red">Desactivado</Badge>}
              </p>
              <p className="text-xs text-muted">
                {u.email}
                {u.lastLoginAt ? ` · último ingreso ${new Date(u.lastLoginAt).toLocaleDateString("es-PE")}` : ""}
              </p>
            </div>
            {u.id !== currentId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={toggling}
                onClick={() => start(() => toggleUser(u.id, !u.active))}
              >
                {u.active ? "Desactivar" : "Activar"}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <form ref={formRef} onSubmit={submitWithoutReset(action)} className="grid gap-4 rounded-xl bg-surface p-4 sm:grid-cols-2">
        <p className="font-bold text-ink sm:col-span-2">Nuevo usuario</p>
        <Field label="Nombre" htmlFor="u-name" error={e.name}>
          <Input id="u-name" name="name" />
        </Field>
        <Field label="Correo" htmlFor="u-email" error={e.email}>
          <Input id="u-email" name="email" type="email" />
        </Field>
        <Field label="Contraseña inicial" htmlFor="u-password" error={e.password}>
          <Input id="u-password" name="password" type="password" autoComplete="new-password" />
        </Field>
        <Field label="Rol" htmlFor="u-role">
          <Select id="u-role" name="role" defaultValue="STAFF">
            <option value="STAFF">Personal (gestiona pedidos y productos)</option>
            <option value="ADMIN">Administrador (acceso total)</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Submit pending={pending}>Crear usuario</Submit>
        </div>
      </form>
    </div>
  );
}
