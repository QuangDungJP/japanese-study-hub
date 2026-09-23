import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Loader2, BookOpen, Headphones, ShieldAlert, CheckCircle2, Mic, Play, Square, Trophy, UserPlus } from "lucide-react";
import FormattedText from "@/components/shared/FormattedText";

const SECTION_TIMERS: Record<string, number> = {
  'vocab': 30 * 60,
  'reading': 60 * 60,
  'listening': 35 * 60,
  'kaiwa': 15 * 60
};

export default function PublicExamRunner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exam, setExam] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  
  // Section state
  const [currentSection, setCurrentSection] = useState<'vocab' | 'reading' | 'listening' | 'kaiwa'>('vocab');
  const [sectionElapsed, setSectionElapsed] = useState(0);
  const [sectionStartedAt, setSectionStartedAt] = useState<number>(Date.now());
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);

  const [sections, setSections] = useState<{ vocab: any[], reading: any[], listening: any[], kaiwa: any[] }>({
    vocab: [], reading: [], listening: [], kaiwa: []
  });

  useEffect(() => {
    const init = async () => {
      if (!id) return;
      setLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("exams")
          .select("*")
          .eq("id", id)
          .eq("is_public", true)
          .maybeSingle();

        if (error || !data) {
          toast({ title: "Không tìm thấy đề thi", description: "Đề thi không tồn tại hoặc đã bị ẩn.", variant: "destructive" });
          navigate("/thi-thu");
          return;
        }

        const qs = data.questions || [];
        const grouped = {
          vocab: qs.filter((q: any) => q.skill === 'vocabulary' || q.skill === 'kanji' || (!q.skill && !q.audio_url)),
          reading: qs.filter((q: any) => q.skill === 'reading' || q.skill === 'grammar'),
          listening: qs.filter((q: any) => q.skill === 'listening' || (q.audio_url && q.skill !== 'kaiwa')),
          kaiwa: qs.filter((q: any) => q.skill === 'kaiwa' || q.type === 'audio_record')
        };
        
        if (grouped.vocab.length === 0 && qs.length > 0) {
          grouped.vocab = qs;
        }
        
        setSections(grouped);
        setExam(data);
        setSectionStartedAt(Date.now());
        setLoading(false);
      } catch (err: any) {
        toast({ title: "Lỗi kết nối", description: err.message, variant: "destructive" });
        setLoading(false);
      }
    };
    init();
  }, [id]);

  useEffect(() => {
    if (!exam || result) return;
    
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
  }, [exam, currentSection, sectionStartedAt, result]);

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
    setSubmitting(true);
    
    // Simulate calculating points (same logic as authenticated exam, but no DB save)
    let vocabCorrect = 0, readingCorrect = 0, listeningCorrect = 0;
    let vocabTotal = 0, readingTotal = 0, listeningTotal = 0;
    
    const configQ = exam.questions.find((q: any) => q.type === 'system_config');
    const scoringConfig = configQ?.config || {
      difficulty_factor: 1.0,
      section_pass: { language: 19, reading: 19, listening: 19, combined: 38 }
    };

    exam.questions.forEach((q: any, i: number) => {
      if (q.type === 'system_config') return;
      
      const processQuestion = (question: any, answerKey: string | number) => {
        const isCorrect = answers[answerKey] !== undefined && answers[answerKey] === question.correct_index;
        const pts = question.points !== undefined ? Number(question.points) : 5;
        if (sections.vocab.some(vq => vq.id === q.id || vq === q)) {
          vocabTotal += pts; if (isCorrect) vocabCorrect += pts;
        } else if (sections.reading.some(rq => rq.id === q.id || rq === q)) {
          readingTotal += pts; if (isCorrect) readingCorrect += pts;
        } else if (sections.listening.some(lq => lq.id === q.id || lq === q)) {
          listeningTotal += pts; if (isCorrect) listeningCorrect += pts;
        }
      };

      if (q.is_passage && q.sub_questions) {
        q.sub_questions.forEach((sq: any, sIdx: number) => {
          processQuestion(sq, `${i}_${sIdx}`);
        });
      } else {
        processQuestion(q, i);
      }
    });
    
    const level = exam.exam_category || exam.level || 'N4';
    let scoreBreakdown: any = {};
    let totalScore = 0;
    let passed = false;
    const passTotal = exam.passing_score || 90;
    
    if (level === 'N4' || level === 'N5') {
      const knowledgePts = Math.round(((vocabCorrect + readingCorrect) / Math.max(1, vocabTotal + readingTotal)) * 120);
      const listeningPts = Math.round((listeningCorrect / Math.max(1, listeningTotal)) * 60);
      totalScore = knowledgePts + listeningPts;
      
      const passKnowledge = knowledgePts >= (scoringConfig.section_pass.combined || 38);
      const passListen = listeningPts >= (scoringConfig.section_pass.listening || 19);
      passed = passKnowledge && passListen && (totalScore >= passTotal);
      
      scoreBreakdown = {
        knowledge: { score: knowledgePts, max: 120, passed: passKnowledge, min: scoringConfig.section_pass.combined || 38, name: "Kiến thức NN & Đọc hiểu" },
        listening: { score: listeningPts, max: 60, passed: passListen, min: scoringConfig.section_pass.listening || 19, name: "Nghe hiểu" }
      };
    } else {
      const languagePts = Math.round((vocabCorrect / Math.max(1, vocabTotal)) * 60);
      const readingPts = Math.round((readingCorrect / Math.max(1, readingTotal)) * 60);
      const listeningPts = Math.round((listeningCorrect / Math.max(1, listeningTotal)) * 60);
      totalScore = languagePts + readingPts + listeningPts;
      
      const passLang = languagePts >= (scoringConfig.section_pass.language || 19);
      const passRead = readingPts >= (scoringConfig.section_pass.reading || 19);
      const passListen = listeningPts >= (scoringConfig.section_pass.listening || 19);
      passed = passLang && passRead && passListen && (totalScore >= passTotal);
      
      scoreBreakdown = {
        language: { score: languagePts, max: 60, passed: passLang, min: scoringConfig.section_pass.language || 19, name: "Kiến thức Ngôn ngữ" },
        reading: { score: readingPts, max: 60, passed: passRead, min: scoringConfig.section_pass.reading || 19, name: "Đọc hiểu" },
        listening: { score: listeningPts, max: 60, passed: passListen, min: scoringConfig.section_pass.listening || 19, name: "Nghe hiểu" }
      };
    }

    setResult({
      score: totalScore,
      passed,
      breakdown: scoreBreakdown,
      max: exam.max_score || 180
    });
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <span className="ml-3 font-semibold text-lg">Đang tải đề thi...</span>
      </div>
    );
  }

  // --- RENDERING RESULT (LEAD GEN) ---
  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-2xl overflow-hidden rounded-3xl border-0 shadow-2xl">
          <div className={`p-8 text-center text-white ${result.passed ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-red-600'}`}>
            <Trophy className="w-20 h-20 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl sm:text-4xl font-black mb-2">
              {result.passed ? "Chúc mừng! Bạn đã ĐẠT" : "Rất tiếc! Bạn CHƯA ĐẠT"}
            </h1>
            <div className="text-5xl sm:text-7xl font-black my-6">
              {result.score}<span className="text-2xl sm:text-3xl font-medium opacity-80">/{result.max}</span>
            </div>
          </div>
          
          <CardContent className="p-6 sm:p-10 space-y-8 bg-card">
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Điểm thành phần
              </h3>
              <div className="space-y-4">
                {Object.entries(result.breakdown).map(([key, data]: [string, any]) => (
                  <div key={key} className="flex flex-col gap-1.5 p-4 rounded-2xl bg-muted/50 border">
                    <div className="flex justify-between items-center text-sm font-semibold">
                      <span>{data.name}</span>
                      <span className={data.passed ? "text-emerald-600" : "text-rose-600"}>{data.score}/{data.max}</span>
                    </div>
                    <div className="w-full h-2.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${data.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.min(100, (data.score / data.max) * 100)}%` }}
                      />
                    </div>
                    {!data.passed && <p className="text-[10px] text-rose-500 text-right mt-0.5">Chưa đạt điểm liệt (Min: {data.min})</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* LEAD GENERATION CTA */}
            <div className="p-6 rounded-3xl bg-primary/10 border-2 border-primary/20 text-center space-y-4">
              <h4 className="text-xl font-black text-primary">Muốn xem chi tiết đáp án?</h4>
              <p className="text-muted-foreground text-sm">
                Bạn vừa hoàn thành một bài thi thử tuyệt vời! Hãy tạo một tài khoản hoàn toàn miễn phí để xem đáp án đúng/sai từng câu, lời giải chi tiết và lưu lại kết quả này vào hồ sơ của bạn nhé.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <Button asChild size="lg" className="rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                  <Link to="/auth?tab=register"><UserPlus className="w-5 h-5 mr-2" /> Đăng ký miễn phí ngay</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-xl font-bold">
                  <Link to="/thi-thu">Về danh sách đề</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- RENDERING EXAM TAKING (Simplified) ---
  const currentSectionData = sections[currentSection] || [];
  const maxTime = SECTION_TIMERS[currentSection] || 1800;
  const timeRemaining = Math.max(0, maxTime - sectionElapsed);
  const isLastSection = 
    (currentSection === 'kaiwa') || 
    (currentSection === 'listening' && sections.kaiwa.length === 0) ||
    (currentSection === 'reading' && sections.listening.length === 0 && sections.kaiwa.length === 0) ||
    (currentSection === 'vocab' && sections.reading.length === 0 && sections.listening.length === 0 && sections.kaiwa.length === 0);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-b shadow-sm h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="font-mono text-lg bg-primary/10 text-primary border-primary/20 py-1 px-3">
            <Clock className="w-5 h-5 mr-2 inline" />
            {formatTime(timeRemaining)}
          </Badge>
          <span className="font-bold hidden sm:inline text-foreground/80">{exam.title_vi || exam.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {submitting ? (
            <Button disabled className="rounded-xl font-bold">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang chấm điểm...
            </Button>
          ) : (
            <Button 
              onClick={() => handleNextSection()} 
              variant={isLastSection ? "default" : "outline"}
              className={`rounded-xl font-bold ${isLastSection ? 'bg-primary text-primary-foreground' : ''}`}
            >
              {isLastSection ? 'Nộp bài toàn phần' : 'Nộp phần này & Đi tiếp'}
            </Button>
          )}
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 container mx-auto p-4 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 max-w-4xl space-y-8 pb-32">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-900 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-bold mb-1">Phần thi: {currentSection.toUpperCase()}</p>
              <p>Hãy hoàn thành phần này trước khi hết giờ. Bạn KHÔNG THỂ quay lại phần này sau khi đã chuyển sang phần tiếp theo.</p>
            </div>
          </div>

          {currentSectionData.map((q: any, i: number) => {
            const num = exam.questions.findIndex((eq: any) => eq.id === q.id) + 1;
            
            return (
              <Card key={q.id || i} className="rounded-2xl shadow-sm border-muted">
                <CardHeader className="bg-muted/30 pb-4 border-b">
                  <CardTitle className="text-base font-bold flex items-start gap-3">
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-sm shrink-0">Câu {num}</span>
                    <FormattedText text={q.text || ''} className="leading-relaxed" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {q.is_passage && q.sub_questions ? (
                    <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border mb-6 text-sm leading-relaxed whitespace-pre-wrap font-serif">
                        <FormattedText text={q.passage_text || ''} />
                      </div>
                      <div className="space-y-8 pl-4 border-l-2 border-primary/20">
                        {q.sub_questions.map((sq: any, sIdx: number) => {
                          const subKey = `${num-1}_${sIdx}`;
                          return (
                            <div key={sIdx} className="space-y-4">
                              <p className="font-bold text-sm">
                                <span className="text-primary mr-2">#{sIdx + 1}</span> 
                                <FormattedText text={sq.text || ''} />
                              </p>
                              <div className="grid gap-2">
                                {sq.options?.map((opt: string, oIdx: number) => (
                                  <label 
                                    key={oIdx} 
                                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                      answers[subKey] === oIdx ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:bg-muted bg-muted/30'
                                    }`}
                                  >
                                    <input 
                                      type="radio" 
                                      name={`q_${subKey}`} 
                                      checked={answers[subKey] === oIdx}
                                      onChange={() => setAnswers(prev => ({ ...prev, [subKey]: oIdx }))}
                                      className="mt-1"
                                    />
                                    <span className="text-sm"><FormattedText text={opt} /></span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {q.options?.map((opt: string, oIdx: number) => (
                        <label 
                          key={oIdx} 
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            answers[num-1] === oIdx ? 'border-primary bg-primary/5 shadow-sm' : 'border-transparent hover:bg-muted bg-muted/30'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name={`q_${num-1}`} 
                            checked={answers[num-1] === oIdx}
                            onChange={() => setAnswers(prev => ({ ...prev, [num-1]: oIdx }))}
                            className="mt-1 w-4 h-4 text-primary"
                          />
                          <span className="text-sm font-medium"><FormattedText text={opt} /></span>
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
