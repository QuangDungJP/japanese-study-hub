import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatWithJST } from '@/lib/dateUtils';
import { TrendingUp, Activity, CheckCircle2, AlertTriangle, FileText, Sparkles } from 'lucide-react';
import { localMockExam } from '@/data/mockJlptExam';

export default function MockExamHistory() {
  const { user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExams: 0,
    passedExams: 0,
    averageScore: 0,
    highestScore: 0
  });

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) return;
      setLoading(true);

      try {
        // Fetch remote attempts that are submitted or graded
        const { data: remoteAttempts, error } = await supabase
          .from('exam_attempts')
          .select(`
            id, exam_id, score, total, status, submitted_at, metadata,
            exams ( title_vi, level, passing_score, exam_type )
          `)
          .eq('student_id', user.id)
          .in('status', ['submitted', 'graded'])
          .order('submitted_at', { ascending: true });
          
        let attempts: any[] = (remoteAttempts || []).filter(a => a.exams?.exam_type === 'jlpt_mock');

        // Fetch local attempts
        const localStr = localStorage.getItem(`mock_attempts_${user.id}`);
        if (localStr) {
          try {
            const localAtts = JSON.parse(localStr).filter((a: any) => a.status === 'submitted' || a.status === 'graded');
            const localExamsData = localAtts.map((a: any) => ({
              ...a,
              exams: {
                title_vi: localMockExam.title_vi,
                level: localMockExam.level,
                passing_score: localMockExam.passing_score,
                exam_type: localMockExam.exam_type
              }
            }));
            attempts = [...attempts, ...localExamsData];
          } catch(e) { console.error("Error parsing local mock attempts", e); }
        }

        // Sort by date
        attempts.sort((a, b) => new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime());

        // Process data for chart
        let totalScore = 0;
        let passedCount = 0;
        let highest = 0;

        const chartData = attempts.map((a, index) => {
          const score = a.score || 0;
          const passingScore = a.exams?.passing_score || 90;
          const predictedReal = a.metadata?.predicted_real;
          const bd = a.metadata?.scoreBreakdown;
          
          let passed = score >= passingScore;
          if (bd) {
             const failedSections = Object.values(bd).filter((s: any) => s.passed === false);
             if (failedSections.length > 0) passed = false;
          }

          totalScore += score;
          if (passed) passedCount++;
          if (score > highest) highest = score;

          const dateObj = new Date(a.submitted_at);
          const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
          
          return {
            id: a.id,
            name: `Lần ${index + 1}`,
            fullDate: formatWithJST(a.submitted_at),
            dateStr: formattedDate,
            score: score,
            predicted: predictedReal !== undefined ? predictedReal : null,
            passingScore: passingScore,
            passed: passed,
            title: a.exams?.title_vi,
            level: a.exams?.level,
            maxScore: a.total || 180,
            metadata: a.metadata
          };
        });

        setData(chartData);
        setStats({
          totalExams: attempts.length,
          passedExams: passedCount,
          averageScore: attempts.length > 0 ? Math.round(totalScore / attempts.length) : 0,
          highestScore: highest
        });

      } catch (e) {
        console.error("Error fetching mock exam history", e);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  if (loading) {
    return (
      <Card className="border-border shadow-soft h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20 shadow-soft">
        <CardContent className="py-12 text-center">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Chưa có lịch sử thi thử</h3>
          <p className="text-muted-foreground mt-1 text-sm">Hãy tham gia Phòng thi ảo để đánh giá năng lực và theo dõi sự tiến bộ của bạn.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tổng số lần thi</span>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{stats.totalExams}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Số lần thi đỗ</span>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{stats.passedExams}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Điểm trung bình</span>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{stats.averageScore}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardContent className="p-4 flex flex-col gap-1">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Điểm cao nhất</span>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">{stats.highestScore}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-950">
        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-900">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Tiến độ Năng lực & Dự đoán điểm
          </CardTitle>
          <CardDescription>Biểu đồ thể hiện điểm số qua các lần thi thử gần đây</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="dateStr" 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  dy={10}
                />
                <YAxis 
                  domain={[0, 180]} 
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={40}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl">
                          <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">{item.title} ({item.level})</p>
                          <p className="text-xs text-zinc-500 mb-3">{item.fullDate}</p>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-4">
                              <span className="flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div> Điểm thi thử
                              </span>
                              <span className="font-bold">{item.score}/{item.maxScore}</span>
                            </div>
                            
                            {item.predicted !== null && (
                              <div className="flex items-center justify-between gap-4">
                                <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600 dark:text-amber-400">
                                  <div className="w-2 h-2 rounded-full bg-amber-500"></div> Dự đoán thi thật
                                </span>
                                <span className="font-bold text-amber-600 dark:text-amber-400">{item.predicted}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                            {item.passed ? (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none">Đạt</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">Trượt</Badge>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <ReferenceLine y={90} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Điểm đỗ (90)', fill: '#ef4444', fontSize: 10 }} />
                
                <Line 
                  type="monotone" 
                  name="Điểm thi thử"
                  dataKey="score" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  name="Dự đoán thi thật"
                  dataKey="predicted" 
                  stroke="#f59e0b" 
                  strokeWidth={3} 
                  strokeDasharray="5 5"
                  activeDot={{ r: 6, strokeWidth: 0 }}
                  dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg text-foreground mb-2 flex items-center gap-2">
          <FileText className="w-5 h-5 text-zinc-400" /> Lịch sử chi tiết (Gần đây nhất)
        </h3>
        
        <div className="grid gap-3">
          {data.slice().reverse().slice(0, 5).map((item) => {
            const bd = item.metadata?.scoreBreakdown;
            let failedSections: any[] = [];
            if (bd) {
              failedSections = Object.values(bd).filter((s: any) => s.passed === false);
            }
            
            return (
              <div key={item.id} className="bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold">{item.level || 'JLPT'}</Badge>
                    <span className="text-xs text-zinc-500">{item.fullDate}</span>
                  </div>
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{item.title}</h4>
                  
                  {!item.passed && failedSections.length > 0 && (
                    <p className="text-xs text-red-500 mt-1 font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Điểm liệt: {failedSections.map(s => s.name).join(', ')}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <p className="text-xs font-semibold text-zinc-500 mb-0.5">Điểm thi thử</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{item.score}<span className="text-sm font-medium text-zinc-400">/{item.maxScore}</span></p>
                  </div>
                  
                  {item.predicted !== null && (
                    <div className="text-right border-l pl-4 border-zinc-100 dark:border-zinc-800">
                      <p className="text-xs font-semibold text-amber-600 mb-0.5 flex items-center gap-1"><Sparkles className="w-3 h-3"/> Dự đoán</p>
                      <p className="text-xl font-black text-amber-600">{item.predicted}</p>
                    </div>
                  )}
                  
                  <div className="w-24 text-right">
                    <Badge className={item.passed ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none" : "bg-red-100 text-red-700 hover:bg-red-200 border-none"}>
                      {item.passed ? "Đạt" : "Trượt"}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
