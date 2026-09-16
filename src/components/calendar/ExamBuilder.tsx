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
  Save, AlertTriangle, Maximize2, Minimize2, Image, BookOpen, ChevronDown, ChevronUp,
  Layers, CheckSquare, Hash, CornerDownRight, Sliders
} from 'lucide-react';
import FormattedText from '@/components/shared/FormattedText';
import MediaUploader from '@/components/shared/MediaUploader';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'speaking' | 'roleplay';
export type TimerMode = 'none' | 'stopwatch' | 'countdown';
export type ExamCategory = 'written' | 'speaking_meeting' | 'speaking_ai';

export interface SubQuestion {
  id?: string;
  _key?: string;
  type?: QuestionType;
  text: string;
  options: string[];
  correct_index: number;
  accepted_answers?: string[];
  explanation?: string;
  points?: number;
}

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
  audio_play_limit?: number;
  image_url?: string;
  is_passage?: boolean;
  passage_title?: string;
  sub_questions?: SubQuestion[];
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

const emptyPassageQuestion = (): ExamQuestion => {
  const _key = generateKey();
  return {
    _key,
    type: 'multiple_choice',
    is_passage: true,
    passage_title: 'Bài đọc hiểu',
    text: '',
    options: [],
    correct_index: 0,
    points: 0,
    sub_questions: [
      {
        id: generateKey(),
        type: 'multiple_choice',
        text: 'Câu hỏi 1:',
        options: ['', '', '', ''],
        correct_index: 0,
        points: 2,
        explanation: '',
      },
      {
        id: generateKey(),
        type: 'multiple_choice',
        text: 'Câu hỏi 2:',
        options: ['', '', '', ''],
        correct_index: 0,
        points: 2,
        explanation: '',
      },
    ],
  };
};

