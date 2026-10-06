import { format, addDays } from 'date-fns';

export interface SessionData {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  topic: string | null;
  status?: string;
}

/** Parse 'yyyy-MM-dd' as a LOCAL date (new Date('yyyy-MM-dd') is UTC and shifts days). */
export const parseLocalDate = (s: string): Date => {
  const [y, m, d] = (s || '').slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};

export const todayStr = () => format(new Date(), 'yyyy-MM-dd');

/**
 * Shifts sessions so each takes the date of the next one; the last moves to the
 * next weekday in the class pattern (avoiding dates already used by other sessions).
 */
export const shiftSessionsToNextAvailableDay = (
  sessions: SessionData[],
  occupiedDates: string[] = [],
): { id: string; newDate: string }[] => {
  if (!sessions || sessions.length === 0) return [];

  const sorted = [...sessions].sort((a, b) =>
    a.session_date === b.session_date
      ? (a.start_time || '').localeCompare(b.start_time || '')
      : a.session_date.localeCompare(b.session_date),
  );

  const weekdays = new Set<number>();
  sorted.filter(s => s.status !== 'makeup').forEach(s => weekdays.add(parseLocalDate(s.session_date).getDay()));
  if (weekdays.size === 0) sorted.forEach(s => weekdays.add(parseLocalDate(s.session_date).getDay()));

  const occupied = new Set(occupiedDates);
  const updates: { id: string; newDate: string }[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i < sorted.length - 1) {
      updates.push({ id: sorted[i].id, newDate: sorted[i + 1].session_date });
    } else {
      let next = parseLocalDate(sorted[i].session_date);
      let guard = 0;
      do {
        next = addDays(next, 1);
        guard++;
      } while ((!weekdays.has(next.getDay()) || occupied.has(format(next, 'yyyy-MM-dd'))) && guard < 60);
      updates.push({ id: sorted[i].id, newDate: format(next, 'yyyy-MM-dd') });
    }
  }
  return updates;
};
