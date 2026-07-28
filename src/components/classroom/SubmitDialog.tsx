import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Link2, Trash2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import InlineViewer from './InlineViewer';

interface Att { kind: 'file' | 'link'; url: string; name: string }
interface Props {
  open: boolean; onOpenChange: (v: boolean) => void;
  assignment: any; existing?: any; onSaved: () => void;
}

const SubmitDialog = ({ open, onOpenChange, assignment, existing, onSaved }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [attachments, setAttachments] = useState<Att[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const isReturned = existing?.status === 'graded' && existing?.returned_at;
  const isUpcoming = assignment?.start_at && new Date(assignment.start_at) > new Date();
  const rubric: Array<{ title: string; max: number }> = Array.isArray(assignment?.rubric) ? assignment.rubric : [];
  const rubricScores: Record<string, number> = existing?.rubric_scores || {};
  const questions: Array<{ prompt: string; hint?: string }> = Array.isArray(assignment?.assigned_to?.questions) ? assignment.assigned_to.questions : [];
  const attachmentsIn: Array<{ url: string; name: string; kind?: string }> = Array.isArray(assignment?.attachments) ? assignment.attachments : [];

  useEffect(() => {
    if (open) {
      setContent(existing?.content || '');
      setLink('');
      setAttachments(Array.isArray(existing?.attachments) ? existing.attachments : []);
    }
  }, [open, existing]);

  const upload = async (file: File) => {
    if (!user) return;
    try {
      const path = `${assignment.class_id}/submissions/${user.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('class-assignments').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('class-assignments').getPublicUrl(path);
      setAttachments(a => [...a, { kind: 'file', url: data.publicUrl, name: file.name }]);
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    }
  };

  const addLink = () => {
    if (!link.trim()) return;
    setAttachments(a => [...a, { kind: 'link', url: link.trim(), name: link.trim() }]);
    setLink('');
  };

  const submit = async () => {
    if (!user) return;
    if (isUpcoming) {
      return toast({ title: 'Chưa đến giờ mở đề', description: 'Đề bài chưa được mở để nộp bài', variant: 'destructive' });
    }
    setSaving(true);
    const payload: any = {
      assignment_id: assignment.id, student_id: user.id,
      content: content || null, attachments,
      status: 'submitted', submitted_at: new Date().toISOString(),
    };
    const sb: any = supabase;
    const { error } = existing?.id
      ? await sb.from('class_assignment_submissions').update(payload).eq('id', existing.id)
      : await sb.from('class_assignment_submissions').insert(payload);
    setSaving(false);
    if (error) return toast({ title: 'Lỗi nộp bài', description: error.message, variant: 'destructive' });
    toast({ title: '✅ Đã nộp bài' });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nộp bài: {assignment?.title}</DialogTitle></DialogHeader>

        {isUpcoming && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-1 text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 font-semibold">
              <Clock className="w-5 h-5 text-amber-600" />
              🔒 Chưa đến giờ mở đề bài
            </div>
            <p className="text-sm">
              Đề bài/bài kiểm tra này được lên lịch mở lúc{' '}
              <strong>{format(new Date(assignment.start_at), 'HH:mm - dd/MM/yyyy')}</strong>. Bạn chưa thể làm bài hay nộp bài vào lúc này.
            </p>
          </div>
        )}

        {isReturned && (
          <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-green-700">Bài đã được chấm</span>
              <Badge className="bg-green-500/15 text-green-700 border-green-500/30 text-base">
                {existing.score}/{assignment.points || 100}
              </Badge>
            </div>
            {rubric.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-2">
                {rubric.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-background/60 rounded px-2 py-1 border">
                    <span>{c.title}</span>
                    <span className="font-semibold text-primary">{rubricScores[c.title] ?? 0}/{c.max}</span>
                  </div>
                ))}
              </div>
            )}
            {existing.feedback && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">Nhận xét</div>
                <p className="text-sm whitespace-pre-wrap">{existing.feedback}</p>
              </div>
            )}
          </div>
        )}
        <div className="space-y-4">
          {(assignment?.instructions || assignment?.description) && (
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Hướng dẫn</div>
              <p className="text-sm whitespace-pre-wrap">{assignment.instructions || assignment.description}</p>
            </div>
          )}
          {attachmentsIn.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tài liệu từ giáo viên</Label>
              {attachmentsIn.map((a, i) => (
                <a key={i} href={a.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded border hover:bg-muted/40 text-sm">
                  <FileText className="w-4 h-4 text-primary" /><span className="flex-1 truncate">{a.name}</span>
                </a>
              ))}
            </div>
          )}
          {questions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Câu hỏi</Label>
              <ol className="space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="p-3 rounded-lg border bg-card">
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap font-medium">{q.prompt}</p>
                        {q.hint && <p className="text-xs text-muted-foreground italic mt-1">💡 {q.hint}</p>}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div>
            <Label>Nội dung bài làm</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Nhập câu trả lời hoặc mô tả bài làm…" disabled={isUpcoming} />
          </div>
          <div className="space-y-2">
            <Label>Đính kèm</Label>
            <div className="flex flex-wrap gap-2 items-center">
              <label className={`cursor-pointer ${isUpcoming ? 'pointer-events-none opacity-50' : ''}`}>
                <input type="file" className="hidden" disabled={isUpcoming} onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
                <Button asChild variant="outline" size="sm" disabled={isUpcoming}><span><Upload className="w-4 h-4 mr-1" />Tải file</span></Button>
              </label>
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="Dán link…" className="h-9 w-56" disabled={isUpcoming} />
              <Button variant="outline" size="sm" onClick={addLink} disabled={isUpcoming}><Link2 className="w-4 h-4 mr-1" />Thêm link</Button>
            </div>
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                {a.kind === 'file' ? <FileText className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                <button className="flex-1 text-sm truncate hover:underline text-left" onClick={() => setPreviewIdx(previewIdx === i ? null : i)}>{a.name}</button>
                <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-primary">Mở</a>
                <Button variant="ghost" size="icon" disabled={isUpcoming} onClick={() => setAttachments(as => as.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            {previewIdx != null && attachments[previewIdx] && (
              <div className="pt-2"><InlineViewer url={attachments[previewIdx].url} name={attachments[previewIdx].name} /></div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit} disabled={saving || isUpcoming}>
            {isUpcoming ? '🔒 Chưa đến giờ mở đề' : saving ? 'Đang nộp…' : 'Nộp bài'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitDialog;