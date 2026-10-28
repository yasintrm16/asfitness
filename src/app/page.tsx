import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { InfoSection } from "@/components/InfoSection";
import { SmoothScroll } from "@/components/SmoothScroll";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { site } from "@/lib/site";

// Google'ın işletmeyi doğru tanıması için yapılandırılmış veri (schema.org).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ExerciseGym",
  name: site.name,
  telephone: "+90 538 616 60 99",
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    postalCode: "16290",
    addressLocality: "Yıldırım",
    addressRegion: "Bursa",
    addressCountry: "TR",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "23:59",
    },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "12:00", closes: "22:00" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "12:00", closes: "18:00" },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SmoothScroll />
      {/* Sabit 3D katman: içerik bunun üzerinde akar */}
      <SceneCanvas />
      <div aria-hidden className="grain" />
      <Header />
      <main className="relative z-10">
        <Hero />
        <InfoSection />
        <Gallery />
      </main>
      <Footer />
    </>
  );
}
