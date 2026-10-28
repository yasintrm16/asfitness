"use client";

import { useRef } from "react";
import { Logo } from "@/components/Logo";
import { gsap, INTRO, isLateLoad, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { rig } from "@/lib/sceneRig";
import { site } from "@/lib/site";

const NAV = [
  { href: "#bilgi", label: "Saatler" },
  { href: "#galeri", label: "Galeri" },
  { href: "#iletisim", label: "İletişim" },
];

export function Header() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const [logo] = q("[data-logo]");
      const [curtain] = q("[data-curtain]");
      const intro = q("[data-intro]");

      // CSS'teki emniyet animasyonunu kapat, kontrol artık GSAP'te.
      gsap.set([...intro, curtain], { animation: "none" });
      gsap.set(intro, { visibility: "visible" });

      // Sayfa kaydıkça bar zemin kazanır; altından geçen başlıklarla çakışmasın.
      ScrollTrigger.create({
        start: 80,
        end: "max",
        onToggle: ({ isActive }) => root.current?.toggleAttribute("data-scrolled", isActive),
      });

      const mm = gsap.matchMedia();
      mm.add({ motion: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, (ctx) => {
        const { reduce } = ctx.conditions as { reduce: boolean };
        if (reduce || isLateLoad()) {
          gsap.to(curtain, { autoAlpha: 0, duration: 0.4 });
          rig.intro = 1;
          return;
        }

        // Logo ekranın ortasında doğar, sonra header'daki yerine uçar (FLIP).
        const box = logo.getBoundingClientRect();
        const dx = window.innerWidth / 2 - (box.left + box.width / 2);
        const dy = window.innerHeight / 2 - (box.top + box.height / 2);

        gsap.set(logo, { x: dx, y: dy, scale: 2.2 });
        gsap
          .timeline()
          .from(q("[data-logo-mark]"), { scale: 0, rotate: -120, duration: 1, ease: "expo.out" }, 0)
          .from(q("[data-logo-word]"), { x: -24, autoAlpha: 0, duration: 0.8, ease: "expo.out" }, 0.2)
          .to(logo, { x: 0, y: 0, scale: 1, duration: 1.2, ease: "expo.inOut" }, 0.6)
          .to(curtain, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, INTRO.curtain)
          // Perde yarıya geldiğinde 3D dambıl girişine başlar (Dumbbell → rig.intro).
          .set(rig, { intro: 1 }, INTRO.curtain + 0.35)
          .set(curtain, { display: "none" })
          .from(q("[data-nav] > *"), { y: -14, autoAlpha: 0, duration: 0.8, ease: "expo.out", stagger: 0.06 }, 1.4);
      });
    },
    { scope: root },
  );

  return (
    <header ref={root} className="group fixed inset-x-0 top-0 z-50">
      {/* Giriş perdesi: alt kenarında ince neon çizgiyle yukarı kalkar */}
      <div
        data-curtain
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-void after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-neon/70"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b from-void/85 to-transparent" />

      <div className="relative flex items-center justify-between border-b border-transparent px-4 py-4 transition-[background-color,border-color,backdrop-filter] duration-500 group-data-scrolled:border-steel/60 group-data-scrolled:bg-void/75 group-data-scrolled:backdrop-blur-md md:px-8 md:py-5 xl:px-12">
        <a href="#hero" data-intro data-logo aria-label={`${site.name} — başa dön`} className="relative">
          <Logo />
        </a>

        <nav data-nav data-intro aria-label="Bölümler" className="flex items-center gap-7">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="type-label hidden text-fog transition-colors hover:text-chalk md:inline"
            >
              {item.label}
            </a>
          ))}
          <a
            href={site.phone.href}
            className="type-label rounded-full border border-steel px-4 py-2.5 text-chalk transition-colors hover:border-neon hover:text-neon"
          >
            <span className="md:hidden">Ara</span>
            <span className="hidden md:inline">{site.phone.display}</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
