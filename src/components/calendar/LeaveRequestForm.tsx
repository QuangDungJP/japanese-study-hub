import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
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
  start_date: z.date({ required_error: 'Vui lòng chọn ngày bắt đầu' }),
  end_date: z.date({ required_error: 'Vui lòng chọn ngày kết thúc' }),
  reason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự'),
});

type FormValues = z.infer<typeof formSchema>;

interface LeaveRequestFormProps {
  onSuccess?: () => void;
}

export const LeaveRequestForm = ({ onSuccess }: LeaveRequestFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      request_type: 'leave',
      reason: '',
    },
  });

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
      const { error } = await supabase.from('leave_requests').insert({
        user_id: user.id,
        request_type: values.request_type,
        start_date: format(values.start_date, 'yyyy-MM-dd'),
        end_date: format(values.end_date, 'yyyy-MM-dd'),
        reason: values.reason,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Gửi yêu cầu thành công!', {
        description: 'Yêu cầu của bạn đang chờ phê duyệt',
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  <SelectItem value="reschedule">Xin dời lịch</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Start Date */}
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Ngày bắt đầu</FormLabel>
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
                    disabled={(date) => date < new Date()}
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
              <FormLabel>Ngày kết thúc</FormLabel>
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
                    disabled={(date) => date < new Date()}
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
              <FormLabel>Lý do</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nhập lý do xin nghỉ/dời lịch..."
                  className="resize-none min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang gửi...
            </>
          ) : (
            'Gửi yêu cầu'
          )}
        </Button>
      </form>
    </Form>
  );
};
