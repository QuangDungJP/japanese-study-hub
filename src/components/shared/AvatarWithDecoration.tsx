import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Crown, Heart, Star, Sun, Moon } from 'lucide-react';
import CustomAvatarFrame from './CustomAvatarFrame';
import { CustomFrameRecord, getCachedCustomFrame, loadCustomFrames } from '@/lib/customAvatarFrames';

export interface AvatarFrameInfo {
  code: string;
  name: string;
  description: string;
  previewClass?: string;
  icon?: string;
}

export const AVATAR_FRAMES_CATALOG: AvatarFrameInfo[] = [
  { code: 'frame_sunflower', name: 'Khung Hướng Dương', description: 'Vòng hoa hướng dương rực rỡ mang năng lượng tích cực' },
  { code: 'frame_crescent_moon', name: 'Khung Trăng Khuyết Thủy Tinh', description: 'Mặt trăng huyền ảo đính pha lê lấp lánh' },
  { code: 'frame_red_hood', name: 'Khung Áo Choàng Đỏ', description: 'Áo choàng nhung đỏ phong cách huyền bí' },
  { code: 'frame_golden_halo', name: 'Khung Hào Quang Thái Dương', description: 'Vòng tròn mặt trời & sao vàng thần thánh' },
  { code: 'frame_hearts', name: 'Khung Trái Tim Dễ Thương', description: 'Hiệu ứng biểu cảm trái tim mộng mơ' },
  { code: 'frame_manga_style', name: 'Khung Manga / Anime', description: 'Nét vẽ bùng nổ phong cách truyện tranh Nhật Bản' },
  { code: 'frame_cat_ears', name: 'Khung Tai Mèo & Râu Mèo', description: 'Tai mèo dễ thương ngộ nghĩnh cho học viên' },
  { code: 'frame_sparkle_gold', name: 'Khung Tinh Tú Vàng', description: 'Các ngôi sao lấp lánh tỏa sáng 8 hướng' },
  { code: 'frame_purple_moon', name: 'Khung Trăng Tím Gothic', description: 'Mặt trăng tím mộng mơ chảy giọt nghệ thuật' },
  { code: 'frame_dragon_gold_3d', name: 'Khung Rồng Thần 3D Gold', description: 'Aura Rồng Thần 3D mạ vàng cao cấp' },
  { code: 'frame_sakura_gold', name: 'Khung Hoa Anh Đào Gold', description: 'Cánh hoa Sakura hồng vàng lơ lửng' },
];

interface AvatarWithDecorationProps {
  userId?: string;
  avatarUrl?: string | null;
  name?: string;
  frameCode?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  onClick?: () => void;
}

const sizeClasses = {
  sm:  { container: 'w-8 h-8', text: 'text-xs', crown: 'w-3.5 h-3.5 -top-2.5', inset: '-inset-1' },
  md:  { container: 'w-10 h-10', text: 'text-sm', crown: 'w-4 h-4 -top-3', inset: '-inset-1.5' },
  lg:  { container: 'w-16 h-16', text: 'text-xl', crown: 'w-5 h-5 -top-4', inset: '-inset-2' },
  xl:  { container: 'w-24 h-24', text: 'text-3xl', crown: 'w-7 h-7 -top-5', inset: '-inset-3' },
  '2xl': { container: 'w-28 h-28', text: 'text-4xl', crown: 'w-8 h-8 -top-6', inset: '-inset-3.5' },
  '3xl': { container: 'w-32 h-32', text: 'text-5xl', crown: 'w-9 h-9 -top-7', inset: '-inset-4' },
};

