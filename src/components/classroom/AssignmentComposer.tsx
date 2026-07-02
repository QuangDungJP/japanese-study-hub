import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { X, Upload, Link2, Youtube, FileText, Sparkles, Trash2, Plus, ClipboardList } from 'lucide-react';

interface Attachment { kind: 'file' | 'link' | 'youtube'; url: string; name: string }
interface RubricCriterion { title: string; max: number }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  classId: string;
  topics: Array<{ id: string; name: string }>;
  initial?: any;
  onSaved: () => void;
}

const AssignmentComposer = ({ open, onOpenChange, classId, topics, initial, onSaved }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [points, setPoints] = useState<number>(100);
  const [dueDate, setDueDate] = useState<string>('');
  const [topicId, setTopicId] = useState<string>('none');
  const [kind, setKind] = useState<'assignment' | 'material' | 'question'>('assignment');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [rubric, setRubric] = useState<RubricCriterion[]>([]);
  const [linkInput, setLinkInput] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(initial?.title || '');
      setInstructions(initial?.instructions || initial?.description || '');
      setPoints(initial?.points ?? 100);
      setDueDate(initial?.due_date ? new Date(initial.due_date).toISOString().slice(0, 16) : '');
      setTopicId(initial?.topic_id || 'none');
      setKind(initial?.kind || 'assignment');
      setAttachments(Array.isArray(initial?.attachments) ? initial.attachments : []);
      setRubric(Array.isArray(initial?.rubric) ? initial.rubric : []);
      setLinkInput('');
    }
  }, [open, initial]);

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

  const aiSuggest = async () => {
    if (!title.trim()) return toast({ title: 'Nhập tiêu đề trước khi gợi ý', variant: 'destructive' });
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('classroom-ai', {
        body: { action: 'suggest_assignment', title, current_instructions: instructions },
      });
      if (error) throw error;
      if (data?.instructions) setInstructions(data.instructions);
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
    setSaving(true);
    const payload: any = {
      class_id: classId,
      title: title.trim(),
      instructions: instructions || null,
      description: instructions || null,
      points,
      due_date: dueDate || null,
      topic_id: topicId === 'none' ? null : topicId,
      kind,
      attachments,
      rubric,
      created_by: user?.id,
    };
    const sb: any = supabase;
    const { error } = initial?.id
      ? await sb.from('class_assignments').update(payload).eq('id', initial.id)
      : await sb.from('class_assignments').insert(payload);
    setSaving(false);
    if (error) return toast({ title: 'Lỗi lưu', description: error.message, variant: 'destructive' });

    // create stream post for new assignment
    if (!initial?.id && kind === 'assignment') {
      await sb.from('class_stream_posts').insert({
        class_id: classId, author_id: user?.id, kind: 'assignment',
        title: `Bài tập mới: ${title.trim()}`, body: instructions || null,
      });
    }
    toast({ title: initial?.id ? 'Đã cập nhật' : '✅ Đã tạo bài tập' });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[92vh] p-0 overflow-hidden gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-primary/5 flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><ClipboardList className="w-5 h-5" /></div>
            {initial?.id ? 'Chỉnh sửa bài tập' : 'Bài tập mới'}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={aiSuggest} disabled={aiLoading}>
              <Sparkles className="w-4 h-4 mr-1" />{aiLoading ? 'Đang tạo…' : 'AI gợi ý'}
            </Button>
            <Button onClick={save} disabled={saving} className="rounded-full">
              {saving ? 'Đang lưu…' : initial?.id ? 'Lưu thay đổi' : 'Giao bài'}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}><X className="w-4 h-4" /></Button>
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-[1fr_320px] gap-0 h-full overflow-hidden">
          {/* Main */}
          <div className="p-6 overflow-y-auto space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tiêu đề *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Bài luận về gia đình" className="mt-1 border-0 border-b rounded-none px-0 text-lg font-semibold focus-visible:ring-0 focus-visible:border-primary" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hướng dẫn</Label>
              <Textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="Mô tả yêu cầu, tài liệu tham khảo…" rows={6} className="mt-1" />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Đính kèm</Label>
              <div className="flex flex-wrap gap-2">
                <label className="cursor-pointer">
                  <input type="file" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                  <Button asChild variant="outline" size="sm"><span><Upload className="w-4 h-4 mr-1" />Tải file</span></Button>
                </label>
                <div className="flex items-center gap-1">
                  <Input value={linkInput} onChange={e => setLinkInput(e.target.value)} placeholder="Dán URL hoặc YouTube…" className="h-9 w-64" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())} />
                  <Button variant="outline" size="sm" onClick={addLink}><Link2 className="w-4 h-4 mr-1" />Thêm</Button>
                </div>
              </div>
              {attachments.length > 0 && (
                <div className="space-y-2 pt-2">
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
            </div>

            {/* Rubric */}
            <div className="space-y-2 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tiêu chí chấm (Rubric)</Label>
                <Button variant="ghost" size="sm" onClick={() => setRubric(r => [...r, { title: '', max: 10 }])}><Plus className="w-3 h-3 mr-1" />Thêm tiêu chí</Button>
              </div>
              {rubric.length === 0 && <p className="text-xs text-muted-foreground italic">Chưa có tiêu chí. Dùng AI gợi ý để tạo nhanh.</p>}
              {rubric.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input value={r.title} onChange={e => setRubric(rs => rs.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Tiêu chí…" className="flex-1" />
                  <Input type="number" value={r.max} onChange={e => setRubric(rs => rs.map((x, j) => j === i ? { ...x, max: parseInt(e.target.value) || 0 } : x))} className="w-24" />
                  <Button variant="ghost" size="icon" onClick={() => setRubric(rs => rs.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="p-6 border-l bg-muted/20 overflow-y-auto space-y-5">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Loại</Label>
              <Select value={kind} onValueChange={(v: any) => setKind(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">Bài tập</SelectItem>
                  <SelectItem value="material">Tài liệu</SelectItem>
                  <SelectItem value="question">Câu hỏi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Điểm</Label>
              <Input type="number" value={points} onChange={e => setPoints(parseInt(e.target.value) || 0)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hạn nộp</Label>
              <Input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Chủ đề</Label>
              <Select value={topicId} onValueChange={setTopicId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Không có chủ đề" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không có chủ đề</SelectItem>
                  {topics.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentComposer;