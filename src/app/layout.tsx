import type { Metadata, Viewport } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

// Tek aile, iki karakter: başlıklarda wdth 62 (brutalist, sıkışık), metinde wdth 100.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "As fitness — Yıldırım / Bursa",
  description:
    "As fitness: Yavuz Selim, 3. Alpay Sk. No:52, Yıldırım/Bursa. 4.9 puan (38 yorum). Hafta içi 09:00–00:00, Cumartesi 12:00–22:00, Pazar 12:00–18:00.",
};

export const viewport: Viewport = {
  themeColor: "#050507",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${archivo.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  );
}
