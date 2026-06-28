import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, CalendarClock, Clock, Trophy, Play } from 'lucide-react';
import { format } from 'date-fns';

const LearnerExams = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data: cs } = await supabase
        .from('class_students').select('class_id').eq('student_id', user.id);
      const classIds = (cs || []).map((r: any) => r.class_id);
      const sb: any = supabase;
      const examQuery = sb.from('exams').select('*').eq('is_published', true).order('exam_date', { ascending: true });
      // If user has no classes, show only exams without class_id
      const { data: examData } = classIds.length > 0
        ? await examQuery.or(`class_id.in.(${classIds.join(',')}),class_id.is.null`)
        : await examQuery.is('class_id', null);
      const { data: attemptData } = await sb
        .from('exam_attempts').select('*').eq('user_id', user.id);
      setExams(examData || []);
      setAttempts(attemptData || []);
      setLoading(false);
    })();
  }, [user]);

  const attemptOf = (examId: string) => attempts.find((a) => a.exam_id === examId);
  const now = new Date();

  const getStatus = (e: any) => {
    const date = new Date(`${e.exam_date}T${e.start_time || '00:00'}`);
    if (date > now) return { label: 'Sắp diễn ra', variant: 'outline' as const };
    if (e.ends_at && new Date(e.ends_at) < now) return { label: 'Đã kết thúc', variant: 'secondary' as const };
    return { label: 'Đang mở', className: 'bg-green-500/10 text-green-600' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 flex-wrap">
          <GraduationCap className="w-7 h-7 text-primary" /> Bài kiểm tra
        </h1>
        <p className="text-muted-foreground mt-1">
          Các bài kiểm tra chính thức có chấm điểm. Khác với <strong>Bài học</strong> (nội dung) và <strong>Bài tập</strong> (luyện tập).
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Đang tải...</div>
      ) : exams.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          Chưa có bài kiểm tra nào.
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {exams.map((e) => {
            const st = getStatus(e);
            const at = attemptOf(e.id);
            return (
              <Card key={e.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{e.title_vi || e.title}</h3>
                      <Badge variant="outline">{e.exam_type}</Badge>
                      <Badge {...(st as any)} className={(st as any).className}>{st.label}</Badge>
                      {at?.score != null && (
                        <Badge className="bg-blue-500/10 text-blue-600 gap-1">
                          <Trophy className="w-3 h-3" />{at.score}/{e.max_score}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{format(new Date(e.exam_date), 'dd/MM/yyyy')} • {e.start_time}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.duration_minutes} phút</span>
                    </div>
                  </div>
                  <Button asChild size="sm" disabled={st.label === 'Đã kết thúc'}>
                    <Link to={`/learn/exams/${e.id}`}>
                      <Play className="w-4 h-4 mr-1" />{at ? 'Xem lại' : 'Làm bài'}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LearnerExams;