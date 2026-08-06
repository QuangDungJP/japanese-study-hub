import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Zap, Flame, Award } from 'lucide-react';
import AvatarWithDecoration from '@/components/shared/AvatarWithDecoration';
import { buildXpSnapshot } from '@/lib/xpRanks';

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  streak: number;
  lessons_completed: number;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
    equipped_frame_code?: string | null;
  };
}

export const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();

    const channel = supabase
      .channel('leaderboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_progress' },
        () => fetchLeaderboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // Fetch top 10 from user_progress with profiles join
      const { data, error } = await (supabase as any)
        .from('user_progress')
        .select('user_id, total_xp, streak, lessons_completed, profiles(full_name, avatar_url, equipped_frame_code)')
        .order('total_xp', { ascending: false })
        .limit(10);

      if (!error && data && data.length > 0) {
        const mapped = (data as any[]).map((row) => ({
          user_id: row.user_id,
          total_xp: row.total_xp ?? 0,
          streak: row.streak ?? 0,
          lessons_completed: row.lessons_completed ?? 0,
          profile: {
            full_name: row.profiles?.full_name ?? null,
            avatar_url: row.profiles?.avatar_url ?? null,
            equipped_frame_code: row.profiles?.equipped_frame_code ?? null,
          },
        }));
        setEntries(mapped);
      } else {
        // Fallback to rpc if query fails
        const { data: rpcData } = await supabase.rpc('get_leaderboard', { _limit: 10 });
        if (rpcData) {
          const mapped = (rpcData as any[]).map((row, i) => ({
            user_id: row.user_id || `rank-${i}`,
            total_xp: row.total_xp ?? 0,
            streak: row.streak ?? 0,
            lessons_completed: row.lessons_completed ?? 0,
            profile: {
              full_name: row.display_name ?? null,
              avatar_url: row.avatar_url ?? null,
              equipped_frame_code: row.equipped_frame_code ?? null,
            },
          }));
          setEntries(mapped);
        }
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border shadow-soft animate-pulse">
        <div className="h-6 w-36 bg-muted rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-3xl p-6 border shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="font-extrabold text-lg">Bảng Xếp Hạng XP</h3>
        </div>
        <Award className="w-5 h-5 text-muted-foreground opacity-50" />
      </div>

      <div className="space-y-2">
        {entries.map((entry, index) => (
          <div
            key={entry.user_id || index}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
              index === 0
                ? 'bg-amber-500/10 border-amber-400/40 shadow-sm'
                : index === 1
                ? 'bg-slate-500/10 border-slate-300/40'
                : index === 2
                ? 'bg-amber-700/10 border-amber-600/30'
                : 'hover:bg-muted/50 border-transparent'
            }`}
          >
            {/* Rank badge */}
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                index === 0
                  ? 'bg-amber-500 text-white shadow-md'
                  : index === 1
                  ? 'bg-slate-400 text-white'
                  : index === 2
                  ? 'bg-amber-700 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1}
            </div>

            {/* Avatar with Decoration & Name */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <AvatarWithDecoration
                userId={entry.user_id}
                avatarUrl={entry.profile?.avatar_url}
                name={entry.profile?.full_name}
                frameCode={entry.profile?.equipped_frame_code}
                size="sm"
              />
              <div className="min-w-0">
                <p className="font-bold text-foreground text-sm truncate leading-tight">
                  {entry.profile?.full_name || 'Học viên'}
                </p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(() => {
                    const s = buildXpSnapshot(entry.total_xp);
                    return (
                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r ${s.rank.gradient} text-white shadow-sm`}
                        title={`${s.rank.name} · Đặc quyền: ${s.rank.perk}`}
                      >
                        {s.rank.emoji} Lv.{s.level} {s.rank.name}
                      </span>
                    );
                  })()}
                  {entry.streak > 0 && (
                    <span className="text-[10px] text-orange-500 font-semibold flex items-center gap-0.5">
                      <Flame className="w-3 h-3 fill-current" /> {entry.streak}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* XP score */}
            <div className="flex items-center gap-1 text-sm font-extrabold text-amber-500 font-mono shrink-0">
              <Zap className="w-4 h-4 fill-current" />
              <span>{entry.total_xp.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
