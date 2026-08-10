import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  X, ClipboardList, ListChecks, CalendarClock, CheckCircle2, ArrowRight, ArrowLeft,
  Wand2, Sparkles, Plus, Trash2, Copy, Loader2, Users, CircleDot, ToggleRight,
  Type, AlignLeft, GripVertical, Clipboard, Music, Upload, Volume2, Timer,
  Infinity as InfinityIcon, Clock, Mic, MessageSquare, Video, Eye, Camera, ShieldAlert, Laptop,
  Save, AlertTriangle, Maximize2, Minimize2, Image
} from 'lucide-react';
import FormattedText from '@/components/shared/FormattedText';
import MediaUploader from '@/components/shared/MediaUploader';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'speaking' | 'roleplay';
export type TimerMode = 'none' | 'stopwatch' | 'countdown';
export type ExamCategory = 'written' | 'speaking_meeting' | 'speaking_ai';

export interface ExamQuestion {
  _key?: string;
  type: QuestionType;
  text: string;
  options: string[];
  correct_index: number;
  accepted_answers?: string[];
  explanation?: string;
  points?: number;
  audio_url?: string;
  image_url?: string;
}

interface ClassOption { id: string; name: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classes: ClassOption[];
  teacherId: string;
  initial?: any;
  onSaved: () => void;
}

const steps = [
  { id: 1, label: 'Cơ bản', icon: ClipboardList },
  { id: 2, label: 'Câu hỏi', icon: ListChecks },
  { id: 3, label: 'Lịch & Giao', icon: CalendarClock },
];

const questionTypeMeta: Record<QuestionType, { label: string; icon: any; auto: boolean }> = {
  multiple_choice: { label: 'Trắc nghiệm', icon: CircleDot, auto: true },
  true_false: { label: 'Đúng / Sai', icon: ToggleRight, auto: true },
  short_answer: { label: 'Trả lời ngắn', icon: Type, auto: true },
  essay: { label: 'Tự luận', icon: AlignLeft, auto: false },
  speaking: { label: 'Thu âm / Thi nói', icon: Mic, auto: false },
  roleplay: { label: 'Đối thoại Kaiwa', icon: MessageSquare, auto: false },
};

const generateKey = () => Math.random().toString(36).substring(2, 9);

const emptyQuestion = (type: QuestionType = 'multiple_choice'): ExamQuestion => {
  const _key = generateKey();
  if (type === 'true_false') return { _key, type, text: '', options: ['Đúng', 'Sai'], correct_index: 0, points: 1, explanation: '' };
  if (type === 'short_answer') return { _key, type, text: '', options: [], correct_index: 0, accepted_answers: [''], points: 1, explanation: '' };
  if (type === 'essay') return { _key, type, text: '', options: [], correct_index: 0, points: 5, explanation: '' };
  return { _key, type, text: '', options: ['', '', '', ''], correct_index: 0, points: 1, explanation: '' };
};

const normalizeQuestion = (q: any): ExamQuestion => {
  const type: QuestionType = q?.type || 'multiple_choice';
  let options: string[] = Array.isArray(q?.options) ? [...q.options] : [];

  if (type === 'true_false') {
    if (options.length !== 2) options = ['Đúng', 'Sai'];
  } else if (type === 'multiple_choice') {
    if (options.length < 2) {
      options = ['', '', '', ''];
    }
  }

  let correctIdx = 0;
  if (typeof q?.correct_index === 'number') {
    correctIdx = q.correct_index;
  } else if (typeof q?.correct_index === 'string' && !isNaN(parseInt(q.correct_index))) {
    correctIdx = parseInt(q.correct_index);
  } else if (typeof q?.correct_answer === 'number') {
    correctIdx = q.correct_answer;
  } else if (typeof q?.correct_answer === 'string') {
    const letter = q.correct_answer.toUpperCase().trim();
    if (['A', 'B', 'C', 'D', 'E', 'F'].includes(letter)) {
      correctIdx = letter.charCodeAt(0) - 65;
    }
  }

  if (options.length > 0) {
    correctIdx = Math.max(0, Math.min(correctIdx, options.length - 1));
  } else {
    correctIdx = 0;
  }

  return {
    _key: q?._key || generateKey(),
    type,
    text: q?.text || '',
    options,
    correct_index: correctIdx,
    accepted_answers: Array.isArray(q?.accepted_answers) ? q.accepted_answers : undefined,
    explanation: q?.explanation || '',
    points: typeof q?.points === 'number' ? q.points : 1,
    audio_url: q?.audio_url || undefined,
    image_url: q?.image_url || undefined,
  };
};

// ─── Parse paste text into option lines ────────────────────────────────────────
const parsePasteLines = (text: string): string[] =>
  text
    .split(/\r?\n/)
    .map((l) => {
      // Strip leading A. / A) / A: / A、 / 1. / 1) patterns
      return l.replace(/^[A-Fa-f1-6][.)、:．]\s*/u, '').trim();
    })
    .filter((l) => l.length > 0);

