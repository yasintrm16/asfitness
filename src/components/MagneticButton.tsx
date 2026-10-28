"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";

type MagneticButtonProps = {
  href: string;
  children: ReactNode;
};

/**
 * İmleç yaklaşınca butona doğru çekilen "manyetik" link.
 * Dış bölge (zone) çekim alanını butondan biraz büyük tutar; buton ve etiketi
 * farklı oranlarda hareket ederek derinlik hissi verir.
 */
export function MagneticButton({ href, children }: MagneticButtonProps) {
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
      <a
        data-magnetic
        href={href}
        className="group relative inline-flex h-16 items-center gap-4 overflow-hidden rounded-full border border-neon/60 pl-8 pr-3 text-chalk shadow-[0_0_40px_-12px_var(--color-neon)] md:h-[4.5rem] md:pl-10"
      >
        {/* Hover'da alttan dolan neon zemin */}
        <span
          aria-hidden
          className="absolute inset-0 translate-y-full rounded-full bg-neon transition-transform duration-500 ease-expo group-hover:translate-y-0"
        />
        <span data-magnetic-label className="relative flex items-center gap-4">
          <span className="type-wide text-sm transition-colors duration-500 group-hover:text-void md:text-base">
            {children}
          </span>
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-full bg-neon text-void transition-colors duration-500 group-hover:bg-void group-hover:text-neon md:size-12"
          >
            <svg viewBox="0 0 24 24" className="size-5 -rotate-45" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </span>
      </a>
    </div>
  );
}
