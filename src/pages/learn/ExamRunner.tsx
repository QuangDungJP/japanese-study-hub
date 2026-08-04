import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { awardUserXpAndStreak } from "@/lib/xpStreakService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Clock, CheckCircle2, AlertTriangle, Loader2, Trophy, Lock, Camera, Video,
  Paperclip, Video as VideoIcon, MessageSquare, X, Wifi, WifiOff, Save,
  RotateCcw, Eye, ShieldAlert, XCircle,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BackgroundMusicPlayer from "@/components/shared/BackgroundMusicPlayer";
import FormattedText from "@/components/shared/FormattedText";

type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "essay";
type TimerMode = "countdown" | "stopwatch" | "none";
type RunMode = "exam" | "review" | "retry_wrong" | "retry_all";

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

interface ProctoringConfig {
  detect_gaze?: boolean;
  detect_head?: boolean;
  detect_multi_face?: boolean;
  detect_dual_monitor?: boolean;
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
  score_mode: 'raw' | 'scaled' | null;
  score_rounding: 'round' | 'floor' | 'ceil' | 'none' | null;
  video_url: string | null;
  meet_link: string | null;
  is_published: boolean;
  exam_category: 'written' | 'speaking_meeting' | 'speaking_ai';
  anti_cheat: boolean;
  ai_proctoring: boolean;
  proctoring_config: ProctoringConfig;
  anti_cheat_max_violations: number;
  anti_cheat_penalty: 'warn_only' | 'auto_submit' | 'reset_answers' | 'deduct_points';
  anti_cheat_deduct_per_violation: number;
  show_answers_after: boolean;
}

const qType = (q: Question): QuestionType => q.type || "multiple_choice";
const isAutoGraded = (q: Question) => qType(q) !== "essay";
const normalizeText = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

// Apply score scaling + rounding based on exam settings
function computeDisplayScore(rawScore: number, totalPts: number, exam: Exam): { display: number; outOf: number } {
  const mode = exam.score_mode || 'raw';
  const maxScore = exam.max_score || totalPts;
  if (mode === 'scaled' && totalPts > 0) {
    const scaled = (rawScore / totalPts) * maxScore;
    const rounding = exam.score_rounding || 'round';
    const rounded = rounding === 'round' ? Math.round(scaled)
      : rounding === 'floor' ? Math.floor(scaled)
      : rounding === 'ceil' ? Math.ceil(scaled)
      : scaled;
    return { display: rounded, outOf: maxScore };
  }
  return { display: rawScore, outOf: totalPts };
}