// ─── Quick Paste Popover ────────────────────────────────────────────────────────
interface QuickPasteProps {
  onPaste: (lines: string[]) => void;
}
const QuickPastePopover = ({ onPaste }: QuickPasteProps) => {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  const apply = () => {
    const lines = parsePasteLines(text);
    if (lines.length >= 2) {
      onPaste(lines);
      setText('');
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-dashed border-primary/40 text-primary hover:bg-primary/10"
          title="Paste nhanh nhiều đáp án từ Word/Excel"
        >
          <Clipboard className="w-3.5 h-3.5" />
          Paste nhanh
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 space-y-3" align="start">
        <div>
          <p className="text-sm font-semibold mb-1">📋 Paste nhanh đáp án</p>
          <p className="text-xs text-muted-foreground">
            Dán 4 đáp án từ Word/Excel vào đây (mỗi dòng = 1 đáp án). Hệ thống tự phân vào A, B, C, D.
          </p>
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={(e) => {
            // Auto-apply right after paste if multi-line
            const pasted = e.clipboardData?.getData('text') || '';
            const lines = parsePasteLines(pasted);
            if (lines.length >= 2) {
              e.preventDefault();
              onPaste(lines);
              setText('');
              setOpen(false);
            }
          }}
          rows={5}
          placeholder={`ゆうべ\nきのう\nあした\nおととい`}
          className="font-mono text-sm resize-none"
          autoFocus
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="flex-1"
            onClick={apply}
            disabled={parsePasteLines(text).length < 2}
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Áp dụng ({parsePasteLines(text).length} đáp án)
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
            Hủy
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// ─── Audio Upload per Question ──────────────────────────────────────────────────
interface AudioUploadProps {
  audioUrl?: string;
  onChange: (url: string | undefined) => void;
}
const AudioUpload = ({ audioUrl, onChange }: AudioUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast({ title: 'Chỉ chấp nhận file âm thanh (MP3, WAV…)', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'mp3';
      const path = `exam-audio/${Date.now()}-${generateKey()}.${ext}`;
      const { error } = await supabase.storage.from('exam-audio').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('exam-audio').getPublicUrl(path);
      onChange(data.publicUrl);
      toast({ title: '✅ Đã tải lên file âm thanh' });
    } catch (e: any) {
      toast({ title: 'Lỗi upload audio', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
      />
      {audioUrl ? (
        <div className="flex items-center gap-2 flex-1 min-w-0 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
          <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <audio controls src={audioUrl} className="h-8 flex-1 min-w-0" style={{ maxWidth: '100%' }} />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-muted-foreground hover:text-destructive shrink-0"
            title="Xóa audio"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs border-dashed"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Music className="w-3.5 h-3.5" />
          )}
          {uploading ? 'Đang tải...' : 'Thêm Audio 🎵'}
        </Button>
      )}
    </div>
  );
};

// ─── Timer Mode Card Selector ──────────────────────────────────────────────────
interface TimerModeCardProps {
  value: TimerMode;
  onChange: (v: TimerMode) => void;
}
const TimerModeCard = ({ value, onChange }: TimerModeCardProps) => {
  const options: { v: TimerMode; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    {
      v: 'none',
      label: 'Không bấm giờ',
      desc: 'Không hiển thị đồng hồ',
      icon: <X className="w-5 h-5" />,
      color: 'text-muted-foreground',
    },
    {
      v: 'stopwatch',
      label: 'Đếm thời gian',
      desc: 'Đếm lên – học viên làm bao lâu cũng được',
      icon: <Timer className="w-5 h-5" />,
      color: 'text-blue-500',
    },
    {
      v: 'countdown',
      label: 'Giới hạn thời gian',
      desc: 'Đếm ngược – hết giờ tự động nộp bài',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {options.map((opt) => {
        const active = value === opt.v;
        return (
          <button
            key={opt.v}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`rounded-xl border-2 p-4 text-left transition-all space-y-1.5 ${active
                ? 'border-primary bg-primary/10 shadow-md'
                : 'border-border hover:border-primary/40 hover:bg-muted/50'
              }`}
          >
            <div className={`${active ? 'text-primary' : opt.color}`}>{opt.icon}</div>
            <p className={`font-semibold text-sm ${active ? 'text-primary' : 'text-foreground'}`}>
              {opt.label}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
          </button>
        );
      })}
    </div>
  );
};

// ─── Draft key helper ─────────────────────────────────────────────────────────
const DRAFT_KEY = 'exambuilder_draft';

// ─── Main ExamBuilder ──────────────────────────────────────────────────────────
const ExamBuilder = ({ open, onOpenChange, classes, teacherId, initial, onSaved }: Props) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [draftRestorePrompt, setDraftRestorePrompt] = useState(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  // Step 1
  const [title, setTitle] = useState('');
  const [titleVi, setTitleVi] = useState('');
  const [examType, setExamType] = useState<'quiz' | 'midterm' | 'final' | 'placement'>('quiz');
  const [examCategory, setExamCategory] = useState<ExamCategory>('written');
  const [level, setLevel] = useState('N5');
  const [instructions, setInstructions] = useState('');
  const [descriptionVi, setDescriptionVi] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  // Step 2
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  // Step 3
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown');
  const [maxScore, setMaxScore] = useState(10);
  const [passingScore, setPassingScore] = useState(6);
  // scoreMode: 'raw' = compare score directly; 'scaled' = scale score to maxScore first
  const [scoreMode, setScoreMode] = useState<'raw' | 'scaled'>('scaled');
  // scoreRounding: how to round when scaled
  const [scoreRounding, setScoreRounding] = useState<'round' | 'floor' | 'ceil' | 'none'>('round');
  const [xpReward, setXpReward] = useState(50);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [lockAfterEnd, setLockAfterEnd] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [isPublished, setIsPublished] = useState(false);
  const [antiCheat, setAntiCheat] = useState(false);
  const [aiProctoring, setAiProctoring] = useState(false);
  const [proctoringConfig, setProctoringConfig] = useState({
    detect_gaze: true,
    detect_head: true,
    detect_multi_face: true,
    detect_dual_monitor: true,
  });
  const [antiCheatMaxViolations, setAntiCheatMaxViolations] = useState(3);
  const [antiCheatPenalty, setAntiCheatPenalty] = useState<'warn_only' | 'auto_submit' | 'reset_answers' | 'deduct_points'>('auto_submit');
  const [antiCheatDeductPerViolation, setAntiCheatDeductPerViolation] = useState(5);
  const [showAnswersAfter, setShowAnswersAfter] = useState(true);
  const [primaryClass, setPrimaryClass] = useState<string>('all');
  const [extraClassIds, setExtraClassIds] = useState<string[]>([]);

  const isEdit = !!initial?.id;

  const prevOpenRef = useRef(false);
  const prevInitialIdRef = useRef<string | undefined>(undefined);

  // ── Build draft snapshot for autosave ────────────────────────────────────────
  const buildDraft = useCallback(() => ({
    step, title, titleVi, examType, examCategory, level, instructions, descriptionVi,
    meetLink, videoUrl, questions, examDate, startTime, duration, timerMode,
    maxScore, passingScore, scoreMode, scoreRounding, xpReward, startsAt, endsAt,
    lockAfterEnd, shuffle, maxAttempts, isPublished, antiCheat, aiProctoring,
    proctoringConfig, antiCheatMaxViolations, antiCheatPenalty,
    antiCheatDeductPerViolation, showAnswersAfter, primaryClass, extraClassIds,
    savedAt: Date.now(),
  }), [step, title, titleVi, examType, examCategory, level, instructions, descriptionVi,
    meetLink, videoUrl, questions, examDate, startTime, duration, timerMode,
    maxScore, passingScore, scoreMode, scoreRounding, xpReward, startsAt, endsAt,
    lockAfterEnd, shuffle, maxAttempts, isPublished, antiCheat, aiProctoring,
    proctoringConfig, antiCheatMaxViolations, antiCheatPenalty,
    antiCheatDeductPerViolation, showAnswersAfter, primaryClass, extraClassIds]);

  // ── Autosave to localStorage (debounced 3s) ───────────────────────────────────
  useEffect(() => {
    if (!open || !isDirtyRef.current) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft()));
      } catch { /* ignore */ }
    }, 3000);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [open, buildDraft]);

  // ── Mark dirty whenever content changes ──────────────────────────────────────
  useEffect(() => { if (open) isDirtyRef.current = true; }, [
    title, titleVi, questions, examDate, maxScore, passingScore, instructions
  ]);

  const restoreDraft = (draft: any) => {
    if (!draft) return;
    setStep(draft.step || 1);
    setTitle(draft.title || '');
    setTitleVi(draft.titleVi || '');
    setExamType(draft.examType || 'quiz');
    setExamCategory(draft.examCategory || 'written');
    setLevel(draft.level || 'N5');
    setInstructions(draft.instructions || '');
    setDescriptionVi(draft.descriptionVi || '');
    setMeetLink(draft.meetLink || '');
    setVideoUrl(draft.videoUrl || '');
    setQuestions(Array.isArray(draft.questions) ? draft.questions.map(normalizeQuestion) : []);
    setExamDate(draft.examDate || new Date().toISOString().slice(0, 10));
    setStartTime(draft.startTime || '09:00');
    setDuration(draft.duration || 60);
    setTimerMode(draft.timerMode || 'countdown');
    setMaxScore(draft.maxScore ?? 10);
    setPassingScore(draft.passingScore ?? 6);
    setScoreMode(draft.scoreMode || 'scaled');
    setScoreRounding(draft.scoreRounding || 'round');
    setXpReward(draft.xpReward ?? 50);
    setStartsAt(draft.startsAt || '');
    setEndsAt(draft.endsAt || '');
    setLockAfterEnd(draft.lockAfterEnd ?? true);
    setShuffle(draft.shuffle ?? false);
    setMaxAttempts(draft.maxAttempts ?? 1);
    setIsPublished(draft.isPublished ?? false);
    setAntiCheat(draft.antiCheat ?? false);
    setAiProctoring(draft.aiProctoring ?? false);
    setProctoringConfig(draft.proctoringConfig || { detect_gaze: true, detect_head: true, detect_multi_face: true, detect_dual_monitor: true });
    setAntiCheatMaxViolations(draft.antiCheatMaxViolations ?? 3);
    setAntiCheatPenalty(draft.antiCheatPenalty || 'auto_submit');
    setAntiCheatDeductPerViolation(draft.antiCheatDeductPerViolation ?? 5);
    setShowAnswersAfter(draft.showAnswersAfter ?? true);
    setPrimaryClass(draft.primaryClass || 'all');
    setExtraClassIds(draft.extraClassIds || []);
  };

  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      isDirtyRef.current = false;
      return;
    }

    const isNewOpen = !prevOpenRef.current;
    const initialId = initial?.id;
    const isDifferentExam = initialId !== prevInitialIdRef.current;

    if (isNewOpen || isDifferentExam) {
      prevOpenRef.current = true;
      prevInitialIdRef.current = initialId;
      isDirtyRef.current = false;

      // If no initial data (new exam), check for unsaved draft
      if (!initialId) {
        try {
          const raw = localStorage.getItem(DRAFT_KEY);
          if (raw) {
            const draft = JSON.parse(raw);
            const ageMin = (Date.now() - (draft.savedAt || 0)) / 60000;
            if (ageMin < 1440 && (draft.titleVi || draft.title || draft.questions?.length > 0)) {
              setDraftRestorePrompt(true);
            } else {
              localStorage.removeItem(DRAFT_KEY);
            }
          }
        } catch { /* ignore */ }
      }

      setStep(1);
      setTitle(initial?.title || '');
      setTitleVi(initial?.title_vi || '');
      setExamType(initial?.exam_type || 'quiz');
      setExamCategory(initial?.exam_category || 'written');
      setLevel('N5');
      setInstructions(initial?.instructions || '');
      setDescriptionVi(initial?.description_vi || '');
      setMeetLink(initial?.meet_link || '');
      setVideoUrl(initial?.video_url || '');
      setQuestions(Array.isArray(initial?.questions) ? initial.questions.map(normalizeQuestion) : []);
      setExamDate(initial?.exam_date || new Date().toISOString().slice(0, 10));
      setStartTime(initial?.start_time || '09:00');
      setDuration(initial?.duration_minutes || 60);
      setTimerMode((initial?.timer_mode as TimerMode) || 'countdown');
      setMaxScore(initial?.max_score ?? 10);
      setPassingScore(initial?.passing_score ?? 6);
      setScoreMode((initial as any)?.score_mode || 'scaled');
      setScoreRounding((initial as any)?.score_rounding || 'round');
      setXpReward(initial?.xp_reward ?? 50);
      setStartsAt(initial?.starts_at ? initial.starts_at.slice(0, 16) : '');
      setEndsAt(initial?.ends_at ? initial.ends_at.slice(0, 16) : '');
      setLockAfterEnd(initial?.lock_after_end ?? true);
      setShuffle(initial?.shuffle_questions ?? false);
      setMaxAttempts(initial?.max_attempts ?? 1);
      setIsPublished(initial?.is_published ?? false);
      setAntiCheat(initial?.anti_cheat ?? false);
      setAiProctoring(initial?.ai_proctoring ?? false);
      setProctoringConfig(initial?.proctoring_config || {
        detect_gaze: true,
        detect_head: true,
        detect_multi_face: true,
        detect_dual_monitor: true,
      });
      setAntiCheatMaxViolations(initial?.anti_cheat_max_violations ?? 3);
      setAntiCheatPenalty(initial?.anti_cheat_penalty || 'auto_submit');
      setAntiCheatDeductPerViolation(initial?.anti_cheat_deduct_per_violation ?? 5);
      setShowAnswersAfter(initial?.show_answers_after ?? true);
      setPrimaryClass(initial?.class_id || 'all');
      setExtraClassIds([]);
    }
  }, [open, initial]);

  const totalPoints = useMemo(() => questions.reduce((s, q) => s + (q.points || 0), 0), [questions]);
  const autoGraded = useMemo(() => questions.filter((q) => questionTypeMeta[q.type].auto).length, [questions]);

  // ── Score preview calculation ─────────────────────────────────────────────────
  const scorePreview = useMemo(() => {
    if (totalPoints === 0) return null;
    // Example: student answers 18/25 correct (each 1pt)
    const exampleCorrect = Math.ceil(totalPoints * 0.72); // ~72%
    if (scoreMode === 'scaled') {
      const raw = (exampleCorrect / totalPoints) * maxScore;
      const fn = scoreRounding === 'round' ? Math.round : scoreRounding === 'floor' ? Math.floor : scoreRounding === 'ceil' ? Math.ceil : (x: number) => x;
      return { raw: exampleCorrect, total: totalPoints, scaled: fn(raw), outOf: maxScore, passing: passingScore, passed: fn(raw) >= passingScore };
    }
    return { raw: exampleCorrect, total: totalPoints, scaled: null, outOf: totalPoints, passing: passingScore, passed: exampleCorrect >= passingScore };
  }, [totalPoints, maxScore, passingScore, scoreMode, scoreRounding]);

  // NOTE: Removed auto-override of maxScore to preserve admin settings

  const patchQ = (i: number, patch: Partial<ExamQuestion>) =>
    setQuestions((arr) => arr.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const changeType = (i: number, type: QuestionType) =>
    setQuestions((arr) => arr.map((q, idx) => (idx === i ? { ...emptyQuestion(type), text: q.text, points: q.points } : q)));

  const addQuestion = (type: QuestionType = 'multiple_choice') => setQuestions((a) => [...a, emptyQuestion(type)]);
  const removeQuestion = (i: number) => setQuestions((a) => a.filter((_, idx) => idx !== i));
  const duplicateQuestion = (i: number) =>
    setQuestions((a) => [
      ...a.slice(0, i + 1),
      {
        ...a[i],
        _key: generateKey(),
        options: [...a[i].options],
        accepted_answers: a[i].accepted_answers ? [...a[i].accepted_answers!] : undefined,
      },
      ...a.slice(i + 1),
    ]);

  const removeOption = (qIndex: number, optIndex: number) => {
    setQuestions((arr) =>
      arr.map((q, idx) => {
        if (idx !== qIndex) return q;
        const newOptions = q.options.filter((_, x) => x !== optIndex);
        let newCorrect = q.correct_index;
        if (optIndex < q.correct_index) {
          newCorrect = Math.max(0, q.correct_index - 1);
        } else if (optIndex === q.correct_index) {
          newCorrect = Math.min(q.correct_index, newOptions.length - 1);
        }
        return { ...q, options: newOptions, correct_index: Math.max(0, newCorrect) };
      })
    );
  };

  const moveQuestion = (i: number, dir: -1 | 1) =>
    setQuestions((a) => {
      const j = i + dir;
      if (j < 0 || j >= a.length) return a;
      const next = [...a];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  // ── Smart paste handler ──────────────────────────────────────────────────────
  const handleOptionPaste = useCallback(
    (qIndex: number, optStartIndex: number, e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData?.getData('text') || '';
      const lines = parsePasteLines(text);
      if (lines.length < 2) return; // single line – normal paste

      e.preventDefault();
      setQuestions((arr) =>
        arr.map((q, idx) => {
          if (idx !== qIndex) return q;
          const newOptions = [...q.options];
          lines.forEach((line, li) => {
            const targetIdx = optStartIndex + li;
            if (targetIdx < 6) {
              if (targetIdx >= newOptions.length) newOptions.push(line);
              else newOptions[targetIdx] = line;
            }
          });
          return { ...q, options: newOptions };
        })
      );
      toast({
        title: `✅ Đã điền ${lines.length} đáp án`,
        description: 'Paste thông minh từ clipboard',
      });
    },
    [toast]
  );

  const runAI = async (action: 'exam_generate' | 'exam_questions', extra: any = {}) => {
    if (!title.trim() && !titleVi.trim()) {
      toast({ title: 'Nhập tiêu đề trước khi dùng AI', variant: 'destructive' });
      return;
    }
    setAiLoading(action);
    try {
      const { data, error } = await supabase.functions.invoke('classroom-ai', {
        body: { action, title: titleVi || title, level, exam_type: examType, ...extra },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (typeof data?.instructions === 'string' && action === 'exam_generate') setInstructions(data.instructions);
      if (Array.isArray(data?.questions)) {
        const incoming = data.questions.map(normalizeQuestion);
        setQuestions((prev) => (action === 'exam_generate' ? incoming : [...prev, ...incoming]));
      }
      toast({ title: 'Đã áp dụng gợi ý AI' });
      if (action === 'exam_generate') setStep(2);
    } catch (e: any) {
      toast({ title: 'AI lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setAiLoading(null);
    }
  };

  const validate = () => {
    if (!titleVi.trim() && !title.trim()) return 'Vui lòng nhập tiêu đề bài kiểm tra';
    if (!examDate) return 'Vui lòng chọn ngày kiểm tra';
    return null;
  };

  const validateQuestions = () => {
    if (questions.length === 0) return 'Vui lòng thêm ít nhất 1 câu hỏi';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        return `Câu ${i + 1}: Vui lòng nhập nội dung câu hỏi`;
      }
      if (q.type === 'multiple_choice') {
        const nonEmptyOpts = q.options.filter((o) => o.trim().length > 0);
        if (nonEmptyOpts.length < 2) {
          return `Câu ${i + 1}: Cần ít nhất 2 đáp án không để trống`;
        }
      }
      if (q.type === 'short_answer') {
        const validAnswers = (q.accepted_answers || []).filter((a) => a.trim().length > 0);
        if (validAnswers.length === 0) {
          return `Câu ${i + 1}: Vui lòng nhập ít nhất 1 đáp án được chấp nhận`;
        }
      }
    }
    return null;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!title.trim() && !titleVi.trim()) {
        toast({ title: 'Vui lòng nhập tiêu đề bài kiểm tra', variant: 'destructive' });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      const qErr = validateQuestions();
      if (qErr) {
        toast({ title: qErr, variant: 'destructive' });
        return;
      }
      setStep(3);
    }
  };

  const save = async () => {
    const err = validate();
    if (err) {
      toast({ title: err, variant: 'destructive' });
      setStep(!titleVi.trim() && !title.trim() ? 1 : 3);
      return;
    }

    const qErr = validateQuestions();
    if (qErr) {
      toast({ title: qErr, variant: 'destructive' });
      setStep(2);
      return;
    }

    setSaving(true);
    const cleanQuestions = questions.map(({ _key, ...q }) => q);

    const base: any = {
      title: (title || titleVi).trim(),
      title_vi: (titleVi || title).trim(),
      description_vi: descriptionVi || null,
      instructions: instructions || null,
      video_url: videoUrl || thumbnailUrl || null,
      exam_type: examType,
      max_score: maxScore,
      passing_score: passingScore,
      score_mode: scoreMode,
      score_rounding: scoreRounding,
      xp_reward: xpReward,
      is_published: isPublished,
      teacher_id: teacherId,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      lock_after_end: lockAfterEnd,
      shuffle_questions: shuffle,
      max_attempts: maxAttempts,
      anti_cheat: antiCheat,
      ai_proctoring: aiProctoring,
      proctoring_config: proctoringConfig,
      anti_cheat_max_violations: antiCheatMaxViolations,
      anti_cheat_penalty: antiCheatPenalty,
      anti_cheat_deduct_per_violation: antiCheatDeductPerViolation,
      show_answers_after: showAnswersAfter,
      questions: cleanQuestions as any,
    };
    const sb: any = supabase;
    let error: any = null;
    try {
      if (isEdit) {
        const res = await sb.from('exams').update({ ...base, class_id: primaryClass === 'all' ? null : primaryClass }).eq('id', initial.id);
        error = res.error;
      } else {
        const targets = [primaryClass, ...extraClassIds];
        const rows = targets.map((cid) => ({ ...base, class_id: cid === 'all' ? null : cid }));
        const res = await sb.from('exams').insert(rows);
        error = res.error;
      }
    } catch (e: any) {
      error = e;
    }
    setSaving(false);
    if (error) {
      toast({ title: 'Lỗi lưu bài kiểm tra', description: error.message, variant: 'destructive' });
      return;
    }
    // Clear draft after successful save
    localStorage.removeItem(DRAFT_KEY);
    isDirtyRef.current = false;
    toast({ title: isEdit ? 'Đã cập nhật bài kiểm tra' : 'Đã tạo bài kiểm tra' });
    onSaved();
    onOpenChange(false);
  };

  const canNext = step === 1 ? title.trim().length > 0 || titleVi.trim().length > 0 : true;

  // ── Handle close attempt (with confirmation) ──────────────────────────────────
  const handleCloseAttempt = () => {
    if (isDirtyRef.current && (titleVi || title || questions.length > 0)) {
      setShowConfirmClose(true);
    } else {
      // Save draft just in case then close
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft())); } catch { /* ignore */ }
      onOpenChange(false);
    }
  };

  const handleForceClose = () => {
    setShowConfirmClose(false);
    localStorage.removeItem(DRAFT_KEY);
    isDirtyRef.current = false;
    onOpenChange(false);
  };

  const handleSaveDraftAndClose = () => {
    setShowConfirmClose(false);
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(buildDraft())); } catch { /* ignore */ }
    toast({ title: '💾 Draft đã được lưu tự động', description: 'Bạn có thể tiếp tục lần sau.' });
    isDirtyRef.current = false;
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleCloseAttempt(); }}>
      <DialogContent
        showCloseButton={false}
        className={`p-0 overflow-hidden gap-0 flex flex-col transition-all duration-200 ${
          isFullscreen
            ? '!left-0 !top-0 !translate-x-0 !translate-y-0 !max-w-none w-screen h-[100dvh] rounded-none border-0'
            : 'max-w-4xl w-[calc(100vw-2rem)] h-[92dvh] max-h-[92dvh]'
        }`}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => { e.preventDefault(); handleCloseAttempt(); }}
      >
        {/* Draft restore banner */}
        {draftRestorePrompt && (
          <div className="flex items-center gap-3 px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/30 text-sm">
            <Save className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="flex-1 text-amber-700 dark:text-amber-400 font-medium">📝 Tìm thấy bản nháp chưa lưu. Khôi phục?</span>
            <Button size="sm" variant="outline" className="h-7 text-xs border-amber-500/50 text-amber-700"
              onClick={() => {
                try {
                  const raw = localStorage.getItem(DRAFT_KEY);
                  if (raw) restoreDraft(JSON.parse(raw));
                } catch { /* ignore */ }
                setDraftRestorePrompt(false);
                toast({ title: '✅ Đã khôi phục bản nháp' });
              }}
            >Khôi phục</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs"
              onClick={() => { localStorage.removeItem(DRAFT_KEY); setDraftRestorePrompt(false); }}
            >Bỏ qua</Button>
          </div>
        )}

        {/* Confirm Close Dialog (inline overlay) */}
        {showConfirmClose && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-base">Thoát khỏi bài kiểm tra?</p>
                  <p className="text-sm text-muted-foreground">Bạn có thay đổi chưa được lưu.</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={handleSaveDraftAndClose} className="gap-2">
                  <Save className="w-4 h-4" /> Lưu nháp & Thoát
                </Button>
                <Button variant="destructive" onClick={handleForceClose} className="gap-2">
                  <X className="w-4 h-4" /> Thoát không lưu
                </Button>
                <Button variant="ghost" onClick={() => setShowConfirmClose(false)}>
                  Tiếp tục chỉnh sửa
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Header + stepper */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <ListChecks className="w-5 h-5" />
              </div>
              {isEdit ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}
            </DialogTitle>
            <div className="flex items-center gap-1">
              {/* Autosave indicator */}
              <span className="text-[10px] text-muted-foreground hidden sm:flex items-center gap-1 mr-2">
                <Save className="w-3 h-3" /> Tự động lưu
              </span>
              {/* Fullscreen toggle */}
              <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(f => !f)} title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}>
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              {/* Close button with confirmation */}
              <Button variant="ghost" size="icon" onClick={handleCloseAttempt}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              const done = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setStep(s.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${active ? 'bg-primary text-primary-foreground shadow-md'
                        : done ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    <span className="hidden sm:inline">{s.id}. {s.label}</span>
                  </button>
                  {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${done ? 'bg-primary/40' : 'bg-muted'}`} />}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Step 1: Cơ bản ── */}
          {step === 1 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hình thức thi & Đánh giá</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1.5">
                  {([
                    { v: 'written', label: '📝 Trắc nghiệm & Viết', desc: 'Đề thi trắc nghiệm, trả lời ngắn, tự luận.' },
                    { v: 'speaking_meeting', label: '🎙️ Thi Nói qua Meeting', desc: 'Học viên & GV vào phòng Google Meet/Zoom thi trực tiếp 1-1.' },
                    { v: 'speaking_ai', label: '🤖 Thi Nói Thu âm / AI', desc: 'Học viên thu âm đoạn đối thoại / phát âm để nộp bài.' },
                  ] as const).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setExamCategory(o.v)}
                      className={`p-3 rounded-xl border-2 text-left transition-all space-y-1 ${examCategory === o.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                        }`}
                    >
                      <p className="font-semibold text-sm">{o.label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Loại bài kiểm tra</Label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {([
                    { v: 'quiz', label: 'Quiz' },
                    { v: 'midterm', label: 'Giữa kỳ' },
                    { v: 'final', label: 'Cuối kỳ' },
                    { v: 'placement', label: 'Xếp lớp' },
                  ] as const).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setExamType(o.v)}
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${examType === o.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
                        }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tiêu đề (VI) *</Label>
                  <Input value={titleVi} onChange={(e) => setTitleVi(e.target.value)} placeholder="VD: Kiểm tra 15 phút bài 5" className="mt-1 font-semibold" autoFocus />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tiêu đề (EN)</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Lesson 5 Quiz" className="mt-1" />
                </div>
              </div>

              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center"><Wand2 className="w-5 h-5" /></div>
                  <div>
                    <p className="font-semibold text-sm">AI tạo toàn bộ đề</p>
                    <p className="text-xs text-muted-foreground">Sinh hướng dẫn + bộ câu hỏi trắc nghiệm theo trình độ.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="h-9 w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>{['N5', 'N4', 'N3', 'N2', 'N1'].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button type="button" onClick={() => runAI('exam_generate', { count: 5 })} disabled={!!aiLoading}>
                    {aiLoading === 'exam_generate' ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
                    Tạo bằng AI
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hướng dẫn cho học viên</Label>
                <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} rows={4} placeholder="Lưu ý khi làm bài, cách tính điểm…" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mô tả (tùy chọn)</Label>
                <Textarea value={descriptionVi} onChange={(e) => setDescriptionVi(e.target.value)} rows={2} className="mt-1" />
              </div>
              {/* Ảnh bìa bài kiểm tra (Thumbnail) */}
              <div className="space-y-1.5 bg-muted/20 p-3 rounded-xl border">
                <Label className="text-xs uppercase tracking-wider text-foreground font-bold flex items-center gap-1.5">
                  <Image className="w-4 h-4 text-purple-600" /> Ảnh bìa Bài kiểm tra (Thumbnail Đề thi)
                </Label>
                <MediaUploader
                  value={thumbnailUrl}
                  onChange={(url) => setThumbnailUrl(url)}
                  accept="image"
                  folder="exam-thumbnails"
                  placeholder="Tải ảnh đại diện bài kiểm tra hoặc chọn từ thư viện"
                  aspectRatio="video"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Link Google Meet</Label>
                  <Input value={meetLink} onChange={(e) => setMeetLink(e.target.value)} placeholder="https://meet.google.com/..." className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Link Video</Label>
                  <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." className="mt-1" />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Câu hỏi ── */}
          {step === 2 && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-2 flex-wrap sticky -top-6 bg-background/95 backdrop-blur py-2 z-10">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="gap-1"><ListChecks className="w-3 h-3" />{questions.length} câu</Badge>
                  <Badge variant="secondary">{totalPoints} điểm</Badge>
                  <span className="text-xs text-muted-foreground">{autoGraded} câu tự chấm • {questions.length - autoGraded} câu chấm tay</span>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => runAI('exam_questions', { count: 5 })} disabled={!!aiLoading}>
                  {aiLoading === 'exam_questions' ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                  AI sinh thêm câu hỏi
                </Button>
              </div>

              {questions.length === 0 && (
                <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-xl">
                  <ListChecks className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="mb-3">Chưa có câu hỏi nào.</p>
                  <p className="text-xs">Thêm thủ công bên dưới hoặc dùng AI để sinh nhanh.</p>
                </div>
              )}

              {questions.map((q, i) => {
                const meta = questionTypeMeta[q.type];
                const TypeIcon = meta.icon;
                return (
                  <div key={q._key || i} className="rounded-xl border-2 bg-card p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col items-center gap-1 pt-1">
                        <button type="button" className="text-muted-foreground hover:text-foreground disabled:opacity-30" onClick={() => moveQuestion(i, -1)} disabled={i === 0}><GripVertical className="w-4 h-4" /></button>
                        <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center">{i + 1}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Select value={q.type} onValueChange={(v) => changeType(i, v as QuestionType)}>
                            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {(Object.keys(questionTypeMeta) as QuestionType[]).map((t) => (
                                <SelectItem key={t} value={t}>{questionTypeMeta[t].label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Badge variant="outline" className="gap-1 text-xs"><TypeIcon className="w-3 h-3" />{meta.auto ? 'Tự chấm' : 'Chấm tay'}</Badge>
                          <div className="flex items-center gap-1 ml-auto">
                            <span className="text-xs text-muted-foreground">Điểm</span>
                            <Input type="number" min={0} className="w-16 h-8" value={q.points ?? 0} onChange={(e) => patchQ(i, { points: parseInt(e.target.value) || 0 })} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Nội dung câu hỏi</Label>
                            <div className="flex items-center gap-1.5 text-xs">
                              <button
                                type="button"
                                title="Bôi đậm phần văn bản đang chọn hoặc thêm mẫu"
                                onClick={(e) => {
                                  const target = e.currentTarget.closest('.space-y-1')?.querySelector('textarea') as HTMLTextAreaElement;
                                  if (target) {
                                    const start = target.selectionStart;
                                    const end = target.selectionEnd;
                                    const val = target.value;
                                    const sel = val.substring(start, end);
                                    const newText = sel ? val.substring(0, start) + `**${sel}**` + val.substring(end) : val + ' **chữ đậm**';
                                    patchQ(i, { text: newText });
                                  } else {
                                    patchQ(i, { text: (q.text || '') + ' **chữ đậm**' });
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground font-bold border border-border text-[11px]"
                              >
                                B
                              </button>
                              <button
                                type="button"
                                title="In nghiêng phần văn bản đang chọn hoặc thêm mẫu"
                                onClick={(e) => {
                                  const target = e.currentTarget.closest('.space-y-1')?.querySelector('textarea') as HTMLTextAreaElement;
                                  if (target) {
                                    const start = target.selectionStart;
                                    const end = target.selectionEnd;
                                    const val = target.value;
                                    const sel = val.substring(start, end);
                                    const newText = sel ? val.substring(0, start) + `*${sel}*` + val.substring(end) : val + ' *chữ nghiêng*';
                                    patchQ(i, { text: newText });
                                  } else {
                                    patchQ(i, { text: (q.text || '') + ' *chữ nghiêng*' });
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground italic border border-border text-[11px]"
                              >
                                I
                              </button>
                              <button
                                type="button"
                                title="Đậm & Nghiêng phần văn bản đang chọn hoặc thêm mẫu"
                                onClick={(e) => {
                                  const target = e.currentTarget.closest('.space-y-1')?.querySelector('textarea') as HTMLTextAreaElement;
                                  if (target) {
                                    const start = target.selectionStart;
                                    const end = target.selectionEnd;
                                    const val = target.value;
                                    const sel = val.substring(start, end);
                                    const newText = sel ? val.substring(0, start) + `***${sel}***` + val.substring(end) : val + ' ***đậm nghiêng***';
                                    patchQ(i, { text: newText });
                                  } else {
                                    patchQ(i, { text: (q.text || '') + ' ***đậm nghiêng***' });
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground font-bold italic border border-border text-[11px]"
                              >
                                B I
                              </button>
                            </div>
                          </div>
                          <Textarea
                            value={q.text}
                            onChange={(e) => patchQ(i, { text: e.target.value })}
                            rows={2}
                            placeholder="Nội dung câu hỏi… (Hỗ trợ **in đậm**, *in nghiêng*, ***đậm nghiêng***)"
                          />
                          {q.text && (q.text.includes('*') || q.text.includes('<')) && (
                            <div className="text-xs bg-muted/40 p-2 rounded-md border text-muted-foreground">
                              <span className="font-semibold text-foreground">Xem trước: </span>
                              <FormattedText text={q.text} />
                            </div>
                          )}
                        </div>

                        {/* ── Audio upload ── */}
                        <AudioUpload
                          audioUrl={q.audio_url}
                          onChange={(url) => patchQ(i, { audio_url: url || undefined })}
                        />

                        {/* ── Question Image Upload / URL Library ── */}
                        <div className="space-y-1 bg-muted/20 p-2.5 rounded-xl border border-border/80">
                          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Image className="w-3.5 h-3.5 text-blue-500" /> Ảnh minh họa câu hỏi (Tải lên / Chọn từ thư viện media / Dán URL)
                          </Label>
                          <MediaUploader
                            value={q.image_url || ''}
                            onChange={(url) => patchQ(i, { image_url: url || undefined })}
                            accept="image"
                            folder="exam-question-images"
                            placeholder="Tải ảnh minh họa hoặc chọn từ thư viện"
                            aspectRatio="auto"
                          />
                        </div>

                        {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                          <div className="space-y-2">
                            {/* Smart paste hint */}
                            {q.type === 'multiple_choice' && (
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs text-muted-foreground flex-1">
                                  💡 Paste nhiều dòng vào ô bất kỳ → tự điền A B C D
                                </p>
                                <QuickPastePopover
                                  onPaste={(lines) => {
                                    const newOptions = [...q.options];
                                    lines.forEach((line, li) => {
                                      if (li < 6) {
                                        if (li >= newOptions.length) newOptions.push(line);
                                        else newOptions[li] = line;
                                      }
                                    });
                                    patchQ(i, { options: newOptions });
                                    toast({ title: `✅ Đã điền ${Math.min(lines.length, 6)} đáp án` });
                                  }}
                                />
                              </div>
                            )}
                            <div className="grid sm:grid-cols-2 gap-2">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => patchQ(i, { correct_index: oi })}
                                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${q.correct_index === oi ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted-foreground/40'
                                      }`}
                                  >
                                    {String.fromCharCode(65 + oi)}
                                  </button>
                                  <Input
                                    value={opt}
                                    onChange={(e) => { const arr = [...q.options]; arr[oi] = e.target.value; patchQ(i, { options: arr }); }}
                                    onPaste={(e) => handleOptionPaste(i, oi, e)}
                                    placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                                    disabled={q.type === 'true_false'}
                                    className="h-8"
                                  />
                                  {q.type === 'multiple_choice' && q.options.length > 2 && (
                                    <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => removeOption(i, oi)}>
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {q.type === 'multiple_choice' && q.options.length < 6 && (
                                <Button type="button" variant="ghost" size="sm" className="h-8 justify-start text-muted-foreground" onClick={() => patchQ(i, { options: [...q.options, ''] })}>
                                  <Plus className="w-3.5 h-3.5 mr-1" />Thêm đáp án
                                </Button>
                              )}
                            </div>
                          </div>
                        )}

                        {q.type === 'short_answer' && (
                          <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Đáp án được chấp nhận (mỗi dòng là 1 cách viết đúng)</Label>
                            <Textarea
                              rows={2}
                              value={(q.accepted_answers || []).join('\n')}
                              onChange={(e) => patchQ(i, { accepted_answers: e.target.value.split('\n') })}
                              placeholder={'VD:\nありがとう\nArigatou'}
                            />
                          </div>
                        )}

                        {q.type === 'essay' && (
                          <p className="text-xs text-muted-foreground italic">Câu tự luận sẽ do giáo viên chấm tay sau khi học viên nộp.</p>
                        )}

                        <Input value={q.explanation || ''} onChange={(e) => patchQ(i, { explanation: e.target.value })} placeholder="Giải thích đáp án (tùy chọn)" className="h-8 text-sm" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => duplicateQuestion(i)}><Copy className="w-4 h-4" /></Button>
                        <Button type="button" size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removeQuestion(i)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="flex flex-wrap gap-2">
                {(Object.keys(questionTypeMeta) as QuestionType[]).map((t) => {
                  const Icon = questionTypeMeta[t].icon;
                  return (
                    <Button key={t} type="button" variant="outline" size="sm" onClick={() => addQuestion(t)}>
                      <Icon className="w-3.5 h-3.5 mr-1" />{questionTypeMeta[t].label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Lịch & Giao ── */}
          {step === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto">

              {/* ── Timer Mode ── */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5" />Chế độ bấm giờ
                </Label>
                <TimerModeCard value={timerMode} onChange={setTimerMode} />
                {timerMode === 'countdown' && (
                  <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
                    <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Thời gian làm bài:</span>
                      <Input
                        type="number"
                        min={1}
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                        className="w-24 h-8 font-bold"
                      />
                      <span className="text-sm text-orange-600 dark:text-orange-400">phút</span>
                    </div>
                  </div>
                )}
                {timerMode === 'stopwatch' && (
                  <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
                    <Timer className="w-4 h-4 text-blue-500 shrink-0" />
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Đồng hồ đếm lên sẽ hiển thị khi học viên làm bài. Không có giới hạn thời gian.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Thang điểm tối đa</Label>
                  <Input type="number" min={1} value={maxScore} onChange={(e) => setMaxScore(parseInt(e.target.value) || 10)} className="mt-1 font-semibold" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Điểm đạt (Passing)</Label>
                  <Input type="number" min={0} value={passingScore} onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                    ⭐ XP Thưởng bài thi
                  </Label>
                  <Input type="number" min={0} value={xpReward} onChange={(e) => setXpReward(parseInt(e.target.value) || 0)} className="mt-1 font-bold text-amber-600" />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Ngày kiểm tra *</Label>
                  <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Giờ bắt đầu</Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                    {timerMode === 'none' || timerMode === 'stopwatch' ? 'Thời lượng dự kiến (phút)' : 'Thời gian làm bài (phút)'}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                    className="mt-1"
                    disabled={timerMode === 'countdown'}
                  />
                </div>
              </div>

              {/* Score System */}
              <div className="rounded-2xl border-2 border-primary/20 bg-primary/3 p-4 space-y-4">
                <Label className="text-sm font-bold flex items-center gap-2 text-primary">🎯 Chế độ tính điểm</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => setScoreMode('scaled')}
                    className={`p-3 rounded-xl border-2 text-left space-y-1 transition-all ${scoreMode === 'scaled' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                  >
                    <p className="font-semibold text-sm">🔢 Quy đổi thang điểm (Khuyên dùng)</p>
                    <p className="text-xs text-muted-foreground">Đúng 18/25 câu → {Math.round(18/25*maxScore)}/{maxScore} điểm. So với điểm đạt {passingScore}.</p>
                  </button>
                  <button type="button" onClick={() => setScoreMode('raw')}
                    className={`p-3 rounded-xl border-2 text-left space-y-1 transition-all ${scoreMode === 'raw' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                  >
                    <p className="font-semibold text-sm">📊 Tính thẳng (raw score)</p>
                    <p className="text-xs text-muted-foreground">Đúng 18/25 câu → 18 điểm. So với điểm đạt {passingScore}.</p>
                  </button>
                </div>
                {scoreMode === 'scaled' && (
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Làm tròn điểm</Label>
                    <Select value={scoreRounding} onValueChange={(v: any) => setScoreRounding(v)}>
                      <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="round">≈ Làm tròn thường (7.5 → 8)</SelectItem>
                        <SelectItem value="floor">↓ Làm tròn xuống (7.9 → 7)</SelectItem>
                        <SelectItem value="ceil">↑ Làm tròn lên (7.1 → 8)</SelectItem>
                        <SelectItem value="none">📄 Giữ nguyên thập phân (7.2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {scorePreview && (
                  <div className={`rounded-xl p-3 border text-sm flex items-center gap-3 ${scorePreview.passed ? 'border-green-500/40 bg-green-500/5' : 'border-red-400/40 bg-red-400/5'}`}>
                    <div className="flex-1">
                      <p className="font-semibold text-xs text-muted-foreground mb-1">🔍 Ví dụ: học viên làm đúng 72% ({scorePreview.raw}/{scorePreview.total} câu)</p>
                      <p className="font-bold text-base">
                        {scoreMode === 'scaled' ? `Điểm: ${scorePreview.scaled}/${scorePreview.outOf}` : `Điểm: ${scorePreview.raw}/${scorePreview.outOf}`}
                        <span className={`ml-2 text-sm font-medium ${scorePreview.passed ? 'text-green-600' : 'text-red-500'}`}>
                          {scorePreview.passed ? '✅ Đạt' : '❌ Chưa đạt'}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">Cần đạt: {scorePreview.passing}/{scorePreview.outOf}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><CalendarClock className="w-3 h-3" />Mở vào lúc</Label>
                  <Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Để trống = mở ngay khi công bố.</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><CalendarClock className="w-3 h-3" />Đóng vào lúc</Label>
                  <Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} className="mt-1" />
                </div>
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">
                  Số lượt làm tối đa
                </Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select
                    value={maxAttempts <= 0 ? '0' : String(maxAttempts)}
                    onValueChange={(v) => setMaxAttempts(parseInt(v))}
                  >
                    <SelectTrigger className="w-48 h-9 font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 lượt làm</SelectItem>
                      <SelectItem value="2">2 lượt làm</SelectItem>
                      <SelectItem value="3">3 lượt làm</SelectItem>
                      <SelectItem value="5">5 lượt làm</SelectItem>
                      <SelectItem value="10">10 lượt làm</SelectItem>
                      <SelectItem value="0">♾️ Vô hạn (Không giới hạn)</SelectItem>
                    </SelectContent>
                  </Select>
                  {maxAttempts > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">Tùy chỉnh:</span>
                      <Input
                        type="number"
                        min={1}
                        value={maxAttempts}
                        onChange={(e) => setMaxAttempts(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 h-9"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {maxAttempts <= 0
                    ? '⚡ Học viên có thể làm lại bài kiểm tra không giới hạn số lần (Vô hạn).'
                    : `Học viên được phép nộp tối đa ${maxAttempts} lần.`}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div><p className="font-medium text-sm">Khóa nộp sau hạn</p><p className="text-xs text-muted-foreground">Tự động chặn nộp khi quá giờ kết thúc.</p></div>
                  <Switch checked={lockAfterEnd} onCheckedChange={setLockAfterEnd} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">🎲 Xáo trộn thứ tự câu hỏi (Đảo câu)</p>
                    <p className="text-xs text-muted-foreground">Mỗi học viên khi mở đề thi sẽ thấy thứ tự câu hỏi hoàn toàn ngẫu nhiên không lần nào giống lần nào.</p>
                  </div>
                  <Switch checked={shuffle} onCheckedChange={setShuffle} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">🔀 Xáo trộn thứ tự đáp án trong từng câu (Đảo đáp án)</p>
                    <p className="text-xs text-muted-foreground">Tự động xáo trộn ngẫu nhiên vị trí các lựa chọn A, B, C, D của từng câu trắc nghiệm.</p>
                  </div>
                  <Switch checked={shuffleOptions} onCheckedChange={setShuffleOptions} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm">Hiện đáp án sau khi nộp</p>
                    <p className="text-xs text-muted-foreground">Học viên có thể xem câu đúng/sai và giải thích.</p>
                  </div>
                  <Switch checked={showAnswersAfter} onCheckedChange={setShowAnswersAfter} />
                </div>
                {/* Master Anti-cheat Switch Card */}
                <div className={`p-4 rounded-2xl border-2 transition-all duration-300 ${antiCheat ? 'bg-gradient-to-br from-red-500/10 via-amber-500/5 to-rose-500/10 border-red-500/40 shadow-md ring-2 ring-red-500/20' : 'bg-card border-border hover:border-muted-foreground/30'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shadow-sm transition-colors ${antiCheat ? 'bg-red-500 text-white ring-4 ring-red-500/20' : 'bg-muted text-muted-foreground'}`}>
                        🛡️
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-sm text-foreground">Phần Mềm Chống Gian Lận (Anti-Cheat 3.0)</p>
                          <Badge variant={antiCheat ? 'default' : 'outline'} className={antiCheat ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]' : 'text-muted-foreground text-[10px]'}>
                            {antiCheat ? '🟢 ĐANG BẬT' : '⚪ ĐANG TẮT'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {antiCheat
                            ? 'Giám sát chuyển tab thông minh (Grace period 1.5s - Chống báo nhầm).'
                            : 'Tắt chống gian lận — học viên làm bài thoải mái không bị giới hạn.'}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={antiCheat}
                      onCheckedChange={setAntiCheat}
                      className="data-[state=checked]:bg-red-500"
                    />
                  </div>

                  {antiCheat && (
                    <div className="mt-3 space-y-3 bg-background/80 backdrop-blur border border-red-500/30 rounded-xl p-3.5 shadow-inner">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                          ⚡ Chế độ xử lý phạt khi vi phạm:
                        </Label>
                        <Select value={antiCheatPenalty} onValueChange={(v: any) => setAntiCheatPenalty(v)}>
                          <SelectTrigger className="h-9 bg-card font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="warn_only">⚠️ Chỉ cảnh báo (không trừ điểm, không nộp bài)</SelectItem>
                            <SelectItem value="auto_submit">🚫 Tự nộp bài sau N lần vi phạm</SelectItem>
                            <SelectItem value="reset_answers">🔄 Xóa hết câu trả lời — làm lại từ đầu</SelectItem>
                            <SelectItem value="deduct_points">➖ Trừ điểm mỗi lần vi phạm</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {antiCheatPenalty !== 'warn_only' && (
                        <div className="flex items-center gap-3 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400 flex-1">
                            {antiCheatPenalty === 'deduct_points' ? 'Nộp bài tự động sau' : 'Áp dụng hình phạt sau'}
                          </p>
                          <Input
                            type="number" min={1} max={20}
                            value={antiCheatMaxViolations}
                            onChange={(e) => setAntiCheatMaxViolations(Math.max(1, parseInt(e.target.value) || 3))}
                            className="w-20 h-8 font-bold text-center"
                          />
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400">lần vi phạm</p>
                        </div>
                      )}

                      {antiCheatPenalty === 'deduct_points' && (
                        <div className="flex items-center gap-3 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400 flex-1">Số điểm trừ mỗi lần chuyển tab &gt; 1.5s</p>
                          <Input
                            type="number" min={1} max={50}
                            value={antiCheatDeductPerViolation}
                            onChange={(e) => setAntiCheatDeductPerViolation(Math.max(1, parseInt(e.target.value) || 5))}
                            className="w-20 h-8 font-bold text-center"
                          />
                          <p className="text-xs font-semibold text-red-700 dark:text-red-400">điểm</p>
                        </div>
                      )}

                      <p className="text-[11px] text-muted-foreground italic bg-muted/40 p-2 rounded-lg">
                        {antiCheatPenalty === 'warn_only' && '💡 Học viên chỉ nhìn thấy thông báo cảnh báo, hệ thống không tự nộp hay trừ điểm.'}
                        {antiCheatPenalty === 'auto_submit' && `💡 Khi chuyển tab quá 1.5s tới ${antiCheatMaxViolations} lần → bài thi sẽ tự nộp.`}
                        {antiCheatPenalty === 'reset_answers' && `💡 Khi vi phạm tới ${antiCheatMaxViolations} lần → toàn bộ câu trả lời sẽ bị xóa để làm lại.`}
                        {antiCheatPenalty === 'deduct_points' && `💡 Mỗi lần vi phạm trừ ${antiCheatDeductPerViolation} điểm. Tối đa ${antiCheatMaxViolations} lần sẽ tự động nộp.`}
                      </p>
                    </div>
                  )}
                </div>

                {/* Advanced AI Proctoring */}
                <div className="flex items-center justify-between rounded-lg border p-3 border-indigo-500/30 bg-indigo-500/5">
                  <div>
                    <p className="font-medium text-sm flex items-center gap-1.5 text-indigo-700 dark:text-indigo-400">
                      <Camera className="w-4 h-4" /> 🤖 AI Giám sát chuyên sâu (Camera Vision)
                    </p>
                    <p className="text-xs text-muted-foreground">Quét ánh mắt, cử chỉ/ngoảnh đầu, vắng mặt & phát hiện 2 màn hình qua WebCam.</p>
                  </div>
                  <Switch checked={aiProctoring} onCheckedChange={setAiProctoring} />
                </div>
                {aiProctoring && (
                  <div className="ml-4 space-y-3 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 text-xs">
                    <p className="font-semibold text-indigo-700 dark:text-indigo-400">🔍 Chọn các chế độ AI quét lỗi gian lận:</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border bg-background hover:border-indigo-400">
                        <Checkbox
                          checked={proctoringConfig.detect_gaze}
                          onCheckedChange={(v) => setProctoringConfig(c => ({ ...c, detect_gaze: !!v }))}
                        />
                        <div>
                          <p className="font-semibold text-foreground">👁️ Quét đôi mắt (Gaze)</p>
                          <p className="text-[11px] text-muted-foreground">Bắt lỗi nhìn nghiêng/ra ngoài quá 3s</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border bg-background hover:border-indigo-400">
                        <Checkbox
                          checked={proctoringConfig.detect_head}
                          onCheckedChange={(v) => setProctoringConfig(c => ({ ...c, detect_head: !!v }))}
                        />
                        <div>
                          <p className="font-semibold text-foreground">🗣️ Cử chỉ & Xoay đầu</p>
                          <p className="text-[11px] text-muted-foreground">Cảnh báo khi quay mặt, cúi đầu</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border bg-background hover:border-indigo-400">
                        <Checkbox
                          checked={proctoringConfig.detect_multi_face}
                          onCheckedChange={(v) => setProctoringConfig(c => ({ ...c, detect_multi_face: !!v }))}
                        />
                        <div>
                          <p className="font-semibold text-foreground">👥 Vắng mặt / Nhiều người</p>
                          <p className="text-[11px] text-muted-foreground">Bắt lỗi rời vị trí hoặc có người thứ 2</p>
                        </div>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg border bg-background hover:border-indigo-400">
                        <Checkbox
                          checked={proctoringConfig.detect_dual_monitor}
                          onCheckedChange={(v) => setProctoringConfig(c => ({ ...c, detect_dual_monitor: !!v }))}
                        />
                        <div>
                          <p className="font-semibold text-foreground">💻 Màn hình kép & Focus</p>
                          <p className="text-[11px] text-muted-foreground">Bắt lỗi cắm 2 màn hình hoặc mất focus</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between rounded-lg border p-3 border-primary/30 bg-primary/5">
                  <div><p className="font-medium text-sm">Công bố ngay</p><p className="text-xs text-muted-foreground">Học viên có thể vào làm bài.</p></div>
                  <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label className="text-sm font-semibold flex items-center gap-2"><Users className="w-4 h-4" />Giao cho lớp</Label>
                <Select value={primaryClass} onValueChange={setPrimaryClass}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả học viên (không gán lớp)</SelectItem>
                    {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {!isEdit && classes.length > 0 && (
                  <div className="rounded-lg border p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">Giao đồng thời cho các lớp khác (tạo bản sao riêng cho mỗi lớp):</p>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {classes.filter((c) => c.id !== primaryClass).map((c) => (
                        <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <Checkbox
                            checked={extraClassIds.includes(c.id)}
                            onCheckedChange={(v) => setExtraClassIds((ids) => v ? [...ids, c.id] : ids.filter((x) => x !== c.id))}
                          />
                          {c.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {isEdit && <p className="text-xs text-muted-foreground">Chỉnh sửa chỉ áp dụng cho bài kiểm tra hiện tại.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex items-center justify-between gap-2 bg-muted/30">
          <Button type="button" variant="ghost" onClick={() => (step > 1 ? setStep(step - 1) : onOpenChange(false))}>
            {step > 1 ? <><ArrowLeft className="w-4 h-4 mr-1" />Quay lại</> : 'Hủy'}
          </Button>
          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button type="button" onClick={handleNextStep}>
                Tiếp tục<ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                {isEdit ? 'Lưu thay đổi' : 'Tạo bài kiểm tra'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamBuilder;
