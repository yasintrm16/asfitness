import { cn } from "@/lib/utils";

/** Beş küçük yıldız. Ekran okuyucuya puanı tek cümleyle söyler. */
export function Stars({ label = "5 üzerinden 5 yıldız", className }: { label?: string; className?: string }) {
  return (
    <span role="img" aria-label={label} className={cn("inline-flex gap-1 text-accent", className)}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} aria-hidden viewBox="0 0 24 24" className="size-3" fill="currentColor">
          <path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
        </svg>
      ))}
    </span>
  );
}
