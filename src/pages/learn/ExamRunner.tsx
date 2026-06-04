import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Clock, CheckCircle2, AlertTriangle, Loader2, Trophy, Lock } from "lucide-react";

interface Question {
  id?: string;
  text: string;
  options: string[];
  correct_index: number;
  points?: number;
}

interface Exam {
  id: string;
  title_vi: string;
  title: string;
  instructions: string | null;
  description_vi: string | null;
  duration_minutes: number;
  starts_at: string | null;
  ends_at: string | null;
  lock_after_end: boolean;
  shuffle_questions: boolean;
  max_attempts: number;
  questions: Question[];
  passing_score: number | null;
  max_score: number | null;
  video_url: string | null;
  is_published: boolean;
}

const fmt = (s: number) => {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const r = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
};

const ExamRunner = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [remaining, setRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const submittedRef = useRef(false);

  const orderedQuestions = useMemo(() => {
    if (!exam) return [];
    const list = [...(exam.questions || [])];
    if (exam.shuffle_questions) list.sort(() => Math.random() - 0.5);
    return list;
  }, [exam]);

  useEffect(() => {
    const init = async () => {
      if (!id || !user) return;
      setLoading(true);
      const { data, error } = await supabase.from("exams").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast({ title: "Không tìm thấy bài kiểm tra", variant: "destructive" });
        navigate("/learn");
        return;
      }
      const ex = data as unknown as Exam;
      if (!ex.is_published) {
        setLocked("Bài kiểm tra chưa được công bố.");
        setExam(ex); setLoading(false); return;
      }
      const now = Date.now();
      if (ex.starts_at && new Date(ex.starts_at).getTime() > now) {
        setLocked(`Bài kiểm tra bắt đầu lúc ${new Date(ex.starts_at).toLocaleString("vi-VN")}.`);
        setExam(ex); setLoading(false); return;
      }
      if (ex.ends_at && ex.lock_after_end && new Date(ex.ends_at).getTime() < now) {
        setLocked("Bài kiểm tra đã đóng.");
        setExam(ex); setLoading(false); return;
      }

      // attempt count
      const { data: attempts } = await supabase
        .from("exam_attempts").select("id,status")
        .eq("exam_id", id).eq("student_id", user.id);
      const submitted = (attempts || []).filter((a: any) => a.status !== "in_progress");
      if (submitted.length >= (ex.max_attempts || 1)) {
        setLocked("Bạn đã dùng hết số lượt làm bài.");
        setExam(ex); setLoading(false); return;
      }
      const inProgress = (attempts || []).find((a: any) => a.status === "in_progress");
      let aid = inProgress?.id;
      let start = now;
      if (inProgress) {
        const { data: full } = await supabase.from("exam_attempts").select("*").eq("id", aid).maybeSingle();
        if (full?.started_at) start = new Date(full.started_at).getTime();
        if (full?.answers) {
          const map: Record<number, number> = {};
          (full.answers as any[]).forEach((v, i) => { if (typeof v === "number") map[i] = v; });
          setAnswers(map);
        }
      } else {
        const { data: ins, error: insErr } = await supabase.from("exam_attempts").insert({
          exam_id: id, student_id: user.id, status: "in_progress", started_at: new Date().toISOString(),
        }).select("id").single();
        if (insErr) { toast({ title: "Lỗi", description: insErr.message, variant: "destructive" }); return; }
        aid = ins.id;
      }
      setExam(ex);
      setAttemptId(aid!);
      setStartedAt(start);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line
  }, [id, user?.id]);

  // Countdown
  useEffect(() => {
    if (!exam || !startedAt) return;
    const tick = () => {
      const elapsed = (Date.now() - startedAt) / 1000;
      const total = exam.duration_minutes * 60;
      const left = Math.max(0, total - elapsed);
      setRemaining(left);
      if (left <= 0 && !submittedRef.current) submit(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [exam, startedAt]);

  const submit = async (auto = false) => {
    if (!exam || !attemptId || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    const total = orderedQuestions.length;
    let score = 0;
    const answersArr: (number | null)[] = orderedQuestions.map((q, i) => {
      const a = answers[i];
      if (typeof a === "number" && a === q.correct_index) score += (q.points || 1);
      return typeof a === "number" ? a : null;
    });
    const time_spent = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    await supabase.from("exam_attempts").update({
      submitted_at: new Date().toISOString(),
      status: auto ? "auto_submitted" : "submitted",
      score, total, answers: answersArr, time_spent_seconds: time_spent,
    }).eq("id", attemptId);
    setResult({ score, total });
    setSubmitting(false);
    toast({ title: auto ? "Hết giờ, đã tự nộp" : "Đã nộp bài", description: `Điểm: ${score}/${total}` });
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  if (locked || !exam) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">{exam?.title_vi || "Không khả dụng"}</h2>
            <p className="text-muted-foreground">{locked}</p>
            <Button onClick={() => navigate(-1)}>Quay lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result) {
    const passing = exam.passing_score || 0;
    const passed = result.score >= passing;
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Trophy className={`w-14 h-14 mx-auto ${passed ? "text-yellow-500" : "text-muted-foreground"}`} />
            <h2 className="text-2xl font-bold">{passed ? "Chúc mừng!" : "Đã nộp bài"}</h2>
            <p className="text-4xl font-extrabold text-primary">{result.score}/{result.total}</p>
            <p className="text-muted-foreground">Điểm đạt yêu cầu: {passing}</p>
            <Button onClick={() => navigate("/learn")}>Về trang học tập</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const total = orderedQuestions.length;
  const answered = Object.keys(answers).length;
  const lowTime = remaining < 60;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-lg font-bold truncate">{exam.title_vi || exam.title}</h1>
            <p className="text-xs text-muted-foreground">Đã trả lời {answered}/{total}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={lowTime ? "destructive" : "secondary"} className="text-base px-3 py-1.5 font-mono">
              <Clock className="w-4 h-4 mr-1" /> {fmt(remaining)}
            </Badge>
            <Button onClick={() => submit(false)} disabled={submitting} variant="hero">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Nộp bài
            </Button>
          </div>
        </div>
        <Progress value={(answered / Math.max(total, 1)) * 100} className="h-1 rounded-none" />
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {(exam.instructions || exam.description_vi) && (
          <Card>
            <CardContent className="p-4 text-sm flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="whitespace-pre-wrap">{exam.instructions || exam.description_vi}</p>
            </CardContent>
          </Card>
        )}

        {orderedQuestions.length === 0 && (
          <Card><CardContent className="py-10 text-center text-muted-foreground">Bài kiểm tra chưa có câu hỏi.</CardContent></Card>
        )}

        {orderedQuestions.map((q, i) => (
          <Card key={i} className="border-2 hover:border-primary/30 transition">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex gap-2">
                <span className="inline-flex w-7 h-7 rounded-full bg-primary text-primary-foreground items-center justify-center text-sm shrink-0">{i + 1}</span>
                <span>{q.text}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[i] === oi;
                return (
                  <button
                    key={oi}
                    type="button"
                    onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                      selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-semibold shrink-0 ${
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
                    }`}>{String.fromCharCode(65 + oi)}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ExamRunner;