"use client";

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { GEAR_COUNT, GEAR_END, rig } from "@/lib/sceneRig";

/** 3D sahnedeki sırayla (three/Gear.tsx): kettlebell, dambıl, lastik. */
const ITEMS = [
  {
    name: "Kettlebell",
    kicker: "Fonksiyonel güç",
    line: "Tek tutuş, bütün vücut. Swing'de kalça, kavrama ve nefes aynı anda çalışır.",
    moves: ["Swing", "Goblet squat", "Clean & press"],
  },
  {
    name: "Dambıl",
    kicker: "Serbest ağırlık",
    line: "Her kol kendi yükünü taşır. Zayıf taraf saklanamaz, güç dengelenir.",
    moves: ["Press", "Row", "Lunge"],
  },
  {
    name: "Lastik",
    kicker: "Patlayıcı kuvvet",
    line: "Yerden kaldır, devir, tekrar et. Bacaktan sırta tek hamlede güç.",
    moves: ["Çevirme", "Sıçrama", "Kondisyon"],
  },
];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "Ekipman" — ekrana sabitlenen bölüm. Girerken bar yukarı süzülüp sise karışır; hero'da
 * köşelerde süzülen kettlebell, dambıl ve lastik scroll'la sırayla sahneye gelir (rig.gear).
 */
export function Equipment() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const items = q("[data-gear-item]");
      const ticks = q("[data-tick]");
      const [index] = q("[data-gear-index]");
      let current = -1;

      const show = (next: number) => {
        if (next === current) return;
        const down = next > current;
        current = next;
        items.forEach((item, i) =>
          gsap.to(item, {
            autoAlpha: i === next ? 1 : 0,
            y: i === next ? 0 : down ? -36 : 36,
            filter: i === next ? "blur(0px)" : "blur(10px)",
            duration: 0.8,
            ease: "expo.out",
            overwrite: true,
          }),
        );
        ticks.forEach((tick, i) => tick.toggleAttribute("data-on", i <= next));
        index.textContent = pad(next + 1);
      };

      gsap.set(items, { autoAlpha: 0 });
      show(0);

      // Bar sahneyi boşaltır.
      gsap.to(rig, {
        exit: 1,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "top 25%", scrub: true },
      });

      // İlk parça bölüm sabitlenirken oturur. Metin, iki parça yolun yarısındayken değişir.
      ScrollTrigger.create({
        trigger: root.current,
        start: "top 60%",
        end: "bottom bottom",
        onUpdate: ({ progress }) => {
          rig.gear = progress * GEAR_END;
          show(gsap.utils.clamp(0, GEAR_COUNT - 1, Math.floor(rig.gear - 0.22)));
        },
      });

      return () => {
        rig.exit = 0;
        rig.gear = 0;
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="ekipman" aria-labelledby="ekipman-baslik" className="relative h-[420vh]">
      <div className="sticky top-0 mx-auto flex h-svh max-w-[1400px] flex-col justify-between px-6 pt-28 pb-8 md:px-10 md:pt-32 md:pb-10">
        <div className="flex items-start justify-between gap-6">
          <p className="type-label flex items-center gap-4 text-mist">
            <span aria-hidden className="neon h-px w-8" />
            Ekipman
          </p>
          <h2 id="ekipman-baslik" className="sr-only">
            Ekipman: kettlebell, dambıl ve lastik
          </h2>
          <p className="type-label hidden items-center gap-3 text-fog md:flex">
            <svg aria-hidden viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="6.5" y="3" width="11" height="18" rx="5.5" />
              <path d="M12 7v3" />
            </svg>
            Üzerine gel, tıkla
          </p>
        </div>

        {/* Metin solda (dikey ekranda üstte); 3D parça sağda (dikey ekranda altta). */}
        <div className="relative -mt-4 h-[19rem] md:mt-0 md:h-[25rem] md:w-5/12">
          {ITEMS.map((item, i) => (
            <div key={item.name} data-gear-item className="absolute inset-x-0 top-0 md:top-auto md:bottom-0">
              <p className="type-label flex items-baseline gap-4 text-fog">
                <span className="type-serif text-xl tracking-normal text-accent">{pad(i + 1)}</span>
                {item.kicker}
              </p>
              <p className="type-display mt-4 text-[clamp(3.25rem,6.4vw,6.25rem)] leading-[0.85] tracking-[0.02em]">
                {item.name}
              </p>
              <p className="type-body mt-5 max-w-sm text-[15px]">{item.line}</p>
              <ul className="mt-6 flex flex-wrap gap-2">
                {item.moves.map((move) => (
                  <li
                    key={move}
                    className="type-label -skew-x-12 border border-white/10 bg-carbon/60 px-4 py-2 text-[0.625rem] text-mist"
                  >
                    <span className="block skew-x-12">{move}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex items-end justify-between gap-6">
          <p className="type-display flex items-baseline gap-2 tabular-nums">
            <span data-gear-index className="text-5xl md:text-6xl">
              01
            </span>
            <span className="text-2xl text-fog">/ {pad(ITEMS.length)}</span>
          </p>
          <div aria-hidden className="flex gap-2">
            {ITEMS.map((item) => (
              <span
                key={item.name}
                data-tick
                className="h-[3px] w-10 bg-steel transition-[background-color,box-shadow] duration-500 data-on:neon md:w-14"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
