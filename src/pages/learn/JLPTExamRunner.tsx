import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, AlertTriangle, Loader2, Play, BookOpen, Headphones, ShieldAlert, CheckCircle2 } from "lucide-react";
import FormattedText from "@/components/shared/FormattedText";

const SECTION_TIMERS = {
  'vocab': 30 * 60,   // 30 mins
  'reading': 60 * 60, // 60 mins
  'listening': 35 * 60 // 35 mins
};

export default function JLPTExamRunner() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exam, setExam] = useState<any>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  
  // Section state
  const [currentSection, setCurrentSection] = useState<'vocab' | 'reading' | 'listening'>('vocab');
  const [sectionElapsed, setSectionElapsed] = useState(0);
  const [sectionStartedAt, setSectionStartedAt] = useState<number>(Date.now());
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  // Grouped questions
  const [sections, setSections] = useState<{ vocab: any[], reading: any[], listening: any[] }>({
    vocab: [], reading: [], listening: []
  });

  useEffect(() => {
    if (authLoading) return;
    const init = async () => {
      if (!id) return;
      if (!user) {
        toast({ title: "Yêu cầu đăng nhập", description: "Vui lòng đăng nhập để vào phòng thi." });
        navigate("/auth");
        return;
      }
      setLoading(true);
      
      try {
        const { data, error } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
        if (error || !data) {
          toast({ title: "Không tìm thấy đề thi", variant: "destructive" });
          navigate("/learn/mock-exams");
          return;
        }

        if (!data.is_published) {
          setLocked("Đề thi chưa được công bố."); 
          setLoading(false); 
          return;
        }

        // Group questions
        const qs = data.questions || [];
        const grouped = {
          vocab: qs.filter((q: any) => q.skill === 'vocabulary' || q.skill === 'kanji' || !q.skill),
          reading: qs.filter((q: any) => q.skill === 'reading' || q.skill === 'grammar'),
          listening: qs.filter((q: any) => q.skill === 'listening' || q.audio_url)
        };
        
        // Ensure some questions exist
        if (grouped.vocab.length === 0 && qs.length > 0) {
          grouped.vocab = qs; // fallback
        }
        
        setSections(grouped);
        setExam(data);

        // Fetch or create attempt
        const { data: attempts } = await supabase
          .from("exam_attempts")
          .select("*")
          .eq("exam_id", id)
          .eq("student_id", user.id)
          .order("started_at", { ascending: false });

        const inProgress = (attempts || []).find((a: any) => a.status === "in_progress");
        
        if (inProgress) {
          setAttemptId(inProgress.id);
          if (inProgress.answers) {
            const map: Record<number, any> = {};
            const arr = Array.isArray(inProgress.answers) ? inProgress.answers : Object.values(inProgress.answers);
            arr.forEach((v, i) => { if (v !== null && v !== undefined) map[i] = v; });
            setAnswers(map);
          }
        } else {
          const { data: ins } = await supabase
            .from("exam_attempts")
            .insert({ exam_id: id, student_id: user.id, status: "in_progress", started_at: new Date().toISOString() })
            .select("id").single();
          if (ins) setAttemptId(ins.id);
        }

        setLoading(false);
      } catch (err: any) {
        toast({ title: "Lỗi kết nối", description: err.message, variant: "destructive" });
        setLoading(false);
      }
    };
    init();
  }, [id, user?.id, authLoading]);

  // Timer tick for section
  useEffect(() => {
    if (!exam || locked || result) return;
    
    const interval = setInterval(() => {
      const sec = Math.floor((Date.now() - sectionStartedAt) / 1000);
      setSectionElapsed(sec);
      
      const maxTime = SECTION_TIMERS[currentSection] || 1800;
      if (sec >= maxTime) {
        toast({ title: "Hết giờ!", description: `Đã hết thời gian cho phần ${currentSection}.`, variant: "destructive" });
        handleNextSection(true);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [exam, currentSection, sectionStartedAt, locked, result]);

  const handleNextSection = (force = false) => {
    if (!force && !window.confirm("Bạn có chắc chắn muốn nộp phần thi này và chuyển sang phần tiếp theo? Bạn sẽ KHÔNG thể quay lại sửa bài.")) {
      return;
    }
    
    setCompletedSections(prev => [...prev, currentSection]);
    
    if (currentSection === 'vocab') {
      setCurrentSection('reading');
      setSectionStartedAt(Date.now());
      setSectionElapsed(0);
    } else if (currentSection === 'reading') {
      setCurrentSection('listening');
      setSectionStartedAt(Date.now());
      setSectionElapsed(0);
    } else {
      submitExam();
    }
  };

  const submitExam = async () => {
    if (!attemptId) return;
    setSubmitting(true);
    
    try {
      const answersArr = exam.questions.map((_: any, i: number) => answers[i] !== undefined ? answers[i] : null);
      
      // Calculate scores
      let correct = 0;
      exam.questions.forEach((q: any, i: number) => {
        if (answers[i] !== undefined && answers[i] === q.correct_index) correct++;
      });
      
      const score = Math.round((correct / exam.questions.length) * (exam.max_score || 180));
      const passed = score >= (exam.passing_score || 90); // Simple pass logic
      
      await supabase.from("exam_attempts").update({
        answers: answersArr,
        status: "submitted",
        score,
        total: exam.max_score || 180,
        submitted_at: new Date().toISOString()
      }).eq("id", attemptId);
      
      setResult({ score, total: exam.max_score || 180, passed });
    } catch (err) {
      toast({ title: "Lỗi nộp bài", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (locked) return <div className="p-12 text-center text-red-500 font-bold">{locked}</div>;

  if (result) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card className="text-center p-8 border-2 border-primary/50 shadow-xl">
          <CheckCircle2 className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-3xl font-extrabold mb-2">Đã Nộp Bài Thành Công</h2>
          <p className="text-xl mb-6">Kết quả mô phỏng JLPT</p>
          <div className="bg-muted p-6 rounded-xl mb-6">
            <p className="text-5xl font-black text-primary mb-2">{result.score} / {result.total}</p>
            <Badge className={result.passed ? "bg-green-500" : "bg-red-500"}>
              {result.passed ? "ĐẠT (PASS)" : "TRƯỢT (FAIL)"}
            </Badge>
          </div>
          <Button onClick={() => navigate("/learn/mock-exams")} className="w-full">
            Quay lại Phòng Thi Ảo
          </Button>
        </Card>
      </div>
    );
  }

  const currentQuestions = sections[currentSection] || [];
  const maxTime = SECTION_TIMERS[currentSection] || 1800;
  const timeLeft = Math.max(0, maxTime - sectionElapsed);
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const secs = (timeLeft % 60).toString().padStart(2, '0');
  
  // Find global index offset for the current section to map to 'answers' state properly
  const getGlobalIndex = (q: any) => exam.questions.findIndex((eq: any) => eq.id === q.id || eq === q);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24">
      {/* Header bar */}
      <div className="sticky top-0 z-40 bg-card border-b p-4 shadow-sm flex items-center justify-between rounded-b-xl">
        <div>
          <Badge className="mb-1" variant="outline">JLPT Mock</Badge>
          <h1 className="text-lg font-bold line-clamp-1">{exam.title_vi}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-lg ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-muted text-foreground'}`}>
            <Clock className="w-5 h-5" />
            {mins}:{secs}
          </div>
          <Button 
            variant="destructive" 
            onClick={() => handleNextSection(false)}
            disabled={submitting}
          >
            {currentSection === 'listening' ? 'Nộp bài thi' : 'Nộp phần này & Đi tiếp'}
          </Button>
        </div>
      </div>

      {/* Tabs representation (locked for simulation) */}
      <div className="flex gap-2">
        <Badge variant={currentSection === 'vocab' ? 'default' : completedSections.includes('vocab') ? 'outline' : 'secondary'} className="px-4 py-2 text-sm">
          Từ vựng & Chữ hán
        </Badge>
        <Badge variant={currentSection === 'reading' ? 'default' : completedSections.includes('reading') ? 'outline' : 'secondary'} className="px-4 py-2 text-sm">
          Ngữ pháp & Đọc hiểu
        </Badge>
        <Badge variant={currentSection === 'listening' ? 'default' : completedSections.includes('listening') ? 'outline' : 'secondary'} className="px-4 py-2 text-sm">
          Nghe hiểu
        </Badge>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900 flex gap-3 text-sm text-amber-800 dark:text-amber-200">
        <ShieldAlert className="w-5 h-5 shrink-0" />
        <p>Hệ thống đang mô phỏng thời gian thi JLPT thực tế. Hết giờ, bài của phần này sẽ tự động thu. <strong>Bạn không thể quay lại phần đã thi.</strong></p>
      </div>

      {/* Questions list */}
      <div className="space-y-6">
        {currentQuestions.map((q, localIdx) => {
          const globalIdx = getGlobalIndex(q);
          const ans = answers[globalIdx];
          
          return (
            <Card key={globalIdx} className="border border-border/50 shadow-sm overflow-hidden">
              <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                <span className="font-bold text-sm">Câu {localIdx + 1}</span>
              </div>
              <CardContent className="p-5 space-y-4">
                <div className="font-medium text-base"><FormattedText text={q.text || ''} /></div>
                
                {q.image_url && <img src={q.image_url} alt="Minh họa" className="max-w-md rounded-lg border" />}
                
                {q.audio_url && currentSection === 'listening' && (
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20">
                    <p className="text-xs font-bold text-primary mb-2 flex items-center gap-1"><Headphones className="w-4 h-4"/> Audio Nghe Hiểu (Chỉ nghe 1 lần)</p>
                    <audio src={q.audio_url} controls controlsList="nodownload" className="w-full h-10" />
                  </div>
                )}

                <div className="space-y-2 mt-4">
                  {(q.options || []).map((opt: string, optIdx: number) => (
                    <label 
                      key={optIdx} 
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${ans === optIdx ? 'bg-primary/10 border-primary shadow-sm' : 'hover:bg-muted/50 border-border'}`}
                    >
                      <input 
                        type="radio" 
                        name={`q_${globalIdx}`} 
                        checked={ans === optIdx}
                        onChange={() => setAnswers(prev => ({ ...prev, [globalIdx]: optIdx }))}
                        className="mt-1 w-4 h-4 accent-primary"
                      />
                      <span className="flex-1"><FormattedText text={opt} /></span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {currentQuestions.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            Không có câu hỏi nào trong phần thi này.
          </div>
        )}
      </div>
      
      <div className="flex justify-end pt-6">
        <Button size="lg" onClick={() => handleNextSection(false)} disabled={submitting}>
          {currentSection === 'listening' ? 'Nộp bài thi' : 'Hoàn thành phần này'}
        </Button>
      </div>
    </div>
  );
}
