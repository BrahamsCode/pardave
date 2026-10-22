import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { WhatsAppFab } from "@/components/site/whatsapp-fab";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido" className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppFab />
    </>
  );
}
