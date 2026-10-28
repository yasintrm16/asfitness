import type Lenis from "lenis";

/** Aktif Lenis örneği (SmoothScroll yazar). Mobil menü açıkken sayfa kaymasın diye durdurulur. */
export const scroller: { lenis: Lenis | null } = { lenis: null };
