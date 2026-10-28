"use client";

import { useRef } from "react";
import { ContactForm } from "@/components/ContactForm";
import { Icon, type IconName } from "@/components/Icon";
import { LiveStatus } from "@/components/LiveStatus";
import { MagneticButton } from "@/components/MagneticButton";
import { gsap, revealDelay, SplitText, useGSAP } from "@/lib/gsap";
import { useGymClock } from "@/lib/schedule";
import { directionsUrl, hours, mapEmbedUrl, site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Action = {
  href: string;
  icon: IconName;
  kicker: string;
  title: string;
  detail: string;
  note: string;
  external?: boolean;
  primary?: boolean;
};

/** Üç net yol: dokun ara · WhatsApp'ta fiyat sor · Instagram'da takip et. */
const ACTIONS: Action[] = [
  {
    href: site.phone.href,
    icon: "phone",
    kicker: "Telefon",
    title: "Hemen ara",
    detail: site.phone.display,
    note: "Dokun, arama hemen başlasın.",
  },
  {
    href: site.whatsapp,
    icon: "whatsapp",
    kicker: "WhatsApp",
    title: "Fiyat bilgisi al",
    detail: "“Merhaba, fiyat bilgisi almak istiyorum.”",
    note: "Mesaj hazır yazılı açılır, sadece gönder.",
    external: true,
    primary: true,
  },
  {
    href: site.instagram.href,
    icon: "instagram",
    kicker: "Instagram",
    title: "Takip et",
    detail: site.instagram.handle,
    note: "Salondan güncel paylaşımlar ve kampanyalar.",
    external: true,
  },
];

/** Köşeleri kesik "sporcu kartı" silueti (sağ üst, sol alt) — Yorumlar'daki kartlarla aynı dil. */
const CHAMFER = "[clip-path:polygon(0_0,calc(100%-34px)_0,100%_34px,100%_100%,34px_100%,0_calc(100%-34px))]";

function ActionCard({ action, index }: { action: Action; index: number }) {
  const n = String(index + 1).padStart(2, "0");
  return (
    <a
      data-card
      href={action.href}
      {...(action.external && { target: "_blank", rel: "noopener noreferrer" })}
      className={cn(
        "group relative flex h-full p-px transition-colors duration-500 [transform-style:preserve-3d]",
        CHAMFER,
        action.primary ? "bg-accent" : "bg-white/12 hover:bg-accent/80",
      )}
    >
      <span
        className={cn(
          "relative flex min-h-[23rem] w-full flex-col overflow-hidden md:min-h-[27rem]",
          CHAMFER,
          action.primary ? "bg-[#140202]" : "bg-carbon",
        )}
      >
        {/* Doku: çapraz çizgiler; öne çıkan kartta kırmızı ışıkla */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-0",
            action.primary
              ? "bg-[repeating-linear-gradient(135deg,rgb(204_0_0/0.09)_0_2px,transparent_2px_14px)]"
              : "bg-[repeating-linear-gradient(135deg,rgb(255_255_255/0.025)_0_1px,transparent_1px_11px)]",
          )}
        />
        {action.primary && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgb(204_0_0/0.35),transparent_70%)]"
          />
        )}
        {/* Dev kontur numara ve silik dev ikon */}
        <span
          aria-hidden
          className="type-display pointer-events-none absolute -top-3 right-5 text-[8.5rem] leading-none text-transparent transition-[-webkit-text-stroke-color] duration-500 [-webkit-text-stroke:1px_rgb(255_255_255/0.08)] group-hover:[-webkit-text-stroke-color:rgb(204_0_0/0.6)] md:text-[10rem]"
        >
          {n}
        </span>
        <Icon
          name={action.icon}
          className="pointer-events-none absolute -right-8 bottom-16 size-52 text-white/[0.035] transition duration-700 ease-expo group-hover:-rotate-12 group-hover:text-accent/15"
        />
        {/* Hover: çapraz kırmızı ışık süpürmesi */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -translate-x-full -skew-x-[24deg] bg-linear-to-r from-transparent via-accent/25 to-transparent opacity-0 transition duration-[1100ms] ease-expo group-hover:translate-x-[420%] group-hover:opacity-100"
        />
        {/* İmleci izleyen kırmızı parıltı */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_var(--gx,50%)_var(--gy,0%),rgb(204_0_0/0.2),transparent_55%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        />

        <span className="relative flex items-center gap-3 p-7 md:p-9">
          <span className="-skew-x-12 bg-accent px-3 py-1.5 shadow-[0_0_24px_-6px_var(--color-accent)]">
            <span className="type-label block skew-x-12 text-[0.625rem] text-chalk">{action.kicker}</span>
          </span>
          {action.primary && (
            <span className="type-label flex items-center gap-2 text-[0.625rem] text-chalk">
              <span aria-hidden className="size-1.5 rounded-full bg-live shadow-[0_0_10px_var(--color-live)] motion-safe:animate-blink" />
              En hızlısı
            </span>
          )}
        </span>

        <span className="relative mt-auto block px-7 md:px-9">
          <span className="type-display block text-[3.1rem] leading-[0.86] tracking-[0.02em] md:text-[3.6rem]">
            {action.title}
          </span>
          <span aria-hidden className="neon mt-5 block h-[3px] w-12 -skew-x-[30deg] transition-[width] duration-700 ease-expo group-hover:w-24" />
          <span className="type-body mt-5 block text-sm">{action.note}</span>
        </span>

        {/* Aksiyon barı: bilgi solda, kare ok butonu sağda; hover'da bar kırmızıyla dolar */}
        <span
          className={cn(
            "relative mt-8 flex items-center justify-between gap-4 border-t py-4 pr-4 pl-7 md:pl-9",
            action.primary ? "border-accent/40" : "border-white/10",
          )}
        >
          <span
            aria-hidden
            className="absolute inset-0 origin-left scale-x-0 bg-accent transition-transform duration-700 ease-expo group-hover:scale-x-100"
          />
          <span className="relative min-w-0 truncate text-[15px] font-light text-chalk md:text-base">{action.detail}</span>
          <span
            aria-hidden
            className="relative grid size-12 shrink-0 place-items-center bg-accent text-chalk transition-colors duration-500 [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,10px_100%,0_calc(100%-10px))] group-hover:bg-void"
          >
            <Icon
              name="arrow"
              className="size-5 transition-transform duration-500 ease-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </span>
        </span>
      </span>
      {action.external && <span className="sr-only">(yeni sekmede açılır)</span>}
    </a>
  );
}

