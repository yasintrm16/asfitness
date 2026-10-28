/**
 * GSAP ScrollTrigger ↔ Three.js köprüsü
 * --------------------------------------
 * Her kanalı tek bir ScrollTrigger yazar (GymScene3D → useScrollRig), böylece
 * tween'ler birbiriyle çakışmaz. Dumbbell bileşeni değerleri useFrame içinde her
 * karede okur ve damp() ile yumuşatarak objeye uygular.
 *
 * React state değil, düz bir nesne: scroll her karede değişir, re-render istemeyiz.
 */
export const rig = {
  /** 0 → 1 · Giriş: perde kalkarken dambıl aşağıdan dönerek süzülür (Header yazar). */
  intro: 0,
  /** 0 → 1 · Hero'dan çıkarken: dambıl, biri kaldırıyormuş gibi yükselir. */
  lift: 0,
  /** 0 → 1 → 0 · Bilgi bölümü: plakalar ayrılır, süzülür ve yeniden kilitlenir. */
  explode: 0,
  /** 0 → 1 · Galeri: obje kenara ve derine çekilir, fotoğraflar öne çıkar. */
  drift: 0,
  /** 0 → 1 · Footer: obje merkeze iner ve yerine oturur. */
  settle: 0,
};
