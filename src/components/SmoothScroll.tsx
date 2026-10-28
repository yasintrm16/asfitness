"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { scroller } from "@/lib/scroll";

/**
 * Lenis yumuşak scroll'u GSAP'in ticker'ına bağlar: tek bir rAF döngüsü,
 * ScrollTrigger her Lenis karesinde güncellenir. Azaltılmış hareket tercih
 * eden kullanıcılarda tarayıcının doğal scroll'u kalır.
 */
export function SmoothScroll() {
  const lenis = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // anchors: #top gibi sayfa içi linkler de yumuşak kayar.
    const instance = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1 });
    instance.on("scroll", ScrollTrigger.update);
    lenis.current = instance;
    scroller.lenis = instance;

    const raf = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      instance.destroy();
      lenis.current = null;
      scroller.lenis = null;
    };
  }, []);

  // Sayfa geçişi: yeni sayfanın ScrollTrigger'ları kurulmadan ÖNCE en üste dön.
  // Layout effect + layout'ta sayfadan önce gelmesi bu sırayı garanti eder; aksi halde
  // tetikleyiciler eski sayfanın scroll konumuyla ölçülür ve `once` olanlar daha
  // ölçüm sırasında kendini silip ScrollTrigger.refresh döngüsünü çökertir.
  // Ardından layout'taki footer dahil tüm konumlar yeni sayfa yüksekliğine göre yenilenir.
  useLayoutEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    window.scrollTo(0, 0);
    lenis.current?.scrollTo(0, { immediate: true, force: true });
    const frame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
