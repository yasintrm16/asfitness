"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { gsap, revealDelay, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { scroller } from "@/lib/scroll";
import { nav, site } from "@/lib/site";
import { cn } from "@/lib/utils";

const isActive = (href: string, pathname: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

const NAV_LINK = cn(
  "type-label relative block py-3 text-mist transition-colors duration-300 hover:text-chalk aria-[current=page]:text-chalk",
  // Neon alt çizgi: hover'da alttan yükselir ve ortadan iki yana açılır.
  // Sağdaki 0.28em: harf aralığının son harften sonra bıraktığı boşluk, çizgi metne tam otursun.
  "after:neon after:pointer-events-none after:absolute after:bottom-1.5 after:left-0 after:right-[0.28em] after:h-px after:origin-center after:translate-y-1.5 after:scale-x-0 after:opacity-0 after:transition after:duration-500 after:ease-expo",
  "hover:after:translate-y-0 hover:after:scale-x-100 hover:after:opacity-100",
  "aria-[current=page]:after:translate-y-0 aria-[current=page]:after:scale-x-100 aria-[current=page]:after:opacity-70",
);

export function Header() {
  const root = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);

  // Sayfa değişince mobil menüyü kapat (effect yerine render sırasında: ekstra bir boyama olmaz).
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  // Menü açıkken arkadaki sayfa kaymasın; Esc kapatır.
  useEffect(() => {
    if (!open) return;
    scroller.lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      scroller.lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const [bar] = q("[data-bar]");
      gsap.set(bar, { visibility: "visible", animation: "none" });

      // Aşağı inerken bar yukarı süzülüp çekilir, yukarı çıkınca geri gelir: içerik nefes alsın.
      let hidden = false;
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          const next = self.direction === 1 && self.scroll() > 240;
          if (next === hidden) return;
          hidden = next;
          gsap.to(bar, { yPercent: next ? -170 : 0, duration: 0.8, ease: "expo.out", overwrite: "auto" });
        },
      });

      // Header layout'ta yaşar: giriş yalnızca siteye ilk girişte oynar, sayfa geçişlerinde değil.
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(bar, { yPercent: -80, autoAlpha: 0, duration: 1.4, ease: "expo.out", delay: revealDelay() + 0.15 });
      });
    },
    { scope: root },
  );

  return (
    <header ref={root} className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
      <div
        data-bar
        data-intro
        className="glass relative z-10 mx-auto flex h-16 max-w-[1400px] items-center justify-between rounded-full pr-2 pl-3 md:h-[4.25rem] md:pr-2.5 md:pl-4"
      >
        <Link href="/" aria-label={`${site.name} — ana sayfa`} className="flex items-center gap-3">
          <Logo />
          <span lang="en" className="type-label hidden text-chalk sm:inline">
            {site.name}
          </span>
        </Link>

        <nav aria-label="Ana menü" className="absolute left-1/2 hidden -translate-x-1/2 md:block">
          <ul className="flex items-center gap-8 lg:gap-12">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href, pathname) ? "page" : undefined}
                  className={NAV_LINK}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={site.phone.href}
            className="type-label hidden h-11 items-center gap-3 rounded-full border border-white/10 px-5 tracking-[0.18em] text-chalk transition-colors duration-300 hover:border-accent/70 lg:inline-flex"
          >
            <span aria-hidden className="neon size-1.5 rounded-full" />
            {site.phone.display}
          </a>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobil-menu"
            onClick={() => setOpen((value) => !value)}
            className="relative grid size-11 place-items-center rounded-full border border-white/10 md:hidden"
          >
            <span className="sr-only">{open ? "Menüyü kapat" : "Menüyü aç"}</span>
            <span
              aria-hidden
              className={cn(
                "absolute h-px w-4 bg-chalk transition duration-500 ease-expo",
                open ? "rotate-45" : "-translate-y-[3px]",
              )}
            />
            <span
              aria-hidden
              className={cn(
                "absolute h-px w-4 bg-chalk transition duration-500 ease-expo",
                open ? "-rotate-45" : "translate-y-[3px]",
              )}
            />
          </button>
        </div>
      </div>

      {/* Mobil menü: barın altında, tüm ekranı kaplayan koyu cam */}
      <div
        id="mobil-menu"
        data-open={open || undefined}
        className="group/menu invisible fixed inset-0 flex flex-col justify-between bg-void/85 px-6 pt-28 pb-10 opacity-0 backdrop-blur-2xl transition-[opacity,visibility] duration-500 data-open:visible data-open:opacity-100 md:hidden"
      >
        <nav aria-label="Mobil menü">
          <ul>
            {nav.map((item, i) => (
              <li key={item.href} className="border-b border-white/[0.06]">
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href, pathname) ? "page" : undefined}
                  style={{ transitionDelay: open ? `${100 + i * 70}ms` : "0ms" }}
                  className="group/link flex translate-y-6 items-baseline justify-between py-5 opacity-0 transition duration-700 ease-expo group-data-open/menu:translate-y-0 group-data-open/menu:opacity-100"
                >
                  <span className="type-display text-[2.5rem] text-chalk group-aria-[current=page]/link:text-accent">
                    {item.label}
                  </span>
                  <span className="type-label text-fog">0{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <a href={site.phone.href} className="block text-2xl font-light tracking-wide text-chalk">
            {site.phone.display}
          </a>
          <p className="type-label text-fog">{site.address.street}</p>
        </div>
      </div>
    </header>
  );
}
