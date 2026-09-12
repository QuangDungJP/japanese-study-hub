import { useEffect, useState, useRef } from "react";
import { localMockExam } from '@/data/mockJlptExam';
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, AlertTriangle, Loader2, Play, BookOpen, Headphones, ShieldAlert, CheckCircle2, Mic, Square } from "lucide-react";
import FormattedText from "@/components/shared/FormattedText";

const SECTION_TIMERS: Record<string, number> = {
  'vocab': 30 * 60,   // 30 mins
  'reading': 60 * 60, // 60 mins
  'listening': 35 * 60, // 35 mins
  'kaiwa': 15 * 60 // 15 mins for speaking
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
  const [recordingId, setRecordingId] = useState<string | null>(null);
  
  // Section state
  const [currentSection, setCurrentSection] = useState<'vocab' | 'reading' | 'listening' | 'kaiwa'>('vocab');
  const [sectionElapsed, setSectionElapsed] = useState(0);
  const [sectionStartedAt, setSectionStartedAt] = useState<number>(Date.now());
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  // Grouped questions
  const [sections, setSections] = useState<{ vocab: any[], reading: any[], listening: any[], kaiwa: any[] }>({
    vocab: [], reading: [], listening: [], kaiwa: []
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
        let data: any = null;
        let attempts: any[] = [];
        
        if (id === 'mock-local-1') {
          data = localMockExam;
          const localStr = localStorage.getItem(`mock_attempts_${user.id}`);
          if (localStr) {
             try { attempts = JSON.parse(localStr).filter((a: any) => a.exam_id === id); } catch(e){}
          }
        } else {
          const res = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
          if (res.error || !res.data) {
            toast({ title: "Không tìm thấy đề thi", variant: "destructive" });
            navigate("/learn/mock-exams");
            return;
          }
          data = res.data;
          
          const attemptsRes = await supabase
            .from("exam_attempts")
            .select("*")
            .eq("exam_id", id)
            .eq("student_id", user.id)
            .order("started_at", { ascending: false });
          attempts = attemptsRes.data || [];
        }

        if (!data.is_published) {
          setLocked("Đề thi chưa được công bố."); 
          setLoading(false); 
          return;
        }

        // Group questions
        const qs = data.questions || [];
        const grouped = {
          vocab: qs.filter((q: any) => q.skill === 'vocabulary' || q.skill === 'kanji' || (!q.skill && !q.audio_url)),
          reading: qs.filter((q: any) => q.skill === 'reading' || q.skill === 'grammar'),
          listening: qs.filter((q: any) => q.skill === 'listening' || (q.audio_url && q.skill !== 'kaiwa')),
          kaiwa: qs.filter((q: any) => q.skill === 'kaiwa' || q.type === 'audio_record')
        };
        
        // Ensure some questions exist
        if (grouped.vocab.length === 0 && qs.length > 0) {
          grouped.vocab = qs; // fallback
        }
        
        setSections(grouped);
        setExam(data);

        // Fetch or create attempt
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
          const newAttempt = { id: `attempt_${Date.now()}`, exam_id: id, student_id: user.id, status: "in_progress", started_at: new Date().toISOString() };
          if (id === 'mock-local-1') {
            const localStr = localStorage.getItem(`mock_attempts_${user.id}`);
            let allAtts = [];
            if (localStr) try { allAtts = JSON.parse(localStr); } catch(e){}
            allAtts.push(newAttempt);
            localStorage.setItem(`mock_attempts_${user.id}`, JSON.stringify(allAtts));
            setAttemptId(newAttempt.id);
          } else {
            const { data: ins } = await supabase
              .from("exam_attempts")
              .insert({ exam_id: id, student_id: user.id, status: "in_progress", started_at: new Date().toISOString() })
              .select("id").single();
            if (ins) setAttemptId(ins.id);
          }
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
    } else if (currentSection === 'listening' && sections.kaiwa.length > 0) {
      setCurrentSection('kaiwa');
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
      
      // Calculate scores per section
      let vocabCorrect = 0, readingCorrect = 0, listeningCorrect = 0;
      let vocabTotal = 0, readingTotal = 0, listeningTotal = 0;

      exam.questions.forEach((q: any, i: number) => {
        const isCorrect = answers[i] !== undefined && answers[i] === q.correct_index;
        if (sections.vocab.some(vq => vq.id === q.id || vq === q)) {
          vocabTotal++; if (isCorrect) vocabCorrect++;
        } else if (sections.reading.some(rq => rq.id === q.id || rq === q)) {
          readingTotal++; if (isCorrect) readingCorrect++;
        } else if (sections.listening.some(lq => lq.id === q.id || lq === q)) {
          listeningTotal++; if (isCorrect) listeningCorrect++;
        }
      });
      
      const level = exam.level || 'N4';
      let scoreBreakdown: any = {};
      let totalScore = 0;
      let passed = false;
      const passTotal = exam.passing_score || 90;
      
      if (level === 'N4' || level === 'N5') {
        // N4/N5: Knowledge (Vocab+Reading) 120pts, Listening 60pts
        const knowledgePts = Math.round(((vocabCorrect + readingCorrect) / Math.max(1, vocabTotal + readingTotal)) * 120);
        const listeningPts = Math.round((listeningCorrect / Math.max(1, listeningTotal)) * 60);
        totalScore = knowledgePts + listeningPts;
        const passKnowledge = knowledgePts >= 38;
        const passListen = listeningPts >= 19;
        passed = passKnowledge && passListen && (totalScore >= passTotal);
        
        scoreBreakdown = {
          knowledge: { score: knowledgePts, max: 120, passed: passKnowledge, min: 38, name: "Kiến thức NN & Đọc hiểu" },
          listening: { score: listeningPts, max: 60, passed: passListen, min: 19, name: "Nghe hiểu" }
        };
      } else {
        // N1/N2/N3: Vocab 60, Reading 60, Listening 60
        const vocabPts = Math.round((vocabCorrect / Math.max(1, vocabTotal)) * 60);
        const readingPts = Math.round((readingCorrect / Math.max(1, readingTotal)) * 60);
        const listeningPts = Math.round((listeningCorrect / Math.max(1, listeningTotal)) * 60);
        totalScore = vocabPts + readingPts + listeningPts;
        
        const passV = vocabPts >= 19;
        const passR = readingPts >= 19;
        const passL = listeningPts >= 19;
        passed = passV && passR && passL && (totalScore >= passTotal);
        
        scoreBreakdown = {
          vocab: { score: vocabPts, max: 60, passed: passV, min: 19, name: "Từ vựng/Ngữ pháp" },
          reading: { score: readingPts, max: 60, passed: passR, min: 19, name: "Đọc hiểu" },
          listening: { score: listeningPts, max: 60, passed: passL, min: 19, name: "Nghe hiểu" }
        };
      }
      
      if (sections.kaiwa.length > 0) {
        let kaiwaMax = 0;
        sections.kaiwa.forEach(q => kaiwaMax += (q.points || 10));
        scoreBreakdown.kaiwa = { score: 'Pending', max: kaiwaMax, passed: true, min: 0, name: "Giao tiếp (Kaiwa)" };
      }
      
      if (id === 'mock-local-1') {
        const localStr = localStorage.getItem(`mock_attempts_${user.id}`);
        let allAtts = [];
        if (localStr) try { allAtts = JSON.parse(localStr); } catch(e){}
        const updatedAtts = allAtts.map(a => {
          if (a.id === attemptId) {
            return {
              ...a,
              answers: answersArr,
              status: "submitted",
              score: totalScore,
              total: exam.max_score || 180,
              metadata: { scoreBreakdown },
              submitted_at: new Date().toISOString()
            };
          }
          return a;
        });
        localStorage.setItem(`mock_attempts_${user.id}`, JSON.stringify(updatedAtts));
      } else {
        await supabase.from("exam_attempts").update({
          answers: answersArr,
          status: "submitted",
          score: totalScore,
          total: exam.max_score || 180,
          metadata: { scoreBreakdown },
          submitted_at: new Date().toISOString()
        }).eq("id", attemptId);
      }
      
      setResult({ score: totalScore, total: exam.max_score || 180, passed, breakdown: scoreBreakdown, level });
    } catch (err) {
      toast({ title: "Lỗi nộp bài", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950"><Loader2 className="w-10 h-10 animate-spin text-zinc-400" /></div>;
  if (locked) return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950"><div className="p-12 text-center text-red-500 font-bold bg-white dark:bg-zinc-900 rounded-3xl shadow-xl">{locked}</div></div>;

  if (result) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8 md:p-12 border-0 shadow-2xl rounded-[2rem] bg-white dark:bg-zinc-900 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-3 ${result.passed ? 'bg-emerald-500' : 'bg-red-500'}`} />
            
            <div className="text-center space-y-4 mb-10">
              <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${result.passed ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                {result.passed ? <CheckCircle2 className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
              </div>
              <h2 className="text-4xl font-black text-zinc-900 dark:text-zinc-100">
                {result.passed ? "CHÚC MỪNG BẠN ĐÃ ĐỖ!" : "THẬT ĐÁNG TIẾC, BẠN CHƯA ĐẠT!"}
              </h2>
              <p className="text-xl text-zinc-500 dark:text-zinc-400">Kết quả thi thử JLPT {result.level}</p>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-950 p-8 rounded-3xl mb-8 border border-zinc-100 dark:border-zinc-800 text-center">
              <p className="text-7xl font-black tracking-tighter text-zinc-900 dark:text-zinc-100 mb-2">
                {result.score}<span className="text-4xl text-zinc-400">/180</span>
              </p>
              <p className="text-zinc-500 font-medium">Điểm đỗ yêu cầu: {exam.passing_score}</p>
            </div>

            <div className="space-y-4 mb-10">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-2">Chi tiết từng phần thi (Có điểm liệt)</h3>
              {Object.entries(result.breakdown).map(([key, part]: [string, any]) => (
                <div key={key} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 gap-4">
                  <div className="flex-1">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">{part.name}</p>
                    <p className="text-xs text-zinc-500 mt-1">Điểm liệt: dưới {part.min}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className={`text-2xl font-black ${!part.passed ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                        {part.score}<span className="text-base font-medium text-zinc-400">/{part.max}</span>
                      </p>
                    </div>
                    <Badge variant={part.passed ? "outline" : "destructive"} className={part.passed ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                      {part.passed ? "Đạt" : "Điểm liệt"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={() => navigate("/learn/mock-exams")} className="w-full h-14 text-lg rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold transition-all">
              Quay lại sảnh chờ
            </Button>
          </Card>
        </div>
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

      <div className="flex gap-2 flex-wrap">
        <Badge variant={currentSection === 'vocab' ? 'default' : completedSections.includes('vocab') ? 'outline' : 'secondary'} className="px-4 py-2 text-sm">
          Từ vựng & Chữ hán
        </Badge>
        <Badge variant={currentSection === 'reading' ? 'default' : completedSections.includes('reading') ? 'outline' : 'secondary'} className="px-4 py-2 text-sm">
          Ngữ pháp & Đọc hiểu
        </Badge>
        <Badge variant={currentSection === 'listening' ? 'default' : completedSections.includes('listening') ? 'outline' : 'secondary'} className="px-4 py-2 text-sm">
          Nghe hiểu
        </Badge>
        {sections.kaiwa.length > 0 && (
          <Badge variant={currentSection === 'kaiwa' ? 'default' : completedSections.includes('kaiwa') ? 'outline' : 'secondary'} className="px-4 py-2 text-sm">
            Kaiwa (Giao tiếp)
          </Badge>
        )}
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
                  {q.skill === 'kaiwa' || q.type === 'audio_record' ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-muted/30 rounded-xl border-2 border-dashed gap-4">
                      {ans ? (
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="w-8 h-8" />
                          </div>
                          <p className="font-bold text-emerald-600">Đã lưu bản ghi âm</p>
                          <Button variant="outline" size="sm" onClick={() => setAnswers(prev => { const n = {...prev}; delete n[globalIdx]; return n; })}>
                            Ghi âm lại
                          </Button>
                        </div>
                      ) : recordingId === q.id ? (
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <Mic className="w-8 h-8" />
                          </div>
                          <p className="font-bold text-red-600 animate-pulse">Đang ghi âm...</p>
                          <Button variant="destructive" onClick={() => {
                            setRecordingId(null);
                            setAnswers(prev => ({ ...prev, [globalIdx]: "recorded_audio_blob_url" }));
                          }}>
                            <Square className="w-4 h-4 mr-2" /> Dừng & Lưu
                          </Button>
                        </div>
                      ) : (
                        <Button size="lg" onClick={() => setRecordingId(q.id)} className="bg-red-500 hover:bg-red-600 text-white gap-2 rounded-full px-8">
                          <Mic className="w-5 h-5" /> Bắt đầu ghi âm
                        </Button>
                      )}
                    </div>
                  ) : (
                    (q.options || []).map((opt: string, optIdx: number) => (
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
                    ))
                  )}
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
          {currentSection === 'listening' && sections.kaiwa.length === 0 ? 'Nộp bài thi' : currentSection === 'kaiwa' ? 'Nộp bài thi' : 'Hoàn thành phần này'}
        </Button>
      </div>
    </div>
  );
}
