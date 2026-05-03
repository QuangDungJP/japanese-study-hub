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
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  { id: 'reading', name: 'Đọc hiểu', icon: BookOpen, color: 'bg-blue-500', href: '/learn/reading', description: 'Luyện đọc và hiểu văn bản' },
  { id: 'speaking', name: 'Nói', icon: Mic, color: 'bg-green-500', href: '/learn/speaking', description: 'Luyện phát âm và giao tiếp' },
  { id: 'writing', name: 'Viết', icon: PenTool, color: 'bg-purple-500', href: '/learn/writing', description: 'Luyện viết câu và đoạn văn' },
  { id: 'listening', name: 'Nghe', icon: Headphones, color: 'bg-orange-500', href: '/learn/listening', description: 'Luyện nghe hiểu' },
];

const Dashboard = () => {
  const { userProgress, currentLanguage, loading } = useLearning();
  const { user } = useAuth();
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [skillProgress, setSkillProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
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
  }, [currentLanguage, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Xin chào! 👋
          </h1>
          <p className="text-muted-foreground">
            Tiếp tục học Tiếng Nhật ngay nào!
          </p>
        </div>
        <Button variant="hero" size="lg" asChild>
          <Link to="/learn/reading">
            <Play className="w-5 h-5" />
            Học tiếp
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Streak</p>
              <p className="text-2xl font-bold text-foreground">{userProgress.streak} ngày</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng XP</p>
              <p className="text-2xl font-bold text-foreground">{userProgress.totalXp.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Bài học</p>
              <p className="text-2xl font-bold text-foreground">{userProgress.lessonsCompleted}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Từ vựng</p>
              <p className="text-2xl font-bold text-foreground">{userProgress.vocabularyMastered}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Goal */}
      <div className="bg-card rounded-2xl p-6 border border-border shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">Mục tiêu hôm nay</h2>
          <span className="text-sm text-muted-foreground">
            {userProgress.dailyProgress}/{userProgress.dailyGoal} XP
          </span>
        </div>
        <div className="h-4 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-accent rounded-full transition-all duration-500"
            style={{ width: `${Math.min((userProgress.dailyProgress / userProgress.dailyGoal) * 100, 100)}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {userProgress.dailyProgress >= userProgress.dailyGoal 
            ? 'Tuyệt vời! Bạn đã hoàn thành mục tiêu hôm nay! 🎉'
            : `Còn ${userProgress.dailyGoal - userProgress.dailyProgress} XP nữa để hoàn thành mục tiêu!`
          }
        </p>
      </div>

      {/* Skills Overview */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">4 Kỹ năng</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              to={skill.href}
              className="group bg-card rounded-2xl p-6 border border-border shadow-soft hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`w-12 h-12 rounded-xl ${skill.color}/10 flex items-center justify-center mb-4`}>
                <skill.icon className={`w-6 h-6 ${skill.color.replace('bg-', 'text-')}`} />
              </div>
              <h3 className="font-bold text-foreground mb-2">{skill.name}</h3>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${skill.color} rounded-full transition-all duration-500`}
                    style={{ width: `${skillProgress[skill.id] || 0}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{skillProgress[skill.id] || 0}%</span>
              </div>
              <div className="flex items-center gap-1 mt-4 text-sm text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Học tiếp <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Lessons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Bài học mới nhất</h2>
        </div>
        {recentLessons.length > 0 ? (
          <div className="space-y-3">
            {recentLessons.map((lesson) => (
              <div 
                key={lesson.id}
                className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:shadow-soft transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    lesson.skill === 'reading' ? 'bg-blue-500/10' :
                    lesson.skill === 'speaking' ? 'bg-green-500/10' :
                    lesson.skill === 'writing' ? 'bg-purple-500/10' : 'bg-orange-500/10'
                  }`}>
                    {lesson.skill === 'reading' ? <BookOpen className="w-5 h-5 text-blue-500" /> :
                     lesson.skill === 'speaking' ? <Mic className="w-5 h-5 text-green-500" /> :
                     lesson.skill === 'writing' ? <PenTool className="w-5 h-5 text-purple-500" /> :
                     <Headphones className="w-5 h-5 text-orange-500" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{lesson.title_vi}</h4>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {lesson.duration_minutes} phút
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="w-4 h-4 text-accent" />
                        +{lesson.xp_reward} XP
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Play className="w-4 h-4" />
                  Bắt đầu
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="Chưa có bài học nào"
            description="Quay lại sau khi giảng viên xuất bản bài học mới, hoặc khám phá các khóa học hiện có."
            actionLabel="Khám phá khóa học"
            actionHref="/courses"
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;
