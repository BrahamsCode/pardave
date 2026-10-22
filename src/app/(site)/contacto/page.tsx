import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getSettings } from "@/lib/catalog";
import { whatsappLink } from "@/lib/utils";
import { ContactForm } from "@/components/site/contact-form";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbenos para cotizaciones, pedidos por volumen y consultas sobre el catálogo.",
};

export default async function ContactoPage() {
  const settings = await getSettings();
  const channels = [
    {
      icon: WhatsAppIcon,
      label: "WhatsApp",
      value: "Escríbenos ahora",
      href: whatsappLink(settings.whatsapp, "Hola, quisiera hacer una consulta."),
      external: true,
    },
    { icon: Phone, label: "Teléfono", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}` },
    { icon: Mail, label: "Correo", value: settings.email, href: `mailto:${settings.email}` },
    { icon: MapPin, label: "Ubicación", value: settings.address },
    { icon: Clock, label: "Horario", value: settings.hours },
  ];

  return (
    <div className="bg-surface">
      <section className="bg-navy-950 text-white">
        <div className="container-page py-14">
          <p className="text-sm font-bold tracking-[0.16em] text-mint-300 uppercase">Contacto</p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-extrabold tracking-tight text-balance">
            Conversemos sobre el abastecimiento de tu negocio
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Cotizaciones por volumen, consultas de stock o pedidos especiales: te respondemos a la brevedad.
          </p>
        </div>
      </section>
      <div className="container-page grid gap-8 py-12 lg:grid-cols-[22rem_1fr]">
        <ul className="space-y-3">
          {channels.map(({ icon: Icon, label, value, href, external }) => {
            const content = (
              <>
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold tracking-wide text-muted uppercase">{label}</span>
                  <span className="block font-semibold break-words text-ink">{value}</span>
                </span>
              </>
            );
            return (
              <li key={label}>
                {href ? (
                  <a
                    href={href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 transition hover:border-brand-200 hover:shadow-card"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4">{content}</div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="rounded-3xl border border-line bg-white p-6 sm:p-8">
          <h2 className="text-xl font-bold text-ink">Envíanos un mensaje</h2>
          <p className="mt-1 mb-6 text-sm text-muted">Completa el formulario y te contactaremos.</p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
