import { useState, useEffect } from 'react';
import { localMockExam } from '@/data/mockJlptExam';
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
import ExamLeaderboard from '@/components/learn/ExamLeaderboard';

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
  max_attempts?: number;
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
      }
      
      const allExams = [localMockExam, ...(examsData as any || [])];
      setExams(allExams);

      if (allExams.length > 0) {
        const examIds = allExams.map(e => e.id).filter(id => !id.startsWith('mock-local'));
        let attemptsData: any[] = [];
        
        if (examIds.length > 0) {
          const { data } = await supabase
            .from('exam_attempts')
            .select('id, exam_id, score, total, status, submitted_at, time_spent_seconds')
            .in('exam_id', examIds)
            .eq('student_id', user.id);
          attemptsData = data || [];
        }

        // Local storage mock attempts for mock-local-1
        const localAttemptsStr = localStorage.getItem(`mock_attempts_${user.id}`);
        if (localAttemptsStr) {
          try {
            const localAttempts = JSON.parse(localAttemptsStr);
            attemptsData = [...attemptsData, ...localAttempts];
          } catch (e) {}
        }

        const grouped: Record<string, any[]> = {};
        (attemptsData || []).forEach(att => {
          if (!grouped[att.exam_id]) grouped[att.exam_id] = [];
          grouped[att.exam_id].push(att);
        });
        setAttempts(grouped);
      }

      setLoading(false);
    };

    fetchExams();
  }, [user]);

  if (loading) return <PageLoadingScreen text="Đang tải Phòng thi ảo..." />;

  const jlptLevels = ['N1', 'N2', 'N3', 'N4', 'N5'];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Premium Minimalist Header Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 md:p-12 shadow-sm">
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-50 dark:bg-red-950/20 rounded-full -mr-[250px] -mt-[250px] opacity-70 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-zinc-50 dark:bg-zinc-800/50 rounded-full -ml-32 -mb-32 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Chuyên sâu luyện thi JLPT</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              Phòng Thi Ảo
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed">
              Trải nghiệm bài thi mô phỏng chân thực nhất. Cấu trúc đề thi, phân bổ thời gian và hệ thống chấm điểm liệt được mô phỏng 100% theo tiêu chuẩn JLPT thực tế.
            </p>
          </div>
          <div className="hidden md:flex shrink-0">
            {/* Elegant Torii gate or Japanese styling could go here. We'll use a clean icon composition */}
            <div className="relative">
              <div className="absolute inset-0 bg-red-500 blur-3xl opacity-10 rounded-full" />
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-red-50 to-white dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-center relative z-10">
                <Trophy className="w-16 h-16 text-red-600 dark:text-red-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-12">
        <ExamLeaderboard examId="all" />
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
          <Card key={exam.id} className="overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:shadow-lg transition-all duration-300 group flex flex-col bg-white dark:bg-zinc-950 rounded-2xl">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 relative">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex gap-2 items-center">
                  <Badge className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 border-none font-bold px-3 py-1 rounded-full text-xs">
                    {exam.level || 'JLPT'}
                  </Badge>
                  <Badge variant="outline" className="text-xs border-zinc-200 dark:border-zinc-800 text-zinc-500">
                    Mô phỏng 100%
                  </Badge>
                </div>
                {completedAttempts.length > 0 && (
                  <Badge variant="outline" className={passed ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800" : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800"}>
                    {passed ? 'Đã thi đỗ' : 'Thi trượt'}
                  </Badge>
                )}
              </div>
              <h3 className="font-bold text-xl text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-500 transition-colors">
                {exam.title_vi}
              </h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-3 line-clamp-2 leading-relaxed">
                {exam.description_vi || 'Đề thi thử đánh giá năng lực tiếng Nhật chuẩn JLPT.'}
              </p>
            </div>
            
            <CardContent className="p-6 flex-1 space-y-5 bg-zinc-50/50 dark:bg-zinc-900/20">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
                  <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Thời gian</span>
                  <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    {exam.duration_minutes || 180} phút
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-zinc-600 dark:text-zinc-400">
                  <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">Điểm đỗ</span>
                  <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    {exam.passing_score}/{exam.max_score || 180}
                  </div>
                </div>
              </div>

              {bestAttempt && (
                <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 shadow-sm mt-4">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Kết quả cao nhất</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-none">{bestAttempt.score}</span>
                    <span className="text-sm font-medium text-zinc-500 mb-0.5">/ {exam.max_score || 180} điểm</span>
                  </div>
                </div>
              )}
            </CardContent>
            
            <div className="p-5 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm text-zinc-500 font-medium">
                  {completedAttempts.length} lượt đã thi
                </span>
                {exam.max_attempts && exam.max_attempts > 0 ? (
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-500">
                    (Tối đa {exam.max_attempts} lượt)
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
                    (Vô hạn lượt)
                  </span>
                )}
              </div>
              
              {(exam.max_attempts && exam.max_attempts > 0 && completedAttempts.length >= exam.max_attempts) ? (
                <Button 
                  disabled
                  className="bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-600 rounded-xl px-6 opacity-70"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> 
                  Hết lượt
                </Button>
              ) : (
                <Button 
                  onClick={() => navigate(`/learn/mock-exams/${exam.id}`)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 rounded-xl px-6"
                >
                  <Play className="w-4 h-4 mr-2" /> 
                  {completedAttempts.length > 0 ? 'Thi lại' : 'Vào thi'}
                </Button>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default VirtualExamRoom;
