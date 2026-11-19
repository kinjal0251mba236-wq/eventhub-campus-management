import type { EventCategory } from '@/src/types/eventhub';

export const CATEGORY_IMAGE_MAP: Record<EventCategory, string> = {
  Technology: '/src/assets/images/campus_tech_symposium_1795095778722.jpg',
  Academic: '/src/assets/images/campus_academic_seminar_1795095777158.jpg',
  Cultural: '/src/assets/images/campus_cultural_fest_1795095779060.jpg',
  Sports: '/src/assets/images/campus_sports_tournament_1795095779612.jpg',
  Career: '/src/assets/images/campus_academic_seminar_1795095777158.jpg',
  Workshop: '/src/assets/images/campus_tech_symposium_1795095778722.jpg',
};

export function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatShortDateParts(dateStr: string): { month: string; day: string; weekday: string } {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return { month: 'TBD', day: '--', weekday: '' };
  const date = new Date(y, m - 1, d);
  return {
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    day: String(d).padStart(2, '0'),
    weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
  };
}

export function formatDisplayTime(timeStr: string): string {
  const [hh, mm] = timeStr.split(':').map(Number);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return timeStr;
  const suffix = hh >= 12 ? 'PM' : 'AM';
  const hour12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${hour12}:${String(mm).padStart(2, '0')} ${suffix}`;
}

export function isPastEvent(startAtMs: number, nowMs: number = Date.now()): boolean {
  return startAtMs < nowMs;
}
