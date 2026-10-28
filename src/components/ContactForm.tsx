"use client";

import { useState, type FormEvent } from "react";
import { whatsappLink } from "@/lib/site";
import { cn } from "@/lib/utils";

const TOPICS = ["Fiyat bilgisi", "Üyelik", "Diğer"] as const;

// Odaklanınca alt çizginin üstünde soldan sağa kırmızı neon çizilir.
const LINE = "neon pointer-events-none absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-700 ease-expo peer-focus:scale-x-100";
const LABEL = "type-label block text-mist";
const INPUT =
  "peer block w-full rounded-none border-0 border-b border-white/20 bg-transparent px-0 pt-3 pb-3 text-lg font-light text-chalk outline-none placeholder:text-fog/60";

function Field({ name, label, placeholder, type = "text", autoComplete, required }: {
  name: string;
  label: string;
  placeholder: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div data-field>
      <label htmlFor={name} className={LABEL}>
        {label}
        {!required && <span className="text-fog"> · isteğe bağlı</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          className={INPUT}
        />
        <span aria-hidden className={LINE} />
      </div>
    </div>
  );
}

/**
 * Sadece alt çizgili, karanlık form. Sunucu gerektirmez: gönderince mesaj, salonun
 * WhatsApp hattında hazır yazılmış olarak açılır.
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const phone = String(data.get("telefon") ?? "").trim();
    const text = [
      `Merhaba, ben ${String(data.get("ad")).trim()}.`,
      `Konu: ${data.get("konu")}`,
      phone ? `Telefon: ${phone}` : null,
      "",
      String(data.get("mesaj")).trim(),
    ]
      .filter((line) => line !== null)
      .join("\n");

    window.open(whatsappLink(text), "_blank", "noopener,noreferrer");
    setSent(true);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-12">
      <div className="grid gap-12 md:grid-cols-2 md:gap-10">
        <Field name="ad" label="Adın soyadın" placeholder="Örn. Emre Kaya" autoComplete="name" required />
        <Field
          name="telefon"
          label="Telefonun"
          placeholder="05xx xxx xx xx"
          type="tel"
          autoComplete="tel"
        />
      </div>

      <fieldset data-field>
        <legend className="type-label text-mist">Konu</legend>
        <div className="mt-5 flex flex-wrap gap-3">
          {TOPICS.map((topic, i) => (
            <label key={topic} className="cursor-pointer">
              <input type="radio" name="konu" value={topic} defaultChecked={i === 0} className="peer sr-only" />
              <span className="type-label inline-flex h-10 items-center rounded-full border border-white/10 px-5 tracking-[0.2em] text-mist transition duration-300 peer-checked:border-accent/80 peer-checked:text-chalk peer-checked:shadow-[0_0_22px_-8px_var(--color-accent)] peer-focus-visible:outline peer-focus-visible:outline-1 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-accent hover:text-chalk">
                {topic}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div data-field>
        <label htmlFor="mesaj" className={LABEL}>
          Mesajın
        </label>
        <div className="relative">
          <textarea
            id="mesaj"
            name="mesaj"
            rows={3}
            required
            placeholder="Merhaba, üyelik ücretleri hakkında bilgi almak istiyorum."
            className={cn(INPUT, "resize-none")}
          />
          <span aria-hidden className={LINE} />
        </div>
      </div>

      <div data-field className="flex flex-wrap items-center gap-x-8 gap-y-5 pt-2">
        <button
          type="submit"
          className="group relative inline-flex h-14 items-center gap-5 overflow-hidden rounded-full border border-white/15 pr-2 pl-7 text-chalk md:h-16 md:pl-8"
        >
          <span
            aria-hidden
            className="absolute inset-0 translate-y-full rounded-full bg-accent transition-transform duration-700 ease-expo group-hover:translate-y-0"
          />
          <span className="type-label relative tracking-[0.24em]">WhatsApp&apos;tan gönder</span>
          <span
            aria-hidden
            className="relative grid size-10 place-items-center rounded-full bg-accent shadow-[0_0_24px_-4px_var(--color-accent)] transition-colors duration-500 group-hover:bg-void md:size-12"
          >
            <svg viewBox="0 0 24 24" className="size-4 -rotate-45" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </button>
        <p aria-live="polite" className="type-body max-w-xs text-sm">
          {sent
            ? "WhatsApp yeni sekmede açıldı — mesajın hazır, göndermen yeterli."
            : "Butona basınca mesajın WhatsApp'ta hazır yazılı açılır."}
        </p>
      </div>
    </form>
  );
}
