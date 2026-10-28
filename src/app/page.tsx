import { Equipment } from "@/components/Equipment";
import { GalleryTeaser } from "@/components/GalleryTeaser";
import { Hero } from "@/components/Hero";
import { LoadTheBar } from "@/components/LoadTheBar";
import { Pulse } from "@/components/Pulse";
import { Testimonials } from "@/components/Testimonials";
import { SceneCanvas } from "@/components/three/SceneCanvas";
import { site } from "@/lib/site";
import { siteUrl } from "@/lib/siteUrl";

// Google'ın işletmeyi doğru tanıması için yapılandırılmış veri (schema.org).
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ExerciseGym",
  name: site.name,
  url: siteUrl,
  logo: `${siteUrl}/images/logo.png`,
  image: `${siteUrl}/images/galeri-1.jpg`,
  sameAs: [site.instagram.href],
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

/**
 * Ana Sayfa: Three.js yalnızca burada, içeriğin arkasındaki sabit katmanda.
 *  · Hero: plakalar, kettlebell, dambıl ve lastik sisin içinde yerçekimsiz süzülür.
 *  · Barı yükle: plakalar scroll'la sırayla bara takılır, bar kaldırılır.
 *  · Ekipman: bar sise karışır; kettlebell, dambıl ve lastik sırayla sahneye gelir.
 *  · Nabız: EKG çizgisi ekranı keser, sis kalp atışıyla atar.
 *  · Yorumlar sahneyi siyaha kapatır; galeri önizlemesi düz zeminde (sahne çizimi durur).
 */
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SceneCanvas watch="sahne" />
      <main className="relative z-10">
        <div id="sahne">
          <Hero />
          <LoadTheBar />
          <Equipment />
          <Pulse />
          <Testimonials />
        </div>
        <GalleryTeaser />
      </main>
    </>
  );
}
