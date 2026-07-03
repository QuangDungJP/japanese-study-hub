import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, Link2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
  const rubric: Array<{ title: string; max: number }> = Array.isArray(assignment?.rubric) ? assignment.rubric : [];
  const rubricScores: Record<string, number> = existing?.rubric_scores || {};

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
          <div>
            <Label>Nội dung bài làm</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Nhập câu trả lời hoặc mô tả bài làm…" />
          </div>
          <div className="space-y-2">
            <Label>Đính kèm</Label>
            <div className="flex flex-wrap gap-2 items-center">
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={e => e.target.files?.[0] && upload(e.target.files[0])} />
                <Button asChild variant="outline" size="sm"><span><Upload className="w-4 h-4 mr-1" />Tải file</span></Button>
              </label>
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="Dán link…" className="h-9 w-56" />
              <Button variant="outline" size="sm" onClick={addLink}><Link2 className="w-4 h-4 mr-1" />Thêm link</Button>
            </div>
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                {a.kind === 'file' ? <FileText className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                <button className="flex-1 text-sm truncate hover:underline text-left" onClick={() => setPreviewIdx(previewIdx === i ? null : i)}>{a.name}</button>
                <a href={a.url} target="_blank" rel="noreferrer" className="text-xs text-primary">Mở</a>
                <Button variant="ghost" size="icon" onClick={() => setAttachments(as => as.filter((_, j) => j !== i))}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            {previewIdx != null && attachments[previewIdx] && (
              <div className="pt-2"><InlineViewer url={attachments[previewIdx].url} name={attachments[previewIdx].name} /></div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={submit} disabled={saving}>{saving ? 'Đang nộp…' : 'Nộp bài'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitDialog;