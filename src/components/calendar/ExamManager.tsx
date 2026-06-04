import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  CalendarIcon, Plus, Loader2, Pencil, Trash2, Video, Users, Lock,
  ListChecks, Trophy, Copy, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  title_vi: z.string().min(1, 'Vui lòng nhập tiêu đề tiếng Việt'),
  description_vi: z.string().optional(),
  instructions: z.string().optional(),
  video_url: z.string().optional(),
  exam_type: z.enum(['quiz', 'midterm', 'final', 'placement']),
  exam_date: z.date({ required_error: 'Vui lòng chọn ngày' }),
  start_time: z.string().min(1, 'Chọn giờ'),
  duration_minutes: z.number().min(1),
  meet_link: z.string().optional(),
  max_score: z.number().min(1).default(100),
  passing_score: z.number().min(0).default(50),
  is_published: z.boolean().default(false),
  class_id: z.string().optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  lock_after_end: z.boolean().default(true),
  shuffle_questions: z.boolean().default(false),
  max_attempts: z.number().min(1).default(1),
});

type FormValues = z.infer<typeof formSchema>;

interface Question {
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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attemptsExam, setAttemptsExam] = useState<Exam | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '', title_vi: '', description_vi: '', instructions: '', video_url: '',
      exam_type: 'quiz', start_time: '09:00', duration_minutes: 60,
      meet_link: '', max_score: 100, passing_score: 50, is_published: false, class_id: '',
      starts_at: '', ends_at: '', lock_after_end: true, shuffle_questions: false, max_attempts: 1,
    },
  });

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    try {
      const { data: ex } = await supabase.from('exams').select('*').eq('teacher_id', user?.id).order('exam_date', { ascending: false });
      setExams((ex as unknown as Exam[]) || []);
      const { data: cl } = await supabase.from('classes').select('id, name_vi').eq('teacher_id', user?.id);
      setClasses(cl || []);
    } finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditingExam(null);
    setQuestions([]);
    form.reset({
      title: '', title_vi: '', description_vi: '', instructions: '', video_url: '',
      exam_type: 'quiz', start_time: '09:00', duration_minutes: 60,
      meet_link: '', max_score: 100, passing_score: 50, is_published: false, class_id: '',
      starts_at: '', ends_at: '', lock_after_end: true, shuffle_questions: false, max_attempts: 1,
    });
    setIsDialogOpen(true);
  };

  const openEdit = (exam: Exam) => {
    setEditingExam(exam);
    setQuestions(Array.isArray(exam.questions) ? exam.questions : []);
    form.reset({
      title: exam.title, title_vi: exam.title_vi,
      description_vi: exam.description_vi || '',
      instructions: exam.instructions || '',
      video_url: exam.video_url || '',
      exam_type: exam.exam_type as any,
      exam_date: new Date(exam.exam_date),
      start_time: exam.start_time,
      duration_minutes: exam.duration_minutes,
      meet_link: exam.meet_link || '',
      max_score: exam.max_score || 100,
      passing_score: exam.passing_score || 50,
      is_published: exam.is_published,
      class_id: exam.class_id || '',
      starts_at: exam.starts_at ? exam.starts_at.slice(0, 16) : '',
      ends_at: exam.ends_at ? exam.ends_at.slice(0, 16) : '',
      lock_after_end: exam.lock_after_end ?? true,
      shuffle_questions: exam.shuffle_questions ?? false,
      max_attempts: exam.max_attempts ?? 1,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const payload = {
        title: values.title, title_vi: values.title_vi,
        description_vi: values.description_vi || null,
        instructions: values.instructions || null,
        video_url: values.video_url || null,
        exam_type: values.exam_type,
        exam_date: format(values.exam_date, 'yyyy-MM-dd'),
        start_time: values.start_time,
        duration_minutes: values.duration_minutes,
        meet_link: values.meet_link || null,
        max_score: values.max_score, passing_score: values.passing_score,
        is_published: values.is_published,
        class_id: values.class_id || null,
        teacher_id: user.id,
        starts_at: values.starts_at ? new Date(values.starts_at).toISOString() : null,
        ends_at: values.ends_at ? new Date(values.ends_at).toISOString() : null,
        lock_after_end: values.lock_after_end,
        shuffle_questions: values.shuffle_questions,
        max_attempts: values.max_attempts,
        questions: questions as any,
      };
      if (editingExam) {
        const { error } = await supabase.from('exams').update(payload).eq('id', editingExam.id);
        if (error) throw error;
        toast.success('Đã cập nhật');
      } else {
        const { error } = await supabase.from('exams').insert(payload);
        if (error) throw error;
        toast.success('Đã tạo bài kiểm tra');
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error('Lỗi', { description: e.message });
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa bài kiểm tra này?')) return;
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) toast.error('Không thể xóa'); else { toast.success('Đã xóa'); fetchData(); }
  };

  const openAttempts = async (exam: Exam) => {
    setAttemptsExam(exam);
    const { data } = await supabase
      .from('exam_attempts')
      .select('id, student_id, status, score, total, submitted_at, time_spent_seconds, started_at')
      .eq('exam_id', exam.id).order('submitted_at', { ascending: false });
    let rows: any[] = data || [];
    if (rows.length) {
      const ids = Array.from(new Set(rows.map((r) => r.student_id)));
      const { data: profs } = await supabase.from('profiles').select('user_id, full_name').in('user_id', ids);
      const map = new Map((profs || []).map((p: any) => [p.user_id, p.full_name]));
      rows = rows.map((r) => ({ ...r, full_name: map.get(r.student_id) || 'Học viên' }));
    }
    setAttempts(rows);
  };

  const updateQuestion = (i: number, patch: Partial<Question>) =>
    setQuestions((arr) => arr.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const addQuestion = () => setQuestions((a) => [...a, { text: '', options: ['', '', '', ''], correct_index: 0, points: 1 }]);
  const removeQuestion = (i: number) => setQuestions((a) => a.filter((_, idx) => idx !== i));
  const duplicateQuestion = (i: number) => setQuestions((a) => [...a.slice(0, i + 1), { ...a[i], options: [...a[i].options] }, ...a.slice(i + 1)]);

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

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quản lý bài kiểm tra</h2>
          <p className="text-muted-foreground text-sm">Tạo bài kiểm tra có timer, khóa nộp, chấm điểm tự động.</p>
        </div>
        <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />Tạo mới</Button>
      </div>

      {exams.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Chưa có bài kiểm tra</h3>
          <p className="text-muted-foreground">Tạo bài kiểm tra mới để bắt đầu</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingExam ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}</DialogTitle></DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="basic">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="basic">Thông tin</TabsTrigger>
                  <TabsTrigger value="timing">Lịch & Khóa</TabsTrigger>
                  <TabsTrigger value="questions">Câu hỏi ({questions.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem><FormLabel>Tiêu đề (EN)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="title_vi" render={({ field }) => (
                      <FormItem><FormLabel>Tiêu đề (VI)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="exam_type" render={({ field }) => (
                      <FormItem><FormLabel>Loại</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="quiz">Quiz</SelectItem>
                            <SelectItem value="midterm">Giữa kỳ</SelectItem>
                            <SelectItem value="final">Cuối kỳ</SelectItem>
                            <SelectItem value="placement">Xếp lớp</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="class_id" render={({ field }) => (
                      <FormItem><FormLabel>Lớp</FormLabel>
                        <Select onValueChange={(v) => field.onChange(v === 'all' ? '' : v)} value={field.value || 'all'}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_vi}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField control={form.control} name="exam_date" render={({ field }) => (
                      <FormItem className="flex flex-col"><FormLabel>Ngày</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn('pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                                {field.value ? format(field.value, 'dd/MM/yyyy') : 'Chọn...'}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus className="pointer-events-auto" />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="start_time" render={({ field }) => (
                      <FormItem><FormLabel>Giờ</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="duration_minutes" render={({ field }) => (
                      <FormItem><FormLabel>Thời lượng (phút)</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="max_score" render={({ field }) => (
                      <FormItem><FormLabel>Điểm tối đa</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="passing_score" render={({ field }) => (
                      <FormItem><FormLabel>Điểm đạt</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl>
                      </FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="meet_link" render={({ field }) => (
                    <FormItem><FormLabel>Link Google Meet</FormLabel><FormControl><Input placeholder="https://meet.google.com/..." {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="video_url" render={({ field }) => (
                    <FormItem><FormLabel>Link Video (YouTube / MP4)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="instructions" render={({ field }) => (
                    <FormItem><FormLabel>Hướng dẫn cho học viên</FormLabel><FormControl><Textarea rows={3} placeholder="Lưu ý khi làm bài..." {...field} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="description_vi" render={({ field }) => (
                    <FormItem><FormLabel>Mô tả</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
                  )} />

                  <FormField control={form.control} name="is_published" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div><FormLabel className="text-base">Công bố</FormLabel>
                        <p className="text-sm text-muted-foreground">Học viên có thể vào làm bài.</p>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </TabsContent>

                <TabsContent value="timing" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="starts_at" render={({ field }) => (
                      <FormItem><FormLabel>Mở vào lúc</FormLabel>
                        <FormControl><Input type="datetime-local" {...field} /></FormControl>
                        <p className="text-xs text-muted-foreground">Không vào được trước thời điểm này.</p>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="ends_at" render={({ field }) => (
                      <FormItem><FormLabel>Đóng vào lúc</FormLabel>
                        <FormControl><Input type="datetime-local" {...field} /></FormControl>
                        <p className="text-xs text-muted-foreground">Sau thời điểm này khóa nộp (nếu bật).</p>
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={form.control} name="max_attempts" render={({ field }) => (
                    <FormItem><FormLabel>Số lượt làm tối đa</FormLabel>
                      <FormControl><Input type="number" min={1} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 1)} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="lock_after_end" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div><FormLabel className="text-base">Khóa nộp sau hạn</FormLabel>
                        <p className="text-sm text-muted-foreground">Tự động chặn nộp khi quá giờ kết thúc.</p>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="shuffle_questions" render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div><FormLabel className="text-base">Xáo trộn câu hỏi</FormLabel>
                        <p className="text-sm text-muted-foreground">Mỗi học viên thấy thứ tự câu khác nhau.</p>
                      </div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )} />
                </TabsContent>

                <TabsContent value="questions" className="space-y-3 mt-4">
                  {questions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                      <ListChecks className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      Chưa có câu hỏi nào.
                    </div>
                  )}
                  {questions.map((q, i) => (
                    <Card key={i} className="border-2">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <Badge className="mt-2">Câu {i + 1}</Badge>
                          <Textarea rows={2} value={q.text} onChange={(e) => updateQuestion(i, { text: e.target.value })} placeholder="Nội dung câu hỏi..." className="flex-1" />
                          <div className="flex flex-col gap-1">
                            <Button type="button" size="icon" variant="ghost" onClick={() => duplicateQuestion(i)}><Copy className="w-4 h-4" /></Button>
                            <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => removeQuestion(i)}><X className="w-4 h-4" /></Button>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <button type="button" onClick={() => updateQuestion(i, { correct_index: oi })}
                                className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0',
                                  q.correct_index === oi ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-muted-foreground/40')}>
                                {String.fromCharCode(65 + oi)}
                              </button>
                              <Input value={opt} onChange={(e) => {
                                const arr = [...q.options]; arr[oi] = e.target.value; updateQuestion(i, { options: arr });
                              }} placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`} />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Điểm:</span>
                          <Input type="number" min={1} className="w-20 h-8" value={q.points || 1} onChange={(e) => updateQuestion(i, { points: parseInt(e.target.value) || 1 })} />
                          <span className="text-xs text-emerald-600 ml-auto">Đáp án đúng: {String.fromCharCode(65 + q.correct_index)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Thêm câu hỏi
                  </Button>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : editingExam ? 'Cập nhật' : 'Tạo mới'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!attemptsExam} onOpenChange={() => setAttemptsExam(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Bài làm – {attemptsExam?.title_vi}</DialogTitle></DialogHeader>
          {attempts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Chưa có học viên làm bài.</p>
          ) : (
            <div className="space-y-2">
              {attempts.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
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
                    {a.score != null && <span className="font-bold text-primary">{a.score}/{a.total}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};