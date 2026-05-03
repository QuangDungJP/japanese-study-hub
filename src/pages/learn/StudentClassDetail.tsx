import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, BookOpen, ClipboardList, GraduationCap, CalendarClock, ExternalLink, Link2, Play, Clock, Upload, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const StudentClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [cls, setCls] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [subOpen, setSubOpen] = useState(false);
  const [subAssignment, setSubAssignment] = useState<any>(null);
  const [subForm, setSubForm] = useState({ content: '', link_url: '', file_url: '' });
  const [uploading, setUploading] = useState(false);

  const fetchAll = async () => {
    if (!id || !user) return;
    const sb: any = supabase;
    const [{ data: c }, { data: l }, { data: a }, { data: e }, { data: s }] = await Promise.all([
      sb.from('classes').select('*').eq('id', id).maybeSingle(),
      sb.from('lessons').select('*').eq('class_id', id).eq('is_published', true).order('start_at', { ascending: true, nullsFirst: false }),
      sb.from('class_assignments').select('*').eq('class_id', id).order('start_at', { ascending: true, nullsFirst: false }),
      sb.from('exams').select('*').eq('class_id', id).eq('is_published', true).order('exam_date', { ascending: true }),
      sb.from('class_assignment_submissions').select('*').eq('student_id', user.id),
    ]);
    setCls(c); setLessons(l || []); setAssignments(a || []); setExams(e || []); setSubmissions(s || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [id, user]);

  const now = new Date();
  const isAvailable = (start?: string | null, end?: string | null) => {
    if (start && new Date(start) > now) return 'upcoming';
    if (end && new Date(end) < now) return 'ended';
    return 'open';
  };

  const submissionFor = (aid: string) => submissions.find(s => s.assignment_id === aid);

  const canSubmit = (a: any): { ok: boolean; reason?: string } => {
    if (a.start_at && new Date(a.start_at) > now) return { ok: false, reason: 'Bài tập chưa mở để nộp' };
    if (a.due_date && new Date(a.due_date) < now) return { ok: false, reason: 'Bài tập đã quá hạn nộp' };
    return { ok: true };
  };

  const openSubmit = (a: any) => {
    const gate = canSubmit(a);
    if (!gate.ok) {
      toast({ title: 'Không thể nộp', description: gate.reason, variant: 'destructive' });
      return;
    }
    const ex = submissionFor(a.id);
    setSubAssignment(a);
    setSubForm({ content: ex?.content || '', link_url: ex?.link_url || '', file_url: ex?.file_url || '' });
    setSubOpen(true);
  };

  const handleUpload = async (file: File) => {
    if (!user || !subAssignment) return;
    setUploading(true);
    try {
      const path = `submissions/${user.id}/${subAssignment.id}_${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('class-assignments').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('class-assignments').getPublicUrl(path);
      setSubForm(f => ({ ...f, file_url: data.publicUrl }));
      toast({ title: 'Đã tải file lên' });
    } catch (e: any) {
      toast({ title: 'Lỗi', description: e.message, variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const submitAssignment = async () => {
    if (!user || !subAssignment) return;
    const gate = canSubmit(subAssignment);
    if (!gate.ok) {
      return toast({ title: 'Không thể nộp', description: gate.reason, variant: 'destructive' });
    }
    if (!subForm.content && !subForm.link_url && !subForm.file_url) {
      return toast({ title: 'Vui lòng nhập nội dung, liên kết hoặc tệp', variant: 'destructive' });
    }
    const sb: any = supabase;
    const payload = {
      assignment_id: subAssignment.id,
      student_id: user.id,
      content: subForm.content || null,
      link_url: subForm.link_url || null,
      file_url: subForm.file_url || null,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    };
    const { error } = await sb.from('class_assignment_submissions').upsert(payload, { onConflict: 'assignment_id,student_id' });
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    toast({ title: 'Đã nộp bài' });
    setSubOpen(false);
    fetchAll();
  };

  const statusBadge = (sub: any, a: any) => {
    if (!sub) {
      if (a.due_date && new Date(a.due_date) < now) return <Badge className="bg-red-500/10 text-red-600">Quá hạn</Badge>;
      return <Badge variant="outline">Chưa nộp</Badge>;
    }
    if (sub.status === 'graded') return <Badge className="bg-green-500/10 text-green-600">Đã chấm{sub.score != null ? ` • ${sub.score}` : ''}</Badge>;
    return <Badge className="bg-blue-500/10 text-blue-600">Chờ duyệt</Badge>;
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Đang tải...</div>;
  if (!cls) return <div className="text-center py-12">Không tìm thấy lớp học</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/learn/classes"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{cls.name_vi}</h1>
          <p className="text-sm text-muted-foreground">{cls.description_vi || cls.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /><span className="text-sm text-muted-foreground">Bài học</span></div><p className="text-2xl font-bold">{lessons.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-orange-500" /><span className="text-sm text-muted-foreground">Bài tập</span></div><p className="text-2xl font-bold">{assignments.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-purple-500" /><span className="text-sm text-muted-foreground">Kiểm tra</span></div><p className="text-2xl font-bold">{exams.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="lessons">
        <TabsList className="flex-wrap">
          <TabsTrigger value="lessons"><BookOpen className="w-4 h-4 mr-1" />Bài học</TabsTrigger>
          <TabsTrigger value="assignments"><ClipboardList className="w-4 h-4 mr-1" />Bài tập</TabsTrigger>
          <TabsTrigger value="exams"><GraduationCap className="w-4 h-4 mr-1" />Kiểm tra</TabsTrigger>
          <TabsTrigger value="submissions"><FileText className="w-4 h-4 mr-1" />Nộp bài</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="mt-4 space-y-3">
          {lessons.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có bài học nào</CardContent></Card> :
            lessons.map(l => {
              const st = isAvailable(l.start_at, l.end_at);
              return (
                <Card key={l.id}>
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{l.title_vi}</h3>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        {l.start_at && <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{format(new Date(l.start_at), 'dd/MM HH:mm')}{l.end_at && ` → ${format(new Date(l.end_at), 'HH:mm')}`}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{l.duration_minutes} phút</span>
                      </div>
                    </div>
                    {st === 'upcoming' ? <Badge variant="outline">Sắp tới</Badge> :
                     st === 'ended' ? <Badge variant="outline">Đã kết thúc</Badge> :
                     <Button size="sm" asChild><Link to={`/learn/${l.skill}`}><Play className="w-4 h-4 mr-1" />Vào học</Link></Button>}
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="assignments" className="mt-4 space-y-3">
          {assignments.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có bài tập</CardContent></Card> :
            assignments.map(a => {
              const st = isAvailable(a.start_at, a.due_date);
              const sub = submissionFor(a.id);
              const overdue = a.due_date && new Date(a.due_date) < now;
              return (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{a.title}</h3>
                          {statusBadge(sub, a)}
                        </div>
                        {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                        <div className="flex flex-wrap gap-3 mt-2 text-xs">
                          {a.start_at && <span className="text-muted-foreground flex items-center gap-1"><CalendarClock className="w-3 h-3" />Mở: {format(new Date(a.start_at), 'dd/MM HH:mm')}</span>}
                          {a.due_date && <span className="text-muted-foreground">Hạn: {format(new Date(a.due_date), 'dd/MM HH:mm')}</span>}
                          {a.file_url && <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1"><ExternalLink className="w-3 h-3" />Tệp đề bài</a>}
                          {a.link_url && <a href={a.link_url} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1"><Link2 className="w-3 h-3" />Liên kết</a>}
                        </div>
                      </div>
                      {(() => {
                        const gate = canSubmit(a);
                        if (st === 'upcoming' || (a.start_at && new Date(a.start_at) > now)) {
                          return <Badge variant="outline">Chưa mở</Badge>;
                        }
                        if (!gate.ok && !sub) {
                          return <Badge variant="outline" className="text-red-600">Đã đóng</Badge>;
                        }
                        if (!gate.ok && sub) {
                          return <Button size="sm" variant="outline" disabled><Upload className="w-4 h-4 mr-1" />Đã đóng</Button>;
                        }
                        return (
                          <Button size="sm" variant={sub ? 'outline' : 'default'} onClick={() => openSubmit(a)}>
                            <Upload className="w-4 h-4 mr-1" />{sub ? 'Cập nhật' : 'Nộp bài'}
                          </Button>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>

        <TabsContent value="exams" className="mt-4 space-y-3">
          {exams.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có kiểm tra</CardContent></Card> :
            exams.map(e => (
              <Card key={e.id}>
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{e.title_vi || e.title}</h3>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CalendarClock className="w-3 h-3" />{format(new Date(e.exam_date), 'dd/MM/yyyy')} • {e.start_time}{e.end_time && ` → ${e.end_time}`}</span>
                      <span>{e.duration_minutes} phút</span>
                    </div>
                  </div>
                  <Badge variant="outline">{e.exam_type}</Badge>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="submissions" className="mt-4 space-y-3">
          {assignments.length === 0 ? <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có bài tập để nộp</CardContent></Card> :
            assignments.map(a => {
              const sub = submissionFor(a.id);
              return (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{a.title}</h3>
                          {statusBadge(sub, a)}
                        </div>
                        {a.due_date && <p className="text-xs text-muted-foreground mt-1">Hạn: {format(new Date(a.due_date), 'dd/MM/yyyy HH:mm')}</p>}
                        {sub && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-sm space-y-1">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                              Đã nộp: {format(new Date(sub.submitted_at), 'dd/MM/yyyy HH:mm')}
                            </div>
                            {sub.content && <p className="whitespace-pre-wrap">{sub.content}</p>}
                            <div className="flex gap-3 text-xs">
                              {sub.file_url && <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1"><ExternalLink className="w-3 h-3" />Tệp đã nộp</a>}
                              {sub.link_url && <a href={sub.link_url} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1"><Link2 className="w-3 h-3" />Liên kết</a>}
                            </div>
                            {sub.feedback && <div className="text-xs border-t pt-1 mt-1"><strong>Phản hồi:</strong> {sub.feedback}</div>}
                          </div>
                        )}
                      </div>
                      {(() => {
                        const gate = canSubmit(a);
                        const disabled = !gate.ok;
                        return (
                          <Button size="sm" variant={sub ? 'outline' : 'default'} disabled={disabled && !sub} onClick={() => openSubmit(a)} title={gate.reason}>
                            <Upload className="w-4 h-4 mr-1" />{sub ? (disabled ? 'Đã đóng' : 'Cập nhật') : (disabled ? (a.start_at && new Date(a.start_at) > now ? 'Chưa mở' : 'Quá hạn') : 'Nộp bài')}
                          </Button>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </TabsContent>
      </Tabs>

      <Dialog open={subOpen} onOpenChange={setSubOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nộp bài: {subAssignment?.title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nội dung trả lời</Label>
              <Textarea rows={4} value={subForm.content} onChange={(e) => setSubForm(f => ({ ...f, content: e.target.value }))} placeholder="Câu trả lời, ghi chú..." />
            </div>
            <div>
              <Label>Liên kết (tùy chọn)</Label>
              <Input value={subForm.link_url} onChange={(e) => setSubForm(f => ({ ...f, link_url: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <Label>Tệp đính kèm (tùy chọn)</Label>
              <Input type="file" disabled={uploading} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              {subForm.file_url && <a href={subForm.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary flex items-center gap-1 mt-1"><ExternalLink className="w-3 h-3" />Xem tệp đã tải</a>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSubOpen(false)}>Hủy</Button>
            <Button onClick={submitAssignment} disabled={uploading}>Nộp bài</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentClassDetail;
