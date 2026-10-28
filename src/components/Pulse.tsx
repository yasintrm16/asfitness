"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { beat, rig } from "@/lib/sceneRig";
import { hours, site } from "@/lib/site";

const BPM_REST = 72;
const BPM_PEAK = 172;

const FACTS = [
  { value: hours[0].close, label: "Hafta içi kapanış", note: "Gece yarısına kadar" },
  { value: "7/7", label: "Haftanın her günü", note: "Pazar dahil açık" },
  { value: site.rating.score, label: "Google puanı", note: `${site.rating.reviews} yorum` },
];

/**
 * "Nabız" — ekrana sabitlenen bölüm. Kalp atışını bu bölüm üretir (beat): 3D sahnede EKG
 * çizgisi ekranı keser, sis her atışta kızarır. Kaydırdıkça nabız 72'den 172'ye çıkar.
 */
export function Pulse() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const [counter] = q("[data-bpm]");
      const [heart] = q("[data-heart]");
      const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const clamp01 = gsap.utils.clamp(0, 1);
      let target = BPM_REST;
      let shown = BPM_REST;

      // Ritim: nabız hedefe yumuşakça yaklaşır, faz ilerler; R dalgasında darbe 1'e sıçrayıp söner.
      const tick = (_time: number, deltaTime: number) => {
        const dt = Math.min(deltaTime, 100) / 1000;
        rig.bpm += (target - rig.bpm) * (1 - Math.exp(-dt * 3));
        beat.phase += dt * (rig.bpm / 60) * (calm ? 0.15 : 1);
        const sinceR = beat.phase - 0.25 - Math.floor(beat.phase - 0.25);
        beat.kick = Math.exp(-sinceR * 7);
        if (!calm) heart.style.transform = `scale(${1 + beat.kick * 0.22})`;
        const bpm = Math.round(rig.bpm);
        if (bpm !== shown) {
          shown = bpm;
          counter.textContent = String(bpm);
        }
      };

      // Görünürlük: bölüm ekrana girerken belirir, çıkarken söner (EKG ve sis nabzı buna bağlı).
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: ({ isActive }) => {
          if (isActive) gsap.ticker.add(tick);
          else {
            gsap.ticker.remove(tick);
            beat.kick = 0;
          }
        },
        onUpdate: (self) => {
          const vh = window.innerHeight;
          const travelled = self.scroll() - self.start;
          const remaining = self.end - self.scroll();
          rig.pulse = clamp01((travelled - vh * 0.1) / (vh * 0.7)) * clamp01((remaining - vh * 0.1) / (vh * 0.7));
        },
      });

      ScrollTrigger.create({
        trigger: root.current,
        start: "top 40%",
        end: "bottom bottom",
        onUpdate: ({ progress }) => {
          target = BPM_REST + (BPM_PEAK - BPM_REST) * progress;
        },
      });

      return () => {
        gsap.ticker.remove(tick);
        rig.pulse = 0;
        rig.bpm = BPM_REST;
        beat.kick = 0;
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="nabiz" aria-labelledby="nabiz-baslik" className="relative h-[260vh]">
      <div className="sticky top-0 mx-auto flex h-svh max-w-[1400px] flex-col justify-between px-6 pt-28 pb-8 md:px-10 md:pt-32 md:pb-10">
        <div>
          <div className="flex items-start justify-between gap-6">
            <p className="type-label flex items-center gap-4 text-mist">
              <span aria-hidden className="neon h-px w-8" />
              Nabız
            </p>
            <p className="type-label flex items-center gap-3 text-fog">
              <span aria-hidden className="neon size-1.5 rounded-full motion-safe:animate-blink" />
              Canlı ritim
            </p>
          </div>
          <h2 id="nabiz-baslik" className="mt-6 text-[clamp(2.6rem,5.6vw,5.25rem)] leading-[0.95] md:mt-8">
            <span className="type-display block tracking-[0.03em]">Kalbin burada</span>
            <span className="type-serif block text-[1.08em] text-accent">hızlanır.</span>
          </h2>
        </div>

        {/* Orta boşluk: 3D EKG çizgisi buradan geçer. */}

        <div>
          <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
            <p className="type-body max-w-xs text-[15px]">
              Kaydırdıkça nabzın yükselir — tıpkı son setteki gibi. Burada her tekrar sayılır.
            </p>
            <p className="flex items-center gap-4 md:gap-6">
              <svg
                data-heart
                aria-hidden
                viewBox="0 0 24 24"
                className="size-8 text-accent drop-shadow-[0_0_14px_rgb(204_0_0/0.8)] md:size-11"
                fill="currentColor"
              >
                <path d="M12 21s-7.5-4.6-9.6-9.4C.9 8 3.1 4 6.9 4c2.2 0 3.7 1.2 5.1 3 1.4-1.8 2.9-3 5.1-3 3.8 0 6 4 4.5 7.6C19.5 16.4 12 21 12 21Z" />
              </svg>
              <span className="type-display text-[clamp(4.25rem,9vw,8.5rem)] leading-[0.8] tabular-nums">
                <span data-bpm>{BPM_REST}</span>
                <span className="ml-3 text-[0.28em] text-accent">BPM</span>
              </span>
            </p>
          </div>

          <dl className="mt-8 grid grid-cols-3 border-t border-white/10 md:mt-10">
            {FACTS.map((fact) => (
              <div key={fact.label} className="border-white/10 pt-5 pr-3 not-first:border-l not-first:pl-4 md:pt-6 md:not-first:pl-8">
                <dt className="type-label text-[0.625rem] text-fog md:text-[0.6875rem]">{fact.label}</dt>
                <dd className="type-display mt-3 text-3xl tabular-nums md:text-5xl">{fact.value}</dd>
                <dd className="type-body mt-1 hidden text-sm sm:block">{fact.note}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
