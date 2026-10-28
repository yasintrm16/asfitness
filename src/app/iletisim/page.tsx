import type { Metadata } from "next";
import { Contact } from "@/components/Contact";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "As Fitness iletişim: 0538 616 60 99 · Yavuz Selim, 3. Alpay Sk. No:52, 16290 Yıldırım/Bursa. WhatsApp'tan yazın ya da arayın.",
};

export default function ContactPage() {
  return (
    <main className="relative z-10">
      <Contact />
    </main>
  );
}
