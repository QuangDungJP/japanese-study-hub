import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { X, Upload, Link2, Youtube, FileText, Sparkles, Trash2, Plus, ClipboardList, ArrowRight, ArrowLeft, CalendarClock, Users, HelpCircle, Wand2, CheckCircle2 } from 'lucide-react';

interface Attachment { kind: 'file' | 'link' | 'youtube'; url: string; name: string }
interface RubricCriterion { title: string; max: number }
interface Question { prompt: string; hint?: string }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classId: string;
  topics: Array<{ id: string; name: string }>;
  initial?: any;
  onSaved: () => void;
}

const steps = [
  { id: 1, label: 'Cơ bản', icon: ClipboardList },
  { id: 2, label: 'Nội dung', icon: HelpCircle },
  { id: 3, label: 'Giao bài', icon: Users },
];

const AssignmentComposer = ({ open, onOpenChange, classId, topics, initial, onSaved }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [points, setPoints] = useState<number>(100);
  const [dueDate, setDueDate] = useState<string>('');
  const [startAt, setStartAt] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('none');
  const [kind, setKind] = useState<'assignment' | 'material' | 'question'>('assignment');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [rubric, setRubric] = useState<RubricCriterion[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [level, setLevel] = useState('N5');
  const [scheduleMode, setScheduleMode] = useState<'always' | 'scheduled'>('always');
  // multi-class
  const [myClasses, setMyClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [extraClassIds, setExtraClassIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setStep(1);
      setTitle(initial?.title || '');
      setInstructions(initial?.instructions || initial?.description || '');
      setPoints(initial?.points ?? 100);
      setDueDate(initial?.due_date ? new Date(initial.due_date).toISOString().slice(0, 16) : '');
      if (initial?.start_at) {
        setScheduleMode('scheduled');
        setStartAt(new Date(initial.start_at).toISOString().slice(0, 16));
      } else {
        setScheduleMode('always');
        setStartAt('');
      }
      setTopicId(initial?.topic_id || 'none');
      setKind(initial?.kind || 'assignment');
      setAttachments(Array.isArray(initial?.attachments) ? initial.attachments : []);
      setRubric(Array.isArray(initial?.rubric) ? initial.rubric : []);
      const initQs = initial?.assigned_to?.questions;
      setQuestions(Array.isArray(initQs) ? initQs : []);
      setLinkInput('');
      setExtraClassIds([]);
      // fetch teacher's other classes
      if (user?.id && !initial?.id) {
        (supabase as any)
          .from('classes')
          .select('id, name, name_vi')
          .or(`teacher_id.eq.${user.id},created_by.eq.${user.id}`)
          .neq('id', classId)
          .then(({ data }: any) => setMyClasses((data || []).map((c: any) => ({ id: c.id, name: c.name_vi || c.name }))));
      } else {
        setMyClasses([]);
      }
    }
  }, [open, initial, user?.id, classId]);

  const uploadFile = async (file: File) => {
    try {
      const path = `${classId}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('class-assignments').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('class-assignments').getPublicUrl(path);
      setAttachments(a => [...a, { kind: 'file', url: data.publicUrl, name: file.name }]);
    } catch (e: any) {
      toast({ title: 'Lỗi tải file', description: e.message, variant: 'destructive' });
    }
  };

  const addLink = () => {
    if (!linkInput.trim()) return;
    const isYt = /youtu\.?be/.test(linkInput);
    setAttachments(a => [...a, { kind: isYt ? 'youtube' : 'link', url: linkInput.trim(), name: linkInput.trim() }]);
    setLinkInput('');
  };

  const runAI = async (action: string, extra: any = {}) => {
    if (!title.trim()) return toast({ title: 'Nhập tiêu đề trước khi gợi ý', variant: 'destructive' });
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('classroom-ai', {
        body: { action, title, instructions, level, ...extra },
      });
      if (error) throw error;
      if (data?.instructions) setInstructions(data.instructions);
      if (Array.isArray(data?.questions)) setQuestions(data.questions);
      if (Array.isArray(data?.rubric)) setRubric(data.rubric);
      toast({ title: '✨ Đã áp dụng gợi ý AI' });
    } catch (e: any) {
      toast({ title: 'AI lỗi', description: e.message, variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    if (!title.trim()) return toast({ title: 'Thiếu tiêu đề', variant: 'destructive' });
    if (scheduleMode === 'scheduled' && !startAt) {
      return toast({ title: 'Chưa chọn thời gian mở đề', description: 'Vui lòng chọn thời gian bắt đầu mở bài khi sử dụng chế độ "Hẹn giờ mở đề"', variant: 'destructive' });
    }
    setSaving(true);
    const finalStartAt = scheduleMode === 'scheduled' ? (startAt || null) : null;
    const basePayload: any = {
      title: title.trim(),
      instructions: instructions || null,
      description: instructions || null,
      points,
      due_date: dueDate || null,
      start_at: finalStartAt,
      topic_id: topicId === 'none' ? null : topicId,
      kind,
      attachments,
      rubric,
      assigned_to: questions.length ? { questions } : null,
      created_by: user?.id,
    };
    const sb: any = supabase;
    let error: any = null;
    if (initial?.id) {
      const res = await sb.from('class_assignments').update({ ...basePayload, class_id: classId }).eq('id', initial.id);
      error = res.error;
    } else {
      const targetClasses = [classId, ...extraClassIds];
      const rows = targetClasses.map(cid => ({ ...basePayload, class_id: cid }));
      const res = await sb.from('class_assignments').insert(rows);
      error = res.error;
      if (!error && kind === 'assignment') {
        await sb.from('class_stream_posts').insert(
          targetClasses.map(cid => ({
            class_id: cid,
            author_id: user?.id,
            kind: 'assignment',
            title: `Bài tập mới: ${title.trim()}`,
            body: instructions || null,
          }))
        );
      }
    }
    setSaving(false);
    if (error) return toast({ title: 'Lỗi lưu', description: error.message, variant: 'destructive' });
    toast({ title: initial?.id ? 'Đã cập nhật' : '✅ Đã tạo bài tập' });
    onSaved();
    onOpenChange(false);
  };

  const canNext = step === 1 ? title.trim().length > 0 : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-4xl h-[92vh] p-0 overflow-hidden gap-0 flex flex-col">
        {/* Header + Stepper */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent space-y-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><ClipboardList className="w-5 h-5" /></div>
              {initial?.id ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
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
                    onClick={() => setStep(s.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      active ? 'bg-primary text-primary-foreground shadow-md' :
                      done ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
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
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Loại</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { v: 'assignment', label: 'Bài tập', icon: ClipboardList },
                    { v: 'material', label: 'Tài liệu', icon: FileText },
                    { v: 'question', label: 'Câu hỏi', icon: HelpCircle },
                  ].map(o => {
                    const Icon = o.icon;
                    return (
                      <button
                        key={o.v}
                        onClick={() => setKind(o.v as any)}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                          kind === o.v ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${kind === o.v ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="text-sm font-medium">{o.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tiêu đề *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Bài luận về gia đình" className="mt-1 text-lg font-semibold" autoFocus />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hướng dẫn</Label>
                  <div className="flex items-center gap-2">
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['N5','N4','N3','N2','N1'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => runAI('assignment_full')} disabled={aiLoading}>
                      <Wand2 className="w-4 h-4 mr-1" />{aiLoading ? 'Đang tạo…' : 'AI tạo toàn bộ'}
                    </Button>
                  </div>
                </div>
                <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Mô tả yêu cầu, tài liệu tham khảo… hoặc bấm AI để tạo tự động." rows={7} className="mt-1" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Attachments */}
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Tài liệu đính kèm</Label>
                  <div className="flex flex-wrap gap-2">
                    <label className="cursor-pointer">
                      <input type="file" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                      <Button asChild variant="outline" size="sm"><span><Upload className="w-4 h-4 mr-1" />Tải file</span></Button>
                    </label>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="Dán URL, YouTube, Google Drive…" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())} />
                  <Button variant="outline" size="sm" onClick={addLink}><Link2 className="w-4 h-4 mr-1" />Thêm</Button>
                </div>
                {attachments.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {attachments.map((att, i) => {
                      const Icon = att.kind === 'youtube' ? Youtube : att.kind === 'link' ? Link2 : FileText;
                      return (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg border bg-muted/30 hover:bg-muted/50">
                          <Icon className="w-4 h-4 text-primary shrink-0" />
                          <a href={att.url} target="_blank" rel="noreferrer" className="flex-1 text-sm truncate hover:underline">{att.name}</a>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAttachments(a => a.filter((_, x) => x !== i))}><Trash2 className="w-3.5 h-3.5" /></Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Questions */}
              <section className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Câu hỏi / Nhiệm vụ</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => runAI('assignment_questions', { count: 5 })} disabled={aiLoading}>
                      <Sparkles className="w-3.5 h-3.5 mr-1" />AI sinh câu hỏi
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setQuestions(q => [...q, { prompt: '', hint: '' }])}><Plus className="w-3.5 h-3.5 mr-1" />Thêm</Button>
                  </div>
                </div>
                {questions.length === 0 && <p className="text-xs text-muted-foreground italic">Chưa có câu hỏi. Có thể để trống nếu học viên tự do làm bài.</p>}
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <div key={i} className="flex gap-2 p-3 rounded-lg border bg-card">
                      <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-sm font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                      <div className="flex-1 space-y-1">
                        <Textarea value={q.prompt} onChange={e => setQuestions(qs => qs.map((x, j) => j === i ? { ...x, prompt: e.target.value } : x))} rows={2} placeholder="Nội dung câu hỏi…" />
                        <Input value={q.hint || ''} onChange={e => setQuestions(qs => qs.map((x, j) => j === i ? { ...x, hint: e.target.value } : x))} placeholder="Gợi ý (không bắt buộc)" className="h-8 text-sm" />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setQuestions(qs => qs.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Rubric */}
              <section className="space-y-2 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Tiêu chí chấm (Rubric)</Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => runAI('assignment_rubric')} disabled={aiLoading}>
                      <Sparkles className="w-3.5 h-3.5 mr-1" />AI đề xuất
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setRubric(r => [...r, { title: '', max: 10 }])}><Plus className="w-3.5 h-3.5 mr-1" />Thêm</Button>
                  </div>
                </div>
                {rubric.length === 0 && <p className="text-xs text-muted-foreground italic">Chưa có tiêu chí. Nếu không thiết lập, giáo viên chấm điểm tự do.</p>}
                {rubric.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={r.title} onChange={e => setRubric(rs => rs.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Tiêu chí…" className="flex-1" />
                    <Input type="number" value={r.max} onChange={e => setRubric(rs => rs.map((x, j) => j === i ? { ...x, max: parseInt(e.target.value) || 0 } : x))} className="w-24" />
                    <span className="text-xs text-muted-foreground">điểm</span>
                    <Button variant="ghost" size="icon" onClick={() => setRubric(rs => rs.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
                {rubric.length > 0 && (
                  <p className="text-xs text-muted-foreground text-right">Tổng: {rubric.reduce((s, r) => s + (r.max || 0), 0)} điểm</p>
                )}
              </section>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Điểm tối đa</Label>
                  <Input type="number" value={points} onChange={e => setPoints(parseInt(e.target.value) || 0)} className="mt-1" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Chủ đề</Label>
                  <Select value={topicId} onValueChange={setTopicId}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Không có" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không có chủ đề</SelectItem>
                      {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Chế độ mở đề / Phát hành</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setScheduleMode('always'); setStartAt(''); }}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      scheduleMode === 'always' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border hover:border-emerald-500/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Luôn mở</div>
                      <div className="text-xs text-muted-foreground">Mở làm bài ngay bất kỳ lúc nào</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleMode('scheduled')}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      scheduleMode === 'scheduled' ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                      <CalendarClock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Hẹn giờ mở đề</div>
                      <div className="text-xs text-muted-foreground">Tới giờ setup mới mở đề bài</div>
                    </div>
                  </button>
                </div>

                {scheduleMode === 'scheduled' && (
                  <div className="mt-3 p-3.5 rounded-xl border bg-card/60 space-y-1.5 animate-in fade-in">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5 text-primary" />
                      Thời gian mở đề bài (Giờ setup)
                    </Label>
                    <Input
                      type="datetime-local"
                      value={startAt}
                      onChange={e => setStartAt(e.target.value)}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground">
                      🔒 Học viên chỉ có thể mở xem đề và nộp bài kể từ thời điểm này trở đi.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <CalendarClock className="w-3 h-3" /> Hạn nộp bài (Deadline)
                </Label>
                <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1" />
                <p className="text-xs text-muted-foreground mt-1">Để trống nếu không đặt hạn nộp</p>
              </div>

              {!initial?.id && myClasses.length > 0 && (
                <div className="pt-4 border-t space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-1"><Users className="w-4 h-4" />Giao cho lớp khác (tùy chọn)</Label>
                  <p className="text-xs text-muted-foreground">Sao chép bài tập này sang các lớp khác của bạn.</p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 rounded-lg border bg-muted/20">
                    {myClasses.map(c => (
                      <label key={c.id} className="flex items-center gap-2 p-2 rounded hover:bg-background cursor-pointer">
                        <Checkbox
                          checked={extraClassIds.includes(c.id)}
                          onCheckedChange={(v) => setExtraClassIds(ids => v ? [...ids, c.id] : ids.filter(x => x !== c.id))}
                        />
                        <span className="text-sm truncate">{c.name}</span>
                      </label>
                    ))}
                  </div>
                  {extraClassIds.length > 0 && <Badge variant="secondary">+{extraClassIds.length} lớp</Badge>}
                </div>
              )}

              <div className="pt-4 border-t bg-muted/30 rounded-lg p-4 space-y-1 text-sm">
                <div className="font-semibold mb-2">Tóm tắt</div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tiêu đề:</span><span className="font-medium truncate max-w-[60%]">{title || '(chưa có)'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Câu hỏi:</span><span>{questions.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Đính kèm:</span><span>{attachments.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rubric:</span><span>{rubric.length} tiêu chí</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lớp:</span><span>{1 + extraClassIds.length}</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-background flex items-center justify-between">
          <Button variant="ghost" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}>
            <ArrowLeft className="w-4 h-4 mr-1" />Quay lại
          </Button>
          <div className="text-xs text-muted-foreground">Bước {step}/3</div>
          {step < 3 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canNext} className="rounded-full">
              Tiếp<ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={save} disabled={saving} className="rounded-full">
              {saving ? 'Đang lưu…' : initial?.id ? 'Lưu thay đổi' : startAt ? 'Lên lịch giao' : '✓ Giao bài ngay'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentComposer;