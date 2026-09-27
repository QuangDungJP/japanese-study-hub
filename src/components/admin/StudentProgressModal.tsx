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
  Check,
  UserRound,
  Save,
  ExternalLink,
  BriefcaseBusiness,
  Link2,
  Shield
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

interface TeacherProfileSummary {
  display_name: string | null;
  headline: string | null;
  image_url: string | null;
  slug: string | null;
  specializations: unknown;
  is_available: boolean | null;
}

const skillLabels: Record<string, string> = {
  reading: 'Đọc',
  speaking: 'Nói',
  writing: 'Viết',
  listening: 'Nghe',
  vocabulary: 'Từ vựng',
  grammar: 'Ngữ pháp',
  kanji: 'Kanji',
};

const UserProfileModal = ({ open, onOpenChange, student }: StudentProgressModalProps) => {
  const [enrolledClasses, setEnrolledClasses] = useState<EnrolledClass[]>([]);
  const [teachingClasses, setTeachingClasses] = useState<any[]>([]);
  const [completedLessons, setCompletedLessons] = useState<CompletedLesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfileSummary | null>(null);
  const [profileForm, setProfileForm] = useState({ full_name: '', avatar_url: '', current_language: '' });

  // Local interactive stats
  const [localXp, setLocalXp] = useState(0);
  const [localStreak, setLocalStreak] = useState(0);
  const [customXpInput, setCustomXpInput] = useState('');
  const [customStreakInput, setCustomStreakInput] = useState('');

  useEffect(() => {
    if (open && student) {
      setLocalXp(student.progress?.total_xp || 0);
      setLocalStreak(student.progress?.streak || 0);
      setProfileForm({
        full_name: student.full_name || '',
        avatar_url: student.avatar_url || '',
        current_language: student.current_language || '',
      });
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

  const handleSaveProfile = async () => {
    if (!student || !profileForm.full_name.trim()) {
      toast.error('Vui lòng nhập tên hiển thị');
      return;
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profileForm.full_name.trim(),
          avatar_url: profileForm.avatar_url.trim() || null,
          current_language: profileForm.current_language.trim() || null,
        })
        .eq('user_id', student.user_id);
      if (error) throw error;
      toast.success('Đã cập nhật hồ sơ tài khoản');
    } catch (error: any) {
      toast.error(error.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchStudentDetails = async () => {
    if (!student) return;
    setLoading(true);
    try {
      // 1. Fetch the public teacher profile when this account is linked to one.
      const { data: teacherData, error: teacherError } = await supabase
        .from('teacher_profiles')
        .select('display_name, headline, image_url, slug, specializations, is_available')
        .eq('user_id', student.user_id)
        .maybeSingle();
      if (teacherError) throw teacherError;
      setTeacherProfile(teacherData);

      // 2. Fetch completed lessons
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

      // 3. Fetch enrolled classes (as a student)
      const { data: classStudents } = await supabase
        .from('class_students')
        .select('*, class:classes(*, courses(title_vi))')
        .eq('student_id', student.user_id);

      setEnrolledClasses((classStudents as any) || []);

      // 4. Fetch teaching classes (if teacher)
      if (student.roles?.includes('teacher') || student.roles?.includes('senior_teacher') || student.roles?.includes('admin')) {
        // Fetch primary classes
        const { data: primaryClasses } = await supabase
          .from('classes')
          .select('*, courses(title_vi)')
          .eq('teacher_id', student.user_id);
          
        const allTeaching = [...(primaryClasses || [])].map(c => ({ class: c, role: 'Giáo viên chính' }));

        // Fetch co-teaching classes (safely, as table might not exist yet)
        try {
          const { data: coClasses, error: coError } = await supabase
            .from('class_teachers')
            .select('class:classes(*, courses(title_vi))')
            .eq('teacher_id', student.user_id);
            
          if (!coError && coClasses) {
            const coTeaching = coClasses.map(c => ({ class: c.class, role: 'Trợ giảng (Co-teacher)' }));
            // Filter duplicates if any
            const existingIds = new Set(allTeaching.map(t => t.class.id));
            coTeaching.forEach(t => {
              if (t.class && !existingIds.has(t.class.id)) {
                allTeaching.push(t);
              }
            });
          }
        } catch (e) {
          console.warn('class_teachers table might not exist yet');
        }
        
        setTeachingClasses(allTeaching);
      }
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
  const primaryRole = ['admin', 'senior_teacher', 'teacher', 'moderator', 'user']
    .find((role) => student.roles?.includes(role)) || 'user';
  const roleLabel: Record<string, string> = {
    admin: 'Admin',
    senior_teacher: 'Giáo viên cao cấp',
    teacher: 'Giáo viên',
    moderator: 'Moderator',
    user: 'Học viên',
  };
  const specializationList = Array.isArray(teacherProfile?.specializations)
    ? teacherProfile.specializations.filter((item): item is string => typeof item === 'string')
    : [];
  const displayName = profileForm.full_name || student.full_name || 'Chưa đặt tên';
  const avatarUrl = profileForm.avatar_url || teacherProfile?.image_url || student.avatar_url || undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto p-0">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-primary via-indigo-600 to-accent p-6 text-white relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-2xl shadow-xl overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full object-cover" alt="" />
              ) : (
                displayName[0]?.toUpperCase() || '?'
              )}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-extrabold">{displayName}</h2>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  Lv.{level} {roleLabel[primaryRole]}
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

          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="profile" className="gap-2 text-xs font-semibold">
                <UserRound className="w-3.5 h-3.5" /> Hồ sơ
              </TabsTrigger>
              <TabsTrigger value="learning" className="gap-2 text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5" /> Chỉ số Tiến độ
              </TabsTrigger>
              <TabsTrigger value="classes" className="gap-2 text-xs font-semibold">
                <Building className="w-3.5 h-3.5" /> Lớp học ({enrolledClasses.length + teachingClasses.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 text-xs font-semibold">
                <BookOpen className="w-3.5 h-3.5" /> Bài học hoàn thành
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-bold">Thông tin tài khoản</h3>
                      <p className="text-xs text-muted-foreground">Dữ liệu hiển thị trong toàn bộ hệ thống.</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">Tên hiển thị</label>
                      <Input value={profileForm.full_name} onChange={(event) => setProfileForm((current) => ({ ...current, full_name: event.target.value }))} />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground">URL avatar</label>
                      <Input value={profileForm.avatar_url} onChange={(event) => setProfileForm((current) => ({ ...current, avatar_url: event.target.value }))} placeholder="https://..." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Ngôn ngữ học</label>
                      <Input value={profileForm.current_language} onChange={(event) => setProfileForm((current) => ({ ...current, current_language: event.target.value }))} placeholder="Tiếng Nhật" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Ngày tham gia</label>
                      <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm">{formatWithJST(student.created_at, false)}</div>
                    </div>
                  </div>
                  <div className="flex justify-end border-t pt-4">
                    <Button size="sm" onClick={handleSaveProfile} disabled={savingProfile} className="gap-2">
                      {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Lưu hồ sơ
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/20 p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-bold">Vai trò & nhận diện</h3>
                      <p className="text-xs text-muted-foreground">Quyền và thiết lập của tài khoản.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(student.roles?.length ? student.roles : ['user']).map((role) => (
                      <Badge key={role} variant={role === 'admin' ? 'default' : 'secondary'}>{roleLabel[role] || role}</Badge>
                    ))}
                  </div>
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Mã tài khoản</dt><dd className="font-mono text-xs">{student.user_id.slice(0, 8)}...</dd></div>
                    <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Ngôn ngữ</dt><dd className="font-medium">{profileForm.current_language || 'Chưa chọn'}</dd></div>
                    <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Mức học tập</dt><dd className="font-bold">Level {level}</dd></div>
                  </dl>
                </div>
              </div>

              {(student.roles?.some((role) => ['admin', 'teacher', 'senior_teacher'].includes(role)) || teacherProfile) && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-background">
                        {teacherProfile?.image_url ? <img src={teacherProfile.image_url} className="h-full w-full object-cover" alt="" /> : <div className="flex h-full items-center justify-center"><BriefcaseBusiness className="h-5 w-5 text-primary" /></div>}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2"><h3 className="truncate font-bold">{teacherProfile?.display_name || 'Chưa liên kết hồ sơ giảng viên'}</h3>{teacherProfile && <Badge variant="secondary">Đã liên kết</Badge>}</div>
                        <p className="mt-1 text-xs text-muted-foreground">{teacherProfile?.headline || (teacherProfile ? 'Hồ sơ công khai của giảng viên' : 'Tạo/liên kết ở Quản lý giảng viên để xuất hiện trên website.')}</p>
                      </div>
                    </div>
                    {teacherProfile?.slug && (
                      <Button asChild size="sm" variant="outline" className="shrink-0 gap-2">
                        <a href={`/giao-vien/${teacherProfile.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Hồ sơ công khai</a>
                      </Button>
                    )}
                  </div>
                  {specializationList.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{specializationList.map((item) => <Badge key={item} variant="outline">{item}</Badge>)}</div>}
                  {!teacherProfile && <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Link2 className="h-4 w-4" /> Liên kết tài khoản được thiết lập trong `/admin/teachers`.</div>}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'XP tích lũy', value: localXp.toLocaleString(), icon: Zap, color: 'text-amber-500' },
                  { label: 'Streak', value: `${localStreak} ngày`, icon: Flame, color: 'text-orange-500' },
                  { label: 'Bài đã học', value: progress?.lessons_completed || 0, icon: BookOpen, color: 'text-primary' },
                  { label: 'Lớp tham gia', value: enrolledClasses.length + teachingClasses.length, icon: Building, color: 'text-emerald-500' },
                ].map(({ label, value, icon: Icon, color }) => <div key={label} className="rounded-lg border bg-card p-3"><Icon className={`mb-2 h-4 w-4 ${color}`} /><p className="font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}
              </div>
            </TabsContent>

            <TabsContent value="learning" className="space-y-6">
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
              ) : enrolledClasses.length === 0 && teachingClasses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="font-medium text-sm">Người dùng này chưa tham gia lớp học trực tuyến nào.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Teaching Classes */}
                  {teachingClasses.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-amber-500" />
                        Lớp Đang Giảng Dạy ({teachingClasses.length})
                      </h3>
                      {teachingClasses.map((item, idx) => (
                        <div key={`teach-${item.class?.id || idx}`} className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-900/10 flex items-center justify-between hover:bg-amber-50/50 transition-colors">
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-white dark:bg-transparent">
                              {item.class?.courses?.title_vi || 'Khóa học'}
                            </Badge>
                            <h4 className="font-bold text-sm text-foreground">{item.class?.name_vi || item.class?.name}</h4>
                            <p className="text-xs text-muted-foreground">Mã lớp: {item.class?.code}</p>
                          </div>
                          <Badge className="capitalize text-xs bg-amber-500 hover:bg-amber-600 text-white border-0">
                            {item.role}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Enrolled Classes */}
                  {enrolledClasses.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mt-2">
                        <BookOpen className="w-4 h-4 text-primary" />
                        Lớp Đang Học ({enrolledClasses.length})
                      </h3>
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

export default UserProfileModal;

