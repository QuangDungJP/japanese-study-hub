import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Clock, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TeacherOption {
  id: string;
  user_id: string | null;
  name: string;
  specialty: string;
}

const timeSlots = [
  "08:00", "09:00", "10:00", "11:00",
  "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

const durations = [
  { value: 45, label: "45 phút" },
  { value: 60, label: "60 phút" },
  { value: 90, label: "90 phút" },
];

const formSchema = z.object({
  teacher: z.string().min(1, "Vui lòng chọn giáo viên"),
  date: z.date({ required_error: "Vui lòng chọn ngày học" }),
  time: z.string().min(1, "Vui lòng chọn giờ học"),
  duration: z.number().min(1, "Vui lòng chọn thời lượng"),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  onSuccess?: () => void;
}

export const BookingForm = ({ onSuccess }: BookingFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  useEffect(() => {
    const loadTeachers = async () => {
      const { data } = await supabase
        .from("teacher_profiles")
        .select("id, user_id, display_name, headline, specializations")
        .eq("is_available", true)
        .order("is_featured", { ascending: false })
        .order("rating", { ascending: false });

      if (data) {
        const opts: TeacherOption[] = data.map((t: any) => {
          const specs = Array.isArray(t.specializations) ? t.specializations : [];
          return {
            id: t.id,
            user_id: t.user_id,
            name: t.display_name || "Giảng viên",
            specialty: t.headline || specs.slice(0, 2).join(", ") || "Giảng viên",
          };
        });
        setTeachers(opts);
      }
      setLoadingTeachers(false);
    };
    loadTeachers();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teacher: "",
      time: "",
      duration: 45,
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt lịch học");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedTeacher = teachers.find((t) => t.id === values.teacher);

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        teacher_name: selectedTeacher?.name || values.teacher,
        booking_date: format(values.date, "yyyy-MM-dd"),
        booking_time: values.time,
        duration_minutes: values.duration,
        notes: values.notes || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Đặt lịch học thành công!", {
        description: `Buổi học với ${selectedTeacher?.name} vào ${format(values.date, "dd/MM/yyyy")} lúc ${values.time}`,
      });

      form.reset();
      onSuccess?.();
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error("Không thể đặt lịch học", {
        description: error.message || "Vui lòng thử lại sau",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Teacher Selection */}
        <FormField
          control={form.control}
          name="teacher"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Chọn giáo viên
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giáo viên..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{teacher.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {teacher.specialty}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Date Selection */}
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Chọn ngày học
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "EEEE, dd/MM/yyyy", { locale: vi })
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
                    disabled={(date) =>
                      date < new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time Selection */}
        <FormField
          control={form.control}
          name="time"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Chọn giờ học
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giờ..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Duration Selection */}
        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thời lượng</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn thời lượng..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {durations.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value.toString()}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú (tuỳ chọn)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Nội dung bạn muốn học, yêu cầu đặc biệt..."
                  className="resize-none"
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
              Đang đặt lịch...
            </>
          ) : (
            "Xác nhận đặt lịch"
          )}
        </Button>
      </form>
    </Form>
  );
};
