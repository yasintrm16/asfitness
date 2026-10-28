import type { ReactNode } from "react";

type ArrowLinkProps = {
  href: string;
  children: ReactNode;
  /** Yeni sekmede açılır (ör. Google Haritalar). */
  external?: boolean;
};

/** Küçük metin linki: hover'da kırmızı çizgi soldan çizilir, ok çapraz kayar. */
export function ArrowLink({ href, children, external }: ArrowLinkProps) {
  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className="group type-label inline-flex items-center gap-2 text-chalk"
    >
      <span className="relative">
        {children}
        <span className="absolute -bottom-1.5 left-0 h-px w-full bg-steel" />
        <span className="neon absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-700 ease-expo group-hover:scale-x-100" />
      </span>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="size-3.5 text-accent transition-transform duration-500 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
      >
        <path d="M7 17 17 7M8 7h9v9" />
      </svg>
      {external && <span className="sr-only">(yeni sekmede açılır)</span>}
    </a>
  );
}
