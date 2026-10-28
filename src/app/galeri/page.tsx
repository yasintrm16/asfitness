import type { Metadata } from "next";
import { Gallery } from "@/components/Gallery";

export const metadata: Metadata = {
  title: "Galeri",
  description: "As Fitness salonundan kareler — Yıldırım / Bursa.",
};

export default function GalleryPage() {
  return (
    <main className="relative z-10">
      <Gallery />
    </main>
  );
}
