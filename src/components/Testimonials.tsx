"use client";

import { useRef } from "react";
import { MagneticButton } from "@/components/MagneticButton";
import { Stars } from "@/components/Stars";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { reviewsUrl, site, testimonials, type Testimonial } from "@/lib/site";
import { cn } from "@/lib/utils";

const KINETIC = ["Disiplin", "Güç", "Ter", "İrade", "Sabır", "Odak"];

/** Köşeleri kesik "sporcu kartı" silueti (sağ üst, sol alt). */
const CHAMFER = "[clip-path:polygon(0_0,calc(100%-30px)_0,100%_30px,100%_100%,30px_100%,0_calc(100%-30px))]";

function Card({ item, index, copy }: { item: Testimonial; index: number; copy?: boolean }) {
  const n = String(index + 1).padStart(2, "0");
  return (
    // mr (gap değil): iz iki eşit yarıdan oluşsun, -%50'de dikiş görünmesin.
    <li
      aria-hidden={copy || undefined}
      className={cn("mr-5 flex w-[min(84vw,25rem)] shrink-0 [perspective:900px] md:mr-7", copy && "motion-reduce:hidden")}
    >
      <figure
        data-card
        className={cn(
          "group relative flex w-full flex-col bg-white/10 p-px transition-colors duration-500 hover:bg-accent/70 [transform-style:preserve-3d]",
          CHAMFER,
        )}
      >
        <div className={cn("relative flex h-full flex-col overflow-hidden bg-carbon p-8 md:p-9", CHAMFER)}>
          {/* Doku: ince çapraz çizgiler + dev, silik sıra numarası */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.025)_0_1px,transparent_1px_11px)]"
          />
          <span
            aria-hidden
            className="type-display pointer-events-none absolute -right-2 -bottom-6 text-[9rem] leading-none text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/0.06)]"
          >
            {n}
          </span>
          {/* İmleci izleyen kırmızı parıltı */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--gx,50%)_var(--gy,0%),rgb(204_0_0/0.22),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
          <span aria-hidden className="neon absolute top-0 left-8 h-[3px] w-14 -skew-x-[30deg]" />

          <div className="relative flex items-center justify-between">
            <span className="type-label text-fog">
              <span className="type-display mr-2 text-base tracking-[0.06em] text-chalk">#{n}</span>Üye yorumu
            </span>
            <Stars />
          </div>

          <blockquote className="relative mt-8 grow text-[17px] leading-[1.65] font-light text-chalk/90 md:text-lg">
            “{item.quote}”
          </blockquote>

          <figcaption className="relative mt-10">
            <span className="type-display block text-2xl tracking-[0.04em] text-chalk">{item.name}</span>
            <span className="type-label mt-2 block text-[0.625rem] tracking-[0.22em] text-fog">{item.since}</span>
          </figcaption>
        </div>
      </figure>
    </li>
  );
}

/** Ağırlık plakası biçiminde puan rozeti: dış çemberde dönen yazı, ortada puan. */
function RatingPlate() {
  const ring = `Google puanı · ${site.rating.reviews} yorum · 5 üzerinden · `;
  return (
    <div className="relative grid size-40 shrink-0 place-items-center md:size-44">
      <svg data-ring aria-hidden viewBox="0 0 200 200" className="absolute inset-0 size-full">
        <defs>
          <path id="puan-cember" d="M100,100 m-82,0 a82,82 0 1,1 164,0 a82,82 0 1,1 -164,0" />
        </defs>
        <circle cx="100" cy="100" r="98" fill="none" stroke="rgb(255 255 255 / 0.12)" />
        <circle cx="100" cy="100" r="68" fill="none" stroke="rgb(204 0 0 / 0.6)" />
        <text className="fill-fog font-sans text-[11px] font-medium tracking-[0.32em] uppercase">
          <textPath href="#puan-cember" textLength="505" lengthAdjust="spacing">
            {ring}
          </textPath>
        </text>
      </svg>
      <div className="text-center">
        <p className="type-display text-5xl leading-none tabular-nums">{site.rating.score}</p>
        <Stars label={`5 üzerinden ${site.rating.score} puan`} className="mt-2" />
      </div>
    </div>
  );
}

