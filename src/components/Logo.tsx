/**
 * LOGO BURAYA
 * -----------
 * Şimdilik "AS" amblemli bir yer tutucu gösteriliyor. Gerçek logoyu eklemek için:
 *   1. Dosyayı public/logo.svg (veya .png) olarak kaydet.
 *   2. Aşağıdaki <span data-logo-mark> bloğunu şununla değiştir:
 *        <Image src="/logo.svg" alt="" width={40} height={40} priority data-logo-mark />
 *      (dosyanın başına: import Image from "next/image")
 *   3. Logo yazıyı da içeriyorsa <span data-logo-word> satırını sil.
 * data-logo-mark / data-logo-word nitelikleri Header'daki giriş animasyonunu sürer, koru.
 */
export function Logo() {
  return (
    <span className="flex items-center gap-3">
      <span
        data-logo-mark
        aria-hidden
        className="relative grid size-10 place-items-center rounded-full border-[1.5px] border-chalk"
      >
        <span className="absolute inset-[4px] rounded-full border border-neon/80 shadow-[0_0_14px_-3px_var(--color-neon)]" />
        <span className="type-display text-[15px]">AS</span>
      </span>
      <span data-logo-word className="type-label text-[0.75rem] text-chalk">
        Fitness
      </span>
    </span>
  );
}
