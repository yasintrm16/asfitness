"use client";

import { useRef } from "react";
import { gsap, revealDelay, useGSAP } from "@/lib/gsap";

/*
 * KURUCU FOTOĞRAFI — public/images/kurucu.jpg (kollar bağlı, karşıya bakan, siyah tişörtlü dikey kare)
 * Dosya yoksa tarayıcı ikinci katmana düşer: Instagram'daki squat karesi (ig-squat.jpg).
 * kurucu.jpg'yi koyduğun an o görünür, kod değişmez.
 */
const PHOTO = "url('/images/kurucu.jpg'), url('/images/ig-squat.jpg')";

/**
 * Hakkımızda sayfasının ana arka planı: kurucu fotoğrafı CSS katmanlarıyla sinematik bir
 * Hollywood afişine dönüşür.
 *   1. gri tonlama + yüksek kontrast
 *   2. koyu kırmızı gradyan, multiply → kan kırmızısı duotone
 *   3. sağ üstten kırmızı ışık, overlay → kontur
 *   4. kenarlardan siyaha kararma → önündeki metin okunur kalır
 * Scroll'da yavaşça yaklaşır ve kararır; metin öne çıkar.
 */
export function FounderBackdrop() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Giriş: kızıl bir buğunun içinden belirir.
        gsap.from(q("[data-founder-photo]"), {
          scale: 1.2,
          autoAlpha: 0,
          filter: "blur(22px)",
          duration: 2.8,
          ease: "expo.out",
          delay: Math.max(revealDelay() - 0.6, 0),
        });

        gsap.to(q("[data-founder]"), {
          scale: 1.1,
          yPercent: -4,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: true },
        });
      });

      // İçerik geldikçe arka plan kararır — hareket tercihinden bağımsız, okunurluk için.
      gsap.to(q("[data-founder-dim]"), {
        opacity: 0.6,
        ease: "none",
        scrollTrigger: { start: 0, end: () => window.innerHeight * 1.1, scrub: true },
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-void">
      <div data-founder className="absolute inset-y-0 right-0 isolate w-full md:w-[70%]">
        <div
          data-founder-photo
          // Üstten biraz aşağıda başlar: yüz, afişin üst kararmasının altında kalsın.
          className="absolute inset-x-0 top-[11%] bottom-0 bg-cover bg-[50%_0%] brightness-[1.1] contrast-[1.25] grayscale"
          style={{ backgroundImage: PHOTO }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(165deg,#3d0000_0%,#cc0000_45%,#140000_100%)] mix-blend-multiply" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_76%_14%,rgb(255_40_40/0.6),transparent_55%)] mix-blend-overlay" />
      </div>

      {/* Afiş kararması: mobilde alttan, masaüstünde metnin olduğu soldan siyaha */}
      <div className="absolute inset-0 bg-[linear-gradient(0deg,#000_10%,transparent_65%),linear-gradient(180deg,#000_0%,transparent_24%)] md:bg-[linear-gradient(90deg,#000_0%,#000_26%,transparent_70%),linear-gradient(0deg,#000_0%,transparent_45%),linear-gradient(180deg,#000_0%,transparent_22%)]" />
      <div data-founder-dim className="absolute inset-0 bg-void opacity-0" />
    </div>
  );
}
