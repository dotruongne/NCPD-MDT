import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const money = (n: number) => "$" + n.toLocaleString("en-US");

export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

export function trackingCode(prefix: string) {
  const s = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${s}`;
}

export function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000);
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export function dutyHoursInPeriod(
  logs: { clockIn: Date; clockOut: Date | null }[],
  periodStart: Date,
  periodEnd: Date
) {
  const start = periodStart.getTime();
  const end = periodEnd.getTime();
  const totalMs = logs.reduce((sum, log) => {
    const clockIn = Math.max(log.clockIn.getTime(), start);
    const clockOut = Math.min(log.clockOut?.getTime() ?? end, end);
    return sum + Math.max(0, clockOut - clockIn);
  }, 0);
  return totalMs / (60 * 60 * 1000);
}
