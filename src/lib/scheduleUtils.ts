import { format, addDays } from 'date-fns';

export interface SessionData {
  id: string;
  session_date: string;
  start_time: string;
  end_time: string | null;
  topic: string | null;
}

/**
 * Shifts an array of sessions so that each session takes the date of the next session.
 * The last session will be shifted based on the weekday pattern of the existing sessions.
 */
export const shiftSessionsToNextAvailableDay = (sessions: SessionData[]): { id: string, newDate: string }[] => {
  if (!sessions || sessions.length === 0) return [];

  // Sort sessions by date just to be sure
  const sorted = [...sessions].sort((a, b) => 
    new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
  );

  const updates: { id: string, newDate: string }[] = [];

  // Determine the weekdays pattern used in these sessions
  const weekdays = new Set<number>();
  sorted.forEach(s => {
    weekdays.add(new Date(s.session_date).getDay());
  });

  const availableWeekdays = Array.from(weekdays).sort();
  if (availableWeekdays.length === 0) return []; // Fallback

  for (let i = 0; i < sorted.length; i++) {
    const currentSession = sorted[i];
    
    if (i < sorted.length - 1) {
      // Shift to the exact date of the next session
      updates.push({
        id: currentSession.id,
        newDate: sorted[i + 1].session_date
      });
    } else {
      // For the last session, we need to calculate the next available day 
      // based on the schedule pattern
      let nextDate = new Date(currentSession.session_date);
      let safetyCounter = 0;
      
      // Keep adding days until we hit a weekday that exists in our schedule
      do {
        nextDate = addDays(nextDate, 1);
        safetyCounter++;
      } while (!availableWeekdays.includes(nextDate.getDay()) && safetyCounter < 14);

      updates.push({
        id: currentSession.id,
        newDate: format(nextDate, 'yyyy-MM-dd')
      });
    }
  }

  return updates;
};
