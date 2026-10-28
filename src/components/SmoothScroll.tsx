"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Lenis yumuşak scroll'u GSAP'in ticker'ına bağlar: tek bir rAF döngüsü,
 * ScrollTrigger her Lenis karesinde güncellenir. Azaltılmış hareket tercih
 * eden kullanıcılarda tarayıcının doğal scroll'u kalır.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // anchors: #bilgi, #galeri gibi sayfa içi linkler de yumuşak kayar.
    const lenis = new Lenis({ autoRaf: false, anchors: true, lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
    };
  }, []);

  return null;
}
