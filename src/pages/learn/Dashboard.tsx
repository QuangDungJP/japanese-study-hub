import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  BookOpen,
  Dumbbell,
  GraduationCap,
  Play,
  Clock,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLearning } from '@/contexts/LearningContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import EmptyState from '@/components/shared/EmptyState';

interface Lesson {
  id: string;
  title_vi: string;
  duration_minutes: number | null;
}

interface Exam {
  id: string;
  title_vi: string | null;
  title: string | null;
  duration_minutes: number | null;
}

const Dashboard = () => {
  const { currentLanguage, loading, completedLessons } = useLearning();
  const { user } = useAuth();
  const [recentLessons, setRecentLessons] = useState<Lesson[]>([]);
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [counts, setCounts] = useState({ lessons: 0, exercises: 0, exams: 0 });

  useEffect(() => {
    (async () => {
      const [{ data: lessons }, { data: exams }, lessonsCount, exercisesCount, examsCount] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, title_vi, duration_minutes')
          .eq('is_published', true)
          .eq('language', currentLanguage)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('exams')
          .select('id, title_vi, title, duration_minutes')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(3),
        supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('is_published', true).eq('language', currentLanguage),
        supabase.from('exercises').select('id', { count: 'exact', head: true }),
        supabase.from('exams').select('id', { count: 'exact', head: true }).eq('is_published', true),
      ]);

      setRecentLessons(lessons || []);
      setRecentExams(exams || []);
      setCounts({
        lessons: lessonsCount.count || 0,
        exercises: exercisesCount.count || 0,
        exams: examsCount.count || 0,
      });
    })();
  }, [currentLanguage, user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const lessonsDone = completedLessons.length;

  const overview = [
    {
      label: 'Bài học',
      icon: BookOpen,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      total: counts.lessons,
      done: lessonsDone,
      href: '/learn/lessons',
    },
    {
      label: 'Bài tập',
      icon: Dumbbell,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      total: counts.exercises,
      done: null,
      href: '/learn/exercises',
    },
    {
      label: 'Bài kiểm tra',
      icon: GraduationCap,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      total: counts.exams,
      done: null,
      href: '/learn/exams',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Xin chào! 👋</h1>
          <p className="text-muted-foreground">Chọn nội dung học hôm nay của bạn.</p>
        </div>
        <Button variant="hero" size="lg" asChild>
          <Link to="/learn/lessons">
            <Play className="w-5 h-5" /> Tiếp tục học
          </Link>
        </Button>
      </div>

      {/* Overview cards: Lesson / Exercise / Exam */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overview.map((o) => (
          <Link
            key={o.label}
            to={o.href}
            className="group bg-card rounded-2xl p-6 border border-border shadow-soft hover:shadow-card-hover hover:-translate-y-1 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 rounded-xl ${o.bg} flex items-center justify-center`}>
                <o.icon className={`w-6 h-6 ${o.color}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm text-muted-foreground mt-4">{o.label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-foreground">{o.total}</p>
              {o.done !== null && (
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {o.done} đã xong
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Recent lessons */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Bài học mới nhất</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/learn/lessons">Tất cả <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </div>
        {recentLessons.length > 0 ? (
          <div className="space-y-3">
            {recentLessons.map((lesson) => (
              <Link
                key={lesson.id}
                to="/learn/lessons"
                className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:shadow-soft transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{lesson.title_vi}</h4>
                    {lesson.duration_minutes ? (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" /> {lesson.duration_minutes} phút
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Play className="w-4 h-4" /> Bắt đầu
                </Button>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="Chưa có bài học nào"
            description="Quay lại sau khi giáo viên xuất bản bài học mới."
            actionLabel="Khám phá khóa học"
            actionHref="/courses"
          />
        )}
      </div>

      {/* Upcoming exams */}
      {recentExams.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Bài kiểm tra gần đây</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/learn/exams">Tất cả <ArrowRight className="w-4 h-4 ml-1" /></Link>
            </Button>
          </div>
          <div className="space-y-3">
            {recentExams.map((exam) => (
              <Link
                key={exam.id}
                to="/learn/exams"
                className="flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:shadow-soft transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{exam.title_vi || exam.title}</h4>
                    {exam.duration_minutes ? (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" /> {exam.duration_minutes} phút
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button variant="outline" size="sm">Vào thi</Button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
