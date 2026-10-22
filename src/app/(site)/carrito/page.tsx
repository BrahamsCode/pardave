import type { Metadata } from "next";
import { getSettings } from "@/lib/catalog";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Mi pedido",
  robots: { index: false },
};

export default async function CarritoPage() {
  const settings = await getSettings();
  return (
    <div className="bg-surface">
      <div className="container-page py-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy-950 sm:text-4xl">Mi pedido</h1>
        <p className="mt-2 text-muted">
          Revisa los productos, completa tus datos y envía tu solicitud. Te confirmaremos stock y total.
        </p>
        <CartView whatsapp={settings.whatsapp} />
      </div>
    </div>
  );
}
