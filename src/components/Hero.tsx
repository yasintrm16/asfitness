"use client";

import { useRef } from "react";
import { MagneticButton } from "@/components/MagneticButton";
import { gsap, INTRO, isLateLoad, SplitText, useGSAP } from "@/lib/gsap";
import { site } from "@/lib/site";

export function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      gsap.set(q("[data-intro]"), { visibility: "visible", animation: "none" });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Harflere böl: her harf kendi satırının maskesinin altından yükselir.
        // (Varsayılan div etiketi kalmalı: SplitText inline-block'u yalnızca span dışı etiketlere verir.)
        const split = SplitText.create(q("[data-line]"), { type: "words,chars", aria: "none" });

        gsap
          .timeline({ delay: isLateLoad() ? 0.1 : INTRO.hero })
          // 140: İ/Ğ üst işaretleri de başlangıçta maskenin altında kalsın
          .from(split.chars, { yPercent: 140, rotate: 8, duration: 1.2, ease: "expo.out", stagger: 0.018 }, 0)
          .from(q("[data-hero-rule]"), { scaleX: 0, duration: 1.4, ease: "expo.inOut" }, 0.1)
          .from(q("[data-hero-fade]"), { y: 28, autoAlpha: 0, duration: 1, ease: "power3.out", stagger: 0.09 }, 0.35);

        // Scroll'da başlık geride kalıp söner; sahne 3D objeye kalır.
        gsap.to(q("[data-headline]"), {
          yPercent: -22,
          opacity: 0.2,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      id="hero"
      ref={root}
      className="relative flex min-h-svh flex-col justify-end px-4 pt-28 pb-6 md:px-8 md:pb-8 xl:px-12"
    >
      <div className="grid items-end gap-x-8 gap-y-10 lg:grid-cols-12">
        <h1
          data-headline
          data-intro
          aria-label="Sınırlarını yerçekimi değil, sen belirle."
          className="type-display text-[clamp(3.4rem,9.2vw,11rem)] lg:col-span-8"
        >
          <span aria-hidden className="block">
            <span data-line className="line-mask">
              Sınırlarını
            </span>
            <span data-line className="line-mask">
              <span className="text-outline">Yerçekimi</span> değil,
            </span>
            <span data-line className="line-mask">
              <span className="text-neon">Sen</span> belirle.
            </span>
          </span>
        </h1>

        <div className="flex flex-col items-start gap-7 lg:col-span-4 lg:pb-3">
          <p data-intro data-hero-fade className="flex items-end gap-3">
            <span className="type-display text-6xl leading-none">{site.rating.score}</span>
            <span aria-hidden className="pb-1 text-xl text-neon">
              ★
            </span>
            <span className="type-label pb-1.5 text-fog">
              <span className="sr-only">puan, </span>
              {site.rating.reviews} Yorum
            </span>
          </p>

          <p data-intro data-hero-fade className="max-w-sm text-base leading-relaxed text-fog md:text-lg">
            Yavuz Selim, Yıldırım. Hafta içi gece yarısına kadar açığız.
          </p>

          <div data-intro data-hero-fade>
            {/* Üyelik formu veya WhatsApp linki olursa href'i buradan değiştir. */}
            <MagneticButton href="#bilgi">Bize Katıl</MagneticButton>
          </div>
        </div>
      </div>

      <div data-hero-rule className="mt-10 h-px origin-left bg-steel" />
      <div data-intro data-hero-fade className="type-label mt-4 flex items-center justify-between gap-4 text-fog">
        <span>
          (01)<span className="hidden sm:inline"> — Yerçekimsiz antrenman</span>
        </span>
        <span className="hidden items-center gap-3 md:flex">
          Kaydır
          <span className="relative h-7 w-px overflow-hidden bg-steel">
            <span className="absolute inset-0 bg-neon motion-safe:animate-scroll-cue" />
          </span>
        </span>
        <span>Yıldırım / Bursa</span>
      </div>
    </section>
  );
}
