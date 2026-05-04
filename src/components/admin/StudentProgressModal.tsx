import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  Flame, 
  Zap, 
  BookOpen, 
  Calendar,
  Target,
  TrendingUp,
  Award,
  Loader2,
  Save,
  Bell,
  ShoppingBag,
  CalendarCheck,
  GraduationCap,
  User as UserIcon
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
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Editable profile
  const [fullName, setFullName] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState('english');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Editable progress
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(50);
  const [vocab, setVocab] = useState(0);

  // Counts
  const [counts, setCounts] = useState({ bookings: 0, orders: 0, classes: 0, submissions: 0 });

  // Notification
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');

  useEffect(() => {
    if (open && student) {
      setFullName(student.full_name || '');
      setCurrentLanguage(student.current_language || 'english');
      setAvatarUrl(student.avatar_url || '');
      setXp(student.progress?.total_xp || 0);
      setStreak(student.progress?.streak || 0);
      setDailyGoal(student.progress?.daily_goal || 50);
      setVocab(student.progress?.vocabulary_mastered || 0);
      fetchCompletedLessons();
      fetchCounts();
    }
  }, [open, student]);

  const fetchCounts = async () => {
    if (!student) return;
    const [b, o, c, s] = await Promise.all([
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('user_id', student.user_id),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', student.user_id),
      supabase.from('class_students').select('id', { count: 'exact', head: true }).eq('student_id', student.user_id),
      supabase.from('student_submissions').select('id', { count: 'exact', head: true }).eq('user_id', student.user_id),
    ]);
    setCounts({
      bookings: b.count || 0,
      orders: o.count || 0,
      classes: c.count || 0,
      submissions: s.count || 0,
    });
  };

  const saveProfile = async () => {
    if (!student) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName, current_language: currentLanguage, avatar_url: avatarUrl })
        .eq('user_id', student.user_id);
      if (error) throw error;
      toast({ title: 'Đã lưu', description: 'Thông tin hồ sơ đã được cập nhật' });
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveProgress = async () => {
    if (!student) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_progress')
        .update({ total_xp: xp, streak, daily_goal: dailyGoal, vocabulary_mastered: vocab })
        .eq('user_id', student.user_id);
      if (error) throw error;
      toast({ title: 'Đã lưu', description: 'Tiến độ đã được cập nhật' });
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sendNotification = async () => {
    if (!student || !notifTitle || !notifMessage) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('notifications').insert({
        user_id: student.user_id,
        title: notifTitle,
        message: notifMessage,
        type: 'info',
      });
      if (error) throw error;
      toast({ title: 'Đã gửi', description: 'Thông báo đã được gửi' });
      setNotifTitle('');
      setNotifMessage('');
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              {student.full_name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-xl font-bold">{student.full_name || 'Chưa đặt tên'}</p>
              <p className="text-sm text-muted-foreground font-normal">
                Tham gia từ {new Date(student.created_at).toLocaleDateString('vi-VN')}
                {' • ID: '}
                <code className="text-xs">{student.user_id.slice(0, 8)}…</code>
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="mt-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
            <TabsTrigger value="progress">Tiến độ</TabsTrigger>
            <TabsTrigger value="notify">Thông báo</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-4">
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

          {/* Activity counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <GraduationCap className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{counts.classes}</p>
              <p className="text-xs text-muted-foreground">Lớp đã tham gia</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <CalendarCheck className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{counts.bookings}</p>
              <p className="text-xs text-muted-foreground">Lịch đặt</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <ShoppingBag className="w-6 h-6 text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{counts.orders}</p>
              <p className="text-xs text-muted-foreground">Đơn hàng</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <BookOpen className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{counts.submissions}</p>
              <p className="text-xs text-muted-foreground">Bài nộp</p>
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
          </TabsContent>

          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Họ và tên</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>URL ảnh đại diện</Label>
              <Input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Ngôn ngữ đang học</Label>
              <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="japanese">Japanese</SelectItem>
                  <SelectItem value="korean">Korean</SelectItem>
                  <SelectItem value="chinese">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveProfile} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu hồ sơ
            </Button>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tổng XP</Label>
                <Input type="number" value={xp} onChange={(e) => setXp(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Streak (ngày)</Label>
                <Input type="number" value={streak} onChange={(e) => setStreak(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Mục tiêu hằng ngày (XP)</Label>
                <Input type="number" value={dailyGoal} onChange={(e) => setDailyGoal(parseInt(e.target.value) || 0)} />
              </div>
              <div className="space-y-2">
                <Label>Từ vựng đã thuộc</Label>
                <Input type="number" value={vocab} onChange={(e) => setVocab(parseInt(e.target.value) || 0)} />
              </div>
            </div>
            <Button onClick={saveProgress} disabled={saving} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Lưu tiến độ
            </Button>
          </TabsContent>

          <TabsContent value="notify" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Tiêu đề</Label>
              <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="VD: Chúc mừng!" />
            </div>
            <div className="space-y-2">
              <Label>Nội dung</Label>
              <Textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} rows={4} />
            </div>
            <Button onClick={sendNotification} disabled={saving || !notifTitle || !notifMessage} className="w-full gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
              Gửi thông báo
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default StudentProgressModal;
