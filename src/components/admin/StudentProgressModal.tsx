import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Flame, 
  Zap, 
  BookOpen, 
  Calendar,
  Target,
  TrendingUp,
  Award,
  Loader2,
  Building,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Plus,
  Minus,
  RotateCcw,
  Sliders,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatWithJST } from '@/lib/dateUtils';
import { adjustUserXpAndStreak } from '@/lib/xpStreakService';
import { toast } from 'sonner';

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
    roles?: string[];
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

interface EnrolledClass {
  id: string;
  class_id: string;
  joined_at: string;
  status: string;
  class?: {
    name: string;
    name_vi: string;
    code: string;
    status: string;
    courses?: {
      title_vi: string;
    };
  };
}

const StudentProgressModal = ({ open, onOpenChange, student }: StudentProgressModalProps) => {
  const [completedLessons, setCompletedLessons] = useState<CompletedLesson[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  // Local interactive stats
  const [localXp, setLocalXp] = useState(0);
  const [localStreak, setLocalStreak] = useState(0);
  const [customXpInput, setCustomXpInput] = useState('');
  const [customStreakInput, setCustomStreakInput] = useState('');

  useEffect(() => {
    if (open && student) {
      setLocalXp(student.progress?.total_xp || 0);
      setLocalStreak(student.progress?.streak || 0);
      fetchStudentDetails();
    }
  }, [open, student]);

  const handleAdjustXpStreak = async (xpDelta: number, streakDelta: number = 0, streakSet?: number) => {
    if (!student) return;
    setAdjusting(true);
    try {
      const res = await adjustUserXpAndStreak({
        userId: student.user_id,
        xpDelta,
        streakDelta,
        streakSet,
      });

      setLocalXp(res.totalXp);
      setLocalStreak(res.streak);
      toast.success('Đã cập nhật XP / Streak cho học viên thành công!');
    } catch (e: any) {
      toast.error('Lỗi khi cập nhật XP/Streak: ' + e.message);
    } finally {
      setAdjusting(false);
    }
  };

  const handleApplyCustomXp = () => {
    const val = parseInt(customXpInput, 10);
    if (isNaN(val)) return toast.error('Vui lòng nhập số hợp lệ');
    handleAdjustXpStreak(val, 0);
    setCustomXpInput('');
  };

  const handleApplyCustomStreak = () => {
    const val = parseInt(customStreakInput, 10);
    if (isNaN(val)) return toast.error('Vui lòng nhập số hợp lệ');
    handleAdjustXpStreak(0, 0, val);
    setCustomStreakInput('');
  };

  const fetchStudentDetails = async () => {
    if (!student) return;
    setLoading(true);
    try {
      // 1. Fetch completed lessons
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

      // 2. Fetch enrolled classes
      const { data: classStudents } = await supabase
        .from('class_students')
        .select('*, class:classes(*, courses(title_vi))')
        .eq('student_id', student.user_id);

      setEnrolledClasses((classStudents as any) || []);
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!student) return null;

  const progress = student.progress;
  const dailyPercent = progress ? Math.min((progress.daily_progress / (progress.daily_goal || 50)) * 100, 100) : 0;
  const level = Math.floor(localXp / 500) + 1;
  const currentLevelXp = localXp - ((level - 1) * 500);
  const levelPercent = Math.min((currentLevelXp / 500) * 100, 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto p-0">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-primary via-indigo-600 to-accent p-6 text-white relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl shadow-xl overflow-hidden shrink-0">
              {student.avatar_url ? (
                <img src={student.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                student.full_name?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold">{student.full_name || 'Chưa đặt tên'}</h2>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  Lv.{level} Student
                </Badge>
              </div>
              <p className="text-xs text-white/80">
                📅 Ngày gia nhập: {formatWithJST(student.created_at, false)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Level & XP Banner */}
          <div className="bg-gradient-to-br from-primary/5 via-indigo-50/20 to-accent/5 rounded-2xl p-5 border border-primary/20 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-bold text-base text-foreground">Cấp độ học tập: Level {level}</span>
              </div>
              <span className="text-xs font-semibold text-primary">
                {localXp.toLocaleString()} XP tích lũy
              </span>
            </div>
            <Progress value={levelPercent} className="h-3 bg-primary/10" />
            <div className="flex justify-between text-xs text-muted-foreground pt-0.5">
              <span>{currentLevelXp} / 500 XP (Level {level})</span>
              <span>Cần {500 - currentLevelXp} XP để lên Level {level + 1}</span>
            </div>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="overview" className="gap-2 text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5" /> Chỉ số Tiến độ
              </TabsTrigger>
              <TabsTrigger value="classes" className="gap-2 text-xs font-semibold">
                <Building className="w-3.5 h-3.5" /> Lớp học ({enrolledClasses.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5" /> Bài học hoàn thành
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Key Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-border/80 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-foreground">{localXp.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground font-medium">Tổng XP tích lũy</p>
                </div>
                <div className="bg-card rounded-2xl border border-border/80 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2 animate-bounce" />
                  <p className="text-2xl font-extrabold text-foreground">{localStreak}</p>
                  <p className="text-xs text-muted-foreground font-medium">Chuỗi Streak (Ngày)</p>
                </div>
                <div className="bg-card rounded-2xl border border-border/80 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  <BookOpen className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-foreground">{progress?.lessons_completed || 0}</p>
                  <p className="text-xs text-muted-foreground font-medium">Bài học đã học</p>
                </div>
                <div className="bg-card rounded-2xl border border-border/80 p-4 text-center shadow-sm hover:shadow-md transition-shadow">
                  <Target className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-foreground">{progress?.vocabulary_mastered || 0}</p>
                  <p className="text-xs text-muted-foreground font-medium">Từ vựng thành thạo</p>
                </div>
              </div>

              {/* ⚡ Dynamic Admin / Teacher Controls: Cộng / Trừ XP & Streak */}
              <div className="bg-muted/20 border border-border rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">Quản lý Cộng / Trừ XP & Streak (Admin / Giáo viên)</h3>
                  </div>
                  {adjusting && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                </div>

                <div className="grid md:grid-cols-2 gap-5 pt-1">
                  {/* XP Adjustments */}
                  <div className="space-y-2 bg-card p-3.5 rounded-xl border">
                    <label className="text-xs font-bold flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <Zap className="w-4 h-4" /> Điều chỉnh XP tích lũy
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-emerald-600 hover:bg-emerald-50" onClick={() => handleAdjustXpStreak(10, 0)} disabled={adjusting}>+10 XP</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-emerald-600 hover:bg-emerald-50" onClick={() => handleAdjustXpStreak(50, 0)} disabled={adjusting}>+50 XP</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-emerald-600 hover:bg-emerald-50" onClick={() => handleAdjustXpStreak(100, 0)} disabled={adjusting}>+100 XP</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-emerald-600 hover:bg-emerald-50" onClick={() => handleAdjustXpStreak(500, 0)} disabled={adjusting}>+500 XP</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-rose-600 hover:bg-rose-50" onClick={() => handleAdjustXpStreak(-50, 0)} disabled={adjusting}>-50 XP</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-rose-600 hover:bg-rose-50" onClick={() => handleAdjustXpStreak(-100, 0)} disabled={adjusting}>-100 XP</Button>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="number"
                        placeholder="Số XP (+ / -)..."
                        value={customXpInput}
                        onChange={e => setCustomXpInput(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button size="sm" className="h-8 text-xs font-semibold shrink-0" onClick={handleApplyCustomXp} disabled={adjusting}>
                        Cập nhật
                      </Button>
                    </div>
                  </div>

                  {/* Streak Adjustments */}
                  <div className="space-y-2 bg-card p-3.5 rounded-xl border">
                    <label className="text-xs font-bold flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                      <Flame className="w-4 h-4" /> Điều chỉnh Streak (Ngày)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-orange-600 hover:bg-orange-50" onClick={() => handleAdjustXpStreak(0, 1)} disabled={adjusting}>+1 ngày</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-orange-600 hover:bg-orange-50" onClick={() => handleAdjustXpStreak(0, 5)} disabled={adjusting}>+5 ngày</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-rose-600 hover:bg-rose-50" onClick={() => handleAdjustXpStreak(0, -1)} disabled={adjusting}>-1 ngày</Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs font-bold text-muted-foreground hover:bg-muted" onClick={() => handleAdjustXpStreak(0, 0, 0)} disabled={adjusting}>Reset 0</Button>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Input
                        type="number"
                        placeholder="Đặt Streak cụ thể..."
                        value={customStreakInput}
                        onChange={e => setCustomStreakInput(e.target.value)}
                        className="h-8 text-xs"
                      />
                      <Button size="sm" className="h-8 text-xs font-semibold shrink-0" onClick={handleApplyCustomStreak} disabled={adjusting}>
                        Đặt Streak
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Progress */}
              <div className="bg-card rounded-2xl border border-border/80 p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-bold text-sm">Mục tiêu XP hôm nay</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {progress?.daily_progress || 0} / {progress?.daily_goal || 50} XP
                  </span>
                </div>
                <Progress value={dailyPercent} className="h-2.5" />
              </div>
            </TabsContent>

            <TabsContent value="classes" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : enrolledClasses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium text-sm">Học viên chưa đăng ký lớp học trực tuyến nào.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {enrolledClasses.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-border bg-card flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                          {item.class?.courses?.title_vi || 'Khóa học'}
                        </Badge>
                        <h4 className="font-bold text-sm text-foreground">{item.class?.name_vi || item.class?.name}</h4>
                        <p className="text-xs text-muted-foreground">Mã lớp: {item.class?.code} • Tham gia ngày: {formatWithJST(item.joined_at, false)}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                        {item.status || 'Active'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : completedLessons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium text-sm">Chưa có bài học nào được hoàn thành gần đây.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border divide-y divide-border overflow-hidden">
                  {completedLessons.map((cl) => (
                    <div key={cl.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-bold text-sm text-foreground">{cl.lesson?.title_vi || cl.lesson?.title || 'Bài học'}</p>
                        <p className="text-xs text-muted-foreground">
                          Kỹ năng: {skillLabels[cl.lesson?.skill || ''] || cl.lesson?.skill || 'Nhật ngữ'} • {formatWithJST(cl.completed_at, false)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {cl.score !== null && (
                          <Badge variant="outline" className="text-xs font-bold text-primary border-primary/30">
                            {cl.score}%
                          </Badge>
                        )}
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          +{cl.lesson?.xp_reward || 25} XP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProgressModal;