const fmt = (s: number) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const r = Math.floor(s % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${r}` : `${m}:${r}`;
};

const AUTO_SAVE_INTERVAL = 15_000;

// ── Helpers ────────────────────────────────────────────────────────────────────
function gradeQuestion(q: Question, answer: number | string | undefined | null): boolean {
  if (answer === undefined || answer === null || answer === "") return false;
  const type = qType(q);
  if (type === "multiple_choice" || type === "true_false") {
    const val = typeof answer === "number" ? answer : (typeof answer === "string" && !isNaN(Number(answer)) ? Number(answer) : null);
    return val !== null && val === q.correct_index;
  }
  if (type === "short_answer") {
    const accepted = (q.accepted_answers || []).map(normalizeText).filter(Boolean);
    if (q.correct_answer) accepted.push(normalizeText(q.correct_answer));
    if (q.answer) accepted.push(normalizeText(q.answer));
    return typeof answer === "string" && !!answer.trim() && accepted.includes(normalizeText(answer));
  }
  return false; // essay — manual
}

// ── Main Component ─────────────────────────────────────────────────────────────
const ExamRunner = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [exam, setExam] = useState<Exam | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string | number, number | string | null>>({});
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number; total: number; status: string;
    submittedAnswers: (number | string | null)[];
  } | null>(null);
  const [locked, setLocked] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [attachment, setAttachment] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  // Anti-cheat
  const [violations, setViolations] = useState(0);
  const [showViolationWarning, setShowViolationWarning] = useState(false);
  // AI Proctoring Vision State
  const [cameraActive, setCameraActive] = useState(false);
  const [proctoringStatus, setProctoringStatus] = useState<"normal" | "gaze_away" | "head_turned" | "no_face" | "multi_monitor">("normal");
  const [proctoringLogs, setProctoringLogs] = useState<Array<{ time: string; type: string; msg: string }>>([]);
  // Speaking Exam Audio Recordings
  const [speakingRecordings, setSpeakingRecordings] = useState<Record<number, string>>({});
  const [recordingActiveIndex, setRecordingActiveIndex] = useState<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Review / Retry
  const [runMode, setRunMode] = useState<RunMode>("exam");
  const [retryQuestions, setRetryQuestions] = useState<Question[]>([]);

  const submittedRef = useRef(false);
  const violationsRef = useRef(0);
  const answersRef = useRef(answers);
  const commentRef = useRef(comment);
  const videoUrlRef = useRef(videoUrl);
  const attachmentRef = useRef(attachment);
  const attemptIdRef = useRef(attemptId);
  const startedAtRef = useRef(startedAt);
  const proctoringLogsRef = useRef(proctoringLogs);
  const speakingRecordingsRef = useRef(speakingRecordings);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { commentRef.current = comment; }, [comment]);
  useEffect(() => { videoUrlRef.current = videoUrl; }, [videoUrl]);
  useEffect(() => { attachmentRef.current = attachment; }, [attachment]);
  useEffect(() => { attemptIdRef.current = attemptId; }, [attemptId]);
  useEffect(() => { startedAtRef.current = startedAt; }, [startedAt]);
  useEffect(() => { proctoringLogsRef.current = proctoringLogs; }, [proctoringLogs]);
  useEffect(() => { speakingRecordingsRef.current = speakingRecordings; }, [speakingRecordings]);

  const orderedQuestions = useMemo(() => {
    if (!exam || !exam.questions) return [];
    if (runMode === "retry_wrong" || runMode === "retry_all") {
      return retryQuestions.map((q, idx) => ({
        ...q,
        origIdx: (q as any).origIdx ?? idx,
        qKey: q.id || `q_${(q as any).origIdx ?? idx}`
      }));
    }
    const list = exam.questions.map((q, origIdx) => ({
      ...q,
      origIdx,
      qKey: q.id || `q_${origIdx}`
    }));
    if (exam.shuffle_questions) {
      list.sort(() => Math.random() - 0.5);
    }
    return list;
  }, [exam?.id, runMode, retryQuestions]);

  // ── Online/offline ──────────────────────────────────────────────────────────
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // ── Prevent accidental close ────────────────────────────────────────────────
  useEffect(() => {
    if (result || locked || runMode !== "exam") return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [result, locked, runMode]);

  // ── Anti-cheat: tab visibility refinement ──────────────────────────────────
  const lastViolationTimeRef = useRef<number>(0);
  const hiddenTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const proctorFailStreakRef = useRef<number>(0);

  useEffect(() => {
    if (!exam?.anti_cheat || result || locked || runMode !== "exam") return;

    const penalty = exam.anti_cheat_penalty || 'auto_submit';
    const maxVio = exam.anti_cheat_max_violations || 3;

    const handleViolation = async () => {
      if (submittedRef.current) return;
      const now = Date.now();
      // Cooldown: prevent multiple triggers within 8 seconds
      if (now - lastViolationTimeRef.current < 8000) return;
      lastViolationTimeRef.current = now;

      const newCount = violationsRef.current + 1;
      violationsRef.current = newCount;
      setViolations(newCount);
      setShowViolationWarning(true);

      // Save violation count to DB
      const aid = attemptIdRef.current;
      if (aid) {
        await supabase.from("exam_attempts").update({ violations: newCount }).eq("id", aid);
      }

      // Apply penalty
      if (penalty === 'warn_only') return;

      if (penalty === 'reset_answers' && newCount >= maxVio) {
        setAnswers({});
        toast({ title: "🔄 Vi phạm quá nhiều — tất cả câu trả lời đã bị xóa!", description: "Bạn phải làm lại từ đầu.", variant: "destructive" });
        violationsRef.current = 0;
        setViolations(0);
        if (aid) await supabase.from("exam_attempts").update({ violations: 0, answers: [] }).eq("id", aid);
        return;
      }

      if (penalty === 'deduct_points') {
        const deduct = exam.anti_cheat_deduct_per_violation || 5;
        toast({ title: `➖ Trừ ${deduct} điểm (lần ${newCount})`, description: `Tổng bị trừ: ${newCount * deduct} điểm`, variant: "destructive" });
        if (newCount >= maxVio) {
          toast({ title: "🚫 Đã vượt quá giới hạn — tự động nộp bài!", variant: "destructive" });
          submit(true);
        }
        return;
      }

      // Default: auto_submit
      if (newCount >= maxVio) {
        toast({ title: "🚫 Đã vượt quá số lần vi phạm — tự động nộp bài!", variant: "destructive" });
        submit(true);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        // Require tab to be hidden continuously for 1.5s (grace period for accidental clicks/IME)
        if (hiddenTimerRef.current) clearTimeout(hiddenTimerRef.current);
        hiddenTimerRef.current = setTimeout(() => {
          if (document.hidden) {
            handleViolation();
          }
        }, 1500);
      } else {
        // Tab came back visible before 1.5s timeout expired
        if (hiddenTimerRef.current) {
          clearTimeout(hiddenTimerRef.current);
          hiddenTimerRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      if (hiddenTimerRef.current) clearTimeout(hiddenTimerRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [exam, result, locked, runMode]);

  // ── AI Camera Vision Proctoring Engine ──────────────────────────────────────
  useEffect(() => {
    if (!exam?.ai_proctoring || result || locked || runMode !== "exam") return;
    let stream: MediaStream | null = null;
    let intervalId: any = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraActive(true);

        const config = exam.proctoring_config || {};

        // Periodic frame analysis heuristic
        intervalId = setInterval(() => {
          if (!videoRef.current || !canvasRef.current) return;
          const video = videoRef.current;
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          if (!ctx || video.readyState !== 4) return;

          canvas.width = 160;
          canvas.height = 120;
          ctx.drawImage(video, 0, 0, 160, 120);

          // Image pixel brightness & balance analysis
          const imgData = ctx.getImageData(0, 0, 160, 120);
          const data = imgData.data;
          let leftLum = 0, rightLum = 0, totalLum = 0;
          let activePixels = 0;

          for (let i = 0; i < data.length; i += 16) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLum += lum;
            activePixels++;
            const x = (i / 4) % 160;
            if (x < 80) leftLum += lum; else rightLum += lum;
          }

          const avgLum = totalLum / Math.max(activePixels, 1);
          const lrRatio = Math.abs(leftLum - rightLum) / Math.max(leftLum + rightLum, 1);

          const timeStr = new Date().toLocaleTimeString("vi-VN");

          // 1. Detect No Face / Away (too dark or low variation)
          if (config.detect_multi_face && avgLum < 12) {
            proctorFailStreakRef.current++;
            if (proctorFailStreakRef.current >= 3) {
              setProctoringStatus("no_face");
              setProctoringLogs(logs => [
                ...logs.slice(-20),
                { time: timeStr, type: "no_face", msg: "⚠️ Không phát hiện khuôn mặt trước camera" }
              ]);
            }
            return;
          }

          // 2. Detect Head Gesture / Turning side to side
          if (config.detect_head && lrRatio > 0.50) {
            proctorFailStreakRef.current++;
            if (proctorFailStreakRef.current >= 3) {
              setProctoringStatus("head_turned");
              setProctoringLogs(logs => [
                ...logs.slice(-20),
                { time: timeStr, type: "head_turned", msg: "🗣️ Học viên ngoảnh mặt / xoay đầu sang bên" }
              ]);
            }
            return;
          }

          // 3. Detect Eye Gaze shift
          if (config.detect_gaze && lrRatio > 0.40) {
            proctorFailStreakRef.current++;
            if (proctorFailStreakRef.current >= 3) {
              setProctoringStatus("gaze_away");
              setProctoringLogs(logs => [
                ...logs.slice(-20),
                { time: timeStr, type: "gaze_away", msg: "👁️ Học viên nhìn nghiêng ra ngoài màn hình quá lâu" }
              ]);
            }
            return;
          }

          proctorFailStreakRef.current = 0;
          setProctoringStatus("normal");
        }, 2000);
      } catch (err) {
        console.warn("AI Camera Proctoring disabled or permission denied:", err);
      }
    };

    startCamera();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) stream.getTracks().forEach(t => t.stop());
      setCameraActive(false);
    };
  }, [exam, result, locked, runMode]);

  // ── Auto-save ───────────────────────────────────────────────────────────────
  const autoSave = useCallback(async () => {
    const aid = attemptIdRef.current;
    if (!aid || submittedRef.current || !navigator.onLine) return;
    setSaving(true);
    try {
      const answersArr = orderedQuestions.map((_, i) => {
        const a = answersRef.current[i];
        return a !== undefined ? a : null;
      });
      const timeSpent = startedAtRef.current ? Math.floor((Date.now() - startedAtRef.current) / 1000) : 0;
      await supabase.from("exam_attempts").update({
        answers: answersArr, time_spent_seconds: timeSpent,
        student_comment: commentRef.current || null,
        video_url: videoUrlRef.current || null,
        attachment_url: attachmentRef.current?.url || null,
        attachment_name: attachmentRef.current?.name || null,
        proctoring_logs: proctoringLogsRef.current as any,
        speaking_recordings: speakingRecordingsRef.current as any,
      }).eq("id", aid);
      setLastSaved(new Date());
    } catch { /* silent */ }
    finally { setSaving(false); }
  }, [orderedQuestions]);

  useEffect(() => {
    if (!attemptId || result || locked || runMode !== "exam") return;
    const t = setInterval(autoSave, AUTO_SAVE_INTERVAL);
    return () => clearInterval(t);
  }, [attemptId, result, locked, autoSave, runMode]);

  // ── Init exam & attempt ─────────────────────────────────────────────────────
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
        setLocked("Bài kiểm tra chưa được công bố."); setExam(ex); setLoading(false); return;
      }
      const now = Date.now();
      if (ex.starts_at && new Date(ex.starts_at).getTime() > now) {
        setLocked(`Bài kiểm tra bắt đầu lúc ${new Date(ex.starts_at).toLocaleString("vi-VN")}.`);
        setExam(ex); setLoading(false); return;
      }
      if (ex.ends_at && ex.lock_after_end && new Date(ex.ends_at).getTime() < now) {
        setLocked("Bài kiểm tra đã đóng."); setExam(ex); setLoading(false); return;
      }

      const { data: attempts } = await supabase
        .from("exam_attempts").select("id,status,started_at")
        .eq("exam_id", id).eq("student_id", user.id)
        .order("started_at", { ascending: false });

      const submitted = (attempts || []).filter((a: any) => a.status !== "in_progress");
      const isUnlimited = !ex.max_attempts || ex.max_attempts <= 0;
      if (!isUnlimited && submitted.length >= (ex.max_attempts || 1)) {
        setLocked("Bạn đã dùng hết số lượt làm bài."); setExam(ex); setLoading(false); return;
      }

      const inProgress = (attempts || []).find((a: any) => a.status === "in_progress");
      let aid = inProgress?.id;
      let start = now;

      if (inProgress) {
        const { data: full } = await supabase.from("exam_attempts").select("*").eq("id", aid).maybeSingle();
        if (full?.started_at) start = new Date(full.started_at).getTime();
        if (full?.answers) {
          const map: Record<number, number | string> = {};
          (full.answers as any[]).forEach((v, i) => { if (v !== null && v !== undefined) map[i] = v; });
          setAnswers(map);
        }
        if (full?.student_comment) setComment(full.student_comment);
        if (full?.video_url) setVideoUrl(full.video_url);
        if (full?.attachment_url) setAttachment({ url: full.attachment_url, name: full.attachment_name || "Tệp đính kèm" });
        if (full?.violations) { violationsRef.current = full.violations; setViolations(full.violations); }
        toast({ title: "Tiếp tục bài làm", description: "Câu trả lời trước đó đã được khôi phục." });
      } else {
        const { data: ins, error: insErr } = await supabase
          .from("exam_attempts")
          .insert({ exam_id: id, student_id: user.id, status: "in_progress", started_at: new Date().toISOString() })
          .select("id").single();
        if (insErr) {
          toast({ title: "Lỗi khởi tạo", description: insErr.message, variant: "destructive" });
          setLoading(false); return;
        }
        aid = ins.id;
      }

      setExam(ex); setAttemptId(aid!); setStartedAt(start); setLoading(false);
    };
    init();
  }, [id, user?.id]);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!exam || !startedAt || runMode !== "exam") return;
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
  }, [exam, startedAt, runMode]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const submit = async (auto = false) => {
    if (!exam || !attemptId || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);

    const originalQuestions = exam.questions || [];
    const totalPts = originalQuestions.reduce((s, q) => s + (q.points || 1), 0);
    let score = 0;

    const answersArr: (number | string | null)[] = originalQuestions.map((q, origIdx) => {
      const qKey = q.id || `q_${origIdx}`;
      const a = answers[qKey] ?? answers[origIdx] ?? answers[String(origIdx)];
      const pts = q.points || 1;
      const type = qType(q);

      if (type === "multiple_choice" || type === "true_false") {
        const val = typeof a === "number" ? a : (typeof a === "string" && a !== "" && !isNaN(Number(a)) ? Number(a) : null);
        if (val !== null && val === q.correct_index) score += pts;
        return val;
      }
      if (type === "short_answer") {
        const accepted = (q.accepted_answers || []).map(normalizeText).filter(Boolean);
        if (q.correct_answer) accepted.push(normalizeText(q.correct_answer));
        if (q.answer) accepted.push(normalizeText(q.answer));
        if (typeof a === "string" && a.trim() && accepted.includes(normalizeText(a))) score += pts;
        return typeof a === "string" ? a : null;
      }
      return typeof a === "string" ? a : null;
    });

    const timeSpent = startedAt ? Math.floor((Date.now() - startedAt) / 1000) : 0;
    const status = auto ? "auto_submitted" : "submitted";

    // Compute displayed/scaled score for DB
    const scoreData = computeDisplayScore(score, totalPts, exam);

    const { error } = await supabase.from("exam_attempts").update({
      submitted_at: new Date().toISOString(), status,
      score: scoreData.display,
      total: scoreData.outOf,
      raw_score: score,
      raw_total: totalPts,
      answers: answersArr, time_spent_seconds: timeSpent,
      violations: violationsRef.current,
      student_comment: comment || null, video_url: videoUrl || null,
      attachment_url: attachment?.url || null, attachment_name: attachment?.name || null,
    }).eq("id", attemptId);

    if (error) {
      submittedRef.current = false;
      setSubmitting(false);
      toast({ title: "Lỗi nộp bài", description: "Mất kết nối. Vui lòng thử lại.", variant: "destructive" });
      return;
    }

    setResult({ score: scoreData.display, total: scoreData.outOf, status, submittedAnswers: answersArr });
    setSubmitting(false);

    // Award XP reward for exam completion
    if (user) {
      const xpBonus = (exam as any).xp_reward || 50;
      try {
        await awardUserXpAndStreak(user.id, xpBonus, 'exam_completed');
      } catch (err) {
        console.warn("Failed to award exam XP:", err);
      }
    }

    toast({ title: auto ? "Hết giờ — Đã tự nộp" : "Đã nộp bài!", description: `Điểm: ${score}/${totalPts} • +${(exam as any).xp_reward || 50} XP` });
  };

  // ── File upload ─────────────────────────────────────────────────────────────
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
    } finally { setUploading(false); }
  };

  // ── Retry handlers ──────────────────────────────────────────────────────────
  const startRetryWrong = () => {
    if (!exam || !result) return;
    const originalQuestions = exam.questions || [];
    const wrong = originalQuestions.filter((q, origIdx) => {
      const a = result.submittedAnswers[origIdx];
      return !gradeQuestion(q, a);
    });
    if (wrong.length === 0) { toast({ title: "Bạn đã trả lời đúng tất cả câu!" }); return; }
    setRetryQuestions(wrong);
    setAnswers({});
    setRunMode("retry_wrong");
  };

  const startRetryAll = () => {
    if (!exam) return;
    setRetryQuestions([...exam.questions]);
    setAnswers({});
    setRunMode("retry_all");
  };

  const exitRetry = () => {
    setRunMode("review");
    setRetryQuestions([]);
    setAnswers({});
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const timerMode: TimerMode = exam?.timer_mode || "countdown";
  const remaining = timerMode === "countdown" ? Math.max(0, (exam?.duration_minutes || 0) * 60 - elapsed) : 0;
  const lowTime = timerMode === "countdown" && remaining > 0 && remaining < 60;

  // ── Loading ─────────────────────────────────────────────────────────────────
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

  // ── Locked ──────────────────────────────────────────────────────────────────
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

  // ── Retry mode ──────────────────────────────────────────────────────────────
  if (runMode === "retry_wrong" || runMode === "retry_all") {
    const totalR = orderedQuestions.length;
    const answeredR = orderedQuestions.reduce((n, _q, i) => {
      const a = answers[i];
      if (typeof a === "number") return n + 1;
      if (typeof a === "string" && a.trim()) return n + 1;
      return n;
    }, 0);

    return (
      <div className="min-h-screen bg-muted/30">
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
          <div className="max-w-4xl mx-auto p-3 md:p-4 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-base font-bold">{runMode === "retry_wrong" ? "🔄 Luyện lại câu sai" : "🔄 Làm lại toàn bộ"}</h1>
              <p className="text-xs text-muted-foreground">Đã trả lời {answeredR}/{totalR}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exitRetry}>
                <X className="w-4 h-4 mr-1" /> Thoát
              </Button>
              <Button size="sm" variant="hero" onClick={() => {
                // grade and show local results
                let sc = 0;
                const arr = orderedQuestions.map((q, i) => {
                  const a = answers[i];
                  if (gradeQuestion(q, a)) sc += (q.points || 1);
                  if (qType(q) === "essay") return typeof a === "string" ? a : null;
                  return typeof a === "number" ? a : (typeof a === "string" ? a : null);
                });
                toast({ title: `Kết quả luyện tập: ${sc}/${orderedQuestions.reduce((s, q) => s + (q.points || 1), 0)} điểm` });
                setRunMode("review");
              }}>
                <CheckCircle2 className="w-4 h-4 mr-1" /> Xem kết quả
              </Button>
            </div>
          </div>
          <Progress value={(answeredR / Math.max(totalR, 1)) * 100} className="h-1 rounded-none" />
        </div>
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 pb-10">
          {orderedQuestions.map((q, i) => {
            const type = qType(q);
            const isAnswered = typeof answers[i] === "number" || (typeof answers[i] === "string" && (answers[i] as string).trim().length > 0);
            return (
              <Card key={i} className={`border-2 ${isAnswered ? "border-green-500/40" : "hover:border-primary/30"}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex gap-2 items-start">
                    <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-sm shrink-0 font-semibold ${isAnswered ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"}`}>
                      {isAnswered ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </span>
                    <span className="flex-1">{q.text}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(type === "multiple_choice" || type === "true_false") && q.options.map((opt, oi) => {
                    const selected = answers[i] === oi;
                    return (
                      <button key={oi} type="button"
                        onClick={() => setAnswers(a => ({ ...a, [i]: oi }))}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/50"}`}>
                        <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-semibold shrink-0 ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                          {selected ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + oi)}
                        </span>
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                  {type === "short_answer" && (
                    <Input placeholder="Nhập câu trả lời…" value={typeof answers[i] === "string" ? answers[i] as string : ""}
                      onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))} />
                  )}
                  {type === "essay" && (
                    <Textarea rows={4} placeholder="Viết bài làm…" value={typeof answers[i] === "string" ? answers[i] as string : ""}
                      onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Review mode (post-exam) ─────────────────────────────────────────────────
  if (runMode === "review" && result) {
    const qs = exam.questions || [];
    const passing = exam.passing_score || 0;
    const passed = result.score >= passing;
    const hasEssay = qs.some(q => qType(q) === "essay");

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-4 pb-10">
        {/* Score summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center sm:text-left">
                <Trophy className={`w-12 h-12 mx-auto sm:mx-0 mb-2 ${passed ? "text-yellow-500" : "text-muted-foreground"}`} />
                <h2 className="text-xl font-bold">{passed ? "Chúc mừng!" : "Đã nộp bài"}</h2>
                <p className="text-4xl font-extrabold text-primary mt-1">{result.score}/{result.total}</p>
                {passing > 0 && <p className="text-sm text-muted-foreground">Điểm đạt: {passing}</p>}
                {violations > 0 && <p className="text-xs text-red-500 mt-1">⚠ Vi phạm anti-cheat: {violations} lần</p>}
              </div>
              <div className="flex flex-col gap-2 sm:ml-auto w-full sm:w-auto">
                {exam.show_answers_after && (
                  <>
                    <Button variant="outline" className="gap-2" onClick={startRetryWrong}>
                      <RotateCcw className="w-4 h-4" /> Làm lại câu sai
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={startRetryAll}>
                      <RotateCcw className="w-4 h-4" /> Làm lại toàn bộ
                    </Button>
                  </>
                )}
                <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
                  <X className="w-4 h-4" /> Quay lại
                </Button>
              </div>
            </div>
            {hasEssay && (
              <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 mt-4">
                ✏️ Bài có câu tự luận — giáo viên sẽ chấm và cập nhật điểm cuối cùng.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Per-question review */}
        {exam.show_answers_after && qs.map((q, i) => {
          const studentAns = result.submittedAnswers[i];
          const type = qType(q);
          const isCorrect = gradeQuestion(q, studentAns);
          const isEssay = type === "essay";

          return (
            <Card key={i} className={`border-2 ${isEssay ? "border-muted" : isCorrect ? "border-green-500/60" : "border-red-400/60"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex gap-2 items-start">
                  <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-sm shrink-0 font-bold ${isEssay ? "bg-muted text-muted-foreground" : isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
                    {isEssay ? i + 1 : isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  </span>
                  <span className="flex-1"><FormattedText text={q.text} /></span>
                  <Badge variant="outline" className={`shrink-0 text-xs ${isEssay ? "" : isCorrect ? "border-green-500 text-green-600" : "border-red-400 text-red-500"}`}>
                    {isEssay ? "Tự luận" : isCorrect ? `+${q.points || 1} điểm` : "Sai"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(type === "multiple_choice" || type === "true_false") && q.options.map((opt, oi) => {
                  const isSelected = studentAns === oi;
                  const isRight = oi === q.correct_index;
                  return (
                    <div key={oi} className={`p-3 rounded-lg border-2 flex items-center gap-3 ${isRight ? "border-green-500 bg-green-50 dark:bg-green-950/20" : isSelected && !isRight ? "border-red-400 bg-red-50 dark:bg-red-950/20" : "border-border opacity-60"}`}>
                      <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-semibold shrink-0 ${isRight ? "border-green-500 bg-green-500 text-white" : isSelected ? "border-red-400 bg-red-400 text-white" : "border-muted-foreground/40"}`}>
                        {isRight ? <CheckCircle2 className="w-4 h-4" /> : isSelected ? <XCircle className="w-4 h-4" /> : String.fromCharCode(65 + oi)}
                      </span>
                      <FormattedText className={isRight ? "font-semibold text-green-700 dark:text-green-400" : isSelected ? "text-red-600 line-through" : ""} text={opt} />
                      {isRight && <Badge className="ml-auto bg-green-500 text-white text-xs">Đáp án đúng</Badge>}
                      {isSelected && !isRight && <Badge className="ml-auto bg-red-400 text-white text-xs">Bạn chọn</Badge>}
                    </div>
                  );
                })}

                {type === "short_answer" && (
                  <div className="space-y-2">
                    <div className={`p-3 rounded-lg border-2 ${isCorrect ? "border-green-500 bg-green-50 dark:bg-green-950/20" : "border-red-400 bg-red-50 dark:bg-red-950/20"}`}>
                      <p className="text-xs text-muted-foreground mb-1">Câu trả lời của bạn:</p>
                      <p className={`font-medium ${isCorrect ? "text-green-700 dark:text-green-400" : "text-red-600 line-through"}`}>
                        {studentAns ? String(studentAns) : "(Không trả lời)"}
                      </p>
                    </div>
                    {!isCorrect && q.accepted_answers && q.accepted_answers.length > 0 && (
                      <div className="p-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
                        <p className="text-xs text-muted-foreground mb-1">Đáp án đúng:</p>
                        <p className="font-medium text-green-700 dark:text-green-400">{q.accepted_answers.filter(Boolean).join(" / ")}</p>
                      </div>
                    )}
                  </div>
                )}

                {type === "essay" && (
                  <div className="p-3 rounded-lg border bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-1">Bài làm của bạn:</p>
                    <p className="text-sm whitespace-pre-wrap">{studentAns ? String(studentAns) : "(Không trả lời)"}</p>
                    <p className="text-xs text-amber-600 mt-2">Giáo viên sẽ chấm điểm câu này.</p>
                  </div>
                )}

                {q.explanation && (
                  <div className="flex gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <Eye className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">{q.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        <div className="flex justify-center pt-4 gap-3">
          {exam.show_answers_after && (
            <>
              <Button variant="outline" className="gap-2" onClick={startRetryWrong}>
                <RotateCcw className="w-4 h-4" /> Làm lại câu sai
              </Button>
              <Button variant="outline" className="gap-2" onClick={startRetryAll}>
                <RotateCcw className="w-4 h-4" /> Làm lại toàn bộ
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
    );
  }

  // ── Result screen (with stats + auto-review) ───────────────────────────────
  if (result && runMode === "exam") {
    const passing = exam.passing_score || 0;
    const passed = result.score >= passing;
    const hasEssay = orderedQuestions.some(q => qType(q) === "essay");
    const autoGradedQs = orderedQuestions.filter(q => isAutoGraded(q));
    const correctCount = autoGradedQs.reduce((n, q, _i) => {
      const origIdx = orderedQuestions.indexOf(q);
      return n + (gradeQuestion(q, result.submittedAnswers[origIdx]) ? 1 : 0);
    }, 0);
    const wrongCount = autoGradedQs.length - correctCount;
    const essayCount = orderedQuestions.length - autoGradedQs.length;
    const deductedPoints = (exam.anti_cheat && exam.anti_cheat_penalty === 'deduct_points')
      ? violations * (exam.anti_cheat_deduct_per_violation || 5)
      : 0;
    const finalScore = Math.max(0, result.score - deductedPoints);

    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-5">
            {/* Score hero */}
            <div className="text-center">
              <Trophy className={`w-14 h-14 mx-auto mb-2 ${passed ? "text-yellow-500" : "text-muted-foreground"}`} />
              <h2 className="text-2xl font-bold">
                {result.status === "auto_submitted" ? "Hết giờ — Đã tự nộp" : passed ? "🎉 Chúc mừng!" : "Đã nộp bài"}
              </h2>
              <p className="text-5xl font-extrabold text-primary mt-2">{deductedPoints > 0 ? finalScore : result.score}/{result.total}</p>
              {passing > 0 && (
                <p className={`text-sm mt-1 font-medium ${passed ? "text-green-600" : "text-red-500"}`}>
                  {passed ? `✓ Đạt (≥ ${passing} điểm)` : `✗ Chưa đạt (cần ≥ ${passing} điểm)`}
                </p>
              )}
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-green-50 dark:bg-green-950/20 rounded-xl p-3 text-center border border-green-200 dark:border-green-800">
                <p className="text-2xl font-extrabold text-green-600">{correctCount}</p>
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">Câu đúng ✓</p>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 text-center border border-red-200 dark:border-red-800">
                <p className="text-2xl font-extrabold text-red-500">{wrongCount}</p>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">Câu sai ✗</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center border">
                <p className="text-2xl font-extrabold text-muted-foreground">{essayCount > 0 ? essayCount : '—'}</p>
                <p className="text-xs text-muted-foreground font-medium">{essayCount > 0 ? 'Tự luận' : 'Tổng câu'}</p>
                {essayCount === 0 && <p className="text-lg font-bold text-foreground">{orderedQuestions.length}</p>}
              </div>
            </div>

            {/* Violation & deduction info */}
            {violations > 0 && (
              <div className="bg-red-50 dark:bg-red-950/20 rounded-xl p-3 border border-red-200 dark:border-red-800 text-sm space-y-1">
                <p className="font-semibold text-red-600 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> Vi phạm anti-cheat: {violations} lần
                </p>
                {deductedPoints > 0 && (
                  <p className="text-red-500">➖ Trừ {deductedPoints} điểm ({violations} × {exam.anti_cheat_deduct_per_violation || 5}). Điểm gốc: {result.score} → Điểm cuối: {finalScore}</p>
                )}
              </div>
            )}

            {hasEssay && (
              <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3">
                ✏️ Bài có câu tự luận — giáo viên sẽ chấm và cập nhật điểm cuối cùng.
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {exam.show_answers_after && (
                <Button className="w-full gap-2" variant="outline" onClick={() => setRunMode("review")}>
                  <Eye className="w-4 h-4" /> 📋 Xem đáp án & giải thích chi tiết
                </Button>
              )}
              <Button className="w-full" onClick={() => navigate(-1)}>Quay lại</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Exam UI ─────────────────────────────────────────────────────────────────
  const totalQ = orderedQuestions.length;
  const answered = orderedQuestions.reduce((n, _q, i) => {
    const a = answers[i];
    if (typeof a === "number") return n + 1;
    if (typeof a === "string" && a.trim()) return n + 1;
    return n;
  }, 0);

  const handleSubmitClick = () => {
    if (answered < totalQ) {
      const ok = window.confirm(`Bạn còn ${totalQ - answered} câu chưa trả lời. Bạn có chắc muốn nộp bài không?`);
      if (!ok) return;
    }
    submit(false);
  };

  const maxVio = exam.anti_cheat_max_violations || 3;
  const penalty = exam.anti_cheat_penalty || 'auto_submit';

  const penaltyLabel: Record<string, string> = {
    warn_only: 'Chỉ cảnh báo — không bị phạt.',
    auto_submit: `Sau ${maxVio} lần → tự động nộp bài.`,
    reset_answers: `Sau ${maxVio} lần → xóa hết câu trả lời, làm lại từ đầu.`,
    deduct_points: `Mỗi lần → trừ ${exam.anti_cheat_deduct_per_violation || 5} điểm. Sau ${maxVio} lần → tự nộp.`,
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Anti-cheat violation warning overlay */}
      {showViolationWarning && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-red-500 shadow-2xl">
            <CardContent className="p-6 text-center space-y-4">
              <ShieldAlert className="w-16 h-16 mx-auto text-red-500" />
              <h2 className="text-xl font-bold text-red-600">⚠️ Cảnh báo gian lận!</h2>
              <p className="text-muted-foreground">
                Bạn đã rời khỏi cửa sổ bài kiểm tra.
                <br />
                <span className="font-bold text-foreground">Vi phạm: {violations}/{penalty === 'warn_only' ? '∞' : maxVio} lần</span>
              </p>
              {penalty === 'reset_answers' && violations >= maxVio ? (
                <p className="text-red-500 font-semibold">🔄 Tất cả câu trả lời đã bị xóa — làm lại từ đầu!</p>
              ) : penalty !== 'warn_only' && violations >= maxVio ? (
                <p className="text-red-500 font-semibold">Đã vượt quá giới hạn — bài đang được nộp…</p>
              ) : (
                <p className="text-sm text-muted-foreground">{penaltyLabel[penalty]}</p>
              )}
              {penalty === 'deduct_points' && violations > 0 && violations < maxVio && (
                <p className="text-sm text-red-500 font-medium">
                  ➖ Đã trừ tổng {violations * (exam.anti_cheat_deduct_per_violation || 5)} điểm
                </p>
              )}
              {(penalty === 'warn_only' || violations < maxVio) && (
                <Button className="w-full" onClick={() => setShowViolationWarning(false)}>
                  Tôi hiểu, tiếp tục làm bài
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto p-3 md:p-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex-1">
            <h1 className="text-base md:text-lg font-bold truncate">{exam.title_vi || exam.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-0.5">
              <span>Đã trả lời {answered}/{totalQ}</span>
              {saving && <span className="flex items-center gap-1"><Save className="w-3 h-3 animate-pulse" /> Đang lưu…</span>}
              {!saving && lastSaved && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-3 h-3" /> Đã lưu {lastSaved.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {isOnline ? <Wifi className="w-3 h-3 text-green-500" /> : <span className="text-red-500 flex items-center gap-1"><WifiOff className="w-3 h-3" /> Offline</span>}
              {exam.anti_cheat && violations > 0 && (
                <span className="text-red-500 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Vi phạm: {violations}/{maxVio}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {timerMode === "countdown" && exam.duration_minutes && (
              <Badge variant={lowTime ? "destructive" : remaining < 300 ? "outline" : "secondary"}
                className={`text-base px-3 py-1.5 font-mono ${lowTime ? "animate-pulse" : ""}`}>
                <Clock className="w-4 h-4 mr-1" /> {fmt(remaining)}
              </Badge>
            )}
            {timerMode === "stopwatch" && (
              <Badge variant="secondary" className="text-base px-3 py-1.5 font-mono">
                <Clock className="w-4 h-4 mr-1" /> {fmt(elapsed)}
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={autoSave} disabled={saving || !isOnline} title="Lưu ngay">
              <Save className="w-4 h-4" />
            </Button>
            <Button onClick={handleSubmitClick} disabled={submitting} variant="hero">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Nộp bài
            </Button>
          </div>
        </div>
        <Progress value={(answered / Math.max(totalQ, 1)) * 100} className="h-1 rounded-none" />
      </div>

      {/* AI Proctoring Camera Vision Floating Widget */}
      {exam.ai_proctoring && (
        <div className="fixed bottom-4 right-4 z-40 bg-background/95 backdrop-blur border-2 border-indigo-500/50 shadow-2xl rounded-2xl p-3 max-w-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400">
              <Camera className="w-3.5 h-3.5 animate-pulse" /> 🤖 AI Giám sát WebCam
            </span>
            <Badge variant={proctoringStatus === "normal" ? "outline" : "destructive"} className="text-[10px] uppercase">
              {proctoringStatus === "normal" && "🟢 An toàn"}
              {proctoringStatus === "gaze_away" && "👁️ Nhìn ra ngoài"}
              {proctoringStatus === "head_turned" && "🗣️ Ngoảnh đầu"}
              {proctoringStatus === "no_face" && "⚠️ Vắng mặt"}
              {proctoringStatus === "multi_monitor" && "💻 2 Màn hình"}
            </Badge>
          </div>
          <div className="relative w-full h-24 bg-black rounded-lg overflow-hidden border border-border">
            <video ref={videoRef} muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
            <canvas ref={canvasRef} className="hidden" />
            {proctoringStatus !== "normal" && (
              <div className="absolute inset-0 bg-red-500/30 flex items-center justify-center p-1 text-center">
                <span className="text-[11px] font-bold text-white bg-red-600/90 px-2 py-1 rounded shadow">
                  {proctoringStatus === "gaze_away" && "⚠️ Đừng nhìn nghiêng ra ngoài!"}
                  {proctoringStatus === "head_turned" && "⚠️ Hãy giữ thẳng đầu!"}
                  {proctoringStatus === "no_face" && "⚠️ Không thấy khuôn mặt!"}
                  {proctoringStatus === "multi_monitor" && "⚠️ Tắt màn hình thứ 2!"}
                </span>
              </div>
            )}
          </div>
          {proctoringLogs.length > 0 && (
            <p className="text-[10px] text-muted-foreground truncate">
              Mốc mới nhất: {proctoringLogs[proctoringLogs.length - 1].msg}
            </p>
          )}
        </div>
      )}

      {/* Meeting Exam Banner */}
      {exam.exam_category === 'speaking_meeting' && exam.meet_link && (
        <div className="bg-indigo-600 text-white p-4 text-center space-y-2">
          <p className="font-bold flex items-center justify-center gap-2 text-sm md:text-base">
            <Video className="w-5 h-5" /> Bài kiểm tra Kỹ năng Nói / Đối thoại trực tuyến qua Meeting
          </p>
          <p className="text-xs text-indigo-100">Hãy tham gia phòng họp bên dưới để thực hiện bài thi Kaiwa 1-1 cùng giáo viên.</p>
          <a
            href={exam.meet_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-indigo-50 shadow transition-colors"
          >
            <Video className="w-4 h-4" /> Tham gia phòng Google Meet / Zoom ngay
          </a>
        </div>
      )}

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-red-500 text-white text-center py-2 px-4 text-sm flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          Mất kết nối internet. Câu trả lời vẫn được giữ — sẽ tự lưu khi có mạng. Đừng đóng tab này.
        </div>
      )}

      {/* Anti-cheat notice */}
      {exam.anti_cheat && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-center py-2 px-4 text-xs flex items-center justify-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          🛡️ Chống gian lận đang bật. {penaltyLabel[penalty]} {violations > 0 && `(${violations}/${penalty === 'warn_only' ? '∞' : maxVio} vi phạm)`}
        </div>
      )}

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

        {orderedQuestions.map((q: any, i: number) => {
          const type = qType(q);
          const pts = q.points || 1;
          const origIdx = q.origIdx ?? i;
          const qKey = q.qKey || q.id || `q_${origIdx}`;

          const currentAns = answers[qKey] ?? answers[origIdx] ?? answers[i];
          const isAnswered = typeof currentAns === "number" || (typeof currentAns === "string" && (currentAns as string).trim().length > 0) || !!speakingRecordings[i];

          const updateAns = (val: number | string) => {
            setAnswers(a => ({ ...a, [qKey]: val, [origIdx]: val, [i]: val }));
          };

          return (
            <Card key={i} className={`border-2 transition-colors duration-200 ${isAnswered ? "border-green-500/40 bg-green-50/20 dark:bg-green-950/10" : "hover:border-primary/30"}`}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex gap-2 items-start">
                  <span className={`inline-flex w-7 h-7 rounded-full items-center justify-center text-sm shrink-0 font-semibold ${isAnswered ? "bg-green-500 text-white" : "bg-primary text-primary-foreground"}`}>
                    {isAnswered ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </span>
                  <span className="flex-1"><FormattedText text={q.text} /></span>
                  <Badge variant="outline" className="shrink-0 font-normal">{pts} điểm</Badge>
                </CardTitle>
                {!isAutoGraded(q) && <p className="text-xs text-muted-foreground pl-9">Câu tự luận – giáo viên sẽ chấm tay.</p>}
              </CardHeader>
              <CardContent className="space-y-2">
                {(type === "multiple_choice" || type === "true_false") && q.options.map((opt: string, oi: number) => {
                  const selected = currentAns === oi || currentAns === String(oi);
                  return (
                    <button key={oi} type="button" onClick={() => updateAns(oi)}
                      className={`w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40 hover:bg-muted/50"}`}>
                      <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-sm font-semibold shrink-0 ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                        {selected ? <CheckCircle2 className="w-4 h-4" /> : String.fromCharCode(65 + oi)}
                      </span>
                      <FormattedText text={opt} />
                    </button>
                  );
                })}
                {type === "short_answer" && (
                  <Input placeholder="Nhập câu trả lời của bạn…"
                    value={typeof currentAns === "string" ? currentAns : ""}
                    onChange={e => updateAns(e.target.value)} />
                )}
                {type === "essay" && (
                  <Textarea rows={5} placeholder="Viết bài làm của bạn tại đây…"
                    value={typeof currentAns === "string" ? currentAns : ""}
                    onChange={e => updateAns(e.target.value)} />
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
              <Label className="text-sm">Nhận xét cho giáo viên</Label>
              <Textarea rows={3} placeholder="VD: phần câu 5 em chưa chắc, mong cô góp ý..."
                value={comment} onChange={e => setComment(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm flex items-center gap-1"><VideoIcon className="w-4 h-4" /> Link video trả lời</Label>
              <Input placeholder="https://..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm flex items-center gap-1"><Paperclip className="w-4 h-4" /> File đính kèm</Label>
              {attachment ? (
                <div className="flex items-center justify-between rounded-md border p-2 bg-muted/30">
                  <a href={attachment.url} target="_blank" rel="noreferrer" className="text-sm text-primary truncate">{attachment.name}</a>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setAttachment(null)}><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <Input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip,.txt"
                  disabled={uploading} onChange={e => e.target.files?.[0] && handleAttachment(e.target.files[0])} />
              )}
              {uploading && <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Đang tải lên...</p>}
            </div>
          </CardContent>
        </Card>

        <div className="pb-8 flex justify-end">
          <Button size="lg" onClick={handleSubmitClick} disabled={submitting} variant="hero" className="min-w-[160px]">
            {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <CheckCircle2 className="w-5 h-5 mr-2" />}
            Nộp bài
          </Button>
        </div>
      </div>

      {/* Background Study Music Player */}
      <BackgroundMusicPlayer />
    </div>
  );
};

export default ExamRunner;
