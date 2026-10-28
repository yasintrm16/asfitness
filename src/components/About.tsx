"use client";

import { useRef } from "react";
import { gsap, revealDelay, SplitText, useGSAP } from "@/lib/gsap";
import { about, hours, site } from "@/lib/site";

/** Bölüm etiketi: italik serif numara + geniş aralıklı ad. */
function Eyebrow({ n, children }: { n: string; children: string }) {
  return (
    <p className="type-label flex items-baseline gap-4 text-fog">
      <span className="type-serif text-xl tracking-normal text-accent">{n}</span>
      {children}
    </p>
  );
}

/**
 * Hakkımızda içeriği — arkadaki kurucu afişinin (FounderBackdrop) önünde akar.
 * Vizyon satır satır maskesinden yükselir, kurucu mesajı scroll ile kelime kelime aydınlanır.
 */
export function About() {
  const root = useRef<HTMLDivElement>(null);
  const founder = about.founder.name;

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      gsap.set(q("[data-intro]"), { visibility: "visible", animation: "none" });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Afiş başlığı
        const title = SplitText.create(q("[data-about-title]"), { type: "lines,chars", mask: "lines", aria: "none" });
        const sub = SplitText.create(q("[data-about-sub]"), { type: "chars", aria: "none" });
        gsap
          .timeline({ delay: revealDelay() })
          .from(title.chars, { yPercent: 115, duration: 1.5, ease: "expo.out", stagger: 0.035 }, 0)
          .from(sub.chars, { autoAlpha: 0, filter: "blur(14px)", x: 12, duration: 1.6, ease: "expo.out", stagger: 0.05 }, 0.4)
          .from(q("[data-about-fade]"), { autoAlpha: 0, y: 18, duration: 1.3, ease: "power3.out", stagger: 0.12 }, 0.7);

        // Vizyon: satırlar maskelerinin altından sırayla yükselir. Ekran boyutu değişince yeniden bölünür.
        SplitText.create(q("[data-reveal-lines]"), {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 105,
              duration: 1.4,
              ease: "expo.out",
              stagger: 0.12,
              scrollTrigger: { trigger: self.elements[0], start: "top 80%", once: true },
            }),
        });

        // Kurucu mesajı: okudukça kelime kelime aydınlanır (scroll'a bağlı).
        SplitText.create(q("[data-reveal-words]"), {
          type: "words",
          autoSplit: true,
          onSplit: (self) =>
            gsap.fromTo(
              self.words,
              { opacity: 0.14 },
              {
                opacity: 1,
                ease: "none",
                stagger: 0.1,
                scrollTrigger: { trigger: self.elements[0], start: "top 78%", end: "bottom 50%", scrub: true },
              },
            ),
        });

        for (const block of q("[data-reveal]")) {
          gsap.from(block, {
            y: 34,
            autoAlpha: 0,
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: { trigger: block, start: "top 88%", once: true },
          });
        }

        for (const rule of q("[data-rule]")) {
          gsap.from(rule, {
            scaleX: 0,
            duration: 1.6,
            ease: "expo.inOut",
            scrollTrigger: { trigger: rule, start: "top 92%", once: true },
          });
        }
      });
    },
    { scope: root },
  );

  return (
    <div ref={root}>
      {/* ── Afiş ─────────────────────────────────────────────── */}
      <section
        aria-labelledby="hakkimizda-baslik"
        className="mx-auto flex min-h-svh max-w-[1400px] flex-col justify-between px-6 pt-32 pb-8 md:px-10 md:pt-40 md:pb-10"
      >
        <p data-intro data-about-fade className="type-label flex items-center gap-4 text-mist">
          <span aria-hidden className="neon h-px w-8" />
          <span>
            <span lang="en">{site.name}</span> sunar
          </span>
        </p>

        <div className="mt-24">
          <h1
            id="hakkimizda-baslik"
            data-intro
            aria-label="Disiplinin adresi."
            className="text-[clamp(3rem,8.2vw,7.5rem)] leading-[0.95]"
          >
            <span aria-hidden data-about-title className="type-display block tracking-[0.03em]">
              Disiplinin
            </span>
            <span aria-hidden data-about-sub className="type-serif block text-[1.08em] text-accent">
              adresi.
            </span>
          </h1>
          <p data-intro data-about-fade className="type-body mt-8 max-w-md text-[15px] md:text-base">
            Yavuz Selim&apos;de, 3. Alpay Sokak&apos;ta bir kapı. Arkasında ter, sessizlik ve her gün biraz daha
            güçlenen insanlar.
          </p>

          {/* Afişin alt künyesi (billing block) — sıkışık, uzun harfler */}
          <p
            data-intro
            data-about-fade
            className="mt-16 max-w-3xl border-t border-white/10 pt-5 font-display text-[0.7rem] leading-[1.55] tracking-[0.14em] text-fog uppercase [font-variation-settings:'wdth'_62] md:mt-24"
          >
            <span lang="en" className="text-chalk">
              {site.name}
            </span>{" "}
            sunar · {site.address.street} · Yıldırım / Bursa ·{" "}
            {hours.map((h) => `${h.label} ${h.open}–${h.close}`).join(" · ")} · Google puanı{" "}
            <span className="text-chalk">{site.rating.score}</span>
          </p>
        </div>
      </section>

      {/* ── Vizyon ───────────────────────────────────────────── */}
      <section aria-labelledby="vizyon-baslik" className="mx-auto max-w-[1400px] px-6 py-32 md:px-10 md:py-48">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3 lg:pt-3">
            <Eyebrow n="01">Vizyon</Eyebrow>
          </div>
          <div className="lg:col-span-8">
            <h2 id="vizyon-baslik" className="sr-only">
              Vizyonumuz
            </h2>
            <p data-reveal-lines className="text-[clamp(1.55rem,2.8vw,2.5rem)] leading-[1.35] font-light text-chalk">
              {about.vision}
            </p>

            <div data-rule className="mt-20 h-px origin-left bg-white/10 md:mt-28" />
            <ul className="mt-10 grid gap-12 md:grid-cols-3 md:gap-10">
              {about.values.map((value, i) => (
                <li key={value.title} data-reveal>
                  <p className="type-label text-fog">0{i + 1}</p>
                  <h3 className="type-display mt-4 text-2xl tracking-[0.04em]">{value.title}</h3>
                  <p className="type-body mt-3 text-[15px]">{value.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Kurucudan ────────────────────────────────────────── */}
      <section aria-labelledby="kurucu-baslik" className="mx-auto max-w-[1400px] px-6 pb-32 md:px-10 md:pb-48">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-3 lg:pt-4">
            <Eyebrow n="02">Kurucudan</Eyebrow>
          </div>
          <figure className="lg:col-span-8">
            <h2 id="kurucu-baslik" className="sr-only">
              Kurucu mesajı
            </h2>
            <blockquote>
              <p data-reveal-words className="type-serif text-[clamp(1.7rem,3.1vw,2.8rem)] leading-[1.3] text-chalk">
                “{about.founderMessage}”
              </p>
            </blockquote>
            <figcaption data-reveal className="mt-12 flex items-center gap-5">
              <span aria-hidden className="neon h-px w-12" />
              <span>
                <span className="type-serif block text-2xl text-chalk">{founder ?? about.founder.title}</span>
                <span className="type-label mt-1 block text-fog">
                  {founder && `${about.founder.title} · `}
                  <span lang="en">{site.name}</span>
                </span>
              </span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Künye ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1400px] px-6 pb-36 md:px-10 md:pb-44">
        <dl className="grid border-y border-white/10 sm:grid-cols-3">
          {[
            { label: "Google puanı", value: site.rating.score, note: `${site.rating.reviews} yorum` },
            { label: "Haftanın her günü", value: "7 / 7", note: "Pazar dahil açık" },
            { label: "Hafta içi kapanış", value: "00:00", note: "Gece yarısına kadar" },
          ].map((fact) => (
            <div
              key={fact.label}
              data-reveal
              className="border-white/10 py-10 not-first:border-t sm:px-8 sm:not-first:border-t-0 sm:not-first:border-l sm:first:pl-0"
            >
              <dt className="type-label text-fog">{fact.label}</dt>
              <dd className="type-display mt-5 text-5xl tabular-nums md:text-6xl">{fact.value}</dd>
              <dd className="type-body mt-2 text-sm">{fact.note}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
