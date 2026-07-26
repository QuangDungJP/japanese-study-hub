import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Plus, Loader2, Pencil, Trash2, Video, Users, Lock,
  ListChecks, Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import ExamBuilder from './ExamBuilder';

interface Question {
  type?: string;
  text: string;
  options: string[];
  correct_index: number;
  points?: number;
}

interface Exam {
  id: string;
  title: string;
  title_vi: string;
  description_vi: string | null;
  instructions: string | null;
  video_url: string | null;
  exam_type: string;
  exam_date: string;
  start_time: string;
  duration_minutes: number;
  meet_link: string | null;
  max_score: number | null;
  passing_score: number | null;
  is_published: boolean;
  class_id: string | null;
  teacher_id: string;
  starts_at: string | null;
  ends_at: string | null;
  lock_after_end: boolean;
  shuffle_questions: boolean;
  max_attempts: number;
  questions: Question[];
}

interface Class { id: string; name_vi: string }

export const ExamManager = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderInitial, setBuilderInitial] = useState<Exam | null>(null);
  const [attemptsExam, setAttemptsExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'upcoming' | 'open' | 'closed'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'reviewed' | 'needs_revision'>('all');
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    try {
      const { data: ex } = await supabase.from('exams').select('*').eq('teacher_id', user?.id).order('exam_date', { ascending: false });
      setExams((ex as unknown as Exam[]) || []);
      const { data: cl } = await supabase.from('classes').select('id, name_vi').eq('teacher_id', user?.id);
      setClasses(cl || []);
    } finally { setLoading(false); }
  };

  const openCreate = () => { setBuilderInitial(null); setBuilderOpen(true); };
  const openEdit = (exam: Exam) => { setBuilderInitial(exam); setBuilderOpen(true); };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa bài kiểm tra này?')) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) toast.error('Không thể xóa'); else { toast.success('Đã xóa'); fetchData(); }
  };

  const openAttempts = async (exam: Exam) => {
    setAttemptsExam(exam);
    const { data } = await supabase
      .from('exam_attempts')
      .select('id, student_id, status, score, total, submitted_at, time_spent_seconds, started_at, student_comment, attachment_url, attachment_name, video_url, review_status, teacher_feedback, reviewed_at')
      .eq('exam_id', exam.id).order('submitted_at', { ascending: false });
    let rows: any[] = data || [];
    if (rows.length) {
      const ids = Array.from(new Set(rows.map((r) => r.student_id)));
      const { data: profs } = await supabase.from('profiles').select('user_id, full_name').in('user_id', ids);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
      rows = rows.map((r) => ({ ...r, full_name: map.get(r.student_id) || 'Học viên' }));
    }
    setAttempts(rows);
    const drafts: Record<string, string> = {};
    rows.forEach((r) => { drafts[r.id] = r.teacher_feedback || ''; });
    setFeedbackDraft(drafts);
  };

  const updateReview = async (attemptId: string, review_status: 'pending' | 'reviewed' | 'needs_revision') => {
    const teacher_feedback = feedbackDraft[attemptId] ?? null;
    const { error } = await supabase.from('exam_attempts').update({
      review_status, teacher_feedback, reviewed_at: review_status === 'pending' ? null : new Date().toISOString(),
    }).eq('id', attemptId);
    if (error) { toast.error('Không lưu được', { description: error.message }); return; }
    toast.success('Đã cập nhật trạng thái');
    setAttempts((arr) => arr.map((a) => a.id === attemptId ? { ...a, review_status, teacher_feedback, reviewed_at: new Date().toISOString() } : a));
  };

  const reviewBadge = (s?: string) => {
    if (s === 'reviewed') return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">Đã chấm</Badge>;
    if (s === 'needs_revision') return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">Cần sửa</Badge>;
    return <Badge variant="outline">Chưa chấm</Badge>;
  };

  const getExamTypeBadge = (type: string) => {
    const map: Record<string, JSX.Element> = {
      quiz: <Badge variant="secondary">Quiz</Badge>,
      midterm: <Badge className="bg-primary text-primary-foreground">Giữa kỳ</Badge>,
      final: <Badge className="bg-accent text-accent-foreground">Cuối kỳ</Badge>,
      placement: <Badge variant="outline">Xếp lớp</Badge>,
    };
    return map[type] || <Badge>{type}</Badge>;
  };

  const statusBadge = (e: Exam) => {
    const now = Date.now();
    if (!e.is_published) return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">Nháp</Badge>;
    if (e.starts_at && new Date(e.starts_at).getTime() > now) return <Badge className="bg-blue-500/10 text-blue-600">Sắp diễn ra</Badge>;
    if (e.ends_at && new Date(e.ends_at).getTime() < now) return <Badge className="bg-rose-500/10 text-rose-600">Đã đóng</Badge>;
    return <Badge className="bg-emerald-500/10 text-emerald-600">Đang mở</Badge>;
  };

  const examStatus = (e: Exam): 'draft' | 'upcoming' | 'open' | 'closed' => {
    const now = Date.now();
    if (!e.is_published) return 'draft';
    if (e.starts_at && new Date(e.starts_at).getTime() > now) return 'upcoming';
    if (e.ends_at && new Date(e.ends_at).getTime() < now) return 'closed';
    return 'open';
  };

  const examTime = (e: Exam) => {
    if (e.starts_at) return new Date(e.starts_at).getTime();
    return new Date(`${e.exam_date}T${e.start_time || '00:00'}`).getTime();
  };

  const visibleExams = exams
    .filter((e) => statusFilter === 'all' ? true : examStatus(e) === statusFilter)
    .sort((a, b) => sortOrder === 'desc' ? examTime(b) - examTime(a) : examTime(a) - examTime(b));

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quản lý bài kiểm tra</h2>
          <p className="text-muted-foreground text-sm">Trình tạo đề nhiều loại câu hỏi, AI hỗ trợ, timer, khóa nộp, chấm điểm tự động.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Tạo mới</Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Trạng thái:</span>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="draft">Nháp</SelectItem>
            <SelectItem value="upcoming">Sắp diễn ra</SelectItem>
            <SelectItem value="open">Đang mở</SelectItem>
            <SelectItem value="closed">Đã đóng</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-2">Sắp xếp:</span>
        <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Mới nhất trước</SelectItem>
            <SelectItem value="asc">Cũ nhất trước</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">{visibleExams.length}/{exams.length} bài</span>
      </div>

      {visibleExams.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">{exams.length === 0 ? 'Chưa có bài kiểm tra' : 'Không có bài kiểm tra phù hợp bộ lọc'}</h3>
          <p className="text-muted-foreground">{exams.length === 0 ? 'Tạo bài kiểm tra mới để bắt đầu' : 'Thử đổi bộ lọc trạng thái'}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {visibleExams.map((exam) => (
            <Card key={exam.id} className="hover:shadow-md transition">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{exam.title_vi || exam.title}</h3>
                      {getExamTypeBadge(exam.exam_type)}
                      {statusBadge(exam)}
                      <Badge variant="outline" className="gap-1"><ListChecks className="w-3 h-3" />{(exam.questions || []).length} câu</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(exam.exam_date), 'dd/MM/yyyy', { locale: vi })} lúc {exam.start_time} • {exam.duration_minutes} phút
                    </div>
                    <div className="flex gap-3 text-xs text-muted-foreground flex-wrap">
                      {exam.lock_after_end && <span className="flex items-center gap-1"><Lock className="w-3 h-3" />Khóa nộp sau hạn</span>}
                      <span>Tối đa {exam.max_attempts || 1} lượt</span>
                      {exam.meet_link && <span className="text-primary flex items-center gap-1"><Video className="w-3 h-3" />Meet</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => openAttempts(exam)}><Trophy className="w-4 h-4 mr-1" />Bài làm</Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(exam)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(exam.id)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {user && (
        <ExamBuilder
          open={builderOpen}
          onOpenChange={setBuilderOpen}
          classes={classes.map((c) => ({ id: c.id, name: c.name_vi }))}
          teacherId={user.id}
          initial={builderInitial}
          onSaved={fetchData}
        />
      )}

      <Dialog open={!!attemptsExam} onOpenChange={() => setAttemptsExam(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Bài làm – {attemptsExam?.title_vi}</DialogTitle></DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Lọc chấm bài:</span>
            <Select value={reviewFilter} onValueChange={(v) => setReviewFilter(v as any)}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="pending">Chưa chấm</SelectItem>
                <SelectItem value="reviewed">Đã chấm</SelectItem>
                <SelectItem value="needs_revision">Cần sửa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {attempts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có học viên làm bài.</p>
          ) : (
            <div className="space-y-2">
              {attempts.filter((a) => reviewFilter === 'all' ? true : (a.review_status || 'pending') === reviewFilter).map((a) => (
                <div key={a.id} className="p-3 rounded-lg border space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium">{a.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.submitted_at ? `Nộp lúc ${new Date(a.submitted_at).toLocaleString('vi-VN')}` : 'Đang làm bài'}
                        {a.time_spent_seconds ? ` • ${Math.floor(a.time_spent_seconds / 60)}p ${a.time_spent_seconds % 60}s` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={a.status === 'auto_submitted' ? 'destructive' : a.status === 'in_progress' ? 'outline' : 'default'}>
                        {a.status === 'in_progress' ? 'Đang làm' : a.status === 'auto_submitted' ? 'Hết giờ' : 'Đã nộp'}
                      </Badge>
                      {reviewBadge(a.review_status)}
                      {a.score != null && <span className="font-bold text-primary">{a.score}/{a.total}</span>}
                    </div>
                  </div>
                  {(a.student_comment || a.attachment_url || a.video_url) && (
                    <div className="rounded-md bg-muted/40 p-2 text-sm space-y-1">
                      {a.student_comment && <p className="whitespace-pre-wrap">{a.student_comment}</p>}
                      <div className="flex gap-3 flex-wrap text-xs">
                        {a.attachment_url && (
                          <a href={a.attachment_url} target="_blank" rel="noreferrer" className="text-primary underline">
                            📎 {a.attachment_name || 'File đính kèm'}
                          </a>
                        )}
                        {a.video_url && (
                          <a href={a.video_url} target="_blank" rel="noreferrer" className="text-primary underline">
                            🎬 Video trả lời
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {a.status !== 'in_progress' && (
                    <div className="space-y-2 pt-1 border-t">
                      <Textarea
                        rows={2}
                        placeholder="Nhận xét của giáo viên..."
                        value={feedbackDraft[a.id] ?? ''}
                        onChange={(e) => setFeedbackDraft((d) => ({ ...d, [a.id]: e.target.value }))}
                      />
                      <div className="flex gap-2 flex-wrap">
                        <Button size="sm" variant="outline" onClick={() => updateReview(a.id, 'reviewed')}>
                          ✓ Đã chấm
                        </Button>
                        <Button size="sm" variant="outline" className="text-amber-600 border-amber-500/30" onClick={() => updateReview(a.id, 'needs_revision')}>
                          ↺ Cần sửa
                        </Button>
                        {a.review_status && a.review_status !== 'pending' && (
                          <Button size="sm" variant="ghost" onClick={() => updateReview(a.id, 'pending')}>
                            Đặt lại Chưa chấm
                          </Button>
                        )}
                        {a.reviewed_at && (
                          <span className="text-xs text-muted-foreground ml-auto self-center">
                            Chấm: {new Date(a.reviewed_at).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
