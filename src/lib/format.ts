import { business } from "@/config/business";

const TZ = business.timezone;

export function etDateKey(iso: string | Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export function formatTimeEt(iso: string | Date) {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
  return `${time} ET`;
}

export function formatDateEt(iso: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatDateTimeEt(iso: string | Date) {
  return `${formatDateEt(iso)}, ${formatTimeEt(iso)}`;
}

export function formatWindow(start: string, end: string) {
  const day = formatDateEt(start);
  const left = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(start));
  const right = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(end));
  return `${day} · ${left}–${right} ET`;
}

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

export function formatWeight(lb: number) {
  return `${lb.toLocaleString("en-US", { maximumFractionDigits: 1 })} lb`;
}

export function formatMiles(miles: number) {
  return `${miles.toLocaleString("en-US", { maximumFractionDigits: 1 })} mi`;
}

export function telHref(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const local = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  return `tel:+1${local}`;
}

export function smsHref(phone: string) {
  return telHref(phone).replace("tel:", "sms:");
}

export function mapsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}&travelmode=driving`;
}

export function greeting(now = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(now),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** Scripted service day for the design prototype so the Saturday board stays stable. */
export const SERVICE_DAY = "2026-10-24";

export function todayKey(now = new Date()) {
  return etDateKey(now);
}
