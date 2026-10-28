"use client";

import { useRef } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { directionsUrl, hours, site } from "@/lib/site";

export function Footer() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(q("[data-cta-line]"), {
          yPercent: 115,
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: q("[data-cta]")[0], start: "top 88%", once: true },
        });

        // Dev kapanış yazısı harf harf zeminden yükselir.
        const wordmark = q("[data-wordmark]")[0];
        const split = SplitText.create(wordmark, { type: "chars", aria: "none" });
        gsap.from(split.chars, {
          yPercent: 110,
          duration: 1.4,
          ease: "expo.out",
          stagger: 0.04,
          scrollTrigger: { trigger: wordmark, start: "top 98%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <footer id="iletisim" ref={root} className="relative z-10 overflow-hidden px-4 pt-32 md:px-8 md:pt-44 xl:px-12">
      <p className="type-label text-neon">(04) — İletişim</p>

      <a
        data-cta
        href={directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group mt-8 flex items-end justify-between gap-6 border-b border-steel pb-8"
      >
        <span className="line-mask">
          <span
            data-cta-line
            className="type-display block text-[clamp(3.4rem,10vw,11rem)] transition-colors duration-500 group-hover:text-neon"
          >
            Yol tarifi al
          </span>
        </span>
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="mb-[1vw] size-[clamp(2.5rem,7vw,7rem)] shrink-0 text-neon transition-transform duration-700 ease-expo group-hover:translate-x-2 group-hover:-translate-y-2"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
        <span className="sr-only">(Google Haritalar yeni sekmede açılır)</span>
      </a>

      <div className="mt-14 grid gap-12 md:grid-cols-3">
        <div>
          <p className="type-label text-fog">Adres</p>
          <p className="mt-3 text-lg leading-snug">
            {site.address.street}
            <br />
            {site.address.city}
          </p>
        </div>
        <div>
          <p className="type-label text-fog">Telefon</p>
          <a href={site.phone.href} className="mt-3 inline-block text-lg transition-colors hover:text-neon">
            {site.phone.display}
          </a>
        </div>
        <div>
          <p className="type-label text-fog">Saatler</p>
          <ul className="mt-3 space-y-1.5 text-lg">
            {hours.map((h) => (
              <li key={h.label} className="flex justify-between gap-6 md:max-w-xs">
                <span className="text-fog">{h.label}</span>
                <span className="tabular-nums">
                  {h.open}–{h.close}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <p
        data-wordmark
        aria-hidden
        className="type-display line-mask mt-24 text-center text-[19vw] leading-[0.8] whitespace-nowrap text-chalk"
      >
        {site.name}
      </p>

      <div className="type-label flex items-center justify-between gap-4 border-t border-steel py-6 text-fog">
        <span>
          © {site.name}
          <span className="hidden sm:inline"> — Yıldırım / Bursa</span>
        </span>
        <a href="#hero" className="transition-colors hover:text-chalk">
          Yukarı çık ↑
        </a>
      </div>
    </footer>
  );
}
