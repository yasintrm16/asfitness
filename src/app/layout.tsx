import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif, Manrope } from "next/font/google";
import { Curtain } from "@/components/Curtain";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SmoothScroll } from "@/components/SmoothScroll";
import { site } from "@/lib/site";
import { siteUrl } from "@/lib/siteUrl";
import "lenis/dist/lenis.css";
import "./globals.css";

// Üç ses: Archivo (sıkışık, maskülen başlık) · Manrope (ince, okunur metin) · Instrument Serif (italik vurgu).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
});

const description =
  "As Fitness: Yavuz Selim, 3. Alpay Sk. No:52, Yıldırım/Bursa. 4.9 puan (38 yorum). Hafta içi 09:00–00:00, Cumartesi 12:00–22:00, Pazar 12:00–18:00.";

// Paylaşım kartı görseli src/app/opengraph-image.tsx'ten gelir; tam URL'ler metadataBase ile kurulur.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "As Fitness — Yıldırım / Bursa",
    template: "%s — As Fitness",
  },
  description,
  applicationName: site.name,
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: site.name,
    title: "As Fitness — Sınırlarını Sen Belirle",
    description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

/** Header, footer ve yumuşak scroll tüm sayfalarda ortak; sayfa geçişlerinde yeniden kurulmaz. */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${archivo.variable} ${manrope.variable} ${instrument.variable}`}>
      <body>
        <div id="top" />
        <SmoothScroll />
        <Curtain />
        <div aria-hidden className="grain" />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
