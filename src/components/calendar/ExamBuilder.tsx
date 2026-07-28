import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  X, ClipboardList, ListChecks, CalendarClock, CheckCircle2, ArrowRight, ArrowLeft,
  Wand2, Sparkles, Plus, Trash2, Copy, Loader2, Users, CircleDot, ToggleRight,
  Type, AlignLeft, GripVertical,
} from 'lucide-react';

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

export interface ExamQuestion {
  type: QuestionType;
  text: string;
  options: string[];
  correct_index: number;
  accepted_answers?: string[];
  explanation?: string;
  points?: number;
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

const questionTypeMeta: Record<QuestionType, { label: string; icon: typeof CircleDot; auto: boolean }> = {
  multiple_choice: { label: 'Trắc nghiệm', icon: CircleDot, auto: true },
  true_false: { label: 'Đúng / Sai', icon: ToggleRight, auto: true },
  short_answer: { label: 'Trả lời ngắn', icon: Type, auto: true },
  essay: { label: 'Tự luận', icon: AlignLeft, auto: false },
};

const emptyQuestion = (type: QuestionType = 'multiple_choice'): ExamQuestion => {
  if (type === 'true_false') return { type, text: '', options: ['Đúng', 'Sai'], correct_index: 0, points: 1, explanation: '' };
  if (type === 'short_answer') return { type, text: '', options: [], correct_index: 0, accepted_answers: [''], points: 1, explanation: '' };
  if (type === 'essay') return { type, text: '', options: [], correct_index: 0, points: 5, explanation: '' };
  return { type, text: '', options: ['', '', '', ''], correct_index: 0, points: 1, explanation: '' };
};

const normalizeQuestion = (q: any): ExamQuestion => {
  const type: QuestionType = q?.type || 'multiple_choice';
  return {
    type,
    text: q?.text || '',
    options: Array.isArray(q?.options) ? q.options : type === 'true_false' ? ['Đúng', 'Sai'] : [],
    correct_index: typeof q?.correct_index === 'number' ? q.correct_index : 0,
    accepted_answers: Array.isArray(q?.accepted_answers) ? q.accepted_answers : undefined,
    explanation: q?.explanation || '',
    points: typeof q?.points === 'number' ? q.points : 1,
  };
};

const ExamBuilder = ({ open, onOpenChange, classes, teacherId, initial, onSaved }: Props) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  // Step 1
  const [title, setTitle] = useState('');
  const [titleVi, setTitleVi] = useState('');
  const [examType, setExamType] = useState<'quiz' | 'midterm' | 'final' | 'placement'>('quiz');
  const [level, setLevel] = useState('N5');
  const [instructions, setInstructions] = useState('');
  const [descriptionVi, setDescriptionVi] = useState('');
  const [meetLink, setMeetLink] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Step 2
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  // Step 3
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [duration, setDuration] = useState(60);
  const [maxScore, setMaxScore] = useState(100);
  const [passingScore, setPassingScore] = useState(50);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [lockAfterEnd, setLockAfterEnd] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [isPublished, setIsPublished] = useState(false);
  const [primaryClass, setPrimaryClass] = useState<string>('all');
  const [extraClassIds, setExtraClassIds] = useState<string[]>([]);

