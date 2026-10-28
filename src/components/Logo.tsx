import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * LOGO — public/images/logo.png
 * Gönderilen logonun siyah zemini şeffafa çevrildi (parlaklığa göre alfa); koyu zeminde birebir aynı görünür.
 * Daha keskin görünüm için aynı dosya adıyla en az 512 px'lik şeffaf PNG (ya da SVG) koyman yeterli.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src="/images/logo.png"
      alt=""
      width={141}
      height={141}
      preload
      className={cn("size-10 md:size-11", className)}
    />
  );
}
