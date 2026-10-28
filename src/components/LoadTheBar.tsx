"use client";

import { useRef } from "react";
import { PLATES } from "@/components/three/Barbell";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { rig } from "@/lib/sceneRig";

const BAR_KG = 20;

/** Her adımda bir çift plaka daha takılır; son adımda bar kaldırılır. */
const STEPS = [
  { word: "Boş bar.", line: "Her şey burada başlar." },
  { word: "Isın.", line: "Ağırlık değil, alışkanlık kazanılır." },
  { word: "Yüklen.", line: "Bugün, dünden bir plaka fazla." },
  { word: "Zorla.", line: "Rahat bölgenin bittiği yer." },
  { word: "Kaldır.", line: "Sınırlarını sen belirle." },
];

// Scroll'un ilk %78'i plakaları takar, kalanının çoğu barı kaldırır.
const LOAD_END = 0.78;
const LIFT_START = 0.8;
const LIFT_END = 0.96;

/**
 * "Barı yükle" — ekrana sabitlenen bölüm. Kaydırdıkça 3D sahnedeki plakalar sırayla bara
 * takılır (GymScene → rig.load), sayaç 20 kg'dan 160 kg'a çıkar, en sonda bar kaldırılır.
 */
export function LoadTheBar() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const [counter] = q("[data-kg]");
      const steps = q("[data-step]");
      const ticks = q("[data-tick]");
      const clamp01 = gsap.utils.clamp(0, 1);
      const shown = { kg: BAR_KG };
      let target = BAR_KG;
      let current = -1;

      const show = (index: number) => {
        if (index === current) return;
        const down = index > current;
        current = index;
        steps.forEach((step, i) =>
          gsap.to(step, {
            autoAlpha: i === index ? 1 : 0,
            y: i === index ? 0 : down ? -28 : 28,
            filter: i === index ? "blur(0px)" : "blur(8px)",
            duration: 0.7,
            ease: "expo.out",
            overwrite: true,
          }),
        );
        ticks.forEach((tick, i) => tick.toggleAttribute("data-on", i <= index));
      };

      gsap.set(steps, { autoAlpha: 0 });
      show(0);

      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: ({ progress }) => {
          const load = clamp01(progress / LOAD_END) * PLATES.length;
          rig.load = load;
          rig.lift = clamp01((progress - LIFT_START) / (LIFT_END - LIFT_START));
          // Sayaç plaka bara oturduğu an artar (yoldaki plaka sayılmaz).
          const locked = Math.min(PLATES.length, Math.floor(load + 0.02));
          const kg = PLATES.slice(0, locked).reduce((sum, plate) => sum + plate.kg * 2, BAR_KG);
          if (kg !== target) {
            target = kg;
            gsap.to(shown, {
              kg,
              duration: 0.7,
              ease: "power3.out",
              overwrite: true,
              onUpdate: () => {
                counter.textContent = String(Math.round(shown.kg));
              },
            });
          }
          show(locked);
        },
      });

      return () => {
        rig.load = 0;
        rig.lift = 0;
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="yukle" aria-labelledby="yukle-baslik" className="relative h-[420vh]">
      <div className="sticky top-0 mx-auto flex h-svh max-w-[1400px] flex-col justify-between px-6 pt-28 pb-8 md:px-10 md:pt-32 md:pb-10">
        <div className="flex items-start justify-between gap-6">
          <p className="type-label flex items-center gap-4 text-mist">
            <span aria-hidden className="neon h-px w-8" />
            Barı yükle
          </p>
          <h2 id="yukle-baslik" className="sr-only">
            Barı yükle: 20 kilodan 160 kiloya
          </h2>
          <p className="type-label hidden items-center gap-3 text-fog md:flex">
            <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="6.5" y="3" width="11" height="18" rx="5.5" />
              <path d="M12 7v3" />
            </svg>
            Plakaların üzerine gel, tıkla
          </p>
        </div>

        <div className="grid items-end gap-10 md:grid-cols-12">
          <div className="relative h-36 md:col-span-6 md:h-44">
            {STEPS.map((step, i) => (
              <div key={step.word} data-step className="absolute inset-x-0 bottom-0">
                <p className="type-label text-fog">
                  Adım {String(i + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
                </p>
                <p className="type-serif mt-3 text-[clamp(2.75rem,5.6vw,5rem)] leading-none text-chalk">{step.word}</p>
                <p className="type-body mt-3 max-w-sm text-[15px]">{step.line}</p>
              </div>
            ))}
          </div>

          <div className="md:col-span-6 md:text-right">
            <p className="type-label text-fog">Toplam yük</p>
            <p className="type-display mt-3 text-[clamp(4rem,9vw,8rem)] leading-[0.85] tabular-nums">
              <span data-kg>{BAR_KG}</span>
              <span className="ml-3 text-[0.32em] text-accent">KG</span>
            </p>
            <div aria-hidden className="mt-6 flex gap-2 md:justify-end">
              {STEPS.map((step) => (
                <span
                  key={step.word}
                  data-tick
                  className="h-[3px] w-10 bg-steel transition-[background-color,box-shadow] duration-500 data-on:neon"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
