import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  ClipboardList,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Store,
  Tags,
  Truck,
} from "lucide-react";
import {
  getBrands,
  getCatalogStats,
  getCategories,
  getFeaturedProducts,
  getSettings,
} from "@/lib/catalog";
import { formatPrice, whatsappLink } from "@/lib/utils";
import { ButtonLink, buttonClass } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { CategoryIcon } from "@/components/product/category-icon";
import { WhatsAppIcon } from "@/components/site/whatsapp-icon";

export default async function HomePage() {
  const [stats, categories, featured, brands, settings] = await Promise.all([
    getCatalogStats(),
    getCategories(),
    getFeaturedProducts(8),
    getBrands(),
    getSettings(),
  ]);
  const wa = whatsappLink(
    settings.whatsapp,
    "Hola, quisiera cotizar productos del catálogo de Inversiones Pardave.",
  );
  const heroHighlights = featured.slice(0, 2);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-navy-950 text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.15] [background-image:linear-gradient(rgb(255_255_255/0.12)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.12)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_30%_40%,black,transparent_75%)]"
        />
        <div aria-hidden="true" className="absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full bg-brand-600/35 blur-3xl" />
        <div aria-hidden="true" className="absolute -right-40 -bottom-48 h-[34rem] w-[34rem] rounded-full bg-mint-500/25 blur-3xl" />

        <div className="relative container-page grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-mint-200">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-400" aria-hidden="true" />
              Catálogo 2026 · {stats.products} productos disponibles
            </p>
            <h1 className="mt-6 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-[3.6rem]">
              Insumos médicos y productos galénicos{" "}
              <span className="bg-gradient-to-r from-mint-300 to-lime-300 bg-clip-text text-transparent">
                al por mayor
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
              Calidad que cuida, confianza que sana. Abastecemos boticas, farmacias, clínicas y
              consultorios con precios por unidad, docena y caja.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/productos" variant="lime" size="lg">
                Ver catálogo completo
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </ButtonLink>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass(
                  "outline",
                  "lg",
                  "border-white/25 bg-white/5 text-white hover:border-white/40 hover:bg-white/10",
                )}
              >
                <WhatsAppIcon className="h-5 w-5" />
                Cotizar por WhatsApp
              </a>
            </div>
            <ul className="mt-10 grid gap-3 text-sm text-white/80 sm:grid-cols-3">
              {[
                { icon: Tags, text: "Precios por mayor" },
                { icon: BadgeCheck, text: "Marcas reconocidas" },
                { icon: MessageCircle, text: "Atención personalizada" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <Icon className="h-4.5 w-4.5 text-mint-300" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative animate-fade-up [animation-delay:120ms]">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white shadow-2xl shadow-black/40">
              <Image
                src="/brand/hero-products.webp"
                alt="Guantes de nitrilo, gasas estériles, jeringas, alcohol y solución fisiológica"
                width={1819}
                height={960}
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="h-auto w-full"
              />
            </div>
            {heroHighlights.map((product, index) => (
              <Link
                key={product.id}
                href={`/productos/${product.slug}`}
                className={
                  index === 0
                    ? "absolute -bottom-6 -left-4 hidden max-w-[15rem] rounded-2xl bg-white p-3.5 text-ink shadow-lift transition hover:-translate-y-0.5 sm:block"
                    : "absolute -top-5 -right-3 hidden max-w-[14rem] rounded-2xl bg-white p-3.5 text-ink shadow-lift transition hover:-translate-y-0.5 lg:block"
                }
              >
                <span className="text-[0.68rem] font-bold tracking-wide text-mint-600 uppercase">
                  Destacado
                </span>
                <span className="mt-0.5 line-clamp-1 block text-sm font-bold">{product.name}</span>
                <span className="mt-1 block text-xs text-muted">
                  Desde{" "}
                  <span className="text-base font-extrabold text-navy-900 tabular-nums">
                    {formatPrice(product.priceFrom ?? 0)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CIFRAS */}
      <section aria-label="El catálogo en cifras" className="border-b border-line bg-white">
        <dl className="container-page grid grid-cols-2 gap-px overflow-hidden py-2 md:grid-cols-4">
          {[
            { value: `${stats.products}+`, label: "Productos en catálogo", icon: Boxes },
            { value: stats.categories, label: "Líneas de producto", icon: ClipboardList },
            { value: `${stats.brands}+`, label: "Marcas y laboratorios", icon: BadgeCheck },
            { value: "Lun – Sáb", label: "Atención de pedidos", icon: Store },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 px-2 py-6 sm:px-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-2xl font-extrabold text-navy-900 tabular-nums">{value}</dd>
                <dd className="text-xs font-medium text-muted sm:text-sm">{label}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* CATEGORÍAS */}
      <section id="categorias" className="scroll-mt-28 bg-surface py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Líneas de producto"
            title="Todo lo que tu botica o clínica necesita"
            description="Explora el catálogo por categoría y arma tu pedido con precios por unidad, docena o caja."
          />
          <ul className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/productos?categoria=${category.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-line bg-white p-4 shadow-card sm:p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-50 to-mint-50 text-brand-600 transition group-hover:from-brand-600 group-hover:to-mint-500 group-hover:text-white">
                      <CategoryIcon slug={category.slug} className="h-6 w-6" />
                    </span>
                    <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-muted tabular-nums">
                      {category.productCount}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-ink sm:text-base">{category.name}</h3>
                  <p className="mt-1.5 line-clamp-2 hidden text-sm leading-relaxed text-muted sm:block">{category.description}</p>
                  <span className="mt-auto hidden items-center gap-1 pt-4 text-sm font-semibold text-brand-600 sm:flex">
                    Ver productos
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* DESTACADOS */}
      <section className="py-20">
        <div className="container-page">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              align="left"
              eyebrow="Más pedidos"
              title="Productos destacados"
              description="Los insumos que más reponen nuestros clientes cada semana."
            />
            <ButtonLink href="/productos" variant="outline">
              Ver todo el catálogo
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ButtonLink>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* NOSOTROS */}
      <section id="nosotros" className="scroll-mt-28 overflow-hidden bg-surface py-20">
        <div className="container-page grid items-center gap-14 lg:grid-cols-2">
          <div className="relative mx-auto w-full max-w-md lg:order-2">
            <div aria-hidden="true" className="absolute -inset-6 rotate-3 rounded-[2.5rem] bg-gradient-to-br from-brand-200/70 to-mint-200/70" />
            <Image
              src="/brand/catalogo-portada.webp"
              alt="Portada del catálogo 2026 de Inversiones Pardave"
              width={910}
              height={1287}
              sizes="(min-width: 1024px) 448px, 90vw"
              className="relative h-auto w-full rounded-[2rem] shadow-lift"
            />
          </div>
          <div>
            <SectionHeading
              align="left"
              eyebrow="Nosotros"
              title="Una distribuidora pensada para el sector salud"
              description={`${settings.companyName} distribuye insumos médicos, material descartable y productos galénicos bajo la línea Corp. Farma Perú. Trabajamos con laboratorios y marcas reconocidas para que tu negocio tenga stock confiable a precio de mayorista.`}
            />
            <ul className="mt-10 grid gap-5 sm:grid-cols-2">
              {[
                {
                  icon: ShieldCheck,
                  title: "Calidad garantizada",
                  text: "Productos de laboratorios y marcas como Alkofarma, Braun, 3M, BD y Tagum.",
                },
                {
                  icon: Tags,
                  title: "Precios por volumen",
                  text: "Compra por unidad, docena, caja o cajón según lo que necesites reponer.",
                },
                {
                  icon: PackageCheck,
                  title: "Catálogo amplio",
                  text: `${stats.products} productos en ${stats.categories} líneas: del descartable a la higiene personal.`,
                },
                {
                  icon: Truck,
                  title: "Pedidos ágiles",
                  text: "Arma tu pedido en la web o por WhatsApp y coordinamos la entrega o el recojo.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-2xl border border-line bg-white p-5">
                  <Icon className="h-6 w-6 text-mint-500" aria-hidden="true" />
                  <h3 className="mt-3 font-bold text-ink">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* MARCAS */}
      <section aria-labelledby="marcas-titulo" className="border-y border-line bg-white py-12">
        <div className="container-page">
          <h2 id="marcas-titulo" className="text-center text-sm font-bold tracking-[0.2em] text-muted uppercase">
            Marcas que distribuimos
          </h2>
        </div>
        <div className="relative mt-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <ul className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
            {[...brands, ...brands].map((brand, index) => (
              <li key={`${brand.name}-${index}`} aria-hidden={index >= brands.length}>
                <Link
                  href={`/productos?marca=${encodeURIComponent(brand.name)}`}
                  tabIndex={index >= brands.length ? -1 : undefined}
                  className="block rounded-xl border border-line bg-surface px-5 py-3 text-sm font-extrabold tracking-tight whitespace-nowrap text-navy-800 transition hover:border-brand-300 hover:bg-brand-50"
                >
                  {brand.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CÓMO COMPRAR */}
      <section id="como-comprar" className="scroll-mt-28 py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Cómo comprar"
            title="Tu pedido en tres pasos"
            description="Sin registros ni complicaciones. Te confirmamos disponibilidad y total antes de despachar."
          />
          <ol className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Arma tu pedido",
                text: "Busca en el catálogo, elige la presentación (unidad, docena o caja) y agrégala a tu pedido.",
              },
              {
                title: "Envíanos la solicitud",
                text: "Completa tus datos y envía el pedido. También puedes mandarlo directo por WhatsApp.",
              },
              {
                title: "Coordina la entrega",
                text: "Confirmamos stock, total y forma de pago, y coordinamos el delivery o el recojo.",
              },
            ].map((step, index) => (
              <li key={step.title} className="relative rounded-2xl border border-line bg-white p-6 shadow-card">
                <span className="font-display text-5xl font-extrabold text-brand-100">0{index + 1}</span>
                <h3 className="mt-2 text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-700 to-navy-900 px-6 py-14 text-white sm:px-12">
            <div aria-hidden="true" className="absolute -top-24 -right-16 h-72 w-72 rounded-full bg-mint-400/30 blur-3xl" />
            <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
                  ¿Tienes una botica, farmacia o clínica?
                </h2>
                <p className="mt-3 text-lg text-white/80">
                  Escríbenos y te ayudamos a armar tu pedido de reposición con precios por volumen.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("lime", "lg")}
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Escribir por WhatsApp
                </a>
                <ButtonLink
                  href="/contacto"
                  variant="outline"
                  size="lg"
                  className="border-white/30 bg-transparent text-white hover:bg-white/10"
                >
                  Enviar un mensaje
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-sm font-bold tracking-[0.16em] text-mint-600 uppercase">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy-950 text-balance sm:text-4xl">
        {title}
      </h2>
      {description && <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{description}</p>}
    </div>
  );
}
