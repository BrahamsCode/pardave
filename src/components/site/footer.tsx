import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getCategories, getSettings } from "@/lib/catalog";
import { Logo } from "@/components/logo";

export async function SiteFooter() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);

  return (
    <footer className="mt-auto bg-navy-950 text-white/75">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div className="space-y-4">
          <Logo tone="light" />
          <p className="max-w-sm text-sm leading-relaxed">
            Distribuidora de insumos médicos y productos galénicos. Abastecemos a boticas, farmacias,
            clínicas y consultorios con precios por mayor.
          </p>
          <p className="text-xs text-white/50">{settings.companyName}</p>
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-wide text-white uppercase">Catálogo</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.slice(0, 7).map((category) => (
              <li key={category.id}>
                <Link href={`/productos?categoria=${category.slug}`} className="hover:text-white">
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-wide text-white uppercase">Empresa</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/#nosotros" className="hover:text-white">Nosotros</Link></li>
            <li><Link href="/#como-comprar" className="hover:text-white">Cómo comprar</Link></li>
            <li><Link href="/productos" className="hover:text-white">Todos los productos</Link></li>
            <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
            <li><Link href="/admin" className="hover:text-white">Acceso interno</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-wide text-white uppercase">Contacto</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-mint-300" aria-hidden="true" />
              <a href={`mailto:${settings.email}`} className="break-all hover:text-white">{settings.email}</a>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-mint-300" aria-hidden="true" />
              <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-white">{settings.phone}</a>
            </li>
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mint-300" aria-hidden="true" />
              <span>{settings.address}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 {settings.companyName}. Todos los derechos reservados.</p>
          <p>Precios en soles (PEN) sujetos a cambio sin previo aviso. Imágenes referenciales.</p>
        </div>
      </div>
    </footer>
  );
}
