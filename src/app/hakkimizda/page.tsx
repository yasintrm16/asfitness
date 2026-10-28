import type { Metadata } from "next";
import { About } from "@/components/About";
import { FounderBackdrop } from "@/components/FounderBackdrop";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "As Fitness'ın vizyonu ve kurucusunun mesajı — Yavuz Selim, 3. Alpay Sk. No:52, 16290 Yıldırım/Bursa.",
};

/** Hakkımızda: kurucu fotoğrafı sinematik arka plan, vizyon ve kurucu mesajı önde. */
export default function AboutPage() {
  return (
    <>
      <FounderBackdrop />
      <main className="relative z-10">
        <About />
      </main>
    </>
  );
}
