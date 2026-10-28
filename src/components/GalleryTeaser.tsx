"use client";

import { useRef } from "react";
import { Media } from "@/components/Gallery";
import { MagneticButton } from "@/components/MagneticButton";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { gallery } from "@/lib/site";
import { cn } from "@/lib/utils";

/*
 * Galerinin büyük kareleri tek satırda, basamaklı. Kutular fotoğrafların kendi
 * genişliğine yakın tutuldu (kaynaklar ~250–430 px): büyütülüp bulanıklaşmasın.
 */
const LAYOUT = [
  { className: "md:col-span-4", depth: 0.25 },
  { className: "md:col-span-3 md:mt-[14vh]", depth: 0.6 },
  { className: "md:col-span-2 md:mt-[5vh]", depth: 0.9 },
  { className: "md:col-span-3 md:mt-[20vh]", depth: 0.45 },
];

/** Ana sayfanın kapanışı: salondan dört kare, her biri kendi hızında kayar; tamamı Galeri'de. */
export function GalleryTeaser() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(q("[data-reveal]"), {
          y: 36,
          autoAlpha: 0,
          duration: 1.3,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: "top 70%", once: true },
        });

        // Kare açılışı: perde alttan yukarı açılır (Galeri sayfasıyla aynı dil).
        for (const frame of q("[data-frame]")) {
          const reveal = gsap
            .timeline({ paused: true })
            .fromTo(
              frame,
              { clipPath: "inset(100% 0% 0% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.out" },
            )
            .from(frame.querySelector("img"), { scale: 1.35, duration: 1.9, ease: "expo.out" }, 0);
          ScrollTrigger.create({ trigger: frame, start: "top 92%", once: true, onEnter: () => reveal.play() });
        }
      });

      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        for (const layer of q("[data-depth]")) {
          const travel = () => window.innerHeight * 0.2 * Number(layer.dataset.depth);
          gsap.fromTo(
            layer,
            { y: travel },
            {
              y: () => -travel(),
              ease: "none",
              scrollTrigger: {
                trigger: layer.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }
      });
    },
    { scope: root },
  );

  const picks = gallery.slice(0, LAYOUT.length);

  return (
    <section ref={root} id="kareler" aria-labelledby="kareler-baslik" className="relative bg-void">
      <div className="mx-auto max-w-[1400px] px-6 pt-28 pb-24 md:px-10 md:pt-36 md:pb-36">
        <div className="flex flex-wrap items-end justify-between gap-10">
          <div>
            <p data-reveal className="type-label flex items-center gap-4 text-mist">
              <span aria-hidden className="neon h-px w-8" />
              Galeri
            </p>
            <h2 data-reveal id="kareler-baslik" className="mt-6 text-[clamp(2.6rem,5.4vw,4.75rem)] leading-[0.95]">
              <span className="type-display block tracking-[0.03em]">Salondan</span>
              <span className="type-serif block text-[1.08em] text-accent">kareler.</span>
            </h2>
          </div>
          <div data-reveal>
            <MagneticButton href="/galeri">Tüm galeri</MagneticButton>
          </div>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-24 md:grid-cols-12 md:items-start md:gap-x-6">
          {picks.map((item, i) => (
            <li key={item.src} className={cn("relative", LAYOUT[i].className)}>
              <div data-depth={LAYOUT[i].depth}>
                <div data-frame>
                  <Media item={item} sizes="(min-width: 768px) 33vw, 50vw" />
                </div>
                <p className="mt-4 flex items-baseline gap-3">
                  <span className="type-serif text-lg text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="type-label text-[0.625rem] text-fog">{item.alt}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
