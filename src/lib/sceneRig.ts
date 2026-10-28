/**
 * GSAP ↔ Three.js köprüsü
 * -----------------------
 * Ana sayfadaki bölümler scroll'a bağlı ScrollTrigger'larla değerleri yazar; 3D sahne
 * her karede okur ve damp() ile yumuşatarak uygular. React state değil, düz bir nesne:
 * değerler her karede değişir, re-render istemeyiz.
 */
export const rig = {
  /** 0 → 1 · Giriş: perde açılırken sahne karanlıktan belirir. */
  intro: 0,
  /** 0 → 1 · Hero'dan "Barı Yükle" bölümüne geçiş: bar aşağıdan merkeze gelir. */
  focus: 0,
  /** 0 → 4 · Kaç çift plakanın bara takıldığı (ara değerler: plaka yolda). */
  load: 0,
  /** 0 → 1 · Bar kaldırılır (uçları esneyerek). */
  lift: 0,
  /** 0 → 1 · "Ekipman" bölümüne girerken bar sisin içine çekilir. */
  exit: 0,
  /** 0 → GEAR_END · Ekipman sırayla sahneye gelir; tam sayılarda bir sonrakiyle yer değiştirir. */
  gear: 0,
  /** 0 → 1 · "Nabız" bölümünün görünürlüğü: EKG çizgisi belirir, sis kalp atışıyla atar. */
  pulse: 0,
  /** Dakikadaki atış — Nabız bölümünde scroll'la yükselir. */
  bpm: 72,
};

/** Ekipman sahnesinin süresi: her parça sahneye 0.45'te oturur, bir sonraki tam sayıda yerini devreder. */
export const GEAR_COUNT = 3;
export const GEAR_END = GEAR_COUNT + 0.45;

/**
 * Kalp atışı (Nabız bölümü yazar, EKG çizgisi ve sis okur).
 * phase: toplam atış sayısı (kesirli) · kick: R dalgasında 1'e sıçrayıp sönen darbe.
 */
export const beat = { phase: 0, kick: 0 };

/** İmleç (viewport'a göre -1…1). Kırmızı neon ışık ve barın eğimi bunu takip eder. */
export const pointer = { x: 0, y: 0, lastMove: -Infinity };
