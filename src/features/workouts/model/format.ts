import type { Units } from '@/features/auth/api/current-user.service';

const LB_PER_KG = 2.2046226218;
const DISPLAY_DIGITS = 2;

export function kgToUnits(kg: number, units: Units): number {
  const value = units === 'lb' ? kg * LB_PER_KG : kg;
  const factor = 10 ** DISPLAY_DIGITS;
  return Math.round(value * factor) / factor;
}

export function unitsToKg(value: number, units: Units): number {
  const kg = units === 'lb' ? value / LB_PER_KG : value;
  return Math.round(kg * 1000) / 1000;
}

export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized.length === 0 || !/^-?(\d+\.?\d*|\.\d+)$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function parseInteger(text: string): number | null {
  const trimmed = text.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

export function parseDuration(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const parts = trimmed.split(':');
  if (parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) {
    return null;
  }
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  return hours > 0
    ? `${String(hours)}:${pad(minutes)}:${pad(rest)}`
    : `${String(minutes)}:${pad(rest)}`;
}

export function formatNumber(value: number, language: string): string {
  return new Intl.NumberFormat(language, {
    maximumFractionDigits: DISPLAY_DIGITS,
  }).format(value);
}

export function formatWeight(
  kg: number,
  units: Units,
  language: string,
): string {
  return formatNumber(kgToUnits(kg, units), language);
}

export function toLocalInput(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(value: string): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
