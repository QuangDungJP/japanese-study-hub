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
 * Find the next date (after `fromDate`) that falls on one of the given weekdays
 * and is not in the occupied set.
 */
const nextAvailableDate = (
  fromDate: Date,
  weekdays: Set<number>,
  occupied: Set<string>,
): Date => {
  let d = addDays(fromDate, 1);
  for (let guard = 0; guard < 180; guard++) {
    if (weekdays.has(d.getDay()) && !occupied.has(format(d, 'yyyy-MM-dd'))) return d;
    d = addDays(d, 1);
  }
  return d; // fallback (should not hit)
};

/**
 * Shifts ALL `sessions` (the affected subset) forward by one slot each in the
 * class's weekday pattern.
 *
 * Rules:
 * - Weekday pattern is inferred from non-makeup, non-cancelled scheduled sessions.
 * - Makeup sessions passed in the list are NOT shifted (excluded from output).
 * - Dates already taken by non-affected sessions (occupiedDates) are skipped.
 * - Each session is shifted to the next available weekday slot AFTER its own current date.
 *   This prevents the "chain swap" bug where session i got session i+1's date, causing
 *   cascading collisions.
 */
export const shiftSessionsToNextAvailableDay = (
  sessions: SessionData[],
  occupiedDates: string[] = [],
): { id: string; newDate: string }[] => {
  if (!sessions || sessions.length === 0) return [];

  // Only shift non-makeup sessions
  const toShift = [...sessions]
    .filter(s => s.status !== 'makeup')
    .sort((a, b) =>
      a.session_date === b.session_date
        ? (a.start_time || '').localeCompare(b.start_time || '')
        : a.session_date.localeCompare(b.session_date),
    );

  if (toShift.length === 0) return [];

  // Detect weekday pattern from the sessions being shifted (non-makeup)
  const weekdays = new Set<number>(toShift.map(s => parseLocalDate(s.session_date).getDay()));

  // Build occupied set: starts with externally occupied dates
  // We will add newly assigned dates as we go to prevent intra-shift collisions
  const occupied = new Set<string>(occupiedDates);

  const updates: { id: string; newDate: string }[] = [];

  for (const session of toShift) {
    const currentDate = parseLocalDate(session.session_date);
    const newDate = nextAvailableDate(currentDate, weekdays, occupied);
    const newDateStr = format(newDate, 'yyyy-MM-dd');
    // Mark this newly assigned date as occupied so the next session won't land on it
    occupied.add(newDateStr);
    updates.push({ id: session.id, newDate: newDateStr });
  }

  return updates;
};
