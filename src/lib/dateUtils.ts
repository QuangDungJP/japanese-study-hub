import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

/**
 * Formats a date string or Date object into localized Vietnamese time (0h-24h ngày/tháng/năm)
 * and displays its equivalent in Japan Time (JST).
 * 
 * Vietnam: UTC+7
 * Japan: UTC+9 (Vietnam + 2 hours)
 */
export function formatWithJST(dateInput: string | Date | null | undefined, includeTime = true): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  // If it's a date-only string like "2026-07-27"
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const parts = dateInput.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // Format Vietnam Time
  const vnDateStr = date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const formatVNPart = (dStr: string) => {
    const p = dStr.split('/');
    if (p.length === 3) {
      return `${p[0].padStart(2, '0')}/${p[1].padStart(2, '0')}/${p[2]}`;
    }
    return dStr;
  };
  const dateVN = formatVNPart(vnDateStr);

  if (!includeTime) {
    return dateVN;
  }

  const timeVN = date.toLocaleTimeString('vi-VN', { 
    timeZone: 'Asia/Ho_Chi_Minh', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });

  // Format Japan Time
  const timeJP = date.toLocaleTimeString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  
  const dateJPVal = date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Tokyo' });
  const dateJP = formatVNPart(dateJPVal);

  if (dateVN !== dateJP) {
    return `${timeVN} ngày ${dateVN} (Nhật: ${timeJP} ngày ${dateJP})`;
  }
  
  return `${timeVN} ngày ${dateVN} (Nhật: ${timeJP})`;
}

/**
 * Formats a time string (e.g. "09:00", "18:30") and converts it to JST.
 * Assumes the input is in Vietnam Time (UTC+7) and converts it to Japan Time (UTC+9, +2 hours).
 */
export function formatTimeWithJST(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  const displayHoursVN = hours === 0 ? 24 : hours;
  const jpHours = (hours + 2) % 24;
  const displayHoursJP = jpHours === 0 ? 24 : jpHours;
  
  const minStr = minutes.toString().padStart(2, '0');
  const formattedVN = `${displayHoursVN.toString().padStart(2, '0')}h${minStr}`;
  const formattedJP = `${displayHoursJP.toString().padStart(2, '0')}h${minStr}`;
  
  return `${formattedVN} (Nhật: ${formattedJP})`;
}
