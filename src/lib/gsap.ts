import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/** Giriş koreografisi (sn): kırmızı çizgi çizilir, perde ikiye ayrılır, ardından sayfa içeriği gelir. */
export const INTRO = {
  open: 1.05,
  // Perde yarıya açıldığında başlıklar yükselmeye başlar.
  reveal: 1.55,
} as const;

/** Sayfa yavaş yüklendiyse (JS 3 sn'den geç geldiyse) ya da bu bir sayfa geçişiyse perdeyi bekleme. */
export const isLateLoad = () => performance.now() > 3000;

/** Sayfa girişlerinin ne kadar bekleyeceği: ilk açılışta perdeyi, sonra neredeyse hiç. */
export const revealDelay = () => (isLateLoad() ? 0.15 : INTRO.reveal);

export { gsap, ScrollTrigger, SplitText, useGSAP };
