import { useState, useEffect } from 'react';
import { Trophy, Flame, Zap, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardEntry {
  user_id: string;
  total_xp: number;
  streak: number;
  lessons_completed: number;
  profile: {
    full_name: string | null;
  } | null;
}

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('leaderboard-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
        },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase.rpc('get_leaderboard', { _limit: 10 });
      if (error) throw error;
      if (data) {
        const mapped = (data as any[]).map((row, i) => ({
          user_id: `rank-${i}`,
          total_xp: row.total_xp ?? 0,
          streak: row.streak ?? 0,
          lessons_completed: row.lessons_completed ?? 0,
          profile: { full_name: row.display_name ?? null },
        }));
        setEntries(mapped);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden">
      <div className="p-4 border-b border-border bg-gradient-primary text-primary-foreground">
        <h2 className="font-bold flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Bảng xếp hạng
        </h2>
      </div>
      
      <div className="divide-y divide-border">
        {entries.map((entry, index) => (
          <div 
            key={entry.user_id}
            className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors"
          >
            {/* Rank */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              index === 0 ? 'bg-yellow-500/20 text-yellow-600' :
              index === 1 ? 'bg-gray-300/30 text-gray-500' :
              index === 2 ? 'bg-orange-500/20 text-orange-600' :
              'bg-muted text-muted-foreground'
            }`}>
              {index + 1}
            </div>

            {/* Avatar & Name */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                {entry.profile?.full_name?.[0]?.toUpperCase() || '?'}
              </div>
              <span className="font-medium text-foreground text-sm truncate">
                {entry.profile?.full_name || 'Học viên'}
              </span>
            </div>

            {/* XP */}
            <div className="flex items-center gap-1 text-sm">
              <Zap className="w-4 h-4 text-accent" />
              <span className="font-bold text-primary">{entry.total_xp.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
