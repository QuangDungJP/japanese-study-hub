import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Send, FileText, Link2 } from 'lucide-react';
import InlineViewer from './InlineViewer';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  assignment: any;
  submission: any;
  studentName?: string;
  onSaved: () => void;
}

const GradingDialog = ({ open, onOpenChange, assignment, submission, studentName, onSaved }: Props) => {
  const { toast } = useToast();
  const rubric: Array<{ title: string; max: number }> = Array.isArray(assignment?.rubric) ? assignment.rubric : [];
  const [scores, setScores] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState('');
  const [total, setTotal] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [previewIdx, setPreviewIdx] = useState(0);

  useEffect(() => {
    if (open) {
      const rs = submission?.rubric_scores || {};
      setScores(rs);
      setFeedback(submission?.feedback || '');
      setTotal(submission?.score ?? sumScores(rs, rubric));
      setPreviewIdx(0);
    }
  }, [open, submission]);

  const sumScores = (s: Record<string, number>, r: typeof rubric) =>
    r.reduce((acc, c) => acc + (Number(s[c.title]) || 0), 0);

  const updateScore = (title: string, val: number, max: number) => {
    const v = Math.max(0, Math.min(max, val || 0));
    const next = { ...scores, [title]: v };
    setScores(next);
    setTotal(sumScores(next, rubric));
  };

  const aiFeedback = async () => {
    setAiLoading(true);
    try {
      const content = [submission?.content, ...(submission?.attachments || []).map((a: any) => `[${a.kind}] ${a.name}`)].filter(Boolean).join('\n');
      const { data, error } = await supabase.functions.invoke('classroom-ai', {
        body: { action: 'suggest_feedback', rubric, content },
      });
      if (error) throw error;
      if (data?.feedback) setFeedback(data.feedback);
      if (data?.suggested_score != null) setTotal(data.suggested_score);
      toast({ title: '✨ Đã áp dụng gợi ý AI' });
    } catch (e: any) {
      toast({ title: 'AI lỗi', description: e.message, variant: 'destructive' });
    } finally { setAiLoading(false); }
  };

  const save = async (returnToStudent = false) => {
    setSaving(true);
    const payload: any = {
      score: total,
      feedback: feedback || null,
      rubric_scores: scores,
      status: returnToStudent ? 'graded' : (submission?.status || 'submitted'),
      returned_at: returnToStudent ? new Date().toISOString() : submission?.returned_at || null,
    };
    const { error } = await (supabase as any).from('class_assignment_submissions').update(payload).eq('id', submission.id);
    setSaving(false);
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    toast({ title: returnToStudent ? '✅ Đã trả bài cho học viên' : 'Đã lưu điểm' });
    onSaved();
    if (returnToStudent) onOpenChange(false);
  };

  const atts: any[] = Array.isArray(submission?.attachments) ? submission.attachments : [];
  const current = atts[previewIdx];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[92vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-3 border-b bg-primary/5">
          <DialogTitle className="text-base">
            Chấm bài · <span className="text-primary">{studentName || 'Học viên'}</span> · {assignment?.title}
          </DialogTitle>
        </DialogHeader>
        <div className="grid md:grid-cols-[1fr_380px] h-full overflow-hidden">
          <div className="p-5 overflow-y-auto space-y-4 bg-muted/10">
            {submission?.content && (
              <Card><CardContent className="p-4">
                <Label className="text-xs uppercase text-muted-foreground">Nội dung bài làm</Label>
                <p className="whitespace-pre-wrap mt-2 text-sm">{submission.content}</p>
              </CardContent></Card>
            )}
            {atts.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {atts.map((a, i) => (
                    <Button key={i} variant={i === previewIdx ? 'default' : 'outline'} size="sm" onClick={() => setPreviewIdx(i)}>
                      {a.kind === 'link' ? <Link2 className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                      <span className="max-w-[180px] truncate">{a.name}</span>
                    </Button>
                  ))}
                </div>
                {current && <InlineViewer url={current.url} name={current.name} />}
              </div>
            )}
            {!submission?.content && atts.length === 0 && (
              <Card><CardContent className="py-16 text-center text-muted-foreground">Học viên chưa nộp nội dung</CardContent></Card>
            )}
          </div>

          <div className="border-l p-5 overflow-y-auto space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase text-muted-foreground">Tổng điểm</div>
                <div className="text-3xl font-bold text-primary">{total}<span className="text-base text-muted-foreground">/{assignment?.points || 100}</span></div>
              </div>
              <Button size="sm" variant="outline" onClick={aiFeedback} disabled={aiLoading}>
                <Sparkles className="w-4 h-4 mr-1" />{aiLoading ? '…' : 'AI feedback'}
              </Button>
            </div>

            {rubric.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-xs uppercase text-muted-foreground">Rubric</Label>
                {rubric.map((c, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{c.title}</span>
                      <Badge variant="outline">/{c.max}</Badge>
                    </div>
                    <Input type="number" min={0} max={c.max} value={scores[c.title] ?? ''} placeholder="0"
                      onChange={e => updateScore(c.title, parseFloat(e.target.value), c.max)} />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <Label className="text-xs uppercase text-muted-foreground">Điểm</Label>
                <Input type="number" value={total} onChange={e => setTotal(parseFloat(e.target.value) || 0)} />
              </div>
            )}

            <div>
              <Label className="text-xs uppercase text-muted-foreground">Nhận xét</Label>
              <Textarea rows={6} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Nhận xét cho học viên…" className="mt-1" />
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-3 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button variant="outline" onClick={() => save(false)} disabled={saving}>Lưu nháp</Button>
          <Button onClick={() => save(true)} disabled={saving}>
            <Send className="w-4 h-4 mr-1" />Trả bài
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GradingDialog;