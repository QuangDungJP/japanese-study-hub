import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Flame, 
  Zap, 
  BookOpen, 
  Calendar,
  Target,
  TrendingUp,
  Award,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface StudentProgressModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    current_language?: string | null;
    progress: {
      total_xp: number;
      streak: number;
      lessons_completed: number;
      vocabulary_mastered: number;
      daily_progress: number;
      daily_goal: number;
    } | null;
  } | null;
}

interface CompletedLesson {
  id: string;
  lesson_id: string;
  completed_at: string;
  score: number | null;
  lesson?: {
    title: string;
    title_vi: string;
    skill: string;
    xp_reward: number;
  };
}

const StudentProgressModal = ({ open, onOpenChange, student }: StudentProgressModalProps) => {
  const [completedLessons, setCompletedLessons] = useState<CompletedLesson[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && student) {
      fetchCompletedLessons();
    }
  }, [open, student]);

  const fetchCompletedLessons = async () => {
    if (!student) return;
    setLoading(true);
    try {
      const { data: completed } = await supabase
        .from('completed_lessons')
        .select('*')
        .eq('user_id', student.user_id)
        .order('completed_at', { ascending: false })
        .limit(10);

      if (completed && completed.length > 0) {
        const lessonIds = completed.map(c => c.lesson_id);
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title, title_vi, skill, xp_reward')
          .in('id', lessonIds);

        const withLessons = completed.map(c => ({
          ...c,
          lesson: lessons?.find(l => l.id === c.lesson_id)
        }));
        setCompletedLessons(withLessons);
      } else {
        setCompletedLessons([]);
      }
    } catch (error) {
      console.error('Error fetching completed lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  const progress = student.progress;
  const dailyPercent = progress ? Math.min((progress.daily_progress / progress.daily_goal) * 100, 100) : 0;
  const level = progress ? Math.floor(progress.total_xp / 500) + 1 : 1;
  const xpForNextLevel = level * 500;
  const currentLevelXp = progress ? progress.total_xp - ((level - 1) * 500) : 0;
  const levelPercent = (currentLevelXp / 500) * 100;

  const skillLabels: Record<string, string> = {
    reading: 'Đọc',
    writing: 'Viết',
    listening: 'Nghe',
    speaking: 'Nói',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              {student.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-xl font-bold">{student.full_name || 'Chưa đặt tên'}</p>
              <p className="text-sm text-muted-foreground font-normal">
                Tham gia từ {new Date(student.created_at).toLocaleDateString('vi-VN')}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Level & XP */}
          <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-5 border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-bold text-lg">Level {level}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {currentLevelXp} / 500 XP
              </span>
            </div>
            <Progress value={levelPercent} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              Cần {500 - currentLevelXp} XP nữa để lên level {level + 1}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Zap className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{progress?.total_xp?.toLocaleString() || 0}</p>
              <p className="text-xs text-muted-foreground">Tổng XP</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{progress?.streak || 0}</p>
              <p className="text-xs text-muted-foreground">Streak ngày</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{progress?.lessons_completed || 0}</p>
              <p className="text-xs text-muted-foreground">Bài học</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{progress?.vocabulary_mastered || 0}</p>
              <p className="text-xs text-muted-foreground">Từ vựng</p>
            </div>
          </div>

          {/* Daily Progress */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="font-medium">Tiến độ hôm nay</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {progress?.daily_progress || 0} / {progress?.daily_goal || 50} XP
              </span>
            </div>
            <Progress value={dailyPercent} className="h-2" />
          </div>

          {/* Recent Completed Lessons */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/30">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Bài học đã hoàn thành gần đây
              </h3>
            </div>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : completedLessons.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground text-sm">
                Chưa hoàn thành bài học nào.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {completedLessons.map((cl) => (
                  <div key={cl.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{cl.lesson?.title_vi || 'Bài học'}</p>
                      <p className="text-xs text-muted-foreground">
                        {skillLabels[cl.lesson?.skill || ''] || cl.lesson?.skill} • {new Date(cl.completed_at).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {cl.score !== null && (
                        <span className="text-sm font-medium text-primary">
                          {cl.score}%
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Zap className="w-3 h-3 text-accent" />
                        +{cl.lesson?.xp_reward || 25}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProgressModal;