  const isEdit = !!initial?.id;

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setTitle(initial?.title || '');
    setTitleVi(initial?.title_vi || '');
    setExamType(initial?.exam_type || 'quiz');
    setLevel('N5');
    setInstructions(initial?.instructions || '');
    setDescriptionVi(initial?.description_vi || '');
    setMeetLink(initial?.meet_link || '');
    setVideoUrl(initial?.video_url || '');
    setQuestions(Array.isArray(initial?.questions) ? initial.questions.map(normalizeQuestion) : []);
    setExamDate(initial?.exam_date || new Date().toISOString().slice(0, 10));
    setStartTime(initial?.start_time || '09:00');
    setDuration(initial?.duration_minutes || 60);
    setMaxScore(initial?.max_score ?? 100);
    setPassingScore(initial?.passing_score ?? 50);
    setStartsAt(initial?.starts_at ? initial.starts_at.slice(0, 16) : '');
    setEndsAt(initial?.ends_at ? initial.ends_at.slice(0, 16) : '');
    setLockAfterEnd(initial?.lock_after_end ?? true);
    setShuffle(initial?.shuffle_questions ?? false);
    setMaxAttempts(initial?.max_attempts ?? 1);
    setIsPublished(initial?.is_published ?? false);
    setPrimaryClass(initial?.class_id || 'all');
    setExtraClassIds([]);
  }, [open, initial]);

  const totalPoints = useMemo(() => questions.reduce((s, q) => s + (q.points || 0), 0), [questions]);
  const autoGraded = useMemo(() => questions.filter((q) => questionTypeMeta[q.type].auto).length, [questions]);

  // Keep max score in sync with question points when they add up to something meaningful
  useEffect(() => {
    if (totalPoints > 0) setMaxScore(totalPoints);
  }, [totalPoints]);

  const patchQ = (i: number, patch: Partial<ExamQuestion>) =>
    setQuestions((arr) => arr.map((q, idx) => (idx === i ? { ...q, ...patch } : q)));

  const changeType = (i: number, type: QuestionType) =>
    setQuestions((arr) => arr.map((q, idx) => (idx === i ? { ...emptyQuestion(type), text: q.text, points: q.points } : q)));

  const addQuestion = (type: QuestionType = 'multiple_choice') => setQuestions((a) => [...a, emptyQuestion(type)]);
  const removeQuestion = (i: number) => setQuestions((a) => a.filter((_, idx) => idx !== i));
  const duplicateQuestion = (i: number) =>
    setQuestions((a) => [...a.slice(0, i + 1), { ...a[i], options: [...a[i].options], accepted_answers: a[i].accepted_answers ? [...a[i].accepted_answers!] : undefined }, ...a.slice(i + 1)]);
  const moveQuestion = (i: number, dir: -1 | 1) =>
    setQuestions((a) => {
      const j = i + dir;
      if (j < 0 || j >= a.length) return a;
      const next = [...a];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

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
    if (!titleVi.trim() && !title.trim()) return 'Vui lòng nhập tiêu đề';
    if (!examDate) return 'Chọn ngày kiểm tra';
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) {
      toast({ title: err, variant: 'destructive' });
      setStep(!titleVi.trim() && !title.trim() ? 1 : 3);
      return;
    }
    setSaving(true);
    const base: any = {
      title: (title || titleVi).trim(),
      title_vi: (titleVi || title).trim(),
      description_vi: descriptionVi || null,
      instructions: instructions || null,
      video_url: videoUrl || null,
      exam_type: examType,
      exam_date: examDate,
      start_time: startTime,
      duration_minutes: duration,
      meet_link: meetLink || null,
      max_score: maxScore,
      passing_score: passingScore,
      is_published: isPublished,
      teacher_id: teacherId,
      starts_at: startsAt ? new Date(startsAt).toISOString() : null,
      ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      lock_after_end: lockAfterEnd,
      shuffle_questions: shuffle,
      max_attempts: maxAttempts,
      questions: questions as any,
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
      toast({ title: 'Lỗi lưu', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: isEdit ? 'Đã cập nhật bài kiểm tra' : 'Đã tạo bài kiểm tra' });
    onSaved();
    onOpenChange(false);
  };

  const canNext = step === 1 ? title.trim().length > 0 || titleVi.trim().length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-4xl h-[92vh] p-0 overflow-hidden gap-0 flex flex-col">
        {/* Header + stepper */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <ListChecks className="w-5 h-5" />
              </div>
              {isEdit ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
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
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      active ? 'bg-primary text-primary-foreground shadow-md'
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
          {step === 1 && (
            <div className="space-y-5 max-w-2xl mx-auto">
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
                      className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        examType === o.v ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'
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

          {step === 2 && (
            <div className="space-y-4 max-w-3xl mx-auto">
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
                  <div key={i} className="rounded-xl border-2 bg-card p-4 space-y-3">
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
                        <Textarea value={q.text} onChange={(e) => patchQ(i, { text: e.target.value })} rows={2} placeholder="Nội dung câu hỏi…" />

                        {(q.type === 'multiple_choice' || q.type === 'true_false') && (
                          <div className="grid sm:grid-cols-2 gap-2">
                            {q.options.map((opt, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => patchQ(i, { correct_index: oi })}
                                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                                    q.correct_index === oi ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted-foreground/40'
                                  }`}
                                >
                                  {String.fromCharCode(65 + oi)}
                                </button>
                                <Input
                                  value={opt}
                                  onChange={(e) => { const arr = [...q.options]; arr[oi] = e.target.value; patchQ(i, { options: arr }); }}
                                  placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`}
                                  disabled={q.type === 'true_false'}
                                  className="h-8"
                                />
                                {q.type === 'multiple_choice' && q.options.length > 2 && (
                                  <button type="button" className="text-muted-foreground hover:text-destructive" onClick={() => {
                                    const arr = q.options.filter((_, x) => x !== oi);
                                    patchQ(i, { options: arr, correct_index: Math.min(q.correct_index, arr.length - 1) });
                                  }}><X className="w-3.5 h-3.5" /></button>
                                )}
                              </div>
                            ))}
                            {q.type === 'multiple_choice' && q.options.length < 6 && (
                              <Button type="button" variant="ghost" size="sm" className="h-8 justify-start text-muted-foreground" onClick={() => patchQ(i, { options: [...q.options, ''] })}>
                                <Plus className="w-3.5 h-3.5 mr-1" />Thêm đáp án
                              </Button>
                            )}
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

          {step === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto">
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
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Thời lượng (phút)</Label>
                  <Input type="number" min={1} value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 0)} className="mt-1" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Điểm tối đa</Label>
                  <Input type="number" value={maxScore} onChange={(e) => setMaxScore(parseInt(e.target.value) || 0)} className="mt-1" />
                  <p className="text-xs text-muted-foreground mt-1">Tự tính từ tổng điểm câu hỏi ({totalPoints}).</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Điểm đạt</Label>
                  <Input type="number" value={passingScore} onChange={(e) => setPassingScore(parseInt(e.target.value) || 0)} className="mt-1" />
                </div>
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
                  <div><p className="font-medium text-sm">Xáo trộn câu hỏi</p><p className="text-xs text-muted-foreground">Mỗi học viên thấy thứ tự khác nhau.</p></div>
                  <Switch checked={shuffle} onCheckedChange={setShuffle} />
                </div>
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
              <Button type="button" onClick={() => canNext && setStep(step + 1)} disabled={!canNext}>
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
