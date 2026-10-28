"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type MagneticButtonProps = {
  href: string;
  children: ReactNode;
  /** Yeni sekmede açılan dış bağlantı (ör. Google Haritalar). */
  external?: boolean;
};

/**
 * İmleç yaklaşınca butona doğru çekilen "manyetik" link.
 * Dış bölge (zone) çekim alanını butondan biraz büyük tutar; buton ve etiketi
 * farklı oranlarda hareket ederek derinlik hissi verir.
 */
export function MagneticButton({ href, children, external }: MagneticButtonProps) {
  const Anchor = external ? "a" : Link;
  const zone = useRef<HTMLDivElement>(null);

  useGSAP(
    (_, contextSafe) => {
      const area = zone.current;
      if (!area || !contextSafe) return;

      const mm = gsap.matchMedia();
      mm.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const button = area.querySelector<HTMLElement>("[data-magnetic]")!;
        const label = area.querySelector<HTMLElement>("[data-magnetic-label]")!;
        const follow = { duration: 0.7, ease: "power3.out" };
        const bx = gsap.quickTo(button, "x", follow);
        const by = gsap.quickTo(button, "y", follow);
        const lx = gsap.quickTo(label, "x", follow);
        const ly = gsap.quickTo(label, "y", follow);

        const move = contextSafe((event: PointerEvent) => {
          const box = button.getBoundingClientRect();
          const x = event.clientX - (box.left + box.width / 2);
          const y = event.clientY - (box.top + box.height / 2);
          bx(x * 0.35);
          by(y * 0.45);
          lx(x * 0.12);
          ly(y * 0.12);
        });
        const reset = contextSafe(() => {
          bx(0);
          by(0);
          lx(0);
          ly(0);
        });

        area.addEventListener("pointermove", move);
        area.addEventListener("pointerleave", reset);
        return () => {
          area.removeEventListener("pointermove", move);
          area.removeEventListener("pointerleave", reset);
        };
      });
    },
    { scope: zone },
  );

  return (
    <div ref={zone} className="-m-6 inline-block p-6">
      <Anchor
        data-magnetic
        href={href}
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
        className="group relative inline-flex h-14 items-center gap-5 overflow-hidden rounded-full border border-white/15 pr-2 pl-7 text-chalk md:h-16 md:pl-8"
      >
        {/* Hover'da alttan dolan kan kırmızısı zemin */}
        <span
          aria-hidden
          className="absolute inset-0 translate-y-full rounded-full bg-accent transition-transform duration-700 ease-expo group-hover:translate-y-0"
        />
        <span data-magnetic-label className="relative flex items-center gap-5">
          <span className="type-label tracking-[0.24em]">{children}</span>
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-full bg-accent text-chalk shadow-[0_0_24px_-4px_var(--color-accent)] transition-colors duration-500 group-hover:bg-void md:size-12"
          >
            <svg viewBox="0 0 24 24" className="size-4 -rotate-45" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </span>
        {external && <span className="sr-only">(yeni sekmede açılır)</span>}
      </Anchor>
    </div>
  );
}
