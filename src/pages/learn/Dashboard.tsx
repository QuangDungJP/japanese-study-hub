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
  Trophy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLearning } from '@/contexts/LearningContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Lesson {
  id: string;
  title: string;
  title_vi: string;
  skill: string;
  duration_minutes: number;
  xp_reward: number;
}

const skills = [
  { id: 'reading', name: 'Đọc hiểu', icon: BookOpen, color: 'text-blue-600 bg-blue-500/10 border-blue-200', href: '/learn/reading', description: 'Luyện đọc và hiểu văn bản tiếng Nhật' },
  { id: 'speaking', name: 'Luyện nói', icon: Mic, color: 'text-emerald-600 bg-emerald-500/10 border-emerald-200', href: '/learn/speaking', description: 'Luyện phát âm và phản xạ giao tiếp' },
  { id: 'writing', name: 'Luyện viết', icon: PenTool, color: 'text-purple-600 bg-purple-500/10 border-purple-200', href: '/learn/writing', description: 'Luyện đặt câu và đoạn văn' },
  { id: 'listening', name: 'Luyện nghe', icon: Headphones, color: 'text-amber-600 bg-amber-500/10 border-amber-200', href: '/learn/listening', description: 'Luyện nghe hiểu qua hội thoại' },
];

const Dashboard = () => {
  const { userProgress, currentLanguage, loading } = useLearning();
  const { user } = useAuth();
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [skillProgress, setSkillProgress] = useState<Record<string, number>>({});
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();
        if (profile?.full_name) setUserName(profile.full_name);
      }

      // Fetch recent lessons from database
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, title_vi, skill, duration_minutes, xp_reward')
        .eq('is_published', true)
        .eq('language', currentLanguage)
        .order('created_at', { ascending: false })
        .limit(3);

      if (lessons) {
        setRecentLessons(lessons);
      }

      // Calculate skill progress based on completed lessons
      if (user) {
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
      }
    };

    fetchData();
    const channel = supabase
      .channel('public:student-dashboard-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'completed_lessons' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_progress' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentLanguage, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-primary via-primary/90 to-accent p-6 md:p-8 text-white shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" /> TNQDO Japanese Study Hub
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Xin chào {userName || 'Bạn'}! 👋
            </h1>
            <p className="text-white/80 text-sm md:text-base max-w-xl font-medium">
              Chào mừng bạn trở lại. Hãy cùng duy trì chuỗi Streak và hoàn thành mục tiêu Tiếng Nhật hôm nay nhé!
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" className="gap-2 font-bold shadow-md" asChild>
              <Link to="/learn/my-classes">
                <Building className="w-4 h-4" /> Lớp học của tôi
              </Link>
            </Button>
            <Button className="bg-white text-primary hover:bg-white/90 gap-2 font-bold shadow-md" asChild>
              <Link to="/learn/reading">
                <Play className="w-4 h-4 fill-current" /> Học tiếp ngay
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-all border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-200">
                <Flame className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Chuỗi Streak</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{userProgress.streak} ngày</p>
                <p className="text-xs text-orange-600 font-semibold mt-1">🔥 Giữ vững phong độ!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-200">
                <Zap className="w-6 h-6 fill-current" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng điểm XP</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{userProgress.totalXp.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">Tích lũy từ bài học</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-200">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bài học đã xong</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{userProgress.lessonsCompleted}</p>
                <p className="text-xs text-emerald-600 font-semibold mt-1">Tiến độ tốt</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-200">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Từ vựng đã thuộc</p>
                <p className="text-3xl font-extrabold text-foreground mt-0.5">{userProgress.vocabularyMastered}</p>
                <p className="text-xs text-muted-foreground mt-1">JLPT Flashcard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Goal Card */}
      <Card className="border-border shadow-soft">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Mục tiêu học tập hôm nay
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Tích lũy XP để hoàn thành chỉ tiêu hàng ngày</p>
            </div>
            <Badge variant="hero" className="font-bold text-xs px-3 py-1">
              {userProgress.dailyProgress} / {userProgress.dailyGoal} XP
            </Badge>
          </div>
          <div className="h-4 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
              style={{ width: `${Math.min((userProgress.dailyProgress / userProgress.dailyGoal) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3 font-medium">
            {userProgress.dailyProgress >= userProgress.dailyGoal 
              ? '🎉 Tuyệt vời! Bạn đã hoàn thành xuất sắc mục tiêu hôm nay!'
              : `💡 Bạn cần thêm ${userProgress.dailyGoal - userProgress.dailyProgress} XP nữa để hoàn thành mục tiêu!`
            }
          </p>
        </CardContent>
      </Card>

      {/* 4 Skills Roadmap Grid */}
      <div>
        <h2 className="text-2xl font-extrabold text-foreground mb-4 tracking-tight">4 Kỹ năng Tiếng Nhật</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              to={skill.href}
              className="group bg-card rounded-2xl p-6 border border-border/80 shadow-soft hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
            >
              <div>
                <div className={`p-3.5 rounded-2xl border ${skill.color} inline-block mb-4`}>
                  <skill.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-1 group-hover:text-primary transition-colors">{skill.name}</h3>
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
                <span className="flex items-center gap-1 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                  Học ngay <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Lessons */}
      <Card className="border-border shadow-soft">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Bài học mới phát hành</CardTitle>
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
                  <Button size="sm" asChild className="gap-1.5 shrink-0">
                    <Link to={`/learn/${lesson.skill}`}>
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
