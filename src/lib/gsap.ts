import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/** Intro koreografisi (sn): Header logoyu merkeze getirip yerine uçurur, perde kalkar, ardından Hero başlığı gelir. */
export const INTRO = {
  curtain: 0.85,
  // Perdenin alt kenarı başlığın üzerinden geçerken harfler yükselmeye başlar.
  hero: 1.4,
} as const;

/** Sayfa yavaş yüklendiyse (JS 3 sn'den geç geldiyse) uzun intro yerine kısa geçiş yap. */
export const isLateLoad = () => performance.now() > 3000;

export { gsap, ScrollTrigger, SplitText, useGSAP };