/**
 * "Üyelerimiz Ne Diyor?" — arkada ters yönlerde akan dev kelimeler, önde sağdan sola
 * sonsuz kayan sporcu kartları. İmleç kartı 3D eğer; şerit üzerine gelince durur, hızlı
 * kaydırınca hızlanır. Arkadaki 3D sahne bölümün başında siyaha kararır.
 * site.ts'te yorum yoksa kartların yerine Google yorumlarına giden bir davet görünür.
 */
export function Testimonials() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    (_, contextSafe) => {
      if (!contextSafe) return;
      const q = gsap.utils.selector(root);

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(q("[data-reveal]"), {
          y: 36,
          autoAlpha: 0,
          duration: 1.3,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: "top 65%", once: true },
        });
        gsap.to(q("[data-ring]"), { rotate: 360, duration: 40, ease: "none", repeat: -1, transformOrigin: "50% 50%" });

        // Kartlar: sağdan sola sonsuz akış (iz iki kopya; yarısı kadar kayınca başa sarar).
        // Henüz yorum eklenmediyse şerit yok; yalnızca arka plan kelimeleri akar.
        const [marquee] = q("[data-marquee]") as HTMLElement[];
        const [track] = q("[data-track]") as HTMLElement[];
        const loop = track
          ? gsap.to(track, { xPercent: -50, ease: "none", repeat: -1, duration: track.scrollWidth / 2 / 45 })
          : null;

        // Arka plan kelimeleri: biri sola biri sağa.
        const words = (q("[data-kinetic]") as HTMLElement[]).map((row) => {
          const dir = Number(row.dataset.kinetic);
          return gsap.fromTo(
            row,
            { xPercent: dir < 0 ? 0 : -50 },
            { xPercent: dir < 0 ? -50 : 0, ease: "none", repeat: -1, duration: 38 },
          );
        });

        const tweens = loop ? [loop, ...words] : words;
        let hovering = false;
        const slow = contextSafe(() => {
          hovering = true;
          if (loop) gsap.to(loop, { timeScale: 0, duration: 1, ease: "power3.out", overwrite: true });
        });
        const resume = contextSafe(() => {
          hovering = false;
          if (loop) gsap.to(loop, { timeScale: 1, duration: 1.2, ease: "power2.in", overwrite: true });
        });
        marquee?.addEventListener("pointerenter", slow);
        marquee?.addEventListener("pointerleave", resume);

        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => tweens.forEach((tween) => (self.isActive ? tween.play() : tween.pause())),
          onUpdate: (self) => {
            const boost = gsap.utils.clamp(1, 5, 1 + Math.abs(self.getVelocity()) / 350);
            for (const tween of hovering ? words : tweens) {
              gsap.to(tween, { timeScale: boost, duration: 0.3, ease: "power2.out", overwrite: true });
              gsap.to(tween, { timeScale: 1, duration: 1.4, delay: 0.3, ease: "power2.inOut" });
            }
          },
        });

        return () => {
          marquee?.removeEventListener("pointerenter", slow);
          marquee?.removeEventListener("pointerleave", resume);
        };
      });

      // Kart eğimi + parıltı konumu (yalnızca fareli cihazlar).
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const cleanups = (q("[data-card]") as HTMLElement[]).map((card) => {
          const rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
          const ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
          const lift = gsap.quickTo(card, "z", { duration: 0.6, ease: "power3.out" });
          const move = contextSafe((event: PointerEvent) => {
            const box = card.getBoundingClientRect();
            const x = (event.clientX - box.left) / box.width;
            const y = (event.clientY - box.top) / box.height;
            rx((0.5 - y) * 14);
            ry((x - 0.5) * 16);
            lift(30);
            card.style.setProperty("--gx", `${x * 100}%`);
            card.style.setProperty("--gy", `${y * 100}%`);
          });
          const reset = contextSafe(() => {
            rx(0);
            ry(0);
            lift(0);
          });
          card.addEventListener("pointermove", move);
          card.addEventListener("pointerleave", reset);
          return () => {
            card.removeEventListener("pointermove", move);
            card.removeEventListener("pointerleave", reset);
          };
        });
        return () => cleanups.forEach((cleanup) => cleanup());
      });
    },
    { scope: root },
  );

  const kinetic = [...KINETIC, ...KINETIC];

  return (
    <section
      ref={root}
      id="yorumlar"
      aria-labelledby="yorumlar-baslik"
      className="relative overflow-hidden pt-40 pb-32 md:pt-56 md:pb-44"
    >
      {/* 3D sahneden zifiri siyaha geçiş */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-transparent via-void/90 via-35% to-void"
      />

      {/* Kinetik tipografi: dev, kontur kelimeler ters yönlerde akar */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[44%] -rotate-[4deg] select-none">
        {[-1, 1].map((dir) => (
          <div
            key={dir}
            data-kinetic={dir}
            className="type-display flex w-max text-[clamp(5rem,13vw,12rem)] leading-[1.05] whitespace-nowrap"
          >
            {[0, 1].map((half) => (
              <span key={half} className="flex">
                {kinetic.map((word, i) => (
                  <span
                    key={`${half}-${i}`}
                    className={cn(
                      "px-[0.25em]",
                      (i + (dir > 0 ? 1 : 0)) % 3 === 0
                        ? "text-accent/[0.12]"
                        : "text-transparent [-webkit-text-stroke:1px_rgb(255_255_255/0.07)]",
                    )}
                  >
                    {word}
                  </span>
                ))}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="relative mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-10 px-6 md:px-10">
        <div>
          <p data-reveal className="type-label flex items-center gap-4 text-mist">
            <span aria-hidden className="neon h-px w-8" />
            Yorumlar
          </p>
          <h2 data-reveal id="yorumlar-baslik" className="mt-6 text-[clamp(2.6rem,5.4vw,4.75rem)] leading-[0.95]">
            <span className="type-display block tracking-[0.03em]">Üyelerimiz</span>
            <span className="type-serif block text-[1.08em] text-accent">Ne Diyor?</span>
          </h2>
        </div>
        <div data-reveal>
          <RatingPlate />
        </div>
      </div>

      {testimonials.length > 0 ? (
        <div data-marquee className="fade-x relative mt-16 motion-reduce:overflow-x-auto md:mt-24">
          <ul data-track className="flex w-max items-stretch py-6">
            {testimonials.map((item, i) => (
              <Card key={item.name} item={item} index={i} />
            ))}
            {testimonials.map((item, i) => (
              <Card key={`${item.name}-kopya`} item={item} index={i} copy />
            ))}
          </ul>
        </div>
      ) : (
        // Gerçek yorumlar site.ts'e eklenene kadar: sözü Google'daki yorumlara bırak.
        <div
          data-reveal
          className="relative mx-auto mt-16 flex max-w-[1400px] flex-wrap items-center justify-between gap-10 px-6 md:mt-28 md:px-10"
        >
          <p className="max-w-xl text-[clamp(1.5rem,2.4vw,2.1rem)] leading-snug font-light text-chalk">
            Google&apos;da {site.rating.reviews} yorum, {site.rating.score} puan.{" "}
            <span className="type-serif text-accent">Sözü onlara bırakıyoruz.</span>
          </p>
          <MagneticButton href={reviewsUrl} external>
            Yorumları oku
          </MagneticButton>
        </div>
      )}
    </section>
  );
}
