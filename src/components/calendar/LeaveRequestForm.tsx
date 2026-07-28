import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Loader2, BookOpen, Calendar as CalendarClassIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const formSchema = z.object({
  request_type: z.enum(['leave', 'reschedule']),
  class_id: z.string().optional(),
  session_id: z.string().optional(),
  start_date: z.date({ required_error: 'Vui lòng chọn ngày bắt đầu' }),
  end_date: z.date({ required_error: 'Vui lòng chọn ngày kết thúc' }),
  reason: z.string().min(5, 'Lý do phải có ít nhất 5 ký tự'),
});

type FormValues = z.infer<typeof formSchema>;

interface LeaveRequestFormProps {
  onSuccess?: () => void;
}

interface ClassItem {
  id: string;
  name_vi: string;
}

interface SessionItem {
  id: string;
  session_date: string;
  topic: string | null;
  start_time: string;
}

export const LeaveRequestForm = ({ onSuccess }: LeaveRequestFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      request_type: 'leave',
      reason: '',
      class_id: '',
      session_id: '',
    },
  });

  // Load student's enrolled classes
  useEffect(() => {
    if (!user) return;
    const fetchClasses = async () => {
      try {
        setLoadingClasses(true);
        const { data: studentClasses } = await supabase
          .from('class_students')
          .select('class_id, classes(id, name_vi)')
          .eq('student_id', user.id)
          .eq('status', 'active');

        const classesList: ClassItem[] = (studentClasses || [])
          .map((sc: any) => sc.classes)
          .filter(Boolean);

        setEnrolledClasses(classesList);
      } catch (err) {
        console.error('Error fetching enrolled classes:', err);
      } finally {
        setLoadingClasses(false);
      }
    };
    fetchClasses();
  }, [user]);

  // Load sessions when a class is selected
  const handleClassChange = async (classId: string) => {
    form.setValue('class_id', classId);
    form.setValue('session_id', '');
    if (!classId) {
      setSessions([]);
      return;
    }

    try {
      setLoadingSessions(true);
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('class_sessions')
        .select('id, session_date, topic, start_time')
        .eq('class_id', classId)
        .gte('session_date', today)
        .order('session_date', { ascending: true });

      setSessions(data || []);
    } catch (err) {
      console.error('Error fetching class sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Auto-fill dates when a specific session is selected
  const handleSessionChange = (sessionId: string) => {
    form.setValue('session_id', sessionId);
    const selectedSession = sessions.find((s) => s.id === sessionId);
    if (selectedSession && selectedSession.session_date) {
      const sDate = new Date(selectedSession.session_date);
      form.setValue('start_date', sDate);
      form.setValue('end_date', sDate);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập');
      return;
    }

    if (values.end_date < values.start_date) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalReason = values.reason;
      if (values.session_id) {
        const selSession = sessions.find((s) => s.id === values.session_id);
        const selClass = enrolledClasses.find((c) => c.id === values.class_id);
        if (selSession && selClass) {
          finalReason = `[Lớp: ${selClass.name_vi} - Buổi học ${selSession.session_date} (${selSession.topic || 'Buổi học'})] ${values.reason}`;
        }
      }

      const { error } = await supabase.from('leave_requests').insert({
        user_id: user.id,
        request_type: values.request_type,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: format(values.end_date, 'yyyy-MM-dd'),
        reason: finalReason,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Gửi yêu cầu xin nghỉ thành công!', {
        description: 'Yêu cầu của bạn đã được chuyển tới quản lý & giáo viên phụ trách.',
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error('Error submitting leave request:', error);
      toast.error('Không thể gửi yêu cầu', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Request Type */}
        <FormField
          control={form.control}
          name="request_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loại yêu cầu</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại yêu cầu..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="leave">Xin nghỉ phép</SelectItem>
                  <SelectItem value="reschedule">Xin dời lịch học</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Select Class (Optional) */}
        {enrolledClasses.length > 0 && (
          <div className="space-y-3 p-3 rounded-xl bg-muted/40 border">
            <FormItem>
              <FormLabel className="text-xs font-bold flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-primary" /> Chọn lớp học đang tham gia
              </FormLabel>
              <Select onValueChange={handleClassChange} value={form.watch('class_id')}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder={loadingClasses ? "Đang tải lớp học..." : "Chọn lớp học..."} />
                </SelectTrigger>
                <SelectContent>
                  {enrolledClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name_vi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            {/* Select Specific Session */}
            {form.watch('class_id') && (
              <FormItem>
                <FormLabel className="text-xs font-bold flex items-center gap-1.5">
                  <CalendarClassIcon className="w-3.5 h-3.5 text-japanese" /> Chọn buổi học cụ thể xin nghỉ/dời lịch
                </FormLabel>
                <Select onValueChange={handleSessionChange} value={form.watch('session_id')}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={loadingSessions ? "Đang tải các buổi học..." : "Chọn buổi học..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.length === 0 ? (
                      <SelectItem value="none" disabled>Lớp chưa có buổi học sắp tới</SelectItem>
                    ) : (
                      sessions.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.session_date} • {s.topic || 'Buổi học'} ({s.start_time})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          </div>
        )}

        {/* Start Date */}
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Ngày bắt đầu nghỉ</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'EEEE, dd/MM/yyyy', { locale: vi })
                      ) : (
                        <span>Chọn ngày...</span>
                      )}
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

        {/* End Date */}
        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Ngày kết thúc nghỉ</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? (
                        format(field.value, 'EEEE, dd/MM/yyyy', { locale: vi })
                      ) : (
                        <span>Chọn ngày...</span>
                      )}
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

        {/* Reason */}
        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lý do nghỉ/dời lịch</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nhập lý do bận việc cá nhân, bị ốm,..."
                  className="resize-none min-h-[90px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" variant="japanese" className="w-full font-bold" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang gửi...
            </>
          ) : (
            'Gửi yêu cầu xin nghỉ'
          )}
        </Button>
      </form>
    </Form>
  );
};
