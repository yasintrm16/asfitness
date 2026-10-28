"use client";

import { useRef } from "react";
import { gsap, INTRO, isLateLoad, useGSAP } from "@/lib/gsap";

/**
 * Siteye ilk girişte sinematik açılış: karanlıkta ince bir kırmızı neon çizgi çizilir,
 * perde bu çizgiden ikiye ayrılarak açılır. Layout'ta yaşar; sayfa geçişlerinde oynamaz.
 * JS geç gelirse CSS emniyeti (globals.css → [data-curtain]) 3 sn'de perdeyi kaldırır.
 */
export function Curtain() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const curtain = root.current!;
      const q = gsap.utils.selector(root);
      // CSS'teki emniyet animasyonunu kapat, kontrol artık GSAP'te.
      gsap.set(curtain, { animation: "none" });

      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
        const { reduce } = ctx.conditions as { reduce: boolean };
        if (reduce || isLateLoad()) {
          gsap.to(curtain, { autoAlpha: 0, duration: 0.4, onComplete: () => gsap.set(curtain, { display: "none" }) });
          return;
        }

        gsap
          .timeline({ onComplete: () => gsap.set(curtain, { display: "none" }) })
          .from(q("[data-curtain-mark]"), { autoAlpha: 0, letterSpacing: "0.9em", duration: 1.1, ease: "expo.out" }, 0)
          .from(q("[data-curtain-line]"), { scaleX: 0, duration: 0.95, ease: "expo.inOut" }, 0.1)
          .to(q("[data-curtain-mark]"), { autoAlpha: 0, y: -12, duration: 0.5, ease: "power2.in" }, INTRO.open - 0.25)
          .to(q("[data-curtain-top]"), { yPercent: -100, duration: 1.3, ease: "expo.inOut" }, INTRO.open)
          .to(q("[data-curtain-bottom]"), { yPercent: 100, duration: 1.3, ease: "expo.inOut" }, INTRO.open)
          .to(q("[data-curtain-line]"), { scaleX: 1.6, autoAlpha: 0, duration: 0.9, ease: "power2.out" }, INTRO.open + 0.05);
      });
    },
    { scope: root },
  );

  return (
    <div ref={root} data-curtain aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      <div data-curtain-top className="absolute inset-x-0 top-0 h-1/2 bg-void" />
      <div data-curtain-bottom className="absolute inset-x-0 bottom-0 h-1/2 bg-void" />
      <div data-curtain-line className="neon absolute inset-x-0 top-1/2 h-px -translate-y-1/2" />
      <p
        data-curtain-mark
        lang="en"
        className="type-label absolute inset-x-0 top-1/2 -translate-y-[calc(100%+1.25rem)] text-center tracking-[0.55em] text-chalk"
      >
        As Fitness
      </p>
    </div>
  );
}
