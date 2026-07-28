import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Mic, 
  PenTool, 
  Headphones, 
  Flame,
  Zap,
  Target,
  TrendingUp,
  Play,
  Clock,
  ArrowRight,
  GraduationCap,
  Building,
  Sparkles,
  Trophy,
  Video,
  Calendar as CalendarIcon,
  Bell,
  CheckCircle2,
  Radio,
  BookMarked,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLearning } from '@/contexts/LearningContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { formatWithJST, formatTimeWithJST } from '@/lib/dateUtils';

interface Lesson {
  id: string;
  title: string;
  title_vi: string;
  skill: string;
  duration_minutes: number;
  xp_reward: number;
}

interface UpcomingLiveSession {
  id: string;
  title: string;
  teacher_name: string;
  date: string;
  time: string;
  meet_link: string | null;
  type: string;
}

const skills = [
  { id: 'reading', name: 'Đọc hiểu', icon: BookOpen, color: 'text-blue-600 bg-blue-500/10 border-blue-200', href: '/learn/my-classes', description: 'Luyện đọc bài giảng & bài đọc trong Lớp học' },
  { id: 'speaking', name: 'Luyện nói', icon: Mic, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200', href: '/learn/my-classes', description: 'Luyện phản xạ giao tiếp theo giáo trình' },
  { id: 'writing', name: 'Luyện viết', icon: PenTool, color: 'text-purple-600 bg-purple-500/10 border-purple-200', href: '/learn/my-classes', description: 'Luyện viết câu và làm bài tập nộp cho giáo viên' },
  { id: 'listening', name: 'Luyện nghe', icon: Headphones, color: 'text-amber-600 bg-amber-500/10 border-amber-200', href: '/learn/my-classes', description: 'Luyện nghe audio & bài tập nghe trực tuyến' },
];

const JapaneseProverbs = [
  { kanji: "継続は力なり", romaji: "Keizoku wa chikara nari", vi: "Kiên trì chính là sức mạnh" },
  { kanji: "一期一会", romaji: "Ichigo ichie", vi: "Trân trọng từng khoảnh khắc học tập" },
  { kanji: "七転び八起き", romaji: "Nanakorobi yaoki", vi: "Vấp ngã 7 lần, đứng dậy 8 lần" },
  { kanji: "塵も積もれば山となる", romaji: "Chiri mo tsumoreba yama to naru", vi: "Tích tiểu thành đại" },
];

const Dashboard = () => {
  const { userProgress, currentLanguage, loading } = useLearning();
  const { user } = useAuth();
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [skillProgress, setSkillProgress] = useState<Record<string, number>>({});
  const [userName, setUserName] = useState('');
  const [enrolledClassesCount, setEnrolledClassesCount] = useState(0);
  const [nextLiveSession, setNextLiveSession] = useState<UpcomingLiveSession | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [dailyQuote, setDailyQuote] = useState(JapaneseProverbs[0]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // 1. Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .maybeSingle();
      if (profile?.full_name) setUserName(profile.full_name);

      // 2. Fetch enrolled classes count
      const { count: classCount } = await supabase
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id)
        .eq('status', 'active');
      setEnrolledClassesCount(classCount || 0);

      // 3. Fetch unread notifications count
      const { count: notifCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      setUnreadNotificationsCount(notifCount || 0);

      // 4. Fetch upcoming meeting session (either class session or 1-1 booking)
      const todayStr = new Date().toISOString().split('T')[0];
      
      // Check enrolled class_sessions
      const { data: enrollments } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', user.id)
        .eq('status', 'active');

      let foundNextSession: UpcomingLiveSession | null = null;

      if (enrollments && enrollments.length > 0) {
        const classIds = enrollments.map(e => e.class_id);
        const { data: cSessions } = await supabase
          .from('class_sessions')
          .select('*, classes(name_vi)')
          .in('class_id', classIds)
          .gte('session_date', todayStr)
          .order('session_date', { ascending: true })
          .limit(1);

        if (cSessions && cSessions.length > 0) {
          const cs = cSessions[0] as any;
          foundNextSession = {
            id: cs.id,
            title: cs.topic || cs.classes?.name_vi || 'Buổi học trực tuyến',
            teacher_name: cs.classes?.name_vi || 'Giảng viên phụ trách',
            date: cs.session_date,
            time: `${formatTimeWithJST(cs.start_time)}${cs.end_time ? ` - ${formatTimeWithJST(cs.end_time)}` : ''}`,
            meet_link: cs.meet_link || null,
            type: 'Lớp học nhóm',
          };
        }
      }

      // If no class session, check 1-1 bookings
      if (!foundNextSession) {
        const { data: bData } = await supabase
          .from('bookings')
          .select('*, meetings(meet_link)')
          .eq('user_id', user.id)
          .gte('booking_date', todayStr)
          .order('booking_date', { ascending: true })
          .limit(1);

        if (bData && bData.length > 0) {
          const b = bData[0] as any;
          foundNextSession = {
            id: b.id,
            title: `Lịch học 1-1: ${b.teacher_name}`,
            teacher_name: b.teacher_name,
            date: b.booking_date,
            time: formatTimeWithJST(b.booking_time),
            meet_link: b.meetings?.[0]?.meet_link || null,
            type: 'Học 1-1',
          };
        }
      }

      setNextLiveSession(foundNextSession);

      // 5. Fetch recent lessons
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, title_vi, skill, duration_minutes, xp_reward')
        .eq('is_published', true)
        .eq('language', currentLanguage)
        .order('created_at', { ascending: false })
        .limit(4);

      if (lessons) {
        setRecentLessons(lessons);
      }

      // 6. Calculate skill progress
      const { data: completed } = await supabase
        .from('completed_lessons')
        .select('lesson_id, lessons(skill)')
        .eq('user_id', user.id);

      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, skill')
        .eq('is_published', true)
        .eq('language', currentLanguage);

      if (completed && allLessons) {
        const progress: Record<string, number> = {};
        skills.forEach(skill => {
          const total = allLessons.filter(l => l.skill === skill.id).length;
          const done = completed.filter(c => {
            const lesson = c.lessons as unknown as { skill: string } | null;
            return lesson?.skill === skill.id;
          }).length;
          progress[skill.id] = total > 0 ? Math.round((done / total) * 100) : 0;
        });
        setSkillProgress(progress);
      }
    } catch (err) {
      console.error('Error loading student dashboard data:', err);
    }
  };

  useEffect(() => {
    // Pick random proverb on mount
    const randomIdx = Math.floor(Math.random() * JapaneseProverbs.length);
    setDailyQuote(JapaneseProverbs[randomIdx]);

    fetchDashboardData();

    const handleThemeChange = () => {
      fetchDashboardData();
    };
    window.addEventListener('tnqdo_theme_changed', handleThemeChange);

    // Supabase Realtime channel
    const channel = supabase
      .channel('public:student-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completed_lessons' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_progress' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'class_sessions' }, fetchDashboardData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, fetchDashboardData)
      .subscribe();

    return () => {
      window.removeEventListener('tnqdo_theme_changed', handleThemeChange);
      supabase.removeChannel(channel);
    };
  }, [currentLanguage, user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero Banner */}
      <div 
        className="relative rounded-3xl p-6 md:p-10 text-white shadow-soft overflow-hidden border border-white/20 transition-all duration-500"
        style={{ background: 'var(--gradient-primary)' }}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> TNQDO Japanese Hub · 日本語学習
              <Badge className="bg-emerald-500 text-white border-0 text-[10px] gap-1 ml-1 font-bold">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> Realtime
              </Badge>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Konnichiwa, {userName || 'Học viên'}! 🌸
            </h1>
            
            <p className="text-white/90 text-sm md:text-base max-w-xl font-medium leading-relaxed">
              Hãy giữ vững ngọn lửa Streak 🔥, tham gia các buổi học trực tuyến và chinh phục mục tiêu JLPT của bạn hôm nay.
            </p>

            {/* Daily Proverb Quote */}
            <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md p-2.5 px-4 rounded-xl border border-white/10 text-xs text-white/90 mt-1">
              <span className="font-bold text-yellow-300 text-sm">{dailyQuote.kanji}</span>
              <span className="opacity-75">({dailyQuote.romaji})</span>
              <span className="font-semibold text-white">ー "{dailyQuote.vi}"</span>
            </div>
          </div>

          <div className="flex flex-wrap md:flex-col lg:flex-row gap-3">
            <Button variant="secondary" size="lg" className="gap-2 font-bold shadow-lg hover:scale-105 transition-transform" asChild>
              <Link to="/learn/my-classes">
                <Building className="w-4 h-4 text-primary" /> Lớp học của tôi ({enrolledClassesCount})
              </Link>
            </Button>
            <Button size="lg" className="bg-white text-japanese hover:bg-white/90 gap-2 font-bold shadow-lg hover:scale-105 transition-transform" asChild>
              <Link to="/learn/zoom">
                <Video className="w-4 h-4 text-japanese" /> Học Online Zoom/Meet
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Active Upcoming Meeting Quick Join Alert */}
      {nextLiveSession && (
        <Card className="border-2 border-emerald-500/40 bg-gradient-to-r from-emerald-500/10 via-card to-card shadow-card-hover">
          <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md animate-pulse">
                <Video className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-600 text-white font-bold text-xs">Buổi học sắp diễn ra</Badge>
                  <span className="text-xs text-muted-foreground font-semibold">{nextLiveSession.type}</span>
                </div>
                <h3 className="font-extrabold text-base text-foreground mt-1">{nextLiveSession.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>GV: <strong className="text-foreground">{nextLiveSession.teacher_name}</strong></span>
                  <span>• Ngày: <strong>{formatWithJST(nextLiveSession.date, false)}</strong></span>
                  <span>• Giờ: <strong>{nextLiveSession.time}</strong></span>
                </div>
              </div>
            </div>

            {nextLiveSession.meet_link ? (
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 shadow-md shrink-0 w-full md:w-auto" asChild>
                <a href={nextLiveSession.meet_link} target="_blank" rel="noopener noreferrer">
                  <Video className="w-4 h-4" /> Vào phòng Meeting ngay
                </a>
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild className="shrink-0 font-bold">
                <Link to="/learn/calendar">Xem trên Lịch học</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-card-hover transition-all duration-300 border border-orange-500/20 bg-gradient-to-br from-card to-orange-500/5 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-orange-500/15 text-orange-500 border border-orange-300/40 shadow-inner">
                <Flame className="w-7 h-7 fill-current animate-bounce" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Chuỗi Streak</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{userProgress.streak} <span className="text-sm font-normal text-muted-foreground">ngày</span></p>
                <p className="text-xs text-orange-600 font-semibold mt-1">🔥 Giữ lửa chăm chỉ!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card-hover transition-all duration-300 border border-amber-500/20 bg-gradient-to-br from-card to-amber-500/5 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-300/40 shadow-inner">
                <Zap className="w-7 h-7 fill-current text-amber-500" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Điểm XP Tích lũy</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{userProgress.totalXp.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">XP</span></p>
                <p className="text-xs text-amber-600 font-semibold mt-1">⚡ Đạt cấp độ cao hơn</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card-hover transition-all duration-300 border border-japanese/20 bg-gradient-to-br from-card to-japanese/5 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-japanese/15 text-japanese border border-japanese/30 shadow-inner">
                <Building className="w-7 h-7 text-japanese" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-japanese">Lớp học tham gia</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{enrolledClassesCount} <span className="text-sm font-normal text-muted-foreground">lớp</span></p>
                <p className="text-xs text-japanese font-semibold mt-1">🏫 Học trực tuyến HD</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-card-hover transition-all duration-300 border border-purple-500/20 bg-gradient-to-br from-card to-purple-500/5 hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/15 text-purple-600 border border-purple-300/40 shadow-inner">
                <Trophy className="w-7 h-7 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-purple-600">Bài học hoàn thành</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{userProgress.lessonsCompleted} <span className="text-sm font-normal text-muted-foreground">bài</span></p>
                <p className="text-xs text-purple-600 font-semibold mt-1">🎯 Đạt mục tiêu JLPT</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily XP Goal & Quick Navigation Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-amber-500/25 bg-gradient-to-br from-card via-amber-500/5 to-card shadow-soft relative overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5 text-amber-500" /> Mục tiêu XP hôm nay
                  </h3>
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-300 text-[11px] font-bold">
                    Hằng ngày
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Tích lũy XP thông qua hoàn thành bài học, bài tập & lớp học trực tuyến</p>
              </div>

              {/* Custom Ultra-Sleek Interactive XP Progress Badge */}
              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 border-2 border-amber-500/40 shadow-sm text-foreground font-black text-sm">
                  <Zap className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
                  <span>{userProgress.dailyProgress}</span>
                  <span className="text-muted-foreground font-normal text-xs">/</span>
                  <span className="text-amber-600 font-bold">{userProgress.dailyGoal} XP</span>
                </div>
              </div>
            </div>

            {/* Progress Bar with Percentage Indicator */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-bold text-muted-foreground">
                <span>Tiến trình hoàn thành</span>
                <span className="text-amber-600 font-extrabold">
                  {Math.round(Math.min((userProgress.dailyProgress / userProgress.dailyGoal) * 100, 100))}%
                </span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden p-0.5 border border-border">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-japanese rounded-full transition-all duration-700 shadow-sm"
                  style={{ width: `${Math.min((userProgress.dailyProgress / userProgress.dailyGoal) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                {userProgress.dailyProgress >= userProgress.dailyGoal 
                  ? '🎉 Tuyệt vời! Bạn đã hoàn thành xuất sắc mục tiêu XP hôm nay!'
                  : `💡 Còn thiếu ${userProgress.dailyGoal - userProgress.dailyProgress} XP nữa để mở khóa thưởng hôm nay!`
                }
              </p>
              <Button variant="ghost" size="sm" asChild className="text-xs font-bold text-japanese hover:text-japanese-dark gap-1 p-0 h-auto self-start sm:self-auto">
                <Link to="/learn/my-classes">Học bài để nhận XP <ArrowRight className="w-3.5 h-3.5" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Hub Action Shortcuts */}
        <Card className="border-border shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-japanese" /> Truy cập nhanh
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <Button variant="outline" size="sm" asChild className="justify-start gap-2 h-10 font-bold">
              <Link to="/learn/my-classes"><Building className="w-4 h-4 text-japanese" /> Lớp của tôi</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start gap-2 h-10 font-bold">
              <Link to="/learn/zoom"><Video className="w-4 h-4 text-green-600" /> Zoom / Meet</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start gap-2 h-10 font-bold">
              <Link to="/learn/calendar"><CalendarIcon className="w-4 h-4 text-blue-600" /> Lịch học</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start gap-2 h-10 font-bold">
              <Link to="/learn/achievements"><Award className="w-4 h-4 text-amber-500" /> Thành tích</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start gap-2 h-10 font-bold col-span-2">
              <Link to="/learn/notifications">
                <Bell className="w-4 h-4 text-purple-600" /> Thông báo từ Giảng viên
                {unreadNotificationsCount > 0 && (
                  <Badge className="bg-red-500 text-white ml-auto text-[10px] px-1.5 py-0">{unreadNotificationsCount}</Badge>
                )}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 4 Skills Practice Grid */}
      <div>
        <h2 className="text-2xl font-extrabold text-foreground mb-4 tracking-tight">4 Kỹ năng Tiếng Nhật</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              to={skill.href}
              className="group bg-card rounded-2xl p-6 border border-border/80 shadow-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className={`p-3.5 rounded-2xl border ${skill.color} inline-block mb-4`}>
                  <skill.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-1 group-hover:text-japanese transition-colors">{skill.name}</h3>
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{skill.description}</p>
              </div>

              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${skill.color.split(' ')[0].replace('text-', 'bg-')} rounded-full transition-all duration-500`}
                      style={{ width: `${skillProgress[skill.id] || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{skillProgress[skill.id] || 0}%</span>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-japanese group-hover:translate-x-1 transition-transform">
                  Học bài ngay <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Published Lessons */}
      <Card className="border-border shadow-soft">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold">Bài học mới phát hành</CardTitle>
            <CardDescription>Các bài học mới nhất được cập nhật từ hệ thống giảng dạy</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs font-bold gap-1 text-japanese">
            <Link to="/learn/my-classes">Vào bài học <ArrowRight className="w-4 h-4" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentLessons.length > 0 ? (
            <div className="space-y-3">
              {recentLessons.map((lesson) => (
                <div 
                  key={lesson.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card rounded-2xl border border-border/80 hover:shadow-md transition-all gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      lesson.skill === 'reading' ? 'bg-blue-500/10 text-blue-600' :
                      lesson.skill === 'speaking' ? 'bg-emerald-500/10 text-emerald-600' :
                      lesson.skill === 'writing' ? 'bg-purple-500/10 text-purple-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {lesson.skill === 'reading' ? <BookOpen className="w-5 h-5" /> :
                       lesson.skill === 'speaking' ? <Mic className="w-5 h-5" /> :
                       lesson.skill === 'writing' ? <PenTool className="w-5 h-5" /> :
                       <Headphones className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-base">{lesson.title_vi}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {lesson.duration_minutes} phút
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-amber-600">
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          +{lesson.xp_reward} XP
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="japanese" asChild className="gap-1.5 shrink-0 font-bold">
                    <Link to="/learn/my-classes">
                      <Play className="w-3.5 h-3.5 fill-current" /> Bắt đầu học
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>Chưa có bài học nào được đăng.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
