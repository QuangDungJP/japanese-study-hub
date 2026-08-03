import { supabase } from '@/integrations/supabase/client';

export interface CustomFrameConfig {
  style: 'ring' | 'dashed' | 'double' | 'aura' | 'image';
  ringFrom: string;
  ringVia: string;
  ringTo: string;
  thickness: number;      // px
  gap: number;            // px offset outside avatar
  glow: number;           // px glow radius
  spin: boolean;
  spinSpeed: number;      // seconds
  pulse: boolean;
  emojiTop: string;
  emojiRight: string;
  emojiBottom: string;
  emojiLeft: string;
  bounceEmoji: boolean;
  labelText: string;
  labelFrom: string;
  labelTo: string;
  overlayImage: string;
}

export const DEFAULT_FRAME_CONFIG: CustomFrameConfig = {
  style: 'ring',
  ringFrom: '#f59e0b',
  ringVia: '#fde047',
  ringTo: '#f97316',
  thickness: 3,
  gap: 8,
  glow: 14,
  spin: true,
  spinSpeed: 8,
  pulse: false,
  emojiTop: '👑',
  emojiRight: '',
  emojiBottom: '',
  emojiLeft: '',
  bounceEmoji: true,
  labelText: '',
  labelFrom: '#f59e0b',
  labelTo: '#ef4444',
  overlayImage: '',
};

export interface CustomFrameRecord {
  code: string;
  name: string;
  description: string;
  cover_image?: string | null;
  config: CustomFrameConfig;
  price_vnd?: number;
  price_xp?: number;
  is_active?: boolean;
}

export const normalizeFrameConfig = (raw: any): CustomFrameConfig => ({
  ...DEFAULT_FRAME_CONFIG,
  ...(raw && typeof raw === 'object' ? raw : {}),
});

let cache: Record<string, CustomFrameRecord> | null = null;
let inflight: Promise<Record<string, CustomFrameRecord>> | null = null;

export const getCachedCustomFrame = (code?: string | null) =>
  code && cache ? cache[code] : undefined;

export const loadCustomFrames = async (force = false): Promise<Record<string, CustomFrameRecord>> => {
  if (cache && !force) return cache;
  if (inflight && !force) return inflight;

  inflight = (async () => {
    try {
      const { data } = await (supabase as any)
        .from('store_items')
        .select('code, title_vi, description_vi, cover_image, content_data, price_vnd, price_xp, is_active')
        .eq('category', 'avatar_frame');

      const map: Record<string, CustomFrameRecord> = {};
      (data || []).forEach((row: any) => {
        map[row.code] = {
          code: row.code,
          name: row.title_vi,
          description: row.description_vi || '',
          cover_image: row.cover_image,
          config: normalizeFrameConfig(row.content_data?.frame_config ?? row.content_data),
          price_vnd: row.price_vnd,
          price_xp: row.price_xp,
          is_active: row.is_active,
        };
      });
      cache = map;
      return map;
    } catch (err) {
      console.error('Error loading custom avatar frames:', err);
      cache = cache || {};
      return cache;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

export const invalidateCustomFrames = () => {
  cache = null;
  window.dispatchEvent(new Event('custom_frames_updated'));
};