export const AvatarWithDecoration = ({
  userId,
  avatarUrl: propAvatarUrl,
  name: propName,
  frameCode: propFrameCode,
  size = 'md',
  className = '',
  onClick,
}: AvatarWithDecorationProps) => {
  const [frameCode, setFrameCode] = useState<string | null>(propFrameCode || null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(propAvatarUrl || null);
  const [name, setName] = useState<string | undefined>(propName);
  const [customFrame, setCustomFrame] = useState<CustomFrameRecord | undefined>(() => getCachedCustomFrame(propFrameCode));

  useEffect(() => {
    let alive = true;
    const sync = async () => {
      if (!frameCode || frameCode.startsWith('http') || frameCode.startsWith('/')) {
        setCustomFrame(undefined);
        return;
      }
      const cached = getCachedCustomFrame(frameCode);
      if (cached) { setCustomFrame(cached); return; }
      const map = await loadCustomFrames();
      if (alive) setCustomFrame(map[frameCode]);
    };
    sync();
    const onUpdated = () => { loadCustomFrames(true).then(map => { if (alive) setCustomFrame(frameCode ? map[frameCode] : undefined); }); };
    window.addEventListener('custom_frames_updated', onUpdated);
    return () => { alive = false; window.removeEventListener('custom_frames_updated', onUpdated); };
  }, [frameCode]);

  const sizeCfg = sizeClasses[size] || sizeClasses.md;
  // Kích thước avatar thực tế (px) để scale khung theo tỉ lệ, tránh khung tràn ra ngoài
  const pxMap: Record<string, number> = { sm: 32, md: 40, lg: 64, xl: 96, '2xl': 112, '3xl': 128 };
  const avatarPx = pxMap[size] ?? 40;
  const FRAME_BASE = 96; // khung được thiết kế cho avatar 96px
  const frameScale = avatarPx / FRAME_BASE;

  useEffect(() => {
    if (propFrameCode !== undefined) setFrameCode(propFrameCode);
    if (propAvatarUrl !== undefined) setAvatarUrl(propAvatarUrl);
    if (propName !== undefined) setName(propName);
  }, [propFrameCode, propAvatarUrl, propName]);

  useEffect(() => {
    if (!userId) return;

    const fetchUserData = async () => {
      try {
        const { data } = await (supabase as any)
          .from('profiles')
          .select('equipped_frame_code, avatar_url, full_name')
          .or(`user_id.eq.${userId},id.eq.${userId}`)
          .maybeSingle();

        if (data) {
          if (propFrameCode === undefined) setFrameCode(data.equipped_frame_code || null);
          if (propAvatarUrl === undefined && data.avatar_url) setAvatarUrl(data.avatar_url);
          if (propName === undefined && data.full_name) setName(data.full_name);
        }
      } catch (err) {
        console.error('Error fetching avatar frame:', err);
      }
    };

    fetchUserData();

    // Cập nhật tức thì khi người dùng đổi khung ở trang khác (không cần reload)
    const onFrameEvent = (e: Event) => {
      const detail = (e as CustomEvent).detail as { userId?: string; frameCode?: string | null; avatarUrl?: string | null } | undefined;
      if (detail?.userId && detail.userId === userId) {
        if (propFrameCode === undefined && 'frameCode' in detail) setFrameCode(detail.frameCode ?? null);
        if (propAvatarUrl === undefined && detail.avatarUrl) setAvatarUrl(detail.avatarUrl);
        return;
      }
      fetchUserData();
    };

    window.addEventListener('avatar_updated', onFrameEvent);
    window.addEventListener('frame_updated', onFrameEvent);

    const uniqueChannelId = `avatar-rt-${userId}-${Math.random().toString(36).substring(2, 9)}`;
    const channel = (supabase as any)
      .channel(uniqueChannelId)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload: any) => {
          if (payload.new?.id === userId || payload.new?.user_id === userId) {
            if (payload.new.equipped_frame_code !== undefined) setFrameCode(payload.new.equipped_frame_code);
            if (payload.new.avatar_url !== undefined) setAvatarUrl(payload.new.avatar_url);
            if (payload.new.full_name !== undefined) setName(payload.new.full_name);
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('avatar_updated', onFrameEvent);
      window.removeEventListener('frame_updated', onFrameEvent);
      (supabase as any).removeChannel(channel);
    };
  }, [userId, propFrameCode, propAvatarUrl, propName]);

  const initial = (name || 'U').charAt(0).toUpperCase();

  // Render SVG / CSS Frame Overlay Effects matching reference designs
  const renderFrameEffect = () => {
    if (!frameCode) return null;

    // Admin-designed custom frame (from store_items)
    if (customFrame) {
      return <CustomAvatarFrame config={customFrame.config} scale={1} />;
    }

    // Direct Image URL Frame
    if (frameCode.startsWith('http://') || frameCode.startsWith('https://') || frameCode.startsWith('/')) {
      return (
        <img
          src={frameCode}
          alt="Avatar Frame"
          className="absolute -inset-3.5 w-[calc(100%+28px)] h-[calc(100%+28px)] pointer-events-none z-10 object-contain drop-shadow-md"
        />
      );
    }

    // Preset 1: Sunflower
    if (frameCode === 'frame_sunflower') {
      return (
        <div className="absolute -inset-2.5 pointer-events-none z-10 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse" />
          <span className="absolute -top-2 left-1 text-sm animate-bounce">🌻</span>
          <span className="absolute -top-2 right-1 text-sm">🌻</span>
          <span className="absolute -bottom-2 left-2 text-sm">🌻</span>
          <span className="absolute -bottom-2 right-2 text-sm animate-bounce">🌻</span>
        </div>
      );
    }

    // Preset 2: Crescent Moon Crystal
    if (frameCode === 'frame_crescent_moon') {
      return (
        <div className="absolute -inset-3 pointer-events-none z-10">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500/20 via-sky-400/30 to-purple-500/20 animate-pulse blur-xs" />
          <div className="absolute inset-0 border-2 border-sky-300/80 rounded-full shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
          <Moon className="absolute -top-3 -right-2 w-6 h-6 text-sky-200 fill-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.8)] animate-pulse" />
          <Sparkles className="absolute -bottom-2 -left-1 w-4 h-4 text-indigo-300 animate-spin-slow" />
        </div>
      );
    }

    // Preset 3: Red Hood Cape
    if (frameCode === 'frame_red_hood') {
      return (
        <div className="absolute -inset-3 pointer-events-none z-10">
          <div className="absolute -top-3 inset-x-0 h-8 bg-gradient-to-b from-rose-600 to-red-700 rounded-t-full border-b-2 border-rose-400 shadow-md flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-500 shadow-xs" />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-rose-600/70" />
        </div>
      );
    }

    // Preset 4: Golden Halo / Sun Ring
    if (frameCode === 'frame_golden_halo') {
      return (
        <div className="absolute -inset-3 pointer-events-none z-10">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-400 animate-spin-slow" style={{ animationDuration: '12s' }} />
          <div className="absolute inset-[2px] rounded-full border border-yellow-300/80 shadow-[0_0_12px_rgba(234,179,8,0.6)]" />
          <Sun className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 text-yellow-300 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)] animate-pulse" />
          <Star className="absolute -bottom-2 -right-1 w-4 h-4 text-amber-300 fill-amber-300 animate-bounce" />
        </div>
      );
    }

    // Preset 5: Cute Hearts
    if (frameCode === 'frame_hearts') {
      return (
        <div className="absolute -inset-2.5 pointer-events-none z-10">
          <div className="absolute inset-0 rounded-full border-2 border-pink-400/80 shadow-[0_0_10px_rgba(244,114,182,0.5)]" />
          <Heart className="absolute -top-2 left-0 w-4 h-4 text-pink-400 fill-pink-400 animate-bounce" />
          <Heart className="absolute -top-3 right-1 w-5 h-5 text-rose-400 fill-rose-500 animate-pulse" />
          <Heart className="absolute -bottom-2 left-2 w-3.5 h-3.5 text-pink-300 fill-pink-300" />
        </div>
      );
    }

    // Preset 6: Manga / Anime Action Lines
    if (frameCode === 'frame_manga_style') {
      return (
        <div className="absolute -inset-3 pointer-events-none z-10">
          <div className="absolute inset-0 rounded-full border-2 border-fuchsia-500 shadow-[0_0_10px_rgba(217,70,239,0.6)]" />
          <span className="absolute -top-3 right-0 bg-fuchsia-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-md shadow-md animate-pulse">
            あ!
          </span>
          <span className="absolute -bottom-2 left-0 text-fuchsia-400 font-extrabold text-xs">⚡</span>
        </div>
      );
    }

    // Preset 7: Cat Ears & Whiskers
    if (frameCode === 'frame_cat_ears') {
      return (
        <div className="absolute -inset-3 pointer-events-none z-10">
          {/* Left Cat Ear */}
          <div className="absolute -top-3.5 left-1 w-5 h-5 bg-pink-200 border-2 border-pink-400 rotate-[-20deg] rounded-tl-xl clip-triangle" />
          {/* Right Cat Ear */}
          <div className="absolute -top-3.5 right-1 w-5 h-5 bg-pink-200 border-2 border-pink-400 rotate-[20deg] rounded-tr-xl clip-triangle" />
          <div className="absolute inset-0 rounded-full border-2 border-pink-300 shadow-[0_0_8px_rgba(244,114,182,0.4)]" />
        </div>
      );
    }

    // Preset 8: Golden Sparkle Stars
    if (frameCode === 'frame_sparkle_gold') {
      return (
        <div className="absolute -inset-3 pointer-events-none z-10">
          <div className="absolute inset-0 rounded-full border-2 border-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.7)] animate-pulse" />
          <Sparkles className="absolute -top-3 -right-2 w-5 h-5 text-yellow-300 animate-spin-slow" />
          <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-amber-400 animate-pulse" />
          <Star className="absolute top-1/2 -left-3 -translate-y-1/2 w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
          <Star className="absolute top-1/2 -right-3 -translate-y-1/2 w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
        </div>
      );
    }

    // Preset 9: Purple Drip Crescent Moon
    if (frameCode === 'frame_purple_moon') {
      return (
        <div className="absolute -inset-3 pointer-events-none z-10">
          <div className="absolute inset-0 rounded-full bg-purple-600/10 border-2 border-purple-500 shadow-[0_0_14px_rgba(168,85,247,0.6)]" />
          <Moon className="absolute -top-3 -right-2 w-6 h-6 text-purple-300 fill-purple-400 animate-pulse" />
          <div className="absolute -bottom-2 inset-x-4 h-2 bg-purple-500/80 rounded-b-full blur-xs" />
        </div>
      );
    }

    // Preset 10: 3D Dragon Gold
    if (frameCode === 'frame_dragon_gold_3d') {
      return (
        <div className="absolute -inset-3.5 pointer-events-none z-10">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-600 animate-spin-slow opacity-85 blur-xs" />
          <div className="absolute inset-[2px] rounded-full border-2 border-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.8)]" />
          <Crown className={`absolute ${sizeCfg.crown} left-1/2 -translate-x-1/2 text-yellow-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] animate-bounce`} />
        </div>
      );
    }

    // Preset 11: Sakura Gold
    if (frameCode === 'frame_sakura_gold') {
      return (
        <div className="absolute -inset-3 pointer-events-none z-10">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-pink-400 via-rose-500 to-amber-400 animate-pulse opacity-90" />
          <div className="absolute inset-[2px] rounded-full border-2 border-pink-200" />
          <Sparkles className="absolute -top-2 -right-1 w-4 h-4 text-pink-200 animate-pulse" />
        </div>
      );
    }

    // Default Fallback Frame
    return (
      <div className="absolute -inset-2 pointer-events-none z-10">
        <div className="absolute inset-0 rounded-full border-2 border-primary/80 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
      </div>
    );
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center shrink-0 ${onClick ? 'cursor-pointer hover:scale-105 transition-transform' : ''} ${className}`}
    >
      {frameCode && (
        <div
          className="absolute left-1/2 top-1/2 z-10 pointer-events-none"
          style={{
            width: FRAME_BASE,
            height: FRAME_BASE,
            transform: `translate(-50%, -50%) scale(${frameScale})`,
            transformOrigin: 'center',
          }}
        >
          {renderFrameEffect()}
        </div>
      )}

      <div className={`relative rounded-full overflow-hidden bg-muted border-2 border-background shadow-md flex items-center justify-center ${sizeCfg.container}`}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={name || 'Avatar'} className="w-full h-full object-cover" />
        ) : (
          <span className={`font-black text-primary ${sizeCfg.text}`}>{initial}</span>
        )}
      </div>
    </div>
  );
};

export default AvatarWithDecoration;
