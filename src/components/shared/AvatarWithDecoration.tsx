import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Crown, Star, Flame, ShieldCheck } from 'lucide-react';

interface AvatarWithDecorationProps {
  userId?: string;
  avatarUrl?: string | null;
  name?: string;
  frameCode?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: { container: 'w-8 h-8', text: 'text-xs', icon: 'w-3 h-3', ring: 'p-0.5' },
  md: { container: 'w-10 h-10', text: 'text-sm', icon: 'w-4 h-4', ring: 'p-1' },
  lg: { container: 'w-16 h-16', text: 'text-xl', icon: 'w-5 h-5', ring: 'p-1.5' },
  xl: { container: 'w-24 h-24', text: 'text-3xl', icon: 'w-7 h-7', ring: 'p-2' },
};

export const AvatarWithDecoration = ({
  userId,
  avatarUrl,
  name,
  frameCode: propFrameCode,
  size = 'md',
  className = '',
}: AvatarWithDecorationProps) => {
  const [frameCode, setFrameCode] = useState<string | null>(propFrameCode || null);
  const sizeCfg = sizeClasses[size];

  useEffect(() => {
    if (propFrameCode !== undefined && propFrameCode !== null) {
      setFrameCode(propFrameCode);
    }

    if (!userId) return;

    // Fetch user's equipped_frame_code from profiles
    const fetchFrame = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('equipped_frame_code')
          .eq('id', userId)
          .maybeSingle();

        setFrameCode(data?.equipped_frame_code || null);
      } catch (err) {
        console.error('Error fetching frame code:', err);
      }
    };

    fetchFrame();

    // Listen to local event and Supabase Realtime for instant avatar update across all users
    window.addEventListener('avatar_updated', fetchFrame);

    const channel = supabase
      .channel(`avatar-realtime-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload: any) => {
          if (payload.new?.equipped_frame_code !== undefined) {
            setFrameCode(payload.new.equipped_frame_code);
          }
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('avatar_updated', fetchFrame);
      supabase.removeChannel(channel);
    };
  }, [userId, propFrameCode]);

  const initial = (name || 'U').charAt(0).toUpperCase();

  // Render Discord-style Frame Overlay
  const renderFrameEffect = () => {
    if (!frameCode) return null;

    if (frameCode === 'frame_dragon_gold_3d') {
      return (
        <>
          {/* Animated Glowing Ring */}
          <div className="absolute -inset-1.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 animate-spin-slow opacity-85 blur-xs pointer-events-none" />
          <Crown className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-5 h-5 text-yellow-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] animate-bounce" />
        </>
      );
    }

    if (frameCode === 'frame_sakura_gold') {
      return (
        <>
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-400 via-rose-500 to-amber-400 animate-pulse opacity-90 pointer-events-none" />
          <Sparkles className="absolute -top-2 -right-1 w-4 h-4 text-pink-300 animate-pulse" />
        </>
      );
    }

    return (
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-primary via-amber-400 to-primary animate-pulse opacity-80 pointer-events-none" />
    );
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {renderFrameEffect()}

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
