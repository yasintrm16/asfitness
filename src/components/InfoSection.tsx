"use client";

import { useRef } from "react";
import { ArrowLink } from "@/components/ArrowLink";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useGymClock } from "@/lib/schedule";
import { directionsUrl, hours, site } from "@/lib/site";
import { cn } from "@/lib/utils";

/** "Şu an" rozeti. Salon kapalıyken "Çok yoğun değil" yanıltıcı olmasın diye "Kapalı" gösterir. */
function LiveStatus({ open }: { open: boolean | null }) {
  // null: sunucu render'ı / henüz bilinmiyor → varsayılan metin
  const closed = open === false;

  return (
    <div
      data-reveal
      className="mt-10 inline-flex items-center gap-3 rounded-full border border-steel bg-carbon/80 py-3 pr-5 pl-4"
    >
      <span aria-hidden className="relative flex size-2.5">
        {!closed && <span className="absolute inset-0 rounded-full bg-live motion-safe:animate-ping" />}
        <span
          className={cn(
            "relative size-2.5 rounded-full",
            closed ? "bg-fog" : "bg-live shadow-[0_0_12px_var(--color-live)] motion-safe:animate-blink",
          )}
        />
      </span>
      <span className="type-label text-fog">
        Şu an: <span className="text-chalk">{closed ? "Kapalı" : site.liveStatus}</span>
      </span>
    </div>
  );
}

export function InfoSection() {
  const root = useRef<HTMLElement>(null);
  const clock = useGymClock();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Başlık satırları maskelerinin altından yükselir.
        gsap.from(q("[data-reveal-line]"), {
          yPercent: 115,
          duration: 1.2,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: q("[data-info-title]")[0], start: "top 82%", once: true },
        });

        // Ayırıcı çizgiler soldan sağa çizilir.
        for (const rule of q("[data-rule]")) {
          gsap.from(rule, {
            scaleX: 0,
            duration: 1.3,
            ease: "expo.inOut",
            scrollTrigger: { trigger: rule, start: "top 92%", once: true },
          });
        }

        // Kartlar ve satırlar görünür alana girdikçe kademeli belirir.
        const items = q("[data-reveal]");
        gsap.set(items, { y: 36, autoAlpha: 0 });
        ScrollTrigger.batch(items, {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1, ease: "power3.out", stagger: 0.08 }),
        });

        // Puan sayacı 0.0 → 4.9. React'in metin düğümünü değiştirmemek için yalnızca içeriğini güncelliyoruz.
        const text = q("[data-score]")[0].firstChild as Text;
        const counter = { value: 0 };
        text.data = "0.0";
        gsap.to(counter, {
          value: Number(site.rating.score),
          duration: 1.8,
          ease: "power2.out",
          scrollTrigger: { trigger: text.parentElement, start: "top 92%", once: true },
          onUpdate: () => {
            text.data = counter.value.toFixed(1);
          },
        });
        return () => {
          text.data = site.rating.score;
        };
      });
    },
    { scope: root },
  );

  return (
    <section
      id="bilgi"
      ref={root}
      aria-labelledby="bilgi-baslik"
      className="relative px-4 pt-32 pb-24 md:px-8 md:pt-44 md:pb-32 xl:px-12"
    >
      <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <p className="type-label text-neon">(02) — Bilgi & Saatler</p>
          <h2 id="bilgi-baslik" data-info-title className="type-display mt-6 text-[clamp(3.6rem,8.4vw,9rem)]">
            <span className="line-mask">
              <span data-reveal-line className="block">
                Her gün
              </span>
            </span>
            <span className="line-mask">
              <span data-reveal-line className="block">
                açığız.
              </span>
            </span>
          </h2>

          <LiveStatus open={clock?.open ?? null} />

          <div className="mt-12 border border-steel bg-carbon/85">
            <div className="type-label flex items-center justify-between px-5 py-4 text-fog md:px-8">
              <span>Çalışma saatleri</span>
              <span>Yıldırım / Bursa</span>
            </div>

            <ul>
              {hours.map((h) => {
                const today = clock ? h.days.includes(clock.day) : false;
                return (
                  <li
                    key={h.label}
                    aria-current={today ? "date" : undefined}
                    className={cn(
                      "relative",
                      today && "bg-neon/[0.05] before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-neon",
                    )}
                  >
                    <div data-rule className="h-px origin-left bg-steel" />
                    <div
                      data-reveal
                      className="grid gap-y-4 px-5 py-7 sm:grid-cols-[1fr_auto] sm:items-end sm:gap-x-8 md:px-8 md:py-8"
                    >
                      <div>
                        <p className="flex flex-wrap items-center gap-3">
                          <span className="type-display text-3xl md:text-4xl">{h.label}</span>
                          {today && (
                            <span className="type-label rounded-full bg-neon px-2.5 py-1 text-void">Bugün</span>
                          )}
                        </p>
                        {h.note && <p className="mt-3 max-w-xs text-sm leading-relaxed text-fog">* {h.note}</p>}
                      </div>
                      <p className="type-display text-5xl tabular-nums md:text-6xl">
                        {h.open}
                        <span className="px-1.5 text-fog/60">–</span>
                        {h.close}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <dl className="mt-14 grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr] sm:gap-8">
            <div data-reveal>
              <dt className="type-label text-fog">Adres</dt>
              <dd className="mt-3 text-lg leading-snug">
                {site.address.street}
                <br />
                {site.address.city}
              </dd>
              <dd className="mt-4">
                <ArrowLink href={directionsUrl} external>
                  Yol tarifi al
                </ArrowLink>
              </dd>
            </div>

            <div data-reveal>
              <dt className="type-label text-fog">Telefon</dt>
              <dd className="mt-3">
                <a href={site.phone.href} className="text-lg transition-colors hover:text-neon">
                  {site.phone.display}
                </a>
              </dd>
            </div>

            <div data-reveal>
              <dt className="type-label text-fog">Puan</dt>
              <dd className="mt-2 flex items-end gap-3">
                <span data-score className="type-display text-6xl leading-none tabular-nums">
                  {site.rating.score}
                </span>
                <span aria-hidden className="pb-1 text-xl text-neon">
                  ★
                </span>
                <span className="type-label pb-1.5 text-fog">{site.rating.reviews} Yorum</span>
              </dd>
            </div>
          </dl>
        </div>

        {/* 3D sahne: bu kolon bilerek boş — dambıl bu bölümde burada ayrışıp süzülür (GymScene3D → explode). */}
        <div aria-hidden className="hidden lg:col-span-5 lg:block" />
      </div>
    </section>
  );
}
