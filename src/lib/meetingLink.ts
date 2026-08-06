/**
 * Tiện ích mở phòng học trực tuyến NGAY TRONG WEBSITE (all-in-one)
 * vẫn giữ khả năng mở tab mới như trước.
 */

export const MEETING_ROOM_PATH = '/phong-hoc';

export const buildMeetingRoomUrl = (url: string, title?: string) => {
  const params = new URLSearchParams({ url });
  if (title) params.set('title', title);
  return `${MEETING_ROOM_PATH}?${params.toString()}`;
};

export const isGoogleMeetUrl = (url?: string | null) =>
  !!url && /(^|\.)meet\.google\.com/.test(url);

/** Chuẩn hóa link: thêm https:// nếu người dùng chỉ nhập mã phòng */
export const normalizeMeetingUrl = (raw?: string | null): string => {
  if (!raw) return '';
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i.test(v)) return `https://meet.google.com/${v}`;
  return `https://${v}`;
};

export const openMeetingPopup = (url: string) => {
  window.open(
    normalizeMeetingUrl(url),
    'tnqdo_meeting',
    'noopener,noreferrer,width=1280,height=800',
  );
};