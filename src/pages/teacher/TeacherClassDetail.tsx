import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Users, BookOpen, BookText, FileText, ClipboardList, Plus, Trash2, Upload, Link2, ExternalLink, Star, Flame, CalendarClock, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';

const TeacherClassDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [cls, setCls] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [vocab, setVocab] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Assignment dialog
  const [aOpen, setAOpen] = useState(false);
  const [aForm, setAForm] = useState({ title: '', description: '', link_url: '', file_url: '', start_at: '', due_date: '', lesson_id: '' });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { if (id) fetchAll(); }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    const sb: any = supabase;
    const [{ data: c }, { data: s }, { data: l }, { data: v }, { data: a }, { data: ex }] = await Promise.all([
      sb.from('classes').select('*').eq('id', id!).maybeSingle(),
      sb.from('class_students').select('*').eq('class_id', id!),
      sb.from('lessons').select('*').eq('class_id', id!).order('start_at', { ascending: true, nullsFirst: false }),
      sb.from('vocabulary').select('*').eq('class_id', id!).order('created_at', { ascending: false }),
      sb.from('class_assignments').select('*').eq('class_id', id!).order('start_at', { ascending: true, nullsFirst: false }),
      sb.from('exams').select('*').eq('class_id', id!).order('exam_date', { ascending: true }),
    ]);
    setCls(c);
    setAssignments(a || []);
    setLessons(l || []);
    setVocab(v || []);
    setExams(ex || []);

    // student profiles + progress
    const studentIds = (s || []).map((x: any) => x.student_id);
    if (studentIds.length) {
      const [{ data: profiles }, { data: progress }] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', studentIds),
        supabase.from('user_progress').select('*').in('user_id', studentIds),
      ]);
      setStudents((s || []).map((x: any) => ({
        ...x,
        profile: profiles?.find(p => p.user_id === x.student_id),
        progress: progress?.find(p => p.user_id === x.student_id),
      })));
    } else setStudents([]);

    // submissions for exercises in this class's lessons
    const lessonIds = (l || []).map((x: any) => x.id);
    if (lessonIds.length) {
      const { data: ex } = await supabase.from('exercises').select('id, title_vi, lesson_id').in('lesson_id', lessonIds);
      const exIds = (ex || []).map(x => x.id);
      if (exIds.length) {
        const { data: subs } = await supabase.from('student_submissions').select('*').in('exercise_id', exIds).order('submitted_at', { ascending: false });
        const userIds = [...new Set((subs || []).map(s => s.user_id))];
        const { data: profs } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
        setSubmissions((subs || []).map(s => ({
          ...s,
          exercise: ex?.find(e => e.id === s.exercise_id),
          profile: profs?.find(p => p.user_id === s.user_id),
        })));
      } else setSubmissions([]);
    } else setSubmissions([]);

    setLoading(false);
  };

  const removeStudent = async (sid: string) => {
    if (!confirm('Xóa học viên khỏi lớp?')) return;
    const { error } = await supabase.from('class_students').delete().eq('class_id', id!).eq('student_id', sid);
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    fetchAll();
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const path = `${id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('class-assignments').upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from('class-assignments').getPublicUrl(path);
      setAForm(f => ({ ...f, file_url: data.publicUrl }));
      toast({ title: 'Đã tải file lên' });
    } catch (e: any) {
      toast({ title: 'Lỗi tải file', description: e.message, variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const saveAssignment = async () => {
    if (!aForm.title.trim()) return toast({ title: 'Thiếu tiêu đề', variant: 'destructive' });
    const payload: any = {
      class_id: id,
      title: aForm.title,
      description: aForm.description || null,
      link_url: aForm.link_url || null,
      file_url: aForm.file_url || null,
      start_at: aForm.start_at || null,
      due_date: aForm.due_date || null,
      lesson_id: aForm.lesson_id || null,
      created_by: user?.id,
    };
    const { error } = await (supabase as any).from('class_assignments').insert(payload);
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    toast({ title: 'Đã tạo bài tập' });
    setAOpen(false);
    setAForm({ title: '', description: '', link_url: '', file_url: '', start_at: '', due_date: '', lesson_id: '' });
    fetchAll();
  };

  const deleteAssignment = async (aid: string) => {
    if (!confirm('Xóa bài tập?')) return;
    const { error } = await (supabase as any).from('class_assignments').delete().eq('id', aid);
    if (error) return toast({ title: 'Lỗi', description: error.message, variant: 'destructive' });
    fetchAll();
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Đang tải...</div>;
  if (!cls) return <div className="text-center py-12">Không tìm thấy lớp học</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link to="/teacher/classes"><ArrowLeft className="w-4 h-4" /></Link></Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{cls.name_vi}</h1>
          <p className="text-sm text-muted-foreground">
            {cls.slug && <span className="font-mono text-xs mr-2">/{cls.slug}</span>}
            {cls.description_vi || cls.name}
          </p>
        </div>
        <Badge className={
          cls.approval_status === 'approved' ? 'bg-green-500/10 text-green-600' :
          cls.approval_status === 'rejected' ? 'bg-red-500/10 text-red-600' :
          'bg-yellow-500/10 text-yellow-700'
        }>
          {cls.approval_status === 'approved' ? 'Đã duyệt' : cls.approval_status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /><span className="text-sm text-muted-foreground">Học viên</span></div><p className="text-2xl font-bold">{students.length}/{cls.max_students}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-blue-500" /><span className="text-sm text-muted-foreground">Bài học</span></div><p className="text-2xl font-bold">{lessons.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><BookText className="w-4 h-4 text-purple-500" /><span className="text-sm text-muted-foreground">Từ vựng</span></div><p className="text-2xl font-bold">{vocab.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><ClipboardList className="w-4 h-4 text-orange-500" /><span className="text-sm text-muted-foreground">Bài tập</span></div><p className="text-2xl font-bold">{assignments.length}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="students">
        <TabsList className="flex-wrap">
          <TabsTrigger value="students"><Users className="w-4 h-4 mr-1" />Học viên</TabsTrigger>
          <TabsTrigger value="lessons"><BookOpen className="w-4 h-4 mr-1" />Bài học</TabsTrigger>
          <TabsTrigger value="vocab"><BookText className="w-4 h-4 mr-1" />Từ vựng</TabsTrigger>
          <TabsTrigger value="assignments"><ClipboardList className="w-4 h-4 mr-1" />Bài tập</TabsTrigger>
          <TabsTrigger value="exams"><GraduationCap className="w-4 h-4 mr-1" />Kiểm tra</TabsTrigger>
          <TabsTrigger value="submissions"><FileText className="w-4 h-4 mr-1" />Bài nộp</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Học viên</TableHead><TableHead>XP</TableHead><TableHead>Streak</TableHead>
                <TableHead>Bài hoàn thành</TableHead><TableHead>Tham gia</TableHead><TableHead className="text-right">Thao tác</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {students.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Chưa có học viên. Quay lại trang lớp học để thêm.</TableCell></TableRow> :
                  students.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.profile?.full_name || '—'}</TableCell>
                      <TableCell><div className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{s.progress?.total_xp || 0}</div></TableCell>
                      <TableCell><div className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" />{s.progress?.streak || 0}</div></TableCell>
                      <TableCell>{s.progress?.lessons_completed || 0}</TableCell>
                      <TableCell>{format(new Date(s.enrolled_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => removeStudent(s.student_id)}><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="lessons" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button asChild size="sm"><Link to="/teacher/lessons"><Plus className="w-4 h-4 mr-1" />Quản lý bài học</Link></Button>
          </div>
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Tiêu đề</TableHead><TableHead>Cấp độ</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader>
              <TableBody>
                {lessons.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Chưa có bài học. Vào "Quản lý bài học" và gán class_id.</TableCell></TableRow> :
                  lessons.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.title_vi}</TableCell>
                      <TableCell>{l.level}</TableCell>
                      <TableCell>{l.is_published ? <Badge className="bg-green-500/10 text-green-600">Đã đăng</Badge> : <Badge variant="outline">Nháp</Badge>}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="vocab" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Từ</TableHead><TableHead>Nghĩa</TableHead><TableHead>Loại</TableHead></TableRow></TableHeader>
              <TableBody>
                {vocab.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Chưa có từ vựng nào trong lớp.</TableCell></TableRow> :
                  vocab.map(v => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.word}</TableCell>
                      <TableCell>{v.meaning_vi || v.meaning}</TableCell>
                      <TableCell>{v.category || '—'}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setAOpen(true)}><Plus className="w-4 h-4 mr-1" />Giao bài tập</Button>
          </div>
          {assignments.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">Chưa có bài tập nào</CardContent></Card>
          ) : assignments.map(a => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{a.title}</h3>
                  {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
                    {a.due_date && <span className="text-muted-foreground">Hạn: {format(new Date(a.due_date), 'dd/MM/yyyy HH:mm')}</span>}
                    {a.file_url && <a href={a.file_url} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1"><ExternalLink className="w-3 h-3" />File đính kèm</a>}
                    {a.link_url && <a href={a.link_url} target="_blank" rel="noreferrer" className="text-primary flex items-center gap-1"><Link2 className="w-3 h-3" />Liên kết</a>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteAssignment(a.id)}><Trash2 className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Học viên</TableHead><TableHead>Bài tập</TableHead><TableHead>Trạng thái</TableHead><TableHead>Điểm</TableHead><TableHead>Nộp lúc</TableHead></TableRow></TableHeader>
              <TableBody>
                {submissions.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Chưa có bài nộp nào</TableCell></TableRow> :
                  submissions.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{s.profile?.full_name || '—'}</TableCell>
                      <TableCell>{s.exercise?.title_vi || '—'}</TableCell>
                      <TableCell>
                        <Badge className={s.status === 'graded' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-700'}>
                          {s.status === 'graded' ? 'Đã chấm' : 'Chờ chấm'}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.score ?? '—'}</TableCell>
                      <TableCell>{format(new Date(s.submitted_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent></Card>
          <div className="text-right mt-3">
            <Button asChild variant="outline" size="sm"><Link to="/teacher/submissions">Sang trang chấm bài</Link></Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Assignment dialog */}
      <Dialog open={aOpen} onOpenChange={setAOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Giao bài tập mới</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Tiêu đề *</Label><Input value={aForm.title} onChange={e => setAForm({ ...aForm, title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Mô tả</Label><Textarea value={aForm.description} onChange={e => setAForm({ ...aForm, description: e.target.value })} rows={3} /></div>
            <div className="space-y-1">
              <Label>Liên kết bài học (tuỳ chọn)</Label>
              <select className="w-full h-10 rounded-md border bg-background px-3 text-sm" value={aForm.lesson_id} onChange={e => setAForm({ ...aForm, lesson_id: e.target.value })}>
                <option value="">— Không —</option>
                {lessons.map(l => <option key={l.id} value={l.id}>{l.title_vi}</option>)}
              </select>
            </div>
            <div className="space-y-1"><Label>Liên kết (URL)</Label><Input value={aForm.link_url} onChange={e => setAForm({ ...aForm, link_url: e.target.value })} placeholder="https://..." /></div>
            <div className="space-y-1">
              <Label className="flex items-center gap-2"><Upload className="w-4 h-4" />Tải file từ máy</Label>
              <Input type="file" disabled={uploading} onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
              {aForm.file_url && <p className="text-xs text-muted-foreground truncate">Đã tải: {aForm.file_url}</p>}
            </div>
            <div className="space-y-1"><Label>Hạn nộp</Label><Input type="datetime-local" value={aForm.due_date} onChange={e => setAForm({ ...aForm, due_date: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAOpen(false)}>Hủy</Button>
            <Button onClick={saveAssignment} disabled={uploading}>Tạo bài tập</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherClassDetail;