const normalizeQuestion = (q: any): ExamQuestion => {
  const is_passage = Boolean(q?.is_passage);
  const type: QuestionType = q?.type || 'multiple_choice';

  if (is_passage) {
    const rawSubs: any[] = Array.isArray(q?.sub_questions) ? q.sub_questions : [];
    const sub_questions: SubQuestion[] = rawSubs.map((sq: any, sidx: number) => {
      let opts: string[] = Array.isArray(sq?.options) ? [...sq.options] : ['', '', '', ''];
      if (opts.length < 2) opts = ['', '', '', ''];
      let cIdx = typeof sq?.correct_index === 'number' ? sq.correct_index : 0;
      if (typeof sq?.correct_answer === 'number') {
        cIdx = sq.correct_answer;
      } else if (typeof sq?.correct_answer === 'string') {
        const letter = sq.correct_answer.toUpperCase().trim();
        if (['A', 'B', 'C', 'D', 'E', 'F'].includes(letter)) {
          cIdx = letter.charCodeAt(0) - 65;
        }
      }
      cIdx = Math.max(0, Math.min(cIdx, Math.max(0, opts.length - 1)));
      return {
        id: sq?.id || generateKey(),
        type: sq?.type || 'multiple_choice',
        text: sq?.text || `Câu hỏi ${sidx + 1}:`,
        options: opts,
        correct_index: cIdx,
        accepted_answers: Array.isArray(sq?.accepted_answers) ? sq.accepted_answers : undefined,
        points: typeof sq?.points === 'number' ? sq.points : 2,
        explanation: sq?.explanation || '',
      };
    });

    return {
      _key: q?._key || generateKey(),
      type: 'multiple_choice',
      is_passage: true,
      passage_title: q?.passage_title || q?.title || 'Bài đọc hiểu',
      text: q?.text || q?.passage || '',
      options: [],
      correct_index: 0,
      points: typeof q?.points === 'number' ? q.points : 0,
      audio_url: q?.audio_url || undefined,
      audio_play_limit: typeof q?.audio_play_limit === 'number' ? q.audio_play_limit : undefined,
      image_url: q?.image_url || undefined,
      sub_questions,
    };
  }

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
    audio_play_limit: typeof q?.audio_play_limit === 'number' ? q.audio_play_limit : undefined,
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
  audioPlayLimit?: number;
  onChange: (url: string | undefined, limit: number | undefined) => void;
  onClose?: () => void;
}
const AudioUpload = ({ audioUrl, audioPlayLimit, onChange, onClose }: AudioUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [linkInput, setLinkInput] = useState(audioUrl || "");
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
      onChange(data.publicUrl, audioPlayLimit);
      setLinkInput(data.publicUrl);
      toast({ title: '✅ Đã tải lên file âm thanh' });
    } catch (e: any) {
      toast({ title: 'Lỗi upload audio', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 bg-muted/20 p-2.5 rounded-xl border border-border/80">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Music className="w-3.5 h-3.5 text-emerald-500" /> File nghe Audio (Tải lên MP3/WAV hoặc dán URL)
        </Label>
        {onClose && (
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground text-xs p-0.5 rounded" title="Đóng ô tải Audio">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          ref={inputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
        />
        {audioUrl ? (
          <div className="flex flex-col gap-2 flex-1 w-full sm:w-auto">
            <div className="flex items-center gap-2 min-w-0 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2">
              <Volume2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <audio controls src={audioUrl} className="h-8 flex-1 min-w-0" style={{ maxWidth: '100%' }} />
              <button
                type="button"
                onClick={() => { onChange(undefined, undefined); setLinkInput(''); }}
                className="text-muted-foreground hover:text-destructive shrink-0"
                title="Xóa audio"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground whitespace-nowrap">Giới hạn số lần nghe:</Label>
              <Input
                type="number"
                min={1}
                placeholder="Vô hạn (để trống)"
                className="h-8 text-xs w-36 bg-background"
                value={audioPlayLimit || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : undefined;
                  onChange(audioUrl, val);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs border-dashed shrink-0"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {uploading ? 'Đang tải...' : 'Upload Audio 🎵'}
            </Button>
            <div className="text-xs text-muted-foreground font-medium shrink-0">hoặc</div>
            <Input
              placeholder="Dán link audio (https://...)"
              className="h-8 text-xs flex-1 bg-background"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
              onBlur={() => {
                if (linkInput && linkInput.trim() !== audioUrl) {
                  onChange(linkInput.trim());
                } else if (!linkInput.trim() && audioUrl) {
                  onChange(undefined);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (linkInput && linkInput.trim() !== audioUrl) {
                    onChange(linkInput.trim());
                  }
                }
              }}
            />
          </div>
        )}
      </div>
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

  // State for collapsible cards and media toggles
  const [openAudio, setOpenAudio] = useState<Record<number, boolean>>({});
  const [openImage, setOpenImage] = useState<Record<number, boolean>>({});
  const [openExplanation, setOpenExplanation] = useState<Record<number, boolean>>({});
  const [collapsedCards, setCollapsedCards] = useState<Record<number, boolean>>({});
  const [bulkPointsInput, setBulkPointsInput] = useState<number>(2);
  const [showBulkPointsPopover, setShowBulkPointsPopover] = useState(false);

  const totalPoints = useMemo(() => questions.reduce((s, q) => {
    if (q.is_passage && Array.isArray(q.sub_questions)) {
      return s + q.sub_questions.reduce((subSum, sq) => subSum + (sq.points ?? 0), 0);
    }
    return s + (q.points || 0);
  }, 0), [questions]);

  const totalQuestionsCount = useMemo(() => questions.reduce((s, q) => {
    if (q.is_passage && Array.isArray(q.sub_questions)) {
      return s + q.sub_questions.length;
    }
    return s + 1;
  }, 0), [questions]);

  const autoGraded = useMemo(() => questions.reduce((s, q) => {
    if (q.is_passage && Array.isArray(q.sub_questions)) {
      return s + q.sub_questions.length;
    }
    return s + (questionTypeMeta[q.type]?.auto ? 1 : 0);
  }, 0), [questions]);

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
  const addPassageQuestion = () => setQuestions((a) => [...a, emptyPassageQuestion()]);

  const addSubQuestion = (qIndex: number) => {
    setQuestions((arr) =>
      arr.map((q, idx) => {
        if (idx !== qIndex) return q;
        const subs = q.sub_questions || [];
        const newSub: SubQuestion = {
          id: generateKey(),
          type: 'multiple_choice',
          text: `Câu hỏi ${subs.length + 1}:`,
          options: ['', '', '', ''],
          correct_index: 0,
          points: 2,
          explanation: '',
        };
        return { ...q, sub_questions: [...subs, newSub] };
      })
    );
  };

  const removeSubQuestion = (qIndex: number, subIndex: number) => {
    setQuestions((arr) =>
      arr.map((q, idx) => {
        if (idx !== qIndex || !q.sub_questions) return q;
        return { ...q, sub_questions: q.sub_questions.filter((_, sidx) => sidx !== subIndex) };
      })
    );
  };

  const patchSubQ = (qIndex: number, subIndex: number, patch: Partial<SubQuestion>) => {
    setQuestions((arr) =>
      arr.map((q, idx) => {
        if (idx !== qIndex || !q.sub_questions) return q;
        const sub_questions = q.sub_questions.map((sq, sidx) => (sidx === subIndex ? { ...sq, ...patch } : sq));
        return { ...q, sub_questions };
      })
    );
  };

  const removeQuestion = (i: number) => setQuestions((a) => a.filter((_, idx) => idx !== i));
  const duplicateQuestion = (i: number) =>
    setQuestions((a) => [
      ...a.slice(0, i + 1),
      {
        ...a[i],
        _key: generateKey(),
        options: [...a[i].options],
        sub_questions: a[i].sub_questions
          ? a[i].sub_questions.map((sq) => ({ ...sq, id: generateKey(), options: [...sq.options] }))
          : undefined,
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

  const removeSubOption = (qIndex: number, subIndex: number, optIndex: number) => {
    setQuestions((arr) =>
      arr.map((q, idx) => {
        if (idx !== qIndex || !q.sub_questions) return q;
        const targetSub = q.sub_questions[subIndex];
        if (!targetSub) return q;
        const newOptions = targetSub.options.filter((_, x) => x !== optIndex);
        let newCorrect = targetSub.correct_index;
        if (optIndex < targetSub.correct_index) {
          newCorrect = Math.max(0, targetSub.correct_index - 1);
        } else if (optIndex === targetSub.correct_index) {
          newCorrect = Math.min(targetSub.correct_index, newOptions.length - 1);
        }
        const sub_questions = q.sub_questions.map((sq, sidx) =>
          sidx === subIndex ? { ...sq, options: newOptions, correct_index: Math.max(0, newCorrect) } : sq
        );
        return { ...q, sub_questions };
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

  const handleSubOptionPaste = useCallback(
    (qIndex: number, subIndex: number, optStartIndex: number, e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData?.getData('text') || '';
      const lines = parsePasteLines(text);
      if (lines.length < 2) return;
      e.preventDefault();
      setQuestions((arr) =>
        arr.map((q, idx) => {
          if (idx !== qIndex || !q.sub_questions) return q;
          const targetSub = q.sub_questions[subIndex];
          if (!targetSub) return q;
          const newOptions = [...targetSub.options];
          lines.forEach((line, li) => {
            const targetIdx = optStartIndex + li;
            if (targetIdx < 6) {
              if (targetIdx >= newOptions.length) newOptions.push(line);
              else newOptions[targetIdx] = line;
            }
          });
          const sub_questions = q.sub_questions.map((sq, sidx) =>
            sidx === subIndex ? { ...sq, options: newOptions } : sq
          );
          return { ...q, sub_questions };
        })
      );
      toast({
        title: `✅ Đã điền ${lines.length} đáp án cho câu hỏi con`,
        description: 'Paste thông minh từ clipboard',
      });
    },
    [toast]
  );

  const applyBulkPoints = (pts: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.is_passage && q.sub_questions) {
          return {
            ...q,
            sub_questions: q.sub_questions.map((sq) => ({ ...sq, points: pts })),
          };
        }
        return { ...q, points: pts };
      })
    );
    setShowBulkPointsPopover(false);
    toast({ title: `✅ Đã gán ${pts} điểm cho toàn bộ câu hỏi` });
  };

  const toggleCollapseAll = () => {
    const allCollapsed = questions.length > 0 && questions.every((_, i) => collapsedCards[i]);
    if (allCollapsed) {
      setCollapsedCards({});
    } else {
      const next: Record<number, boolean> = {};
      questions.forEach((_, i) => {
        next[i] = true;
      });
      setCollapsedCards(next);
    }
  };

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
    if (!examDate || !examDate.trim()) return 'Vui lòng chọn ngày kiểm tra';
    return null;
  };

  const validateQuestions = () => {
    if (questions.length === 0) return 'Vui lòng thêm ít nhất 1 câu hỏi';
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (q.is_passage) {
        if (!q.text.trim()) {
          return `Bài đọc ${i + 1}: Vui lòng nhập nội dung đoạn văn`;
        }
        if (!q.sub_questions || q.sub_questions.length === 0) {
          return `Bài đọc ${i + 1}: Cần ít nhất 1 câu hỏi con`;
        }
        for (let s = 0; s < q.sub_questions.length; s++) {
          const sq = q.sub_questions[s];
          if (!sq.text.trim()) {
            return `Bài đọc ${i + 1}, câu con ${s + 1}: Vui lòng nhập nội dung câu hỏi`;
          }
          const validOpts = (sq.options || []).filter((o) => o.trim().length > 0);
          if (validOpts.length < 2) {
            return `Bài đọc ${i + 1}, câu con ${s + 1}: Cần ít nhất 2 đáp án không để trống`;
          }
        }
        continue;
      }

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
    const cleanQuestions = questions.map(({ _key, ...q }) => {
      if (q.is_passage && Array.isArray(q.sub_questions)) {
        const totalSubPts = q.sub_questions.reduce((sum, sq) => sum + (sq.points || 0), 0);
        return {
          ...q,
          points: totalSubPts,
          sub_questions: q.sub_questions.map((sq) => {
            const { _key: _, ...cleanSq } = sq as any;
            return cleanSq;
          }),
        };
      }
      return q;
    });

    const base: any = {
      title: (title || titleVi).trim(),
      title_vi: (titleVi || title).trim(),
      description: descriptionVi || null,
      description_vi: descriptionVi || null,
      instructions: instructions || null,
      video_url: videoUrl || thumbnailUrl || null,
      meet_link: meetLink || null,
      exam_type: examType,
      exam_category: examCategory || 'written',
      exam_date: examDate ? String(examDate) : new Date().toISOString().slice(0, 10),
      start_time: startTime || '09:00',
      duration_minutes: duration || 60,
      timer_mode: timerMode,
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
            : 'w-full sm:max-w-4xl sm:w-[calc(100vw-2rem)] h-[100dvh] sm:h-[92dvh] sm:max-h-[92dvh] rounded-none sm:rounded-2xl border-0 sm:border'
        }`}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => { e.preventDefault(); handleCloseAttempt(); }}
      >
        {/* Draft restore banner */}
        {draftRestorePrompt && (
          <div className="flex items-center gap-3 px-4 sm:px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/30 text-sm">
            <Save className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="flex-1 text-amber-700 dark:text-amber-400 font-medium text-xs sm:text-sm">📝 Tìm thấy bản nháp chưa lưu. Khôi phục?</span>
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
        <DialogHeader className="px-3 sm:px-6 py-3 sm:py-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent space-y-2.5 sm:space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <ListChecks className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="truncate">{isEdit ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}</span>
            </DialogTitle>
            <div className="flex items-center gap-1 shrink-0">
              {/* Autosave indicator */}
              <span className="text-[10px] text-muted-foreground hidden sm:flex items-center gap-1 mr-2">
                <Save className="w-3 h-3" /> Tự động lưu
              </span>
              {/* Fullscreen toggle */}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsFullscreen(f => !f)} title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}>
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              {/* Close button with confirmation */}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCloseAttempt}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((s, i) => {
              const Icon = s.icon;
              const active = step === s.id;
              const done = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-1 sm:gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setStep(s.id)}
                    className={`flex items-center justify-center gap-1 sm:gap-2 w-full px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${active ? 'bg-primary text-primary-foreground shadow-md'
                        : done ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                      }`}
                  >
                    {done ? <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> : <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
                    <span className="text-[11px] sm:text-sm">{s.id}. <span className="hidden sm:inline">{s.label}</span></span>
                  </button>
                  {i < steps.length - 1 && <div className={`w-3 sm:flex-1 h-0.5 shrink-0 ${done ? 'bg-primary/40' : 'bg-muted'}`} />}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-6">
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                  {([
                    { v: 'quiz', label: 'Quiz' },
                    { v: 'midterm', label: 'Giữa kỳ' },
                    { v: 'final', label: 'Cuối kỳ' },
                    { v: 'placement', label: 'Xếp lớp' },
                  ] as const).map((o) => (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => {
                        setExamType(o.v);
                        if (o.v === 'quiz') setMaxAttempts(0);
                        else setMaxAttempts(1);
                      }}
                      className={`p-2.5 sm:p-3 rounded-xl border-2 text-xs sm:text-sm font-medium transition-all text-center ${examType === o.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
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
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* Toolbar & Stats Bar */}
              <div className="sticky -top-3.5 sm:-top-6 bg-background/95 backdrop-blur py-2 sm:py-2.5 z-20 border-b space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm shrink-0">
                    <Badge variant="outline" className="gap-1 font-semibold text-[11px] sm:text-xs">
                      <ListChecks className="w-3.5 h-3.5 text-primary" />
                      {totalQuestionsCount} câu ({questions.length} mục)
                    </Badge>
                    <Badge variant="secondary" className="font-bold text-primary text-[11px] sm:text-xs">
                      {totalPoints} điểm
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden md:inline">
                      {autoGraded} tự chấm • {totalQuestionsCount - autoGraded} chấm tay
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {/* Bulk points popover */}
                    <Popover open={showBulkPointsPopover} onOpenChange={setShowBulkPointsPopover}>
                      <PopoverTrigger asChild>
                        <Button type="button" variant="outline" size="sm" className="h-7 sm:h-8 gap-1 text-[11px] sm:text-xs shrink-0">
                          <Sliders className="w-3.5 h-3.5 text-blue-500" />
                          <span>Đặt điểm</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3 space-y-2.5" align="end">
                        <p className="font-bold text-xs">Đặt điểm đồng bộ cho tất cả câu</p>
                        <p className="text-[11px] text-muted-foreground">Áp dụng cho mọi câu hỏi và câu con trong đề.</p>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={1}
                            value={bulkPointsInput}
                            onChange={(e) => setBulkPointsInput(parseInt(e.target.value) || 1)}
                            className="h-8 text-xs font-bold w-20"
                          />
                          <Button
                            type="button"
                            size="sm"
                            className="h-8 text-xs flex-1"
                            onClick={() => applyBulkPoints(bulkPointsInput)}
                          >
                            Áp dụng
                          </Button>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 5, 10].map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => applyBulkPoints(p)}
                              className="px-2 py-0.5 text-[11px] font-semibold rounded bg-muted hover:bg-primary/20 border"
                            >
                              {p}đ
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Collapse / Expand all */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={toggleCollapseAll}
                      className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 shrink-0"
                      title="Thu gọn hoặc mở rộng toàn bộ"
                    >
                      {questions.length > 0 && questions.every((_, idx) => collapsedCards[idx]) ? (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" /> Mở rộng
                        </>
                      ) : (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" /> Thu gọn
                        </>
                      )}
                    </Button>

                    {/* AI Generator */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => runAI('exam_questions', { count: 5 })}
                      disabled={!!aiLoading}
                      className="h-7 sm:h-8 gap-1 text-[11px] sm:text-xs border-primary/40 text-primary hover:bg-primary/10 shrink-0"
                    >
                      {aiLoading === 'exam_questions' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Mini-map / Quick Navigation Bar */}
                {questions.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                    <span className="text-[11px] font-bold text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-primary" /> Bản đồ câu:
                    </span>
                    {questions.map((q, idx) => {
                      const isPassage = !!q.is_passage;
                      const subCount = q.sub_questions?.length || 0;
                      const isFilled = isPassage ? (q.text.trim().length > 0 && subCount > 0) : q.text.trim().length > 0;
                      return (
                        <button
                          key={q._key || idx}
                          type="button"
                          onClick={() => {
                            const el = document.getElementById(`exam-card-${idx}`);
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }}
                          className={`px-2.5 py-0.5 rounded-md text-xs font-semibold shrink-0 transition-all flex items-center gap-1 border ${
                            isPassage
                              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/40 hover:bg-purple-500/20'
                              : isFilled
                                ? 'bg-muted/80 text-foreground border-border hover:border-primary/50'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40'
                          }`}
                          title={isPassage ? `Bài đọc ${idx + 1} (${subCount} câu con)` : `Câu ${idx + 1}`}
                        >
                          {isPassage ? (
                            <>
                              <BookOpen className="w-3 h-3" />
                              <span>Đọc {idx + 1} ({subCount}c)</span>
                            </>
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                          {!isFilled && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {questions.length === 0 && (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl p-6 bg-muted/10 space-y-3">
                  <ListChecks className="w-12 h-12 mx-auto text-muted-foreground/40" />
                  <p className="font-semibold text-foreground text-base">Chưa có câu hỏi nào trong đề.</p>
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Thêm câu trắc nghiệm đơn lẻ hoặc thêm Chùm bài đọc hiểu (Đoạn văn kèm nhiều câu con) bằng các nút bên dưới.
                  </p>
                  <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                    <Button type="button" size="sm" onClick={() => addQuestion('multiple_choice')}>
                      <Plus className="w-3.5 h-3.5 mr-1" /> Thêm câu trắc nghiệm
                    </Button>
                    <Button type="button" size="sm" variant="default" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={addPassageQuestion}>
                      <BookOpen className="w-3.5 h-3.5 mr-1.5" /> + Chùm bài Đọc hiểu (Passage)
                    </Button>
                  </div>
                </div>
              )}

              {/* Question list */}
              {questions.map((q, i) => {
                const isCollapsed = !!collapsedCards[i];

                // ── CASE A: PASSAGE GROUP QUESTION ────────────────────────────
                if (q.is_passage) {
                  const subCount = q.sub_questions?.length || 0;
                  const passagePoints = (q.sub_questions || []).reduce((s, sq) => s + (sq.points || 0), 0);

                  return (
                    <div
                      key={q._key || i}
                      id={`exam-card-${i}`}
                      className="rounded-2xl border-2 border-purple-500/40 bg-gradient-to-b from-purple-500/[0.04] to-card p-4 md:p-5 space-y-4 shadow-sm"
                    >
                      {/* Passage Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-purple-500/20 pb-2.5">
                        <div className="flex items-center justify-between sm:justify-start gap-2 flex-wrap w-full sm:w-auto">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <button
                              type="button"
                              className="hover:text-foreground disabled:opacity-30 p-1"
                              onClick={() => moveQuestion(i, -1)}
                              disabled={i === 0}
                              title="Di chuyển lên"
                            >
                              <GripVertical className="w-4 h-4" />
                            </button>
                            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center justify-center shadow-sm shrink-0">
                              {i + 1}
                            </span>
                          </div>

                          <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1 text-xs">
                            <BookOpen className="w-3 h-3" /> Đọc / Nghe Hiểu
                          </Badge>

                          <Badge variant="outline" className="border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs">
                            {subCount} câu con
                          </Badge>

                          <Badge variant="secondary" className="font-bold text-xs">
                            {passagePoints}đ
                          </Badge>

                          {/* Action buttons on mobile inline */}
                          <div className="flex sm:hidden items-center gap-0.5 ml-auto">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() => setCollapsedCards((p) => ({ ...p, [i]: !p[i] }))}
                              title={isCollapsed ? 'Mở rộng bài đọc' : 'Thu gọn bài đọc'}
                            >
                              {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => duplicateQuestion(i)}
                              title="Nhân bản bài đọc này"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive"
                              onClick={() => removeQuestion(i)}
                              title="Xóa bài đọc này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Desktop Action buttons */}
                        <div className="hidden sm:flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => setCollapsedCards((p) => ({ ...p, [i]: !p[i] }))}
                            title={isCollapsed ? 'Mở rộng bài đọc' : 'Thu gọn bài đọc'}
                          >
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => duplicateQuestion(i)}
                            title="Nhân bản bài đọc này"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeQuestion(i)}
                            title="Xóa bài đọc này"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Collapsed summary */}
                      {isCollapsed ? (
                        <div className="text-xs text-muted-foreground py-1 flex items-center justify-between cursor-pointer" onClick={() => setCollapsedCards((p) => ({ ...p, [i]: false }))}>
                          <span className="font-medium truncate max-w-xl">
                            {q.passage_title ? `[${q.passage_title}] ` : ''}
                            {q.text ? q.text.slice(0, 100) + '...' : 'Đoạn văn đọc hiểu chưa nhập nội dung'}
                          </span>
                          <span className="text-primary font-medium shrink-0 ml-2">Mở chi tiết &gt;</span>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Passage Title */}
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Tiêu đề bài đọc (tùy chọn)
                            </Label>
                            <Input
                              value={q.passage_title || ''}
                              onChange={(e) => patchQ(i, { passage_title: e.target.value })}
                              placeholder="VD: Đoạn văn 1 - Đọc hiểu trung văn N4 (Văn hóa trà đạo), Hội thoại Kaiwa..."
                              className="mt-1 font-semibold text-sm bg-background"
                            />
                          </div>

                          {/* Passage Body */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                                Nội dung đoạn văn đọc hiểu *
                              </Label>
                              <div className="flex items-center gap-1 text-xs">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const target = e.currentTarget.closest('.space-y-1\\.5')?.querySelector('textarea') as HTMLTextAreaElement;
                                    if (target) {
                                      const start = target.selectionStart;
                                      const end = target.selectionEnd;
                                      const val = target.value;
                                      const sel = val.substring(start, end);
                                      const newText = sel ? val.substring(0, start) + `**${sel}**` + val.substring(end) : val + ' **chữ đậm**';
                                      patchQ(i, { text: newText });
                                    }
                                  }}
                                  className="px-2 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground font-bold border border-border text-[11px]"
                                  title="In đậm văn bản"
                                >
                                  B
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    const target = e.currentTarget.closest('.space-y-1\\.5')?.querySelector('textarea') as HTMLTextAreaElement;
                                    if (target) {
                                      const start = target.selectionStart;
                                      const end = target.selectionEnd;
                                      const val = target.value;
                                      const sel = val.substring(start, end);
                                      const newText = sel ? val.substring(0, start) + `*${sel}*` + val.substring(end) : val + ' *chữ nghiêng*';
                                      patchQ(i, { text: newText });
                                    }
                                  }}
                                  className="px-2 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground italic border border-border text-[11px]"
                                  title="In nghiêng văn bản"
                                >
                                  I
                                </button>
                              </div>
                            </div>
                            <Textarea
                              value={q.text}
                              onChange={(e) => patchQ(i, { text: e.target.value })}
                              rows={5}
                              placeholder="Dán hoặc soạn nội dung đoạn văn đọc hiểu tại đây... (Hỗ trợ **in đậm**, *in nghiêng*, chữ Kanji/Furigana)"
                              className="font-medium bg-background"
                            />
                            {q.text && (q.text.includes('*') || q.text.includes('<')) && (
                              <div className="text-xs bg-muted/40 p-3 rounded-xl border text-muted-foreground">
                                <span className="font-semibold text-foreground">Xem trước đoạn văn: </span>
                                <div className="mt-1 text-foreground leading-relaxed whitespace-pre-wrap">
                                  <FormattedText text={q.text} />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Media chips for passage */}
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-xs text-muted-foreground font-semibold">Tùy chọn đính kèm:</span>
                            {/* Audio toggle */}
                            {q.audio_url ? (
                              <Badge
                                variant="outline"
                                className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-xs cursor-pointer"
                                onClick={() => setOpenAudio((p) => ({ ...p, [i]: !p[i] }))}
                              >
                                <Music className="w-3 h-3" /> Đã có Audio bài đọc
                              </Badge>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2.5 text-xs gap-1 border border-dashed rounded-lg ${
                                  openAudio[i]
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                                onClick={() => setOpenAudio((p) => ({ ...p, [i]: !p[i] }))}
                              >
                                <Music className="w-3 h-3 text-emerald-500" />
                                {openAudio[i] ? 'Đóng ô Audio' : '+ Audio bài đọc'}
                              </Button>
                            )}

                            {/* Image toggle */}
                            {q.image_url ? (
                              <Badge
                                variant="outline"
                                className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 text-xs cursor-pointer"
                                onClick={() => setOpenImage((p) => ({ ...p, [i]: !p[i] }))}
                              >
                                <Image className="w-3 h-3" /> Đã có Ảnh / Biểu đồ
                              </Badge>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={`h-7 px-2.5 text-xs gap-1 border border-dashed rounded-lg ${
                                  openImage[i]
                                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/40'
                                    : 'text-muted-foreground hover:text-foreground'
                                }`}
                                onClick={() => setOpenImage((p) => ({ ...p, [i]: !p[i] }))}
                              >
                                <Image className="w-3 h-3 text-blue-500" />
                                {openImage[i] ? 'Đóng ô Ảnh' : '+ Ảnh / Biểu đồ bài đọc'}
                              </Button>
                            )}
                          </div>

                          {/* Expandable Audio for passage */}
                          {(q.audio_url || openAudio[i]) && (
                            <AudioUpload
                              audioUrl={q.audio_url}
                              onChange={(url) => patchQ(i, { audio_url: url || undefined })}
                              onClose={() => setOpenAudio((p) => ({ ...p, [i]: false }))}
                            />
                          )}

                          {/* Expandable Image for passage */}
                          {(q.image_url || openImage[i]) && (
                            <div className="space-y-1.5 bg-muted/20 p-2.5 rounded-xl border border-border/80">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                  <Image className="w-3.5 h-3.5 text-blue-500" /> Ảnh / Biểu đồ minh họa bài đọc
                                </Label>
                                <button
                                  type="button"
                                  onClick={() => setOpenImage((p) => ({ ...p, [i]: false }))}
                                  className="text-muted-foreground hover:text-foreground text-xs p-0.5 rounded"
                                  title="Đóng ô ảnh"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <MediaUploader
                                value={q.image_url || ''}
                                onChange={(url) => patchQ(i, { image_url: url || undefined })}
                                accept="image"
                                folder="exam-question-images"
                                placeholder="Tải ảnh minh họa hoặc chọn từ thư viện"
                                aspectRatio="auto"
                              />
                            </div>
                          )}

                          {/* ── SUB-QUESTIONS CONTAINER ────────────────────────── */}
                          <div className="space-y-3 pt-2 border-t border-purple-500/20">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                  <CornerDownRight className="w-4 h-4 text-purple-600" />
                                  Danh sách câu hỏi con ({subCount})
                                </span>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => addSubQuestion(i)}
                                className="h-8 text-xs gap-1.5 border-purple-500/40 text-purple-700 dark:text-purple-300 hover:bg-purple-500/10"
                              >
                                <Plus className="w-3.5 h-3.5" /> Thêm câu hỏi con
                              </Button>
                            </div>

                            {/* Sub-question cards */}
                            <div className="space-y-3 pl-2 md:pl-4 border-l-2 border-purple-500/30">
                              {(q.sub_questions || []).map((sq, sIdx) => (
                                <div
                                  key={sq.id || sIdx}
                                  className="bg-card border border-border/90 rounded-xl p-3.5 space-y-3 shadow-xs"
                                >
                                  {/* Sub-question top row */}
                                  <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-bold flex items-center justify-center border border-purple-300 dark:border-purple-800">
                                        {i + 1}.{sIdx + 1}
                                      </span>
                                      <Select value={sq.type || 'multiple_choice'} onValueChange={(v) => patchSubQ(i, sIdx, { type: v as QuestionType })}>
                                        <SelectTrigger className="h-7 w-32 sm:w-40 text-xs font-medium border-purple-200 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/30">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="multiple_choice" className="text-xs">Trắc nghiệm</SelectItem>
                                          <SelectItem value="short_answer" className="text-xs">Điền từ / Trả lời ngắn</SelectItem>
                                          <SelectItem value="speaking" className="text-xs">Thi Nói / Ghi âm</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <span className="text-xs text-muted-foreground">Điểm:</span>
                                        <Input
                                          type="number"
                                          min={0}
                                          value={sq.points ?? 2}
                                          onChange={(e) =>
                                            patchSubQ(i, sIdx, { points: parseInt(e.target.value) || 0 })
                                          }
                                          className="w-14 h-7 text-xs font-bold"
                                        />
                                      </div>

                                      {subCount > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => removeSubQuestion(i, sIdx)}
                                          className="text-muted-foreground hover:text-destructive p-1 rounded"
                                          title="Xóa câu hỏi con này"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Sub-question text */}
                                  <div>
                                    <Input
                                      value={sq.text}
                                      onChange={(e) => patchSubQ(i, sIdx, { text: e.target.value })}
                                      placeholder={`Nội dung câu hỏi con ${sIdx + 1}...`}
                                      className="font-medium text-sm"
                                    />
                                  </div>

                                  {/* Sub-question options */}
                                  <div className="space-y-2">
                                    {(!sq.type || sq.type === 'multiple_choice') && (
                                      <>
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-xs text-muted-foreground">
                                            Chọn đáp án đúng (tích vào chữ cái tròn):
                                          </span>
                                          <QuickPastePopover
                                            onPaste={(lines) => {
                                              const newOptions = [...sq.options];
                                              lines.forEach((line, li) => {
                                                if (li < 6) {
                                                  if (li >= newOptions.length) newOptions.push(line);
                                                  else newOptions[li] = line;
                                                }
                                              });
                                              patchSubQ(i, sIdx, { options: newOptions });
                                              toast({ title: `✅ Đã điền ${Math.min(lines.length, 6)} đáp án` });
                                            }}
                                          />
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-2">
                                          {sq.options.map((opt, oi) => (
                                            <div key={oi} className="flex items-center gap-1.5">
                                              <button
                                                type="button"
                                                onClick={() => patchSubQ(i, sIdx, { correct_index: oi })}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${
                                                  sq.correct_index === oi
                                                    ? 'border-emerald-500 bg-emerald-500 text-white'
                                                    : 'border-muted-foreground/40 hover:border-emerald-500'
                                                }`}
                                                title={`Chọn ${String.fromCharCode(65 + oi)} là đáp án đúng`}
                                              >
                                                {String.fromCharCode(65 + oi)}
                                              </button>
                                              <Input
                                                value={opt}
                                                onChange={(e) => {
                                                  const arr = [...sq.options];
                                                  arr[oi] = e.target.value;
                                                  patchSubQ(i, sIdx, { options: arr });
                                                }}
                                                onPaste={(e) => handleSubOptionPaste(i, sIdx, oi, e)}
                                                placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                                                className="h-8 text-xs"
                                              />
                                              {sq.options.length > 2 && (
                                                <button
                                                  type="button"
                                                  className="text-muted-foreground hover:text-destructive p-0.5"
                                                  onClick={() => removeSubOption(i, sIdx, oi)}
                                                  title="Xóa đáp án này"
                                                >
                                                  <X className="w-3 h-3" />
                                                </button>
                                              )}
                                            </div>
                                          ))}
                                        </div>

                                        {sq.options.length < 6 && (
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                              patchSubQ(i, sIdx, { options: [...sq.options, ''] })
                                            }
                                          >
                                            <Plus className="w-3 h-3 mr-1" /> Thêm đáp án
                                          </Button>
                                        )}
                                      </>
                                    )}

                                    {sq.type === 'short_answer' && (
                                      <div className="space-y-1 mt-2">
                                        <Label className="text-xs text-muted-foreground">Đáp án được chấp nhận (mỗi dòng là 1 cách viết đúng)</Label>
                                        <Textarea
                                          rows={2}
                                          value={(sq.accepted_answers || []).join('\n')}
                                          onChange={(e) => patchSubQ(i, sIdx, { accepted_answers: e.target.value.split('\n') })}
                                          placeholder={'VD:\nありがとう\nArigatou'}
                                          className="text-sm"
                                        />
                                      </div>
                                    )}

                                    {sq.type === 'speaking' && (
                                      <div className="mt-2 text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-lg border border-dashed">
                                        Câu hỏi ghi âm. Học viên sẽ thu âm trực tiếp qua mic để trả lời câu hỏi này. (Chấm tay sau)
                                      </div>
                                    )}
                                  </div>

                                  {/* Sub-question explanation */}
                                  <div>
                                    <Input
                                      value={sq.explanation || ''}
                                      onChange={(e) =>
                                        patchSubQ(i, sIdx, { explanation: e.target.value })
                                      }
                                      placeholder="Giải thích đáp án cho câu hỏi con (tùy chọn)"
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addSubQuestion(i)}
                              className="w-full h-8 text-xs text-purple-700 dark:text-purple-300 border border-dashed border-purple-400/40 hover:bg-purple-500/10"
                            >
                              <Plus className="w-3.5 h-3.5 mr-1" /> Thêm câu hỏi con vào bài đọc này
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }

                // ── CASE B: REGULAR SINGLE QUESTION (ULTRA CLEAN & COMPACT) ──
                const meta = questionTypeMeta[q.type];
                const TypeIcon = meta.icon;

                return (
                  <div
                    key={q._key || i}
                    id={`exam-card-${i}`}
                    className="rounded-2xl border-2 bg-card p-4 md:p-5 space-y-3 shadow-xs hover:border-primary/40 transition-colors"
                  >
                    {/* Card Header */}
                    <div className="space-y-2 border-b pb-2.5">
                      {/* Row 1: Index, Question Type, Auto badge, and Action buttons */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                            <button
                              type="button"
                              className="hover:text-foreground disabled:opacity-30 p-0.5"
                              onClick={() => moveQuestion(i, -1)}
                              disabled={i === 0}
                              title="Di chuyển lên"
                            >
                              <GripVertical className="w-4 h-4" />
                            </button>
                            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                          </div>

                          <Select value={q.type} onValueChange={(v) => changeType(i, v as QuestionType)}>
                            <SelectTrigger className="h-8 max-w-[140px] sm:max-w-none sm:w-36 text-xs font-medium">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(questionTypeMeta) as QuestionType[]).map((t) => (
                                <SelectItem key={t} value={t} className="text-xs">
                                  {questionTypeMeta[t].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Badge variant="outline" className="gap-1 text-[11px] shrink-0 hidden sm:inline-flex">
                            <TypeIcon className="w-3 h-3" />
                            {meta.auto ? 'Tự chấm' : 'Chấm tay'}
                          </Badge>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground"
                            onClick={() => setCollapsedCards((p) => ({ ...p, [i]: !p[i] }))}
                            title={isCollapsed ? 'Mở rộng câu hỏi' : 'Thu gọn câu hỏi'}
                          >
                            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => duplicateQuestion(i)}
                            title="Nhân bản câu này"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 sm:h-8 sm:w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => removeQuestion(i)}
                            title="Xóa câu này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Row 2: Điểm + Compact Media Toggles */}
                      <div className="flex items-center justify-between gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-muted-foreground font-medium">Điểm:</span>
                          <Input
                            type="number"
                            min={0}
                            className="w-14 h-7 text-xs font-bold"
                            value={q.points ?? 0}
                            onChange={(e) => patchQ(i, { points: parseInt(e.target.value) || 0 })}
                          />
                        </div>

                        {/* Compact Media Toggles */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                          {q.audio_url ? (
                            <Badge
                              variant="outline"
                              className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-[11px] cursor-pointer"
                              onClick={() => setOpenAudio((p) => ({ ...p, [i]: !p[i] }))}
                            >
                              <Music className="w-3 h-3" /> Audio
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={`h-7 px-2 text-xs gap-1 border border-dashed rounded-lg ${
                                openAudio[i]
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/40'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => setOpenAudio((p) => ({ ...p, [i]: !p[i] }))}
                            >
                              <Music className="w-3 h-3 text-emerald-500" />
                              {openAudio[i] ? 'Đóng' : '+ Audio'}
                            </Button>
                          )}

                          {q.image_url ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1 text-[11px] cursor-pointer"
                              onClick={() => setOpenImage((p) => ({ ...p, [i]: !p[i] }))}
                            >
                              <Image className="w-3 h-3" /> Ảnh
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={`h-7 px-2 text-xs gap-1 border border-dashed rounded-lg ${
                                openImage[i]
                                  ? 'bg-blue-500/10 text-blue-600 border-blue-500/40'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => setOpenImage((p) => ({ ...p, [i]: !p[i] }))}
                            >
                              <Image className="w-3 h-3 text-blue-500" />
                              {openImage[i] ? 'Đóng' : '+ Ảnh'}
                            </Button>
                          )}

                          {q.explanation ? (
                            <Badge
                              variant="outline"
                              className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1 text-[11px] cursor-pointer"
                              onClick={() => setOpenExplanation((p) => ({ ...p, [i]: !p[i] }))}
                            >
                              💡 Giải thích
                            </Badge>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className={`h-7 px-2 text-xs gap-1 border border-dashed rounded-lg ${
                                openExplanation[i]
                                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/40'
                                  : 'text-muted-foreground hover:text-foreground'
                              }`}
                              onClick={() => setOpenExplanation((p) => ({ ...p, [i]: !p[i] }))}
                            >
                              <span className="text-amber-500 font-bold">💡</span>
                              {openExplanation[i] ? 'Đóng' : '+ Giải thích'}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Collapsed summary */}
                    {isCollapsed ? (
                      <div
                        className="text-xs text-muted-foreground py-1 flex items-center justify-between cursor-pointer"
                        onClick={() => setCollapsedCards((p) => ({ ...p, [i]: false }))}
                      >
                        <span className="font-medium truncate max-w-xl">
                          {q.text ? q.text : 'Chưa có nội dung câu hỏi'}
                        </span>
                        <span className="text-primary font-medium shrink-0 ml-2">Mở chi tiết &gt;</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Question Text */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs font-semibold text-muted-foreground">Nội dung câu hỏi *</Label>
                            <div className="flex items-center gap-1 text-xs">
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
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground font-bold border border-border text-[11px]"
                              >
                                B
                              </button>
                              <button
                                type="button"
                                title="In nghiêng"
                                onClick={(e) => {
                                  const target = e.currentTarget.closest('.space-y-1')?.querySelector('textarea') as HTMLTextAreaElement;
                                  if (target) {
                                    const start = target.selectionStart;
                                    const end = target.selectionEnd;
                                    const val = target.value;
                                    const sel = val.substring(start, end);
                                    const newText = sel ? val.substring(0, start) + `*${sel}*` + val.substring(end) : val + ' *chữ nghiêng*';
                                    patchQ(i, { text: newText });
                                  }
                                }}
                                className="px-2 py-0.5 rounded bg-muted hover:bg-primary/20 text-foreground italic border border-border text-[11px]"
                              >
                                I
                              </button>
                            </div>
                          </div>
                          <Textarea
                            value={q.text}
                            onChange={(e) => patchQ(i, { text: e.target.value })}
                            rows={2}
                            placeholder="Nội dung câu hỏi… (Hỗ trợ **in đậm**, *in nghiêng*)"
                          />
                          {q.text && (q.text.includes('*') || q.text.includes('<')) && (
                            <div className="text-xs bg-muted/40 p-2 rounded-md border text-muted-foreground">
                              <span className="font-semibold text-foreground">Xem trước: </span>
                              <FormattedText text={q.text} />
                            </div>
                          )}
                        </div>

                        {/* Collapsible Audio Upload */}
                        {(q.audio_url || openAudio[i]) && (
                          <AudioUpload
                            audioUrl={q.audio_url}
                            onChange={(url) => patchQ(i, { audio_url: url || undefined })}
                            onClose={() => setOpenAudio((p) => ({ ...p, [i]: false }))}
                          />
                        )}

                        {/* Collapsible Image Upload */}
                        {(q.image_url || openImage[i]) && (
                          <div className="space-y-1 bg-muted/20 p-2.5 rounded-xl border border-border/80">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                <Image className="w-3.5 h-3.5 text-blue-500" /> Ảnh minh họa câu hỏi
                              </Label>
                              <button
                                type="button"
                                onClick={() => setOpenImage((p) => ({ ...p, [i]: false }))}
                                className="text-muted-foreground hover:text-foreground text-xs p-0.5 rounded"
                                title="Đóng ô ảnh"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <MediaUploader
                              value={q.image_url || ''}
                              onChange={(url) => patchQ(i, { image_url: url || undefined })}
                              accept="image"
                              folder="exam-question-images"
                              placeholder="Tải ảnh minh họa hoặc chọn từ thư viện"
                              aspectRatio="auto"
                            />
                          </div>
                        )}

                        {/* Options for multiple choice & true/false */}
                        {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                          <div className="space-y-2">
                            {q.type === 'multiple_choice' && (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
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
                                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                                      q.correct_index === oi
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : 'border-muted-foreground/40 hover:border-emerald-500'
                                    }`}
                                    title={`Chọn ${String.fromCharCode(65 + oi)} là đáp án đúng`}
                                  >
                                    {String.fromCharCode(65 + oi)}
                                  </button>
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const arr = [...q.options];
                                      arr[oi] = e.target.value;
                                      patchQ(i, { options: arr });
                                    }}
                                    onPaste={(e) => handleOptionPaste(i, oi, e)}
                                    placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                                    disabled={q.type === 'true_false'}
                                    className="h-8"
                                  />
                                  {q.type === 'multiple_choice' && q.options.length > 2 && (
                                    <button
                                      type="button"
                                      className="text-muted-foreground hover:text-destructive p-1"
                                      onClick={() => removeOption(i, oi)}
                                      title="Xóa đáp án này"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              {q.type === 'multiple_choice' && q.options.length < 6 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 justify-start text-muted-foreground"
                                  onClick={() => patchQ(i, { options: [...q.options, ''] })}
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" /> Thêm đáp án
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
                          <p className="text-xs text-muted-foreground italic">
                            Câu tự luận sẽ do giáo viên chấm tay sau khi học viên nộp.
                          </p>
                        )}

                        {/* Collapsible Explanation */}
                        {(q.explanation || openExplanation[i]) && (
                          <div className="space-y-1 bg-amber-500/5 p-2 rounded-xl border border-amber-500/20">
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                💡 Giải thích chi tiết đáp án
                              </Label>
                              <button
                                type="button"
                                onClick={() => setOpenExplanation((p) => ({ ...p, [i]: false }))}
                                className="text-muted-foreground hover:text-foreground text-xs p-0.5 rounded"
                                title="Đóng ô giải thích"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <Input
                              value={q.explanation || ''}
                              onChange={(e) => patchQ(i, { explanation: e.target.value })}
                              placeholder="Giải thích tại sao đáp án này đúng, mẹo ghi nhớ…"
                              className="h-8 text-xs bg-background"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Bottom Add Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t bg-muted/20 p-3 rounded-2xl">
                <span className="text-xs font-bold text-muted-foreground mr-1">Thêm câu hỏi:</span>
                {(Object.keys(questionTypeMeta) as QuestionType[]).map((t) => {
                  const Icon = questionTypeMeta[t].icon;
                  return (
                    <Button
                      key={t}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addQuestion(t)}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Icon className="w-3.5 h-3.5 text-primary" />
                      {questionTypeMeta[t].label}
                    </Button>
                  );
                })}

                {/* Big Prominent Passage Group Button */}
                <Button
                  type="button"
                  size="sm"
                  onClick={addPassageQuestion}
                  className="h-8 text-xs gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow-sm font-semibold ml-auto"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  + Chùm Đọc Hiểu (Passage + Câu hỏi con)
                </Button>
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

        {/* Footer — sticky bottom bar on mobile */}
        <div
          className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-t flex items-center justify-between gap-2 bg-background/95 backdrop-blur-sm"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)' }}
        >
          <Button type="button" variant="ghost" size="sm" className="text-xs sm:text-sm" onClick={() => (step > 1 ? setStep(step - 1) : onOpenChange(false))}>
            {step > 1 ? <><ArrowLeft className="w-4 h-4 mr-1" />Quay lại</> : 'Hủy'}
          </Button>
          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button type="button" size="sm" className="text-xs sm:text-sm" onClick={handleNextStep}>
                Tiếp tục<ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button type="button" size="sm" className="text-xs sm:text-sm" onClick={save} disabled={saving}>
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
