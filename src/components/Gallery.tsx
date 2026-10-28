"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { MagneticButton } from "@/components/MagneticButton";
import { gsap, revealDelay, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { directionsUrl, gallery, galleryDetails, type GalleryItem } from "@/lib/site";
import { cn } from "@/lib/utils";

/*
 * Asimetrik dizilim (masaüstü, 12 kolon). Kareler ikişerli satırlar kurar: geniş + dar, sonra
 * dar + geniş; dar olan aşağı kaydırılır. depth: scroll'da ne kadar hızlı yukarı kaydığı —
 * büyük kareler yavaş (uzakta), küçük kareler hızlı (yakında). Galeri uzadıkça desen tekrar eder;
 * dar kutulara dikey, geniş kutulara yatay fotoğraf yakışır (site.ts'teki sıra buna göre).
 */
const FEATURE_LAYOUT = [
  { className: "md:col-span-8 md:col-start-1", depth: 0.2 },
  { className: "md:col-span-4 md:col-start-9 md:mt-[24vh]", depth: 0.55 },
  { className: "md:col-span-4 md:col-start-1 md:mt-[30vh]", depth: 0.5 },
  { className: "md:col-span-8 md:col-start-5 md:mt-[12vh]", depth: 0.22 },
];

/*
 * Detay kareleri: üç sütunlu, basamaklı ızgara. Her sütun kendi yüksekliğinde başlar
 * (translate: satırları itmeden kaydırır) ve kendi hızında kayar.
 */
const STRIP_LAYOUT = [
  { className: "md:translate-y-0", depth: 0.5 },
  { className: "md:translate-y-[14vh]", depth: 0.85 },
  { className: "md:translate-y-[5vh]", depth: 0.65 },
];

/** Hover: kare hafifçe büyür, üstüne çok hafif kan kırmızısı bir ton ve iç ışıma gelir. */
export function Media({ item, sizes }: { item: GalleryItem; sizes: string }) {
  return (
    <div className="group relative overflow-hidden bg-carbon" style={{ aspectRatio: `${item.width} / ${item.height}` }}>
      <div data-inner className="absolute inset-0 scale-[1.14]">
        <div className="absolute inset-0 transition-transform duration-[1400ms] ease-expo group-hover:scale-[1.07]">
          {/* Kaynaklar zaten küçük JPEG: yeniden sıkıştırıp kaliteyi düşürmemek için olduğu gibi sunulur. */}
          <Image
            src={encodeURI(item.src)}
            alt={item.alt}
            fill
            unoptimized
            sizes={sizes}
            className="object-cover brightness-[0.88] grayscale-[25%] transition-[filter] duration-700 group-hover:brightness-100 group-hover:grayscale-0"
          />
        </div>
      </div>
      <span
        aria-hidden
        className="absolute inset-0 bg-accent opacity-0 mix-blend-multiply transition-opacity duration-700 ease-expo group-hover:opacity-30"
      />
      <span
        aria-hidden
        className="absolute inset-0 opacity-0 shadow-[inset_0_0_90px_rgb(204_0_0/0.4)] transition-opacity duration-700 group-hover:opacity-100"
      />
    </div>
  );
}

function Detail({ item, index, depth, className }: { item: GalleryItem; index: number; depth: number; className?: string }) {
  return (
    <figure className={cn("relative", className)}>
      <div data-depth={depth} className="md:shadow-[0_40px_80px_-30px_rgb(0_0_0/0.95)]">
        <div data-frame>
          <Media item={item} sizes="(min-width: 768px) 30vw, 50vw" />
        </div>
        <figcaption className="mt-4 flex items-baseline gap-3">
          <span className="type-serif text-lg text-accent">{String(index).padStart(2, "0")}</span>
          <span className="type-label text-[0.625rem] text-fog">{item.alt}</span>
        </figcaption>
      </div>
    </figure>
  );
}

export function Gallery() {
  const root = useRef<HTMLElement>(null);
  const total = String(gallery.length + galleryDetails.length).padStart(2, "0");

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      gsap.set(q("[data-intro]"), { visibility: "visible", animation: "none" });
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const title = SplitText.create(q("[data-gallery-title]"), { type: "lines,chars", mask: "lines", aria: "none" });
        const sub = SplitText.create(q("[data-gallery-sub]"), { type: "chars", aria: "none" });
        gsap
          .timeline({ delay: revealDelay() })
          .from(title.chars, { yPercent: 115, duration: 1.5, ease: "expo.out", stagger: 0.04 }, 0)
          .from(sub.chars, { autoAlpha: 0, filter: "blur(14px)", x: 12, duration: 1.6, ease: "expo.out", stagger: 0.05 }, 0.35)
          .from(q("[data-gallery-fade]"), { autoAlpha: 0, y: 18, duration: 1.3, ease: "power3.out", stagger: 0.1 }, 0.6);

        // Kare açılışı: perde alttan yukarı açılır, fotoğraf büyükten yerine oturur.
        // Tetikleyici ayrı kurulur: timeline'a gömülü tetikleyiciler sayfa geçişinde refresh döngüsünü bozabiliyor.
        for (const frame of q("[data-frame]")) {
          const reveal = gsap
            .timeline({ paused: true })
            .fromTo(
              frame,
              { clipPath: "inset(100% 0% 0% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.out" },
            )
            .from(frame.querySelector("img"), { scale: 1.35, duration: 1.9, ease: "expo.out" }, 0);
          ScrollTrigger.create({ trigger: frame, start: "top 92%", once: true, onEnter: () => reveal.play() });
        }

        // Çerçevenin içinde fotoğraf ters yöne kayar: pencereden bakıyormuş gibi derinlik.
        for (const inner of q("[data-inner]")) {
          gsap.fromTo(
            inner,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: { trigger: inner.parentElement, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        }
      });

      // Asimetrik parallax: her kare kendi hızında yukarı kayar. Tetikleyici sabit dış kutu, hareket eden iç kutu.
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        for (const layer of q("[data-depth]")) {
          const depth = Number(layer.dataset.depth);
          if (!depth) continue;
          const travel = () => window.innerHeight * 0.22 * depth;
          gsap.fromTo(
            layer,
            { y: travel },
            {
              y: () => -travel(),
              ease: "none",
              scrollTrigger: {
                trigger: layer.parentElement,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
                invalidateOnRefresh: true,
              },
            },
          );
        }
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="galeri-baslik"
      className="mx-auto max-w-[1400px] px-6 pt-40 pb-32 md:px-10 md:pt-52 md:pb-48"
    >
      <div className="flex flex-wrap items-end justify-between gap-10">
        <div>
          <p data-intro data-gallery-fade className="type-label flex items-center gap-4 text-mist">
            <span aria-hidden className="neon h-px w-8" />
            Galeri · {total} kare
          </p>
          <h1
            id="galeri-baslik"
            data-intro
            aria-label="Salondan kareler."
            className="mt-6 text-[clamp(2.8rem,6.6vw,6rem)] leading-[0.95]"
          >
            <span aria-hidden data-gallery-title className="type-display block tracking-[0.03em]">
              Salondan
            </span>
            <span aria-hidden data-gallery-sub className="type-serif block text-[1.08em] text-accent">
              kareler.
            </span>
          </h1>
        </div>
        <p data-intro data-gallery-fade className="type-body max-w-xs text-[15px]">
          Demirin sesi, kırmızı ışık, gece yarısı setleri. Aşağı indikçe salon seninle birlikte nefes alır.
        </p>
      </div>

      <div className="mt-24 md:mt-36">
        <div className="grid grid-cols-1 gap-y-20 md:grid-cols-12 md:gap-x-8 md:gap-y-0">
          {gallery.map((item, i) => {
            const layout = FEATURE_LAYOUT[i % FEATURE_LAYOUT.length];
            // İkişerli satırlar: (0,1) aynı satırda, (2,3) bir sonrakinde. Mobilde tek sütun, satır serbest.
            const row = Math.floor(i / 4) * 2 + (i % 4 < 2 ? 1 : 2);
            return (
              <figure
                key={item.src}
                className={cn("relative md:[grid-row:var(--row)]", layout.className)}
                style={{ "--row": row } as CSSProperties}
              >
                <div data-depth={layout.depth}>
                  <div data-frame>
                    <Media item={item} sizes="(min-width: 768px) 66vw, 100vw" />
                  </div>
                  <figcaption className="mt-5 flex items-baseline gap-4">
                    <span className="type-serif text-xl text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <span className="type-label text-fog">{item.alt}</span>
                  </figcaption>
                </div>
              </figure>
            );
          })}
        </div>

        <div className="mt-24 grid grid-cols-2 gap-x-4 gap-y-12 md:mt-[22vh] md:grid-cols-3 md:items-start md:gap-x-10 md:gap-y-[16vh] md:pb-[14vh]">
          {galleryDetails.map((item, i) => {
            const layout = STRIP_LAYOUT[i % STRIP_LAYOUT.length];
            return (
              <Detail
                key={item.src}
                item={item}
                index={gallery.length + i + 1}
                depth={layout.depth}
                className={layout.className}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-32 flex flex-wrap items-center justify-between gap-10 border-t border-white/10 pt-12 md:mt-44">
        <p className="text-[clamp(1.5rem,2.4vw,2.1rem)] leading-snug font-light text-chalk">
          Kareler yetmez. <span className="type-serif text-accent">Gel, kendin gör.</span>
        </p>
        <MagneticButton href={directionsUrl} external>
          Yol tarifi al
        </MagneticButton>
      </div>
    </section>
  );
}
