import { cn } from "@/lib/utils";

const PATHS = {
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4.5 19.5 5.6 15.8A8 8 0 1 1 8.4 18.5Z" />
      <path d="M9.2 8.6c.2-.5.6-.5.9-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c-.1.1-.1.3 0 .5.6 1 1.4 1.8 2.4 2.3.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.6.7c.3.1.4.3.4.5 0 .8-.6 1.6-1.4 1.7-1 .2-2.6-.2-4.4-1.9-1.7-1.6-2.4-3.2-2.3-4.2 0-.5.3-1 .6-1.4Z" />
    </>
  ),
  maps: (
    <>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  phone: (
    <path d="M6.6 3.5h2.6l1.4 4-2 1.4a11 11 0 0 0 6.5 6.5l1.4-2 4 1.4v2.6c0 1-.8 1.9-1.9 1.8C10.5 18.6 5.4 13.5 4.8 5.4c-.1-1 .8-1.9 1.8-1.9Z" />
  ),
  arrow: <path d="M7 17 17 7M8 7h9v9" />,
};

export type IconName = keyof typeof PATHS;

/** İnce çizgili ikon seti (sosyal, telefon, harita, ok). */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("size-[18px]", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      {PATHS[name]}
    </svg>
  );
}