function SectionLabel({ n, children }: { n: string; children: string }) {
  return (
    <p className="type-label flex items-baseline gap-4 text-fog">
      <span className="type-serif text-xl tracking-normal text-accent">{n}</span>
      {children}
    </p>
  );
}

/** İletişim: önce üç büyük eylem, sonra harita + saatler, en sonda isteğe bağlı mesaj formu. */
export function Contact() {
  const root = useRef<HTMLElement>(null);
  const clock = useGymClock();

  useGSAP(
    (_, contextSafe) => {
      if (!contextSafe) return;
      const q = gsap.utils.selector(root);
      gsap.set(q("[data-intro]"), { visibility: "visible", animation: "none" });

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const title = SplitText.create(q("[data-contact-title]"), { type: "lines,chars", mask: "lines", aria: "none" });
        const sub = SplitText.create(q("[data-contact-sub]"), { type: "words", aria: "none" });

        gsap
          .timeline({ delay: revealDelay() })
          .from(title.chars, { yPercent: 115, duration: 1.5, ease: "expo.out", stagger: 0.03 }, 0)
          .from(sub.words, { autoAlpha: 0, filter: "blur(14px)", y: 16, duration: 1.6, ease: "expo.out", stagger: 0.12 }, 0.3)
          .from(q("[data-contact-fade]"), { autoAlpha: 0, y: 18, duration: 1.3, ease: "power3.out", stagger: 0.1 }, 0.6)
          .from(q("[data-action]"), { autoAlpha: 0, y: 40, duration: 1.3, ease: "expo.out", stagger: 0.1 }, 0.7);

        for (const block of q("[data-reveal]")) {
          gsap.from(block, {
            y: 34,
            autoAlpha: 0,
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: { trigger: block, start: "top 88%", once: true },
          });
        }
      });

      // Kart imlece doğru eğilir, parıltı imleci izler (yalnızca fareli cihazlar).
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const cleanups = (q("[data-card]") as HTMLElement[]).map((card) => {
          const rx = gsap.quickTo(card, "rotationX", { duration: 0.6, ease: "power3.out" });
          const ry = gsap.quickTo(card, "rotationY", { duration: 0.6, ease: "power3.out" });
          const lift = gsap.quickTo(card, "z", { duration: 0.6, ease: "power3.out" });
          const move = contextSafe((event: PointerEvent) => {
            const box = card.getBoundingClientRect();
            const x = (event.clientX - box.left) / box.width;
            const y = (event.clientY - box.top) / box.height;
            rx((0.5 - y) * 10);
            ry((x - 0.5) * 12);
            lift(24);
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

  return (
    <section
      ref={root}
      aria-labelledby="iletisim-baslik"
      className="mx-auto max-w-[1400px] px-6 pt-40 pb-32 md:px-10 md:pt-52 md:pb-44"
    >
      <div className="flex flex-wrap items-end justify-between gap-10">
        <div>
          <p data-intro data-contact-fade className="type-label flex items-center gap-4 text-mist">
            <span aria-hidden className="neon h-px w-8" />
            İletişim
          </p>
          <h1
            id="iletisim-baslik"
            data-intro
            aria-label="Bir mesaj uzağındayız."
            className="mt-6 text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.98]"
          >
            <span aria-hidden data-contact-title className="type-display block tracking-[0.03em]">
              Bir mesaj
            </span>
            <span aria-hidden data-contact-sub className="type-serif block text-[1.08em] text-accent">
              uzağındayız.
            </span>
          </h1>
        </div>
        <div data-intro data-contact-fade className="space-y-5">
          <LiveStatus open={clock?.open ?? null} />
          <p className="type-body max-w-xs text-[15px]">Ara, yaz ya da takip et — üçünden biri yeter.</p>
        </div>
      </div>

      {/* ── 01 · Üç büyük eylem ─────────────────────────────── */}
      <ul className="mt-16 grid gap-5 md:mt-24 md:grid-cols-3 md:gap-6">
        {ACTIONS.map((action, i) => (
          <li key={action.kicker} data-action className="[perspective:1100px]">
            <ActionCard action={action} index={i} />
          </li>
        ))}
      </ul>

      {/* ── 02 · Harita + saatler ───────────────────────────── */}
      <div className="mt-28 grid gap-14 md:mt-40 lg:grid-cols-12 lg:gap-8">
        <div data-reveal className="lg:col-span-7">
          <SectionLabel n="01">Bizi bul</SectionLabel>
          <div className="relative mt-6 overflow-hidden border border-white/10 bg-carbon">
            {/* Gri tonlu, karartılmış harita (mavi hiçbir yerde görünmesin diye renkleri önce gri yapılır). */}
            <iframe
              src={mapEmbedUrl}
              title={`${site.name} konumu — Google Haritalar`}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="block h-[22rem] w-full contrast-[1.05] grayscale invert-[0.9] md:h-[26rem]"
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-accent/10 mix-blend-multiply" />
            {/* Kendi neon iğnemiz — haritanın ortası adres */}
            <span aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center">
              <span className="absolute size-10 rounded-full border border-accent/70 motion-safe:animate-ping" />
              <span className="neon size-3.5 rounded-full ring-4 ring-void/70" />
            </span>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-8">
            <address className="text-lg leading-relaxed font-light text-chalk not-italic">
              {site.address.street}
              <br />
              {site.address.city}
            </address>
            <MagneticButton href={directionsUrl} external>
              Yol tarifi al
            </MagneticButton>
          </div>
        </div>

        <div data-reveal className="lg:col-span-4 lg:col-start-9">
          <SectionLabel n="02">Çalışma saatleri</SectionLabel>
          <ul className="mt-6 border-t border-white/10">
            {hours.map((h) => {
              const today = clock ? h.days.includes(clock.day) : false;
              return (
                <li
                  key={h.label}
                  aria-current={today ? "date" : undefined}
                  className={cn(
                    "relative flex items-center justify-between gap-6 border-b border-white/10 py-6",
                    today && "before:neon before:absolute before:inset-y-3 before:-left-4 before:w-px",
                  )}
                >
                  <span className={cn("text-lg", today ? "text-chalk" : "font-light text-mist")}>
                    {h.label}
                    {today && <span className="type-label ml-3 text-[0.625rem] text-chalk">Bugün</span>}
                  </span>
                  <span className={cn("type-display text-3xl tabular-nums", today ? "text-chalk" : "text-mist")}>
                    {h.open}–{h.close}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="type-body mt-4 text-xs">* {hours[0].note}</p>
        </div>
      </div>

      {/* ── 03 · İsteğe bağlı mesaj formu ────────────────────── */}
      <div className="mt-28 grid gap-14 md:mt-40 lg:grid-cols-12 lg:gap-8">
        <div data-reveal className="lg:col-span-4">
          <SectionLabel n="03">Mesaj bırak</SectionLabel>
          <p className="type-body mt-6 max-w-xs text-[15px]">
            Adını ve sorunu yaz; mesajın WhatsApp&apos;ta hazır açılır, biz de en kısa sürede dönelim.
          </p>
        </div>
        <div data-reveal className="lg:col-span-7 lg:col-start-6">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
