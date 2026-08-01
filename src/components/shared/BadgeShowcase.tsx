import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Star, Flame, Award, Zap, CheckCircle2, Lock, Sparkles } from 'lucide-react';

export interface BadgeShowcaseProps {
  userId: string;
  role?: 'student' | 'teacher' | 'admin' | string;
  compact?: boolean;
}

interface BadgeItem {
  id: string;
  code: string;
  title_vi: string;
  description_vi?: string | null;
  icon_url?: string | null;
  badge_type: string;
  req_type: string;
  req_value: number;
  bonus_xp: number;
  unlocked?: boolean;
  unlocked_at?: string;
}

export const calcLevel = (totalXp: number) => {
  return Math.floor(Math.sqrt(Math.max(0, totalXp) / 20)) + 1;
};

export const calcXpForLevel = (level: number) => {
  return Math.pow(level - 1, 2) * 20;
};

const BadgeShowcase = ({ userId, role = 'student', compact = false }: BadgeShowcaseProps) => {
  const [totalXp, setTotalXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user progress
        const { data: prog } = await supabase
          .from('user_progress')
          .select('total_xp, streak')
          .eq('user_id', userId)
          .maybeSingle();

        if (prog) {
          setTotalXp(prog.total_xp || 0);
          setStreak(prog.streak || 0);
        }

        // Fetch all badges
        const { data: allBadges } = await supabase
          .from('badges')
          .select('*')
          .eq('is_active', true)
          .order('req_value', { ascending: true });

        // Fetch user unlocked badges
        const { data: unlockedData } = await supabase
          .from('user_badges')
          .select('badge_id, unlocked_at')
          .eq('user_id', userId);

        const unlockedMap = new Map((unlockedData || []).map(u => [u.badge_id, u.unlocked_at]));

        const mappedBadges: BadgeItem[] = (allBadges || [])
          .filter(b => b.target_role === 'all' || b.target_role === role)
          .map(b => {
            const isUnlocked = unlockedMap.has(b.id);
            return {
              ...b,
              unlocked: isUnlocked,
              unlocked_at: unlockedMap.get(b.id),
            };
          });

        setBadges(mappedBadges);
      } catch (err) {
        console.error('BadgeShowcase fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, role]);

  const level = calcLevel(totalXp);
  const currentLevelMinXp = calcXpForLevel(level);
  const nextLevelMinXp = calcXpForLevel(level + 1);
  const levelProgressXp = Math.max(0, totalXp - currentLevelMinXp);
  const xpNeededForNext = Math.max(1, nextLevelMinXp - currentLevelMinXp);
  const progressPercent = Math.min(100, Math.floor((levelProgressXp / xpNeededForNext) * 100));

  const unlockedCount = badges.filter(b => b.unlocked).length;

  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl border bg-card/60 backdrop-blur">
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 text-white font-extrabold flex items-center justify-center text-sm shadow-md">
          {level}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-bold flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Level {level}
            </span>
            <span className="text-muted-foreground font-mono">{totalXp} XP</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
        {streak > 0 && (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 text-xs shrink-0">
            <Flame className="w-3 h-3 fill-amber-500" /> {streak} ngày
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className="border-2 overflow-hidden shadow-sm">
      <CardHeader className="bg-muted/30 border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 text-white font-extrabold flex flex-col items-center justify-center shadow-lg border-2 border-white/40">
              <span className="text-[9px] uppercase tracking-wider opacity-90 leading-none">Level</span>
              <span className="text-xl leading-none font-black">{level}</span>
            </div>
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                Hệ thống Danh hiệu & Cấp độ
                <Badge variant="secondary" className="text-xs bg-amber-500/10 text-amber-600 border-amber-500/20">
                  {totalXp} XP tích lũy
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Đã sở hữu {unlockedCount}/{badges.length} danh hiệu
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {streak > 0 && (
              <Badge className="bg-amber-500 text-white gap-1 px-3 py-1 text-xs shadow-md">
                <Flame className="w-4 h-4 fill-white" /> Chuỗi {streak} ngày liên tục
              </Badge>
            )}
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-muted-foreground">Tiến trình Cấp độ {level}</span>
            <span className="text-primary font-mono">{levelProgressXp} / {xpNeededForNext} XP (Cần {nextLevelMinXp - totalXp} XP nữa để lên Level {level + 1})</span>
          </div>
          <Progress value={progressPercent} className="h-2 rounded-full" />
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            Bộ sưu tập Huy hiệu ({unlockedCount}/{badges.length})
          </h4>
        </div>

        {loading ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Đang tải danh hiệu...</div>
        ) : badges.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Chưa có danh hiệu nào.</div>
        ) : (
          <TooltipProvider>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {badges.map((b) => (
                <Tooltip key={b.id}>
                  <TooltipTrigger asChild>
                    <div
                      className={`p-3 rounded-2xl border-2 text-center transition-all duration-300 relative group cursor-pointer ${
                        b.unlocked
                          ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/10 to-yellow-500/5 shadow-md hover:scale-105 hover:border-amber-500'
                          : 'border-border bg-muted/20 opacity-50 grayscale hover:opacity-75'
                      }`}
                    >
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-background flex items-center justify-center text-2xl shadow-inner border border-border group-hover:scale-110 transition-transform overflow-hidden p-1">
                        {b.icon_url?.startsWith('http') ? (
                          <img src={b.icon_url} alt={b.title_vi} className="w-full h-full object-contain" />
                        ) : (
                          <span>{b.icon_url || '⭐'}</span>
                        )}
                      </div>
                      <p className="font-bold text-xs truncate text-foreground">{b.title_vi}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        {b.unlocked ? (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Đã mở
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Lock className="w-3 h-3" /> Chưa mở
                          </span>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs text-xs space-y-1 p-3">
                    <p className="font-bold text-sm flex items-center gap-1">
                      {b.icon_url || '⭐'} {b.title_vi}
                    </p>
                    <p className="text-muted-foreground">{b.description_vi || 'Mô tả danh hiệu'}</p>
                    {b.bonus_xp > 0 && <p className="text-amber-500 font-semibold">+ {b.bonus_xp} XP thưởng khi mở khóa</p>}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgeShowcase;
