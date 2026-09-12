import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Clock, Medal, Crown } from 'lucide-react';
import AvatarWithDecoration from '@/components/shared/AvatarWithDecoration';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';

interface ExamLeaderboardEntry {
  student_id: string;
  score: number;
  total: number;
  time_spent_seconds: number;
  submitted_at: string;
  profile?: {
    full_name?: string | null;
    avatar_url?: string | null;
    equipped_frame_code?: string | null;
  };
}

export default function ExamLeaderboard({ examId }: { examId?: string }) {
  const [entries, setEntries] = useState<ExamLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('week');

  useEffect(() => {
    fetchLeaderboard();
  }, [timeFilter, examId]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      // Calculate date boundary based on timeFilter
      const dateBoundary = new Date();
      if (timeFilter === 'week') dateBoundary.setDate(dateBoundary.getDate() - 7);
      else if (timeFilter === 'month') dateBoundary.setMonth(dateBoundary.getMonth() - 1);
      else if (timeFilter === 'year') dateBoundary.setFullYear(dateBoundary.getFullYear() - 1);

      let query = supabase
        .from('exam_attempts')
        .select(`
          student_id, score, total, time_spent_seconds, submitted_at,
          profiles(full_name, avatar_url, equipped_frame_code)
        `)
        .in('status', ['submitted', 'graded'])
        .gte('submitted_at', dateBoundary.toISOString())
        .order('score', { ascending: false })
        .order('time_spent_seconds', { ascending: true }) // Tie-breaker: faster time
        .limit(10);
        
      if (examId && examId !== 'all') {
        query = query.eq('exam_id', examId);
      }

      const { data, error } = await query;

      if (!error && data) {
        // Map data
        const mapped = data.map((row: any) => ({
          student_id: row.student_id,
          score: row.score || 0,
          total: row.total || 180,
          time_spent_seconds: row.time_spent_seconds || 0,
          submitted_at: row.submitted_at,
          profile: {
            full_name: row.profiles?.full_name,
            avatar_url: row.profiles?.avatar_url,
            equipped_frame_code: row.profiles?.equipped_frame_code,
          }
        }));

        // Group by student_id and only keep the best score per student if multiple attempts exist
        const bestScoresMap = new Map<string, ExamLeaderboardEntry>();
        mapped.forEach(entry => {
          const existing = bestScoresMap.get(entry.student_id);
          if (!existing) {
            bestScoresMap.set(entry.student_id, entry);
          } else {
            if (entry.score > existing.score || (entry.score === existing.score && entry.time_spent_seconds < existing.time_spent_seconds)) {
              bestScoresMap.set(entry.student_id, entry);
            }
          }
        });

        // Convert back to array and sort again just to be sure
        const finalEntries = Array.from(bestScoresMap.values())
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return a.time_spent_seconds - b.time_spent_seconds;
          })
          .slice(0, 10);

        // Inject some mock data if empty for demo purposes (as requested)
        if (finalEntries.length === 0) {
          const mockEntries: ExamLeaderboardEntry[] = [
            { student_id: 'mock1', score: 175, total: 180, time_spent_seconds: 5400, submitted_at: new Date().toISOString(), profile: { full_name: 'Nguyễn Văn A', avatar_url: 'https://i.pravatar.cc/150?u=a' } },
            { student_id: 'mock2', score: 160, total: 180, time_spent_seconds: 6000, submitted_at: new Date().toISOString(), profile: { full_name: 'Trần Thị B', avatar_url: 'https://i.pravatar.cc/150?u=b' } },
            { student_id: 'mock3', score: 140, total: 180, time_spent_seconds: 4500, submitted_at: new Date().toISOString(), profile: { full_name: 'Lê Văn C', avatar_url: 'https://i.pravatar.cc/150?u=c' } },
            { student_id: 'mock4', score: 95, total: 180, time_spent_seconds: 7200, submitted_at: new Date().toISOString(), profile: { full_name: 'Phạm Thị D', avatar_url: 'https://i.pravatar.cc/150?u=d' } },
          ];
          setEntries(mockEntries.slice(0, timeFilter === 'year' ? 4 : timeFilter === 'month' ? 3 : 2));
        } else {
          setEntries(finalEntries);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}p ${s}s`;
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-slate-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="font-bold text-zinc-500 w-6 text-center">{index + 1}</span>;
  };

  return (
    <Card className="border-2 shadow-sm bg-white dark:bg-zinc-950">
      <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-none">Bảng Vàng JLPT</h3>
            <p className="text-sm text-muted-foreground mt-1">Top điểm cao nhất thi thử</p>
          </div>
        </div>
        
        <Tabs value={timeFilter} onValueChange={(v: any) => setTimeFilter(v)} className="w-[300px]">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="week">Tuần</TabsTrigger>
            <TabsTrigger value="month">Tháng</TabsTrigger>
            <TabsTrigger value="year">Năm</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            Chưa có dữ liệu xếp hạng trong thời gian này.
          </div>
        ) : (
          <div className="divide-y">
            {entries.map((entry, index) => (
              <div key={entry.student_id} className={`flex items-center p-4 gap-4 transition-colors hover:bg-muted/30 ${index < 3 ? 'bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-950/20' : ''}`}>
                <div className="flex items-center justify-center w-8 shrink-0">
                  {getRankIcon(index)}
                </div>
                <AvatarWithDecoration
                  userId={entry.student_id}
                  avatarUrl={entry.profile?.avatar_url}
                  name={entry.profile?.full_name}
                  frameCode={entry.profile?.equipped_frame_code}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-base truncate">{entry.profile?.full_name || 'Học viên ẩn danh'}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {formatTime(entry.time_spent_seconds)}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-primary leading-none">{entry.score}</p>
                  <p className="text-xs text-muted-foreground">/ {entry.total}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
