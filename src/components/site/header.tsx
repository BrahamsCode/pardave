import Link from "next/link";
import { Clock, Mail, Phone } from "lucide-react";
import { getSettings } from "@/lib/catalog";
import { Logo } from "@/components/logo";
import { CartButton } from "@/components/site/cart-button";
import { MobileNav } from "@/components/site/mobile-nav";
import { NAV_LINKS } from "@/components/site/nav-links";
import { SearchForm } from "@/components/site/search-form";

export async function SiteHeader() {
  const settings = await getSettings();

  return (
    <header className="sticky top-0 z-30">
      <div className="hidden bg-navy-950 text-[0.8rem] text-white/80 md:block">
        <div className="container-page flex h-9 items-center justify-between gap-6">
          <p className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
            {settings.hours}
          </p>
          <div className="flex items-center gap-5">
            <a href={`mailto:${settings.email}`} className="flex items-center gap-1.5 hover:text-white">
              <Mail className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
              {settings.email}
            </a>
            <a href={`tel:${settings.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-white">
              <Phone className="h-3.5 w-3.5 text-mint-300" aria-hidden="true" />
              {settings.phone}
            </a>
          </div>
        </div>
      </div>
      <div className="relative border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
        <div className="container-page flex h-[4.5rem] items-center gap-4 lg:gap-8">
          <Link href="/" aria-label="Inversiones Pardave, inicio" className="shrink-0">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-ink/80 transition hover:bg-surface hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <SearchForm className="ml-auto hidden w-full max-w-sm md:block" />
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <CartButton />
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
