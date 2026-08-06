/**
 * Hệ thống XP · Cấp độ · Danh hiệu (Rank) nâng cao
 */

export interface RankTier {
  code: string;
  name: string;
  minLevel: number;
  emoji: string;
  /** class gradient dùng cho badge/khung danh hiệu */
  gradient: string;
  ring: string;
  text: string;
  perk: string;
}

export const RANK_TIERS: RankTier[] = [
  { code: 'tan_binh', name: 'Tân Binh Nhập Môn', minLevel: 1, emoji: '🌱', gradient: 'from-slate-400 to-slate-500', ring: 'ring-slate-400/40', text: 'text-slate-500', perk: 'Mở khóa nhiệm vụ hằng ngày' },
  { code: 'dong', name: 'Học Giả Đồng', minLevel: 5, emoji: '🥉', gradient: 'from-amber-700 to-orange-600', ring: 'ring-amber-700/40', text: 'text-amber-700', perk: 'Giảm 5% giá XP tại Cửa hàng' },
  { code: 'bac', name: 'Học Giả Bạc', minLevel: 10, emoji: '🥈', gradient: 'from-slate-300 to-slate-500', ring: 'ring-slate-300/50', text: 'text-slate-400', perk: 'Mở khóa khung avatar hạng Bạc' },
  { code: 'vang', name: 'Học Giả Vàng', minLevel: 18, emoji: '🥇', gradient: 'from-amber-400 to-yellow-500', ring: 'ring-amber-400/50', text: 'text-amber-500', perk: 'Hiển thị viền vàng trên Bảng xếp hạng' },
  { code: 'bach_kim', name: 'Kiếm Sĩ Bạch Kim', minLevel: 28, emoji: '⚔️', gradient: 'from-cyan-300 to-sky-500', ring: 'ring-cyan-400/50', text: 'text-cyan-500', perk: 'Ưu tiên xét duyệt lớp học 1-1' },
  { code: 'kim_cuong', name: 'Cao Thủ Kim Cương', minLevel: 40, emoji: '💎', gradient: 'from-indigo-400 via-violet-500 to-fuchsia-500', ring: 'ring-violet-400/50', text: 'text-violet-500', perk: 'Nhận x1.2 XP mỗi hoạt động' },
  { code: 'huyen_thoai', name: 'Huyền Thoại Sakura', minLevel: 60, emoji: '🌸', gradient: 'from-rose-400 via-pink-500 to-red-500', ring: 'ring-rose-400/60', text: 'text-rose-500', perk: 'Khung Huyền Thoại độc quyền + tên phát sáng' },
  { code: 'thien_menh', name: 'Thiên Mệnh Long Thần', minLevel: 85, emoji: '🐉', gradient: 'from-yellow-300 via-amber-500 to-rose-600', ring: 'ring-amber-400/70', text: 'text-amber-500', perk: 'Đỉnh cao danh vọng — hiệu ứng Rồng Thần' },
];

/** Đường cong XP: level n cần 20*(n-1)^2 XP (giữ tương thích dữ liệu cũ) */
export const calcXpForLevel = (level: number) => Math.pow(Math.max(1, level) - 1, 2) * 20;
export const calcLevel = (totalXp: number) => Math.floor(Math.sqrt(Math.max(0, totalXp) / 20)) + 1;

export const getRank = (level: number): RankTier => {
  let current = RANK_TIERS[0];
  for (const t of RANK_TIERS) if (level >= t.minLevel) current = t;
  return current;
};

export const getNextRank = (level: number): RankTier | null =>
  RANK_TIERS.find(t => t.minLevel > level) ?? null;

export interface XpSnapshot {
  totalXp: number;
  level: number;
  rank: RankTier;
  nextRank: RankTier | null;
  levelMinXp: number;
  nextLevelMinXp: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelPercent: number;
  xpToNextRank: number;
}

export const buildXpSnapshot = (totalXp: number): XpSnapshot => {
  const safeXp = Math.max(0, totalXp || 0);
  const level = calcLevel(safeXp);
  const levelMinXp = calcXpForLevel(level);
  const nextLevelMinXp = calcXpForLevel(level + 1);
  const xpIntoLevel = Math.max(0, safeXp - levelMinXp);
  const xpForNextLevel = Math.max(1, nextLevelMinXp - levelMinXp);
  const nextRank = getNextRank(level);
  return {
    totalXp: safeXp,
    level,
    rank: getRank(level),
    nextRank,
    levelMinXp,
    nextLevelMinXp,
    xpIntoLevel,
    xpForNextLevel,
    levelPercent: Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100)),
    xpToNextRank: nextRank ? Math.max(0, calcXpForLevel(nextRank.minLevel) - safeXp) : 0,
  };
};

/** Độ hiếm của huy hiệu dựa trên yêu cầu mở khóa */
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export const RARITY_META: Record<BadgeRarity, { label: string; color: string; border: string; glow: string }> = {
  common:    { label: 'Phổ thông', color: 'text-slate-500',  border: 'border-slate-400/40',  glow: 'from-slate-400/10 to-slate-500/5' },
  rare:      { label: 'Hiếm',      color: 'text-sky-500',    border: 'border-sky-400/50',    glow: 'from-sky-400/15 to-cyan-500/5' },
  epic:      { label: 'Sử thi',    color: 'text-violet-500', border: 'border-violet-400/50', glow: 'from-violet-500/15 to-fuchsia-500/5' },
  legendary: { label: 'Huyền thoại', color: 'text-amber-500', border: 'border-amber-400/60', glow: 'from-amber-400/20 to-orange-500/10' },
};

export const getBadgeRarity = (reqType: string, reqValue: number): BadgeRarity => {
  const v = Number(reqValue) || 0;
  if (reqType === 'streak_days') {
    if (v >= 100) return 'legendary';
    if (v >= 30) return 'epic';
    if (v >= 7) return 'rare';
    return 'common';
  }
  if (v >= 10000) return 'legendary';
  if (v >= 3000) return 'epic';
  if (v >= 500) return 'rare';
  return 'common';
};

/** Nguồn kiếm XP hiển thị cho học viên */
export const XP_SOURCES: { icon: string; label: string; xp: string }[] = [
  { icon: '📘', label: 'Hoàn thành 1 bài học', xp: '+20 XP' },
  { icon: '📝', label: 'Nộp bài tập đúng hạn', xp: '+30 XP' },
  { icon: '🎯', label: 'Đạt trên 80% bài kiểm tra', xp: '+50 XP' },
  { icon: '🗓️', label: 'Điểm danh học mỗi ngày', xp: '+10 XP' },
  { icon: '🎥', label: 'Tham gia đủ buổi học trực tuyến', xp: '+25 XP' },
  { icon: '🔥', label: 'Duy trì streak 7 ngày', xp: '+100 XP' },
];