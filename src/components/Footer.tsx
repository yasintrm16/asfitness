"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { LiveStatus } from "@/components/LiveStatus";
import { Logo } from "@/components/Logo";
import { MagneticButton } from "@/components/MagneticButton";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useGymClock } from "@/lib/schedule";
import { directionsUrl, hours, nav, site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Social = { label: string; href: string; icon: IconName };

const SOCIALS: Social[] = [
  { label: `Instagram ${site.instagram.handle}`, href: site.instagram.href, icon: "instagram" },
  { label: "WhatsApp'tan fiyat bilgisi al", href: site.whatsapp, icon: "whatsapp" },
  { label: "Google Haritalar", href: directionsUrl, icon: "maps" },
  { label: `Ara: ${site.phone.display}`, href: site.phone.href, icon: "phone" },
];

const OWN_CLOSING = ["/iletisim", "/galeri"];

/** Footer'ın tepesinde birbirini kesen iki antrenman bandı: biri sola, biri sağa akar. */
const TAPES = [
  {
    dir: -1,
    words: ["Sınırlarını sen belirle", site.name, "Yıldırım / Bursa", "Gece yarısına kadar açık"],
    className: "-rotate-[4deg] bg-accent text-void",
  },
  {
    dir: 1,
    words: ["Disiplin", "Güç", "Ter", "İrade", "Sabır", "Odak"],
    className: "rotate-[3deg] border-y border-white/10 bg-carbon text-chalk",
  },
];

/** Köşeleri kesik kare (sosyal butonlar). */
const CHAMFER = "[clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,10px_100%,0_calc(100%-10px))]";

/** Bantlarda kelime ayıracı: küçük dambıl. */
function DumbbellGlyph() {
  return (
    <svg aria-hidden viewBox="0 0 34 16" className="mx-[0.45em] h-[0.5em] w-auto shrink-0" fill="currentColor">
      <rect x="0" y="4" width="4" height="8" rx="1" />
      <rect x="5" y="1" width="5" height="14" rx="1" />
      <rect x="10" y="6.5" width="14" height="3" />
      <rect x="24" y="1" width="5" height="14" rx="1" />
      <rect x="30" y="4" width="4" height="8" rx="1" />
    </svg>
  );
}

/** Ayraç çizgisi bir halter: bar ortadan açılır, plakalar iki uçtan takılır. */
function BarbellRule() {
  const plates = (side: 1 | -1) => (
    <span data-plates={side} className={cn("flex items-center gap-[3px]", side > 0 && "flex-row-reverse")}>
      <span className="h-2.5 w-1 bg-steel" />
      <span className="h-5 w-1.5 bg-fog/60" />
      <span className="h-8 w-2 bg-accent shadow-[0_0_14px_-2px_var(--color-accent)]" />
      <span className="h-11 w-2.5 border border-white/10 bg-graphite" />
      <span className="h-4 w-1 bg-mist/70" />
    </span>
  );
  return (
    <div aria-hidden className="flex items-center">
      {plates(-1)}
      <span data-bar className="h-[3px] flex-1 origin-center bg-linear-to-r from-mist/50 via-white/20 to-mist/50" />
      {plates(1)}
    </div>
  );
}

/** Logonun etrafında dönen plaka halkası. */
function PlateBadge() {
  const ring = `${site.name} · Yıldırım · Bursa · Sınırlarını sen belirle · `;
  return (
    <span className="relative grid size-32 shrink-0 place-items-center md:size-36">
      <svg data-badge-ring aria-hidden viewBox="0 0 200 200" className="absolute inset-0 size-full">
        <defs>
          <path id="footer-cember" d="M100,100 m-80,0 a80,80 0 1,1 160,0 a80,80 0 1,1 -160,0" />
        </defs>
        <circle cx="100" cy="100" r="98" fill="none" stroke="rgb(255 255 255 / 0.12)" />
        <circle cx="100" cy="100" r="64" fill="none" stroke="rgb(204 0 0 / 0.6)" />
        <text className="fill-fog font-sans text-[11px] font-medium tracking-[0.3em] uppercase">
          <textPath href="#footer-cember" textLength="495" lengthAdjust="spacing">
            {ring}
          </textPath>
        </text>
      </svg>
      <Logo className="size-14 md:size-16" />
    </span>
  );
}

function Column({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div data-footer-col className={className}>
      <p className="type-label flex items-center gap-3 text-fog">
        <span aria-hidden className="neon h-[3px] w-4 -skew-x-[30deg]" />
        {title}
      </p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

/**
 * Footer: antrenman bantları, kapanış daveti, plaka rozeti, menü / iletişim / saatler,
 * halter ayraç ve scroll'la dolan dev "AS FITNESS". Her sayfada ortak.
 */
export function Footer() {
  const root = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const clock = useGymClock();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Bantlar ters yönlerde sonsuz akar; yalnızca ekrandayken, hızlı kaydırınca hızlanır.
        const tapes = (q("[data-tape]") as HTMLElement[]).map((track) => {
          const dir = Number(track.dataset.tape);
          return gsap.fromTo(
            track,
            { xPercent: dir < 0 ? 0 : -50 },
            { xPercent: dir < 0 ? -50 : 0, ease: "none", repeat: -1, duration: 34, paused: true },
          );
        });
        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => tapes.forEach((tween) => (self.isActive ? tween.play() : tween.pause())),
          onUpdate: (self) => {
            const boost = gsap.utils.clamp(1, 4, 1 + Math.abs(self.getVelocity()) / 400);
            for (const tween of tapes) {
              gsap.to(tween, { timeScale: boost, duration: 0.3, ease: "power2.out", overwrite: true });
              gsap.to(tween, { timeScale: 1, duration: 1.4, delay: 0.3, ease: "power2.inOut" });
            }
          },
        });

        gsap.from(q("[data-footer-col], [data-footer-cta]"), {
          y: 30,
          autoAlpha: 0,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: q("[data-footer-main]")[0], start: "top 88%", once: true },
        });

        gsap.to(q("[data-badge-ring]"), { rotate: 360, duration: 40, ease: "none", repeat: -1, transformOrigin: "50% 50%" });

        // Halter: bar ortadan açılır, ardından plakalar iki uçtan "çat" diye oturur.
        const [rule] = q("[data-rule]");
        gsap
          .timeline({ scrollTrigger: { trigger: rule, start: "top 95%", once: true } })
          .from(q("[data-bar]"), { scaleX: 0, duration: 1.2, ease: "expo.inOut" })
          .from(
            q("[data-plates] > span"),
            {
              x: (i, el: HTMLElement) => Number(el.parentElement?.dataset.plates) * 80,
              autoAlpha: 0,
              duration: 0.9,
              ease: "back.out(2)",
              stagger: 0.05,
            },
            0.55,
          );

        // Dev yazı soldan sağa kırmızıyla dolar; kenarında neon bir çizgi ilerler.
        gsap
          .timeline({
            scrollTrigger: { trigger: q("[data-wordmark]")[0], start: "top bottom", end: "bottom bottom", scrub: true },
          })
          .fromTo(q("[data-wordmark-fill]"), { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none" }, 0)
          .fromTo(q("[data-wordmark-edge]"), { left: "0%" }, { left: "100%", ease: "none" }, 0)
          .to(q("[data-wordmark-edge]"), { autoAlpha: 0, duration: 0.08 }, 0.92);
      });
    },
    { scope: root, dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <footer ref={root} className="relative z-10 overflow-hidden bg-void">
      {/* ── Antrenman bantları ─────────────────────────────── */}
      <div aria-hidden className="relative h-48 select-none md:h-64">
        {TAPES.map((tape) => (
          <div
            key={tape.dir}
            className={cn(
              "absolute top-1/2 -right-[5%] -left-[5%] -translate-y-1/2 py-3 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.9)] md:py-4",
              tape.className,
            )}
          >
            <div
              data-tape={tape.dir}
              className="type-display flex w-max items-center text-[clamp(1.6rem,3.2vw,2.75rem)] leading-none whitespace-nowrap"
            >
              {[0, 1].map((half) => (
                <span key={half} className="flex items-center">
                  {[...tape.words, ...tape.words].map((word, i) => (
                    <span key={`${half}-${i}`} className="flex items-center">
                      <span className="tracking-[0.04em]">{word}</span>
                      <DumbbellGlyph />
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        {/* Kapanış daveti — kendi kapanışı olan sayfalarda (İletişim formu, Galeri'nin yol tarifi) gizli */}
        {!OWN_CLOSING.includes(pathname) && (
          <div
            data-footer-cta
            className="flex flex-wrap items-center justify-between gap-10 border-b border-white/[0.06] pt-10 pb-20 md:pt-14 md:pb-28"
          >
            <p className="text-[clamp(2rem,4.2vw,3.75rem)] leading-[1.02]">
              <span className="type-display block tracking-[0.03em]">Bir sonraki set</span>
              <span className="type-serif block text-[1.08em] text-accent">seninle.</span>
            </p>
            <MagneticButton href="/iletisim">İletişime geç</MagneticButton>
          </div>
        )}

        <div data-footer-main className="grid gap-14 py-20 sm:grid-cols-2 md:py-24 lg:grid-cols-12 lg:gap-8">
          <div data-footer-col className="sm:col-span-2 lg:col-span-4">
            <Link href="/" aria-label={`${site.name} — ana sayfa`} className="inline-flex items-center gap-6">
              <PlateBadge />
              <span lang="en" className="type-display text-3xl tracking-[0.06em] text-chalk">
                {site.name}
              </span>
            </Link>
            <p className="type-body mt-8 max-w-xs text-[15px]">
              Yıldırım&apos;ın kalbinde, siyah ve kırmızının arasında. Sınırlarını sen belirle.
            </p>
            <ul className="mt-8 flex gap-2.5">
              {SOCIALS.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    {...(social.href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
                    className={cn("group block bg-white/10 p-px transition-colors duration-500 hover:bg-accent", CHAMFER)}
                  >
                    <span
                      className={cn(
                        "grid size-12 place-items-center bg-carbon text-mist transition-colors duration-500 group-hover:bg-accent group-hover:text-chalk",
                        CHAMFER,
                      )}
                    >
                      <Icon name={social.icon} />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <Column title="Menü" className="lg:col-span-3">
            <ul className="space-y-1">
              {nav.map((item, i) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={pathname === item.href ? "page" : undefined}
                    className="group flex items-baseline gap-4 py-1 text-mist transition-colors duration-300 hover:text-chalk aria-[current=page]:text-chalk"
                  >
                    <span className="type-label w-6 text-fog transition-colors duration-300 group-hover:text-accent">
                      0{i + 1}
                    </span>
                    <span className="type-display text-[1.75rem] tracking-[0.04em] transition-transform duration-500 ease-expo group-hover:translate-x-2">
                      {item.label}
                    </span>
                    <Icon
                      name="arrow"
                      className="size-4 -translate-x-2 self-center text-accent opacity-0 transition duration-500 ease-expo group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </Column>

          <Column title="Ulaş" className="lg:col-span-2">
            <address className="text-[15px] leading-relaxed font-light text-mist not-italic">
              {site.address.street}
              <br />
              {site.address.city}
            </address>
            <a
              href={site.phone.href}
              className="type-display mt-5 block text-2xl tracking-[0.04em] text-chalk tabular-nums transition-colors duration-300 hover:text-accent"
            >
              {site.phone.display}
            </a>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="type-label mt-5 inline-flex items-center gap-2 text-fog transition-colors duration-300 hover:text-chalk"
            >
              Yol tarifi
              <Icon name="arrow" className="size-3.5 text-accent" />
              <span className="sr-only">(yeni sekmede açılır)</span>
            </a>
          </Column>

          <Column title="Antrenman saatleri" className="lg:col-span-3">
            <LiveStatus open={clock?.open ?? null} className="mb-6" />
            <ul className="border-t border-white/10">
              {hours.map((h) => {
                const today = clock ? h.days.includes(clock.day) : false;
                return (
                  <li
                    key={h.label}
                    aria-current={today ? "date" : undefined}
                    className={cn(
                      "relative flex items-baseline justify-between gap-6 border-b border-white/10 py-3.5",
                      today && "before:neon before:absolute before:inset-y-2 before:-left-3 before:w-[3px]",
                    )}
                  >
                    <span className={cn("text-[15px]", today ? "text-chalk" : "font-light text-mist")}>
                      {h.label}
                      {today && <span className="type-label ml-2 text-[0.5625rem] text-accent">Bugün</span>}
                    </span>
                    <span className={cn("type-display text-2xl tabular-nums", today ? "text-chalk" : "text-mist")}>
                      {h.open}–{h.close}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Column>
        </div>

        <div data-rule>
          <BarbellRule />
        </div>
      </div>

      {/* ── Dev yazı: kontur hâlinde durur, sayfanın sonuna inildikçe soldan dolar ── */}
      <div data-wordmark aria-hidden className="relative mx-auto mt-14 max-w-[1400px] px-6 select-none md:mt-20 md:px-10">
        <div className="relative">
          <svg viewBox="0 0 1000 150" className="block w-full">
            <text
              x="0"
              y="138"
              textLength="1000"
              lengthAdjust="spacingAndGlyphs"
              className="type-display fill-transparent stroke-white/15 text-[172px]"
              strokeWidth="1"
            >
              AS FITNESS
            </text>
          </svg>
          <svg data-wordmark-fill viewBox="0 0 1000 150" className="absolute inset-0 block w-full">
            <defs>
              <linearGradient id="footer-yazi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff2a2a" />
                <stop offset="100%" stopColor="#5c0000" />
              </linearGradient>
            </defs>
            <text x="0" y="138" textLength="1000" lengthAdjust="spacingAndGlyphs" className="type-display text-[172px]">
              <tspan className="fill-chalk">AS </tspan>
              <tspan fill="url(#footer-yazi)">FITNESS</tspan>
            </text>
          </svg>
          <span data-wordmark-edge className="neon absolute inset-y-0 left-full w-px" />
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-8 md:px-10">
        <p className="flex items-baseline gap-3">
          <span lang="en" className="type-serif text-xl text-chalk">
            {site.name}
          </span>
          <span className="type-label text-fog">© 2024</span>
        </p>
        <p className="type-label text-fog">Yıldırım / Bursa</p>
        <a href="#top" className="group type-label flex items-center gap-2 text-fog transition-colors duration-300 hover:text-chalk">
          Bir set daha
          <span className="sr-only">(sayfanın başına dön)</span>
          <span aria-hidden className="text-accent transition-transform duration-500 ease-expo group-hover:-translate-y-1">
            ↑
          </span>
        </a>
      </div>
    </footer>
  );
}
