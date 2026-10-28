"use client";

import Link from "next/link";
import { useRef } from "react";
import { MagneticButton } from "@/components/MagneticButton";
import { Stars } from "@/components/Stars";
import { gsap, revealDelay, SplitText, useGSAP } from "@/lib/gsap";
import { useGymClock } from "@/lib/schedule";
import { rig } from "@/lib/sceneRig";
import { hours, site } from "@/lib/site";

/** Ana sayfa girişi: sis, partiküller ve yerçekimsiz plakaların önünde "Sınırlarını Sen Belirle". */
export function Hero() {
  const root = useRef<HTMLElement>(null);
  const clock = useGymClock();
  const today = clock ? hours.find((h) => h.days.includes(clock.day)) : undefined;

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      gsap.set(q("[data-intro]"), { visibility: "visible", animation: "none" });
      const delay = revealDelay();

      // Sahne perde açılırken karanlıktan belirir (yumuşatma ParticleField'da).
      gsap.delayedCall(Math.max(delay - 0.6, 0), () => {
        rig.intro = 1;
      });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // 1. satır harf harf maskesinin altından yükselir, 2. satır buğudan netleşir.
        const title = SplitText.create(q("[data-hero-title]"), { type: "lines,chars", mask: "lines", aria: "none" });
        const sub = SplitText.create(q("[data-hero-sub]"), { type: "words", aria: "none" });

        gsap
          .timeline({ delay })
          .from(title.chars, { yPercent: 115, duration: 1.5, ease: "expo.out", stagger: 0.035 }, 0)
          .from(
            sub.words,
            { autoAlpha: 0, y: 26, filter: "blur(16px)", duration: 1.8, ease: "expo.out", stagger: 0.14 },
            0.35,
          )
          .from(q("[data-hero-fade]"), { autoAlpha: 0, y: 18, duration: 1.3, ease: "power3.out", stagger: 0.1 }, 0.75);

        // Scroll'da içerik geri çekilip söner.
        gsap.to(q("[data-hero-content]"), {
          yPercent: -14,
          autoAlpha: 0,
          ease: "power1.in",
          scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
        });
      });

      // Bar aşağıdan sahnenin ortasına gelir ("Barı yükle" bölümüne hazırlık).
      gsap.to(rig, {
        focus: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });

      return () => {
        rig.intro = 0;
        rig.focus = 0;
      };
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="hero"
      aria-labelledby="hero-baslik"
      className="relative h-svh min-h-[620px] overflow-hidden"
    >
      {/* Okunurluk: başlığın arkasında hafif gölge (3D sahne sabit katmanda, arkada) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_38%_at_50%_44%,rgb(0_0_0/0.6),transparent_75%)]"
      />

      <div
        data-hero-content
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 pb-10 text-center"
      >
        <p data-intro data-hero-fade className="type-label flex items-center gap-4 text-mist">
          <span aria-hidden className="neon h-px w-8" />
          Yıldırım · Bursa
          <span aria-hidden className="neon h-px w-8" />
        </p>

        <h1 id="hero-baslik" data-intro aria-label="Sınırlarını Sen Belirle" className="mt-8 md:mt-10">
          <span
            aria-hidden
            data-hero-title
            className="type-display block text-[clamp(3.25rem,7.6vw,7rem)] tracking-[0.05em]"
          >
            Sınırlarını
          </span>
          <span
            aria-hidden
            data-hero-sub
            className="type-serif block text-[clamp(3.5rem,8.2vw,7.5rem)] leading-[1.02] text-chalk"
          >
            <span className="text-accent [text-shadow:0_0_42px_rgb(204_0_0/0.5)]">Sen</span> Belirle
          </span>
        </h1>

        <p data-intro data-hero-fade className="type-body mt-8 max-w-[25rem] text-[15px] md:mt-10 md:text-base">
          Karanlığın içinde yalnızca sen, demir ve kararlılığın. Hafta içi gece yarısına kadar açığız.
        </p>

        <div
          data-intro
          data-hero-fade
          className="mt-9 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 md:mt-12"
        >
          {/* Üyelik formu ya da WhatsApp linki olursa href'i değiştir. */}
          <MagneticButton href="/iletisim">Bize Katıl</MagneticButton>
          <Link
            href="/hakkimizda"
            className="group type-label relative py-2 text-mist transition-colors duration-300 hover:text-chalk"
          >
            Hikâyemiz
            <span
              aria-hidden
              className="neon absolute right-[0.28em] bottom-0 left-0 h-px origin-left scale-x-0 transition-transform duration-700 ease-expo group-hover:scale-x-100"
            />
          </Link>
        </div>
      </div>

      {/* Alt bant: puan · kaydır işareti · bugünün saatleri */}
      <div
        data-intro
        data-hero-fade
        className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-w-[1400px] items-end justify-between gap-6 px-6 pb-7 md:px-10 md:pb-9"
      >
        <p className="flex items-center gap-3">
          <span className="type-display text-xl tabular-nums">{site.rating.score}</span>
          <Stars label={`5 üzerinden ${site.rating.score} puan`} />
          <span className="type-label hidden text-fog sm:inline">{site.rating.reviews} yorum</span>
        </p>
        <span aria-hidden className="hidden flex-col items-center gap-3 md:flex">
          <span className="type-label text-fog">Kaydır</span>
          <span className="relative h-10 w-px overflow-hidden bg-steel">
            <span className="absolute inset-0 bg-accent motion-safe:animate-scroll-cue" />
          </span>
        </span>
        <p className="type-label text-right text-fog">
          {today ? (
            <>
              Bugün{" "}
              <span className="text-chalk tabular-nums">
                {today.open}–{today.close}
              </span>
            </>
          ) : (
            "Haftanın 7 günü açık"
          )}
        </p>
      </div>
    </section>
  );
}
