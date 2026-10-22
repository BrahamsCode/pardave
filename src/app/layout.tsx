import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Inversiones Pardave · Insumos médicos y productos galénicos",
    template: "%s · Inversiones Pardave",
  },
  description:
    "Distribuidora de insumos médicos, material descartable y productos galénicos en Perú. Más de 500 productos con precios por unidad, docena y caja. Cotiza en línea o por WhatsApp.",
  keywords: [
    "insumos médicos",
    "productos galénicos",
    "material descartable",
    "distribuidora farmacéutica",
    "Corp. Farma Perú",
    "Inversiones Pardave",
  ],
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "Inversiones Pardave",
    images: [{ url: "/brand/catalogo-portada.webp", width: 910, height: 1287 }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0a2560",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-PE" data-scroll-behavior="smooth" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
