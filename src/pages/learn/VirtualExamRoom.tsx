import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, CheckCircle2, Play, AlertCircle, FileText, Sparkles, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatWithJST } from '@/lib/dateUtils';
import PageLoadingScreen from '@/components/shared/PageLoadingScreen';

interface JLPTExam {
  id: string;
  title_vi: string;
  title: string;
  description_vi: string;
  exam_type: string;
  level: string;
  duration_minutes: number;
  max_score: number;
  passing_score: number;
  is_published: boolean;
  starts_at: string;
  ends_at: string;
}

const VirtualExamRoom = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState<JLPTExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempts, setAttempts] = useState<Record<string, any[]>>({});

  useEffect(() => {
    const fetchExams = async () => {
      if (!user) return;
      setLoading(true);

      // Fetch exams with type 'jlpt_mock'
      const { data: examsData, error } = await supabase
        .from('exams')
        .select('*')
        .eq('exam_type', 'jlpt_mock')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching JLPT exams:', error);
      } else {
        setExams(examsData as any || []);

        if (examsData && examsData.length > 0) {
          const examIds = examsData.map(e => e.id);
          const { data: attemptsData } = await supabase
            .from('exam_attempts')
            .select('id, exam_id, score, total, status, submitted_at, time_spent_seconds')
            .in('exam_id', examIds)
            .eq('student_id', user.id);

          const grouped: Record<string, any[]> = {};
          (attemptsData || []).forEach(att => {
            if (!grouped[att.exam_id]) grouped[att.exam_id] = [];
            grouped[att.exam_id].push(att);
          });
          setAttempts(grouped);
        }
      }

      setLoading(false);
    };

    fetchExams();
  }, [user]);

  if (loading) return <PageLoadingScreen text="Đang tải Phòng thi ảo..." />;

  const jlptLevels = ['N1', 'N2', 'N3', 'N4', 'N5'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-8 md:p-12 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full -ml-20 -mb-20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <Badge className="bg-amber-400 text-amber-950 font-bold border-none px-3 py-1 shadow-sm">
              <Sparkles className="w-4 h-4 mr-1.5" /> Tính năng mới
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Phòng Thi Ảo JLPT</h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Trải nghiệm bài thi JLPT mô phỏng chân thực nhất với thời gian đếm ngược chuẩn, phân chia cấu trúc thi và hệ thống tính điểm liệt khắt khe như thi thật.
            </p>
          </div>
          <div className="hidden md:flex shrink-0 p-6 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 shadow-inner">
            <Trophy className="w-24 h-24 text-amber-400 drop-shadow-md" />
          </div>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full flex-wrap justify-start h-auto gap-2">
          <TabsTrigger value="all" className="rounded-md font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm">
            Tất cả cấp độ
          </TabsTrigger>
          {jlptLevels.map(level => (
            <TabsTrigger key={level} value={level} className="rounded-md font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shadow-sm">
              JLPT {level}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="m-0 space-y-6">
          <ExamGrid exams={exams} attempts={attempts} navigate={navigate} />
        </TabsContent>

        {jlptLevels.map(level => (
          <TabsContent key={level} value={level} className="m-0 space-y-6">
            <ExamGrid 
              // Assumes level is stored in exam metadata or parsed from title/level field
              exams={exams.filter(e => e.level === level || e.title.includes(level))} 
              attempts={attempts} 
              navigate={navigate} 
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

const ExamGrid = ({ exams, attempts, navigate }: { exams: JLPTExam[], attempts: Record<string, any[]>, navigate: any }) => {
  if (exams.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent className="py-16 text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-30" />
          <h3 className="text-xl font-bold text-foreground">Chưa có đề thi nào</h3>
          <p className="text-muted-foreground mt-2">Đề thi thử JLPT cấp độ này đang được biên soạn và sẽ sớm ra mắt.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {exams.map((exam) => {
        const examAttempts = attempts[exam.id] || [];
        const completedAttempts = examAttempts.filter(a => a.status === 'submitted' || a.status === 'graded');
        const bestAttempt = completedAttempts.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
        
        const passed = bestAttempt && bestAttempt.score >= exam.passing_score;

        return (
          <Card key={exam.id} className="overflow-hidden border border-border/50 hover:shadow-xl transition-all duration-300 group flex flex-col bg-card">
            <div className="p-5 border-b bg-gradient-to-br from-primary/5 to-transparent relative">
              <div className="flex justify-between items-start gap-4 mb-3">
                <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-bold px-2 py-0.5 text-xs">
                  {exam.level || 'JLPT'}
                </Badge>
                {completedAttempts.length > 0 && (
                  <Badge variant="outline" className={passed ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200"}>
                    {passed ? 'Đã thi đỗ' : 'Thi trượt'}
                  </Badge>
                )}
              </div>
              <h3 className="font-extrabold text-xl text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                {exam.title_vi}
              </h3>
              <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                {exam.description_vi || 'Đề thi thử đánh giá năng lực tiếng Nhật chuẩn JLPT.'}
              </p>
            </div>
            
            <CardContent className="p-5 flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 p-2 rounded-md">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{exam.duration_minutes || 180} phút</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 p-2 rounded-md">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium text-foreground">Điểm đỗ: {exam.passing_score}</span>
                </div>
              </div>

              {bestAttempt && (
                <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Kết quả cao nhất</p>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-extrabold text-foreground leading-none">{bestAttempt.score}</span>
                    <span className="text-sm text-muted-foreground mb-0.5">/ {exam.max_score || 180} điểm</span>
                  </div>
                </div>
              )}
            </CardContent>
            
            <div className="p-4 bg-muted/20 border-t flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground font-medium">
                {completedAttempts.length} lượt thi
              </span>
              <Button 
                onClick={() => navigate(`/learn/mock-exams/${exam.id}`)}
                className="gap-2 font-bold shadow-sm hover:shadow-md transition-all"
              >
                <Play className="w-4 h-4 fill-current" /> 
                {examAttempts.length > 0 ? 'Thi lại' : 'Vào thi ngay'}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default VirtualExamRoom;
