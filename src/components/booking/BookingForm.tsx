import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, Clock, User, Loader2, Send } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
  user_id?: string;
  name: string;
  specialty: string;
}

const fallbackJapaneseTeachers: TeacherOption[] = [
  { id: "yamada", name: "Sensei Yamada", specialty: "Chuyên gia JLPT N1 - N2 & Kính ngữ Business" },
  { id: "tanaka", name: "Thầy Tanaka Kenji", specialty: "Giao tiếp phản xạ & Phát âm chuẩn Tokyo" },
  { id: "nguyen_sensei", name: "Cô Nguyễn Thu Hà", specialty: "Luyện thi JLPT N3 - N5 & Ngữ pháp" },
];

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

const MAX_NOTES_LENGTH = 300;

const formSchema = z.object({
  teacher: z.string().min(1, "Vui lòng chọn giáo viên"),
  date: z.date({ required_error: "Vui lòng chọn ngày học" }),
  time: z.string().min(1, "Vui lòng chọn giờ học"),
  duration: z.number().min(1, "Vui lòng chọn thời lượng"),
  notes: z.string().max(MAX_NOTES_LENGTH, `Ghi chú tối đa ${MAX_NOTES_LENGTH} ký tự`).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  onSuccess?: () => void;
  initialTeacher?: string;
}

export const BookingForm = ({ onSuccess, initialTeacher }: BookingFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch real Japanese teachers from Supabase database
  const { data: dbTeachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ["booking-form-teachers"],
    queryFn: async () => {
      const { data: tpData } = await supabase
        .from("teacher_profiles")
        .select("*")
        .eq("is_available", true)
        .order("order_index", { ascending: true });

      if (!tpData || tpData.length === 0) {
        return fallbackJapaneseTeachers;
      }

      const userIds = tpData.map((t) => t.user_id).filter(Boolean);
      const profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profData } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        (profData || []).forEach((p) => {
          if (p.user_id && p.full_name) profileMap[p.user_id] = p.full_name;
        });
      }

      return tpData.map((t: any) => {
        const specs = Array.isArray(t.specializations) ? t.specializations.join(", ") : (t.bio_vi || "Giảng viên tiếng Nhật");
        return {
          id: t.id,
          user_id: t.user_id,
          name: profileMap[t.user_id] || t.name || t.display_name || "Giảng viên Nhật ngữ",
          specialty: specs || "Chuyên gia JLPT & Giao tiếp",
        };
      });
    },
  });

  const teacherList = dbTeachers && dbTeachers.length > 0 ? dbTeachers : fallbackJapaneseTeachers;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teacher: initialTeacher || "",
      time: "",
      duration: 45,
      notes: "",
    },
  });

  const notesValue = form.watch("notes") || "";

  const onSubmit = async (values: FormValues) => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để đặt lịch học");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedTeacher = teacherList.find((t) => t.id === values.teacher || t.name === values.teacher);
      const teacherName = selectedTeacher ? selectedTeacher.name : values.teacher;
      const formattedDate = format(values.date, "yyyy-MM-dd");

      // Check anti-spam duplicate pending booking
      const { data: existingBooking } = await supabase
        .from("bookings")
        .select("id")
        .eq("user_id", user.id)
        .eq("booking_date", formattedDate)
        .eq("booking_time", values.time)
        .eq("status", "pending")
        .maybeSingle();

      if (existingBooking) {
        toast.error("Bạn đã có lịch hẹn chờ duyệt vào thời gian này rồi!");
        setIsSubmitting(false);
        return;
      }

      // Create booking record
      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        teacher_name: teacherName,
        booking_date: formattedDate,
        booking_time: values.time,
        duration_minutes: values.duration,
        notes: values.notes || null,
        status: "pending",
      });

      if (error) throw error;

      // Get student's display name
      const { data: studentProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const studentName = studentProfile?.full_name || user.email || "Học viên";
      const displayDate = format(values.date, "dd/MM/yyyy");

      // Send Realtime notification directly to the assigned teacher's inbox!
      if (selectedTeacher?.user_id) {
        await supabase.from("notifications").insert({
          user_id: selectedTeacher.user_id,
          title: `📅 Lịch hẹn 1-1 mới từ ${studentName}`,
          message: `Học viên ${studentName} vừa đặt lịch học 1-1 với bạn vào ${displayDate} lúc ${values.time} (${values.duration} phút). ${values.notes ? `Ghi chú: "${values.notes}"` : ""}`,
          type: "reminder",
        });
      }

      toast.success("Đặt lịch học & gửi thông báo tới giáo viên thành công!", {
        description: `Buổi học với ${teacherName} vào ${displayDate} lúc ${values.time}. Thông báo đã được gửi tới giáo viên!`,
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
              <FormLabel className="flex items-center gap-2 font-bold">
                <User className="w-4 h-4 text-japanese" />
                Chọn giáo viên phụ trách
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value || (initialTeacher ? initialTeacher : undefined)}>
                <FormControl>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={isLoadingTeachers ? "Đang tải danh sách giáo viên..." : "Chọn giáo viên..."} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teacherList.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      <div className="flex flex-col py-0.5">
                        <span className="font-semibold text-foreground">{teacher.name}</span>
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
              <FormLabel className="flex items-center gap-2 font-bold">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Chọn ngày học
              </FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-background",
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
                      date < new Date(new Date().setHours(0, 0, 0, 0))
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
              <FormLabel className="flex items-center gap-2 font-bold">
                <Clock className="w-4 h-4 text-primary" />
                Chọn giờ học
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-background">
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
              <FormLabel className="font-bold">Thời lượng học</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value.toString()}
              >
                <FormControl>
                  <SelectTrigger className="bg-background">
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

        {/* Notes with character counter & limitation */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel className="font-bold">Ghi chú gửi giáo viên (tuỳ chọn)</FormLabel>
                <span className={cn("text-xs font-semibold", notesValue.length > MAX_NOTES_LENGTH ? "text-destructive" : "text-muted-foreground")}>
                  {notesValue.length}/{MAX_NOTES_LENGTH} ký tự
                </span>
              </div>
              <FormControl>
                <Textarea
                  placeholder="Nội dung muốn học, chủ đề luyện nói, thắc mắc bài học..."
                  className="resize-none min-h-[90px] bg-background"
                  maxLength={MAX_NOTES_LENGTH}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" variant="japanese" className="w-full font-bold shadow-md gap-2" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang gửi thông báo & đặt lịch...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Xác nhận đặt lịch & Gửi thông báo
            </>
          )}
        </Button>
      </form>
    </Form>
  );
};
