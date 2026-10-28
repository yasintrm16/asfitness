import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * "Canlı" rozeti: yanıp sönen yeşil nokta. Salon kapalıyken "Çok yoğun değil"
 * yanıltıcı olmasın diye "Kapalı" gösterir (open, useGymClock'tan gelir).
 */
export function LiveStatus({ open, className }: { open: boolean | null; className?: string }) {
  // null: sunucu render'ı / henüz bilinmiyor → varsayılan metin
  const closed = open === false;

  return (
    <div
      className={cn(
        "glass inline-flex items-center gap-3 rounded-full py-2.5 pr-5 pl-4 shadow-none",
        className,
      )}
    >
      <span aria-hidden className="relative flex size-2">
        {!closed && <span className="absolute inset-0 rounded-full bg-live motion-safe:animate-ping" />}
        <span
          className={cn(
            "relative size-2 rounded-full",
            closed ? "bg-fog" : "bg-live shadow-[0_0_10px_var(--color-live)] motion-safe:animate-blink",
          )}
        />
      </span>
      <span className="type-label tracking-[0.2em] text-fog">
        Canlı: <span className="text-chalk">{closed ? "Kapalı" : site.liveStatus}</span>
      </span>
    </div>
  );
}
