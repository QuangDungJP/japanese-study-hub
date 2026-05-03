import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Plus, Loader2, Pencil, Trash2, Video, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const formSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  title_vi: z.string().min(1, 'Vui lòng nhập tiêu đề tiếng Việt'),
  description: z.string().optional(),
  description_vi: z.string().optional(),
  exam_type: z.enum(['quiz', 'midterm', 'final', 'placement']),
  exam_date: z.date({ required_error: 'Vui lòng chọn ngày thi' }),
  start_time: z.string().min(1, 'Vui lòng chọn giờ thi'),
  duration_minutes: z.number().min(5, 'Thời gian phải ít nhất 5 phút'),
  location: z.string().optional(),
  meet_link: z.string().optional(),
  max_score: z.number().min(1).default(100),
  passing_score: z.number().min(0).default(50),
  is_published: z.boolean().default(false),
  class_id: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Exam {
  id: string;
  title: string;
  title_vi: string;
  description: string | null;
  description_vi: string | null;
  exam_type: string;
  exam_date: string;
  start_time: string;
  duration_minutes: number;
  location: string | null;
  meet_link: string | null;
  max_score: number | null;
  passing_score: number | null;
  is_published: boolean;
  class_id: string | null;
  teacher_id: string;
}

interface Class {
  id: string;
  name_vi: string;
}

export const ExamManager = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      title_vi: '',
      description: '',
      description_vi: '',
      exam_type: 'quiz',
      start_time: '09:00',
      duration_minutes: 60,
      location: '',
      meet_link: '',
      max_score: 100,
      passing_score: 50,
      is_published: false,
      class_id: '',
    },
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Fetch exams
      const { data: examsData, error } = await supabase
        .from('exams')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('exam_date', { ascending: true });

      if (error) throw error;
      setExams(examsData || []);

      // Fetch classes
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, name_vi')
        .eq('teacher_id', user?.id);

      setClasses(classesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingExam(null);
    form.reset({
      title: '',
      title_vi: '',
      description: '',
      description_vi: '',
      exam_type: 'quiz',
      start_time: '09:00',
      duration_minutes: 60,
      location: '',
      meet_link: '',
      max_score: 100,
      passing_score: 50,
      is_published: false,
      class_id: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (exam: Exam) => {
    setEditingExam(exam);
    form.reset({
      title: exam.title,
      title_vi: exam.title_vi,
      description: exam.description || '',
      description_vi: exam.description_vi || '',
      exam_type: exam.exam_type as 'quiz' | 'midterm' | 'final' | 'placement',
      exam_date: new Date(exam.exam_date),
      start_time: exam.start_time,
      duration_minutes: exam.duration_minutes,
      location: exam.location || '',
      meet_link: exam.meet_link || '',
      max_score: exam.max_score || 100,
      passing_score: exam.passing_score || 50,
      is_published: exam.is_published,
      class_id: exam.class_id || '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const examData = {
        title: values.title,
        title_vi: values.title_vi,
        description: values.description || null,
        description_vi: values.description_vi || null,
        exam_type: values.exam_type,
        exam_date: format(values.exam_date, 'yyyy-MM-dd'),
        start_time: values.start_time,
        duration_minutes: values.duration_minutes,
        location: values.location || null,
        meet_link: values.meet_link || null,
        max_score: values.max_score,
        passing_score: values.passing_score,
        is_published: values.is_published,
        class_id: values.class_id || null,
        teacher_id: user.id,
      };

      if (editingExam) {
        const { error } = await supabase
          .from('exams')
          .update(examData)
          .eq('id', editingExam.id);
        if (error) throw error;
        toast.success('Đã cập nhật bài kiểm tra');
      } else {
        const { error } = await supabase.from('exams').insert(examData);
        if (error) throw error;
        toast.success('Đã tạo bài kiểm tra mới');
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Có lỗi xảy ra', { description: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài kiểm tra này?')) return;

    try {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
      toast.success('Đã xóa bài kiểm tra');
      fetchData();
    } catch (error) {
      toast.error('Không thể xóa bài kiểm tra');
    }
  };

  const getExamTypeBadge = (type: string) => {
    switch (type) {
      case 'quiz':
        return <Badge variant="secondary">Quiz</Badge>;
      case 'midterm':
        return <Badge className="bg-primary text-primary-foreground">Giữa kỳ</Badge>;
      case 'final':
        return <Badge className="bg-accent text-accent-foreground">Cuối kỳ</Badge>;
      case 'placement':
        return <Badge variant="outline">Xếp lớp</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Quản lý bài kiểm tra</h2>
          <p className="text-muted-foreground">Tạo và quản lý các bài kiểm tra, thi</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Tạo mới
        </Button>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Chưa có bài kiểm tra nào</h3>
            <p className="text-muted-foreground">Tạo bài kiểm tra mới để bắt đầu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <Card key={exam.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{exam.title_vi}</h3>
                      {getExamTypeBadge(exam.exam_type)}
                      <Badge variant={exam.is_published ? 'default' : 'outline'}>
                        {exam.is_published ? 'Đã công bố' : 'Nháp'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(exam.exam_date), 'dd/MM/yyyy', { locale: vi })} lúc {exam.start_time} • {exam.duration_minutes} phút
                    </div>
                    {exam.meet_link && (
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <Video className="w-4 h-4" />
                        Có link Meet
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(exam)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(exam.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExam ? 'Chỉnh sửa bài kiểm tra' : 'Tạo bài kiểm tra mới'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiêu đề (EN)</FormLabel>
                      <FormControl>
                        <Input placeholder="Exam title..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title_vi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiêu đề (VI)</FormLabel>
                      <FormControl>
                        <Input placeholder="Tiêu đề bài kiểm tra..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="exam_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại kiểm tra</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="midterm">Giữa kỳ</SelectItem>
                          <SelectItem value="final">Cuối kỳ</SelectItem>
                          <SelectItem value="placement">Xếp lớp</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lớp (tùy chọn)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(v === 'all' ? '' : v)} value={field.value || 'all'}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn lớp..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">Tất cả</SelectItem>
                          {classes.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name_vi}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="exam_date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Ngày thi</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? format(field.value, 'dd/MM/yyyy') : 'Chọn...'}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Giờ bắt đầu</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thời gian (phút)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="max_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Điểm tối đa</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="passing_score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Điểm đạt</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="meet_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link Google Meet (tùy chọn)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://meet.google.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description_vi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mô tả</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Mô tả bài kiểm tra..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-base">Công bố</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Học viên có thể xem và đăng ký
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingExam ? (
                    'Cập nhật'
                  ) : (
                    'Tạo mới'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
