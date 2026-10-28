"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { gallery, type GalleryItem } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Masaüstünde 3 kolon, her biri farklı hızda kayar (yPercent, kolon yüksekliğine göre):
 * asimetrik, "yerçekimsiz" bir akış. Mobilde kolonlar `contents` olup tek sütuna dökülür.
 */
const COLUMNS = [
  { speed: 6, className: "md:mt-28" },
  { speed: -10, className: "" },
  { speed: 3, className: "md:mt-52" },
];

const total = String(gallery.length).padStart(2, "0");

/** Fotoğraf gelene kadar gösterilen, bilinçli tasarlanmış yer tutucu. */
function Placeholder({ n }: { n: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-[repeating-linear-gradient(135deg,transparent_0_14px,rgb(255_255_255/0.025)_14px_15px)]">
      <div className="text-center">
        <p className="type-display text-[clamp(3.5rem,7vw,6rem)] text-steel">{n}</p>
        <p className="type-label mt-3 text-fog">Galeri fotosu {Number(n)}</p>
      </div>
      <span aria-hidden className="absolute top-4 left-4 size-4 border-t border-l border-fog/40" />
      <span aria-hidden className="absolute right-4 bottom-4 size-4 border-r border-b border-fog/40" />
    </div>
  );
}

function Tile({ item, index }: { item: GalleryItem; index: number }) {
  const n = String(index + 1).padStart(2, "0");

  return (
    <figure
      data-tile
      data-index={n}
      className="group relative overflow-hidden bg-graphite"
      style={{ aspectRatio: item.aspect, order: index }}
    >
      <div data-tile-media className="absolute inset-0 transition-[scale] duration-1000 ease-expo group-hover:scale-[1.06]">
        {item.src ? (
          // GALERİ FOTOSU — kaynaklar src/lib/site.ts → gallery dizisinde
          <Image
            src={item.src}
            alt={item.alt}
            fill
            sizes="(min-width: 768px) 33vw, 100vw"
            className="object-cover grayscale-[40%] transition-[filter] duration-700 group-hover:grayscale-0"
          />
        ) : (
          <Placeholder n={n} />
        )}
      </div>
      <figcaption className="type-label pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-void/80 to-transparent p-4 pt-10">
        <span className="text-neon">{n}</span>
        <span className="translate-y-2 text-chalk opacity-0 transition duration-500 ease-expo group-hover:translate-y-0 group-hover:opacity-100">
          {item.alt}
        </span>
      </figcaption>
    </figure>
  );
}

export function Gallery() {
  const root = useRef<HTMLElement>(null);
  const cursor = useRef<HTMLDivElement>(null);

  useGSAP(
    (_, contextSafe) => {
      if (!contextSafe) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(q("[data-gallery-line]"), {
          yPercent: 115,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: root.current, start: "top 75%", once: true },
        });

        // Kare açılışı: perde alttan yukarı açılır, fotoğraf büyükten yerine oturur.
        for (const tile of q("[data-tile]")) {
          gsap
            .timeline({ scrollTrigger: { trigger: tile, start: "top 92%", once: true } })
            .fromTo(
              tile,
              { clipPath: "inset(100% 0% 0% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3, ease: "expo.out" },
            )
            .from(tile.querySelector("[data-tile-media]"), { scale: 1.3, duration: 1.6, ease: "expo.out" }, 0);
        }
      });

      // Asimetrik scroll: kolonlar birbirine göre farklı hızlarda akar.
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        for (const column of q("[data-col]")) {
          const speed = Number(column.dataset.speed);
          gsap.fromTo(
            column,
            { yPercent: speed },
            {
              yPercent: -speed,
              ease: "none",
              scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
      });

      // İmleci takip eden sayaç halkası (yalnızca fareli cihazlar).
      mm.add("(hover: hover) and (pointer: fine)", () => {
        const section = root.current!;
        const ring = cursor.current!;
        const label = ring.querySelector("span")!;
        const tiles = q("[data-tile]") as HTMLElement[];

        gsap.set(ring, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 0 });
        const xTo = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3.out" });
        const yTo = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3.out" });

        const move = contextSafe((event: PointerEvent) => {
          xTo(event.clientX);
          yTo(event.clientY);
        });
        const enter = contextSafe((event: PointerEvent) => {
          label.textContent = `${(event.currentTarget as HTMLElement).dataset.index} / ${total}`;
          gsap.to(ring, { scale: 1, autoAlpha: 1, duration: 0.5, ease: "expo.out", overwrite: "auto" });
        });
        const leave = contextSafe(() => {
          gsap.to(ring, { scale: 0, autoAlpha: 0, duration: 0.35, ease: "power3.in", overwrite: "auto" });
        });

        section.addEventListener("pointermove", move);
        for (const tile of tiles) {
          tile.addEventListener("pointerenter", enter);
          tile.addEventListener("pointerleave", leave);
        }
        return () => {
          section.removeEventListener("pointermove", move);
          for (const tile of tiles) {
            tile.removeEventListener("pointerenter", enter);
            tile.removeEventListener("pointerleave", leave);
          }
        };
      });
    },
    { scope: root },
  );

  return (
    <section
      id="galeri"
      ref={root}
      aria-labelledby="galeri-baslik"
      className="relative px-4 pt-24 pb-32 md:px-8 md:pt-28 md:pb-44 xl:px-12"
    >
      <div className="mb-16 flex flex-wrap items-end justify-between gap-6 md:mb-24">
        <div>
          <p className="type-label text-neon">(03) — Galeri</p>
          <h2 id="galeri-baslik" className="type-display mt-6 text-[clamp(3.6rem,8.4vw,9rem)]">
            <span className="line-mask">
              <span data-gallery-line className="block">
                İçeriden
              </span>
            </span>
            <span className="line-mask">
              <span data-gallery-line className="block text-outline">
                kareler
              </span>
            </span>
          </h2>
        </div>
        <p className="type-label max-w-[16rem] text-fog">
          {total} kare
          <span className="hidden [@media(hover:hover)]:inline"> — imleci üzerlerinde gezdir.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-start md:gap-6">
        {COLUMNS.map((column, c) => (
          <div
            key={c}
            data-col
            data-speed={column.speed}
            className={cn("contents md:flex md:flex-col md:gap-6", column.className)}
          >
            {gallery.map((item, i) => (i % COLUMNS.length === c ? <Tile key={i} item={item} index={i} /> : null))}
          </div>
        ))}
      </div>

      <div
        ref={cursor}
        aria-hidden
        className="pointer-events-none invisible fixed top-0 left-0 z-40 grid size-24 place-items-center rounded-full border border-neon/70 bg-void/50 backdrop-blur-sm"
      >
        <span className="type-label text-chalk" />
      </div>
    </section>
  );
}
