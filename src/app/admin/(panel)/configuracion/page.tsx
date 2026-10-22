import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DEFAULT_SETTINGS, type StoreSettings } from "@/lib/catalog";
import { Card, PageHeader } from "@/components/admin/page-header";
import { PasswordForm, StoreSettingsForm, UsersManager } from "@/components/admin/settings-forms";

export const instant = false;
export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const user = await requireUser();
  const isAdmin = user.role === "ADMIN";
  const [rows, users] = await Promise.all([
    db.setting.findMany(),
    isAdmin ? db.user.findMany({ orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
  ]);
  const settings: StoreSettings = { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) };

  return (
    <>
      <PageHeader title="Configuración" description="Datos de la empresa, accesos y seguridad." />
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-1 font-bold text-ink">Datos de la tienda</h2>
          <p className="mb-5 text-sm text-muted">Se muestran en la web, el pie de página y los enlaces de WhatsApp.</p>
          <StoreSettingsForm settings={settings} disabled={!isAdmin} />
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="mb-5 font-bold text-ink">Mi contraseña</h2>
          <PasswordForm />
        </Card>
        {isAdmin && (
          <Card className="p-5 sm:p-6 xl:col-span-2">
            <h2 className="mb-5 font-bold text-ink">Usuarios del panel</h2>
            <UsersManager
              currentId={user.id}
              users={users.map((u) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                active: u.active,
                lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
              }))}
            />
          </Card>
        )}
      </div>
    </>
  );
}
