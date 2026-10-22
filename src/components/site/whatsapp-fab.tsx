import { getSettings } from "@/lib/catalog";
import { whatsappLink } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";

export async function WhatsAppFab() {
  const settings = await getSettings();
  return (
    <a
      href={whatsappLink(settings.whatsapp, "Hola, quisiera cotizar productos del catálogo de Inversiones Pardave.")}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-4 bottom-4 z-40 inline-flex h-14 items-center gap-2 rounded-full bg-[#25D366] pr-5 pl-4 text-sm font-bold text-white shadow-lift transition hover:scale-[1.03] sm:right-6 sm:bottom-6"
      aria-label="Escríbenos por WhatsApp"
    >
      <WhatsAppIcon className="h-6 w-6" />
      <span className="hidden sm:inline">Cotiza por WhatsApp</span>
    </a>
  );
}
