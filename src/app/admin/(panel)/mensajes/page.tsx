import type { Metadata } from "next";
import { Mail, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { PageHeader } from "@/components/admin/page-header";
import { MessageActions } from "@/components/admin/message-actions";
import { Badge } from "@/components/ui/badge";

export const instant = false;
export const metadata: Metadata = { title: "Mensajes" };

export default async function MessagesPage() {
  const user = await requireUser();
  const messages = await db.contactMessage.findMany({ orderBy: [{ read: "asc" }, { createdAt: "desc" }], take: 200 });
  const unread = messages.filter((m) => !m.read).length;

  return (
    <>
      <PageHeader title="Mensajes" description={`${unread} sin leer · formulario de contacto de la web`} />
      {messages.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line bg-white px-6 py-16 text-center text-muted">
          Todavía no hay mensajes.
        </p>
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className={`rounded-2xl border bg-white p-5 ${m.read ? "border-line" : "border-brand-200 shadow-card"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2 font-bold text-ink">
                    {m.name}
                    {!m.read && <Badge tone="brand">Nuevo</Badge>}
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    {m.company && <span>{m.company}</span>}
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                        <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {m.phone}
                      </a>
                    )}
                    {m.email && (
                      <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1 text-brand-700 hover:underline">
                        <Mail className="h-3.5 w-3.5" aria-hidden="true" /> {m.email}
                      </a>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{formatDate(m.createdAt, true)}</span>
                  <MessageActions id={m.id} read={m.read} canDelete={user.role === "ADMIN"} />
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink/85">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
