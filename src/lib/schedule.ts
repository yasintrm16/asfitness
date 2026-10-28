import { useSyncExternalStore } from "react";
import { hours } from "./site";

// Ziyaretçi nerede olursa olsun "bugün" ve "açık mı" salonun yerel saatine göre hesaplanır.
const TIME_ZONE = "Europe/Istanbul";
const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

function readSnapshot() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const day = WEEKDAYS[part("weekday")];
  const now = Number(part("hour")) * 60 + Number(part("minute"));
  const today = hours.find((h) => h.days.includes(day));
  const close = today ? toMinutes(today.close) || 24 * 60 : 0;
  const open = !!today && now >= toMinutes(today.open) && now < close;

  // useSyncExternalStore kararlı bir değer ister: nesne yerine primitive döndürüyoruz.
  return `${day}:${open ? 1 : 0}`;
}

function subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 30_000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

/**
 * Salonun yerel gün/açık bilgisi. Sunucuda (prerender) null döner; böylece
 * hydration uyuşmazlığı olmaz ve build sırasında `new Date()` çağrılmaz.
 */
export function useGymClock() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => null);
  if (!snapshot) return null;
  const [day, open] = snapshot.split(":");
  return { day: Number(day), open: open === "1" };
}
