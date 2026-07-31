import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, CheckCircle2, AlertTriangle, Loader2, Trophy, Lock,
  Paperclip, Video as VideoIcon, MessageSquare, X, Wifi, WifiOff, Save,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "essay";
type TimerMode = "countdown" | "stopwatch" | "none";

interface Question {
  id?: string;
  type?: QuestionType;
  text: string;
  options: string[];
  correct_index: number;
  accepted_answers?: string[];
  explanation?: string;
  points?: number;
}

interface Exam {
  id: string;
  title_vi: string;
  title: string;
  instructions: string | null;
  description_vi: string | null;
  duration_minutes: number | null;
  timer_mode: TimerMode | null;
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

const qType = (q: Question): QuestionType => q.type || "multiple_choice";
const isAutoGraded = (q: Question) => qType(q) !== "essay";
const normalizeText = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const r = Math.floor(s % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${r}` : `${m}:${r}`;
};

// Auto-save every 15 seconds
const AUTO_SAVE_INTERVAL = 15_000;

const ExamRunner = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number; status: string } | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);

  const submittedRef = useRef(false);
  const answersRef = useRef(answers);
  const commentRef = useRef(comment);
  const videoUrlRef = useRef(videoUrl);
  const attachmentRef = useRef(attachment);
  const attemptIdRef = useRef(attemptId);
  const startedAtRef = useRef(startedAt);

  // Keep refs synced
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { commentRef.current = comment; }, [comment]);
  useEffect(() => { videoUrlRef.current = videoUrl; }, [videoUrl]);
  useEffect(() => { attachmentRef.current = attachment; }, [attachment]);
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);
  useEffect(() => { startedAtRef.current = startedAt; }, [startedAt]);

  const orderedQuestions = useMemo(() => {
    if (!exam) return [];
    const list = [...(exam.questions || [])];
    if (exam.shuffle_questions) list.sort(() => Math.random() - 0.5);
    return list;
  }, [exam]);

  // ── Online / offline ───────────────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // ── Prevent accidental close ───────────────────────────────────────────────
  useEffect(() => {
    if (result || locked) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [result, locked]);

  // ── Auto-save ──────────────────────────────────────────────────────────────
  const autoSave = useCallback(async () => {
    const aid = attemptIdRef.current;
    if (!aid || submittedRef.current || !navigator.onLine) return;
    setSaving(true);
    try {
      const answersArr = orderedQuestions.map((_, i) => {
        const a = answersRef.current[i];
        return a !== undefined ? a : null;
      });
      const timeSpent = startedAtRef.current
        ? Math.floor((Date.now() - startedAtRef.current) / 1000)
        : 0;
      await supabase.from("exam_attempts").update({
        answers: answersArr,
        time_spent_seconds: timeSpent,
        student_comment: commentRef.current || null,
        video_url: videoUrlRef.current || null,
        attachment_url: attachmentRef.current?.url || null,
        attachment_name: attachmentRef.current?.name || null,
      }).eq("id", aid);
      setLastSaved(new Date());
    } catch {
      // silently fail auto-save
    } finally {
      setSaving(false);
    }
  }, [orderedQuestions]);

  useEffect(() => {
    if (!attemptId || result || locked) return;
    const t = setInterval(autoSave, AUTO_SAVE_INTERVAL);
    return () => clearInterval(t);
  }, [attemptId, result, locked, autoSave]);

  // ── Init exam & attempt ────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      if (!id || !user) return;
      setLoading(true);

      const { data, error } = await supabase
        .from("exams").select("*").eq("id", id).maybeSingle();
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

      // Fetch all attempts for this student
      const { data: attempts } = await supabase
        .from("exam_attempts")
        .select("id,status,started_at")
        .eq("exam_id", id)
        .eq("student_id", user.id)
        .order("started_at", { ascending: false });

      // Only COMPLETED attempts count toward the limit
      const submitted = (attempts || []).filter(
        (a: any) => a.status !== "in_progress"
      );
      const isUnlimited = !ex.max_attempts || ex.max_attempts <= 0;

      if (!isUnlimited && submitted.length >= (ex.max_attempts || 1)) {
        setLocked("Bạn đã dùng hết số lượt làm bài.");
        setExam(ex); setLoading(false); return;
      }

      // Resume existing in-progress attempt — this does NOT count as a new attempt
      const inProgress = (attempts || []).find((a: any) => a.status === "in_progress");
      let aid = inProgress?.id;
      let start = now;

      if (inProgress) {
        const { data: full } = await supabase
          .from("exam_attempts").select("*").eq("id", aid).maybeSingle();
        if (full?.started_at) start = new Date(full.started_at).getTime();
        if (full?.answers) {
          const map: Record<number, number | string> = {};
          (full.answers as any[]).forEach((v, i) => {
            if (v !== null && v !== undefined) map[i] = v;
          });
          setAnswers(map);
        }
        if (full?.student_comment) setComment(full.student_comment);
        if (full?.video_url) setVideoUrl(full.video_url);
        if (full?.attachment_url)
          setAttachment({ url: full.attachment_url, name: full.attachment_name || "Tệp đính kèm" });
        toast({
          title: "Tiếp tục bài làm",
          description: "Câu trả lời trước đó đã được khôi phục.",
        });
      } else {
        const { data: ins, error: insErr } = await supabase
          .from("exam_attempts")
          .insert({ exam_id: id, student_id: user.id, status: "in_progress", started_at: new Date().toISOString() })
          .select("id")
          .single();
        if (insErr) {
          toast({ title: "Lỗi khởi tạo bài làm", description: insErr.message, variant: "destructive" });
          setLoading(false);
          return;
        }
        aid = ins.id;
      }

      setExam(ex);
      setAttemptId(aid!);
      setStartedAt(start);
      setLoading(false);
    };
    init();
  }, [id, user?.id]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!exam || !startedAt) return;
    const mode: TimerMode = exam.timer_mode || "countdown";

    const tick = () => {
      const sec = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(sec);
      if (mode === "countdown" && exam.duration_minutes) {
        const left = Math.max(0, exam.duration_minutes * 60 - sec);
        if (left <= 0 && !submittedRef.current) submit(true);
      }
    };

    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [exam, startedAt]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submit = async (auto = false) => {
    if (!exam || !attemptId || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    const totalPts = orderedQuestions.reduce((s, q) => s + (q.points || 1), 0);
    let score = 0;
    const answersArr: (number | string | null)[] = orderedQuestions.map((q, i) => {
      const a = answers[i];
      const pts = q.points || 1;
      const type = qType(q);
      if (type === "multiple_choice" || type === "true_false") {
        if (typeof a === "number" && a === q.correct_index) score += pts;
        return typeof a === "number" ? a : null;
      }
      if (type === "short_answer") {
        const accepted = (q.accepted_answers || []).map(normalizeText).filter(Boolean);
        if (typeof a === "string" && a.trim() && accepted.includes(normalizeText(a))) score += pts;
        return typeof a === "string" ? a : null;
      }
      return typeof a === "string" ? a : null;
    });

    const timeSpent = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    const status = auto ? "auto_submitted" : "submitted";

    const { error } = await supabase.from("exam_attempts").update({
      submitted_at: new Date().toISOString(),
      status,
      score,
      total: totalPts,
      answers: answersArr,
      time_spent_seconds: timeSpent,
      student_comment: comment || null,
      video_url: videoUrl || null,
      attachment_url: attachment?.url || null,
      attachment_name: attachment?.name || null,
    }).eq("id", attemptId);

    if (error) {
      // Network error — allow retry
      submittedRef.current = false;
      setSubmitting(false);
      toast({
        title: "Lỗi nộp bài",
        description: "Mất kết nối. Câu trả lời đã được lưu tạm. Vui lòng thử lại.",
        variant: "destructive",
      });
      return;
    }

    setResult({ score, total: totalPts, status });
    setSubmitting(false);
    toast({
      title: auto ? "Hết giờ — Đã tự nộp" : "Đã nộp bài thành công!",
      description: `Điểm tự động: ${score}/${totalPts}`,
    });
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleAttachment = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "bin").toLowerCase();
      const path = `exam-submissions/${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("lesson-assets").upload(path, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("lesson-assets").getPublicUrl(path);
      setAttachment({ url: publicUrl, name: file.name });
      toast({ title: "Đã tải lên", description: file.name });
    } catch (e: any) {
      toast({ title: "Lỗi tải lên", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const timerMode: TimerMode = exam?.timer_mode || "countdown";
  const remaining = timerMode === "countdown"
    ? Math.max(0, (exam?.duration_minutes || 0) * 60 - elapsed)
    : 0;
  const lowTime = timerMode === "countdown" && remaining > 0 && remaining < 60;

  // ── Render: loading ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Đang tải bài kiểm tra…</p>
        </div>
      </div>
    );
  }

  // ── Render: locked ─────────────────────────────────────────────────────────
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

  // ── Render: result ─────────────────────────────────────────────────────────
  if (result) {
    const passing = exam.passing_score || 0;
    const passed = result.score >= passing;
    const hasEssay = orderedQuestions.some((q) => qType(q) === "essay");
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Trophy className={`w-14 h-14 mx-auto ${passed ? "text-yellow-500" : "text-muted-foreground"}`} />
            <h2 className="text-2xl font-bold">
              {result.status === "auto_submitted"
                ? "Hết giờ — Đã tự nộp"
                : passed ? "Chúc mừng!" : "Đã nộp bài"}
            </h2>
            <p className="text-4xl font-extrabold text-primary">{result.score}/{result.total}</p>
            {passing > 0 && (
              <p className="text-muted-foreground">Điểm đạt yêu cầu: {passing}</p>
            )}
            {hasEssay && (
              <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                ✏️ Bài có câu tự luận — giáo viên sẽ chấm và cập nhật điểm cuối cùng sớm.
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Bạn có thể xem trạng thái trong mục Bài kiểm tra.
            </p>
            <Button onClick={() => navigate(-1)}>Quay lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render: exam ───────────────────────────────────────────────────────────
  const totalQ = orderedQuestions.length;
  const answered = orderedQuestions.reduce((n, _q, i) => {
    const a = answers[i];
    if (typeof a === "number") return n + 1;
    if (typeof a === "string" && a.trim()) return n + 1;
    return n;
  }, 0);

  const handleSubmitClick = () => {
    if (answered < totalQ) {
      const unanswered = totalQ - answered;
      const ok = window.confirm(
        `Bạn còn ${unanswered} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`
      );
      if (!ok) return;
    }
    submit(false);
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto p-3 md:p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-lg font-bold truncate">
              {exam.title_vi || exam.title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
              <span>Đã trả lời {answered}/{totalQ}</span>
              {saving && (
                <span className="flex items-center gap-1">
                  <Save className="w-3 h-3 animate-pulse" /> Đang lưu…
                </span>
              )}
              {!saving && lastSaved && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3 h-3" />
                  Đã lưu {lastSaved.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {isOnline ? (
                <span className="flex items-center gap-1 text-green-500">
                  <Wifi className="w-3 h-3" />
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-500">
                  <WifiOff className="w-3 h-3" /> Mất kết nối
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer badge */}
            {timerMode === "countdown" && exam.duration_minutes && (
              <Badge
                variant={lowTime ? "destructive" : remaining < 300 ? "outline" : "secondary"}
                className={`text-base px-3 py-1.5 font-mono ${lowTime ? "animate-pulse" : ""}`}
              >
                <Clock className="w-4 h-4 mr-1" /> {fmt(remaining)}
              </Badge>
            )}
            {timerMode === "stopwatch" && (
              <Badge variant="secondary" className="text-base px-3 py-1.5 font-mono">
                <Clock className="w-4 h-4 mr-1" /> {fmt(elapsed)}
              </Badge>
            )}

            {/* Manual save */}
            <Button
              size="sm"
              variant="outline"
              onClick={autoSave}
              disabled={saving || !isOnline}
              title="Lưu ngay"
            >
              <Save className="w-4 h-4" />
            </Button>

            <Button onClick={handleSubmitClick} disabled={submitting} variant="hero">
              {submitting
                ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Nộp bài
            </Button>
          </div>
        </div>
        <Progress value={(answered / Math.max(totalQ, 1)) * 100} className="h-1 rounded-none" />
      </div>

      {/* ── Offline banner ── */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          Mất kết nối internet. Câu trả lời vẫn được giữ — sẽ tự lưu khi có mạng trở lại.
          Đừng đóng tab này.
        </div>
      )}

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        {/* Instructions */}
        {(exam.instructions || exam.description_vi) && (
          <Card>
            <CardContent className="p-4 text-sm flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="whitespace-pre-wrap">{exam.instructions || exam.description_vi}</p>
            </CardContent>
          </Card>
        )}

        {orderedQuestions.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Bài kiểm tra chưa có câu hỏi.
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        {orderedQuestions.map((q, i) => {
          const type = qType(q);
          const pts = q.points || 1;
          const isAnswered =
            typeof answers[i] === "number" ||
            (typeof answers[i] === "string" && (answers[i] as string).trim().length > 0);

          return (
            <Card
              key={i}
              className={`border-2 transition-colors duration-200 ${
                isAnswered
                  ? "border-green-500/40 bg-green-50/20 dark:bg-green-950/10"
                  : "hover:border-primary/30"
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex gap-2 items-start">
                  <span
                    className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-sm shrink-0 font-semibold ${
                      isAnswered
                        ? "bg-green-500 text-white"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {isAnswered ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </span>
                  <span className="flex-1">{q.text}</span>
                  <Badge variant="outline" className="shrink-0 font-normal">{pts} điểm</Badge>
                </CardTitle>
                {!isAutoGraded(q) && (
                  <p className="text-xs text-muted-foreground pl-9">
                    Câu tự luận – giáo viên sẽ chấm tay.
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                {(type === "multiple_choice" || type === "true_false") &&
                  q.options.map((opt, oi) => {
                    const selected = answers[i] === oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [i]: oi }))}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                          selected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/40 hover:bg-muted/50"
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-semibold shrink-0 ${
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {selected ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + oi)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}

                {type === "short_answer" && (
                  <Input
                    placeholder="Nhập câu trả lời của bạn…"
                    value={typeof answers[i] === "string" ? (answers[i] as string) : ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                  />
                )}

                {type === "essay" && (
                  <Textarea
                    rows={5}
                    placeholder="Viết bài làm của bạn tại đây…"
                    value={typeof answers[i] === "string" ? (answers[i] as string) : ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Comment & extras */}
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Nhận xét &amp; nộp bổ sung (tùy chọn)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm">Nhận xét / lời nhắn cho giáo viên</Label>
              <Textarea
                rows={3}
                placeholder="Ví dụ: phần câu 5 em chưa chắc, mong cô góp ý..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm flex items-center gap-1">
                <VideoIcon className="w-4 h-4" /> Link video trả lời (YouTube, Drive, Loom...)
              </Label>
              <Input
                placeholder="https://..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm flex items-center gap-1">
                <Paperclip className="w-4 h-4" /> File đính kèm
              </Label>
              {attachment ? (
                <div className="flex items-center justify-between rounded-md border p-2 bg-muted/30">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary truncate"
                  >
                    {attachment.name}
                  </a>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setAttachment(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.txt"
                  disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && handleAttachment(e.target.files[0])}
                />
              )}
              {uploading && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Đang tải lên...
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bottom submit */}
        <div className="pb-8 flex justify-end">
          <Button
            size="lg"
            onClick={handleSubmitClick}
            disabled={submitting}
            variant="hero"
            className="min-w-[160px]"
          >
            {submitting
              ? <Loader2 className="w-5 h-5 animate-spin mr-2" />
              : <CheckCircle2 className="w-5 h-5 mr-2" />}
            Nộp bài
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExamRunner;
