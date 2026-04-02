import { useEffect, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Calendar, Clock, User, Trash2, Loader2, Video, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Booking {
  id: string;
  teacher_name: string;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Meeting {
  id: string;
  booking_id: string;
  meet_link: string;
  start_time: string;
  end_time: string;
}

export const MyBookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("booking_date", { ascending: true })
        .order("booking_time", { ascending: true });

      if (error) throw error;
      setBookings(data || []);

      // Fetch meetings for these bookings
      if (data && data.length > 0) {
        const bookingIds = data.map(b => b.id);
        const { data: meetingsData, error: meetingsError } = await supabase
          .from("meetings")
          .select("*")
          .in("booking_id", bookingIds);

        if (!meetingsError && meetingsData) {
          setMeetings(meetingsData);
        }
      }
    } catch (error: any) {
      console.error("Error fetching bookings:", error);
      toast.error("Không thể tải danh sách đặt lịch");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const getMeetingForBooking = (bookingId: string) => {
    return meetings.find(m => m.booking_id === bookingId);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("bookings").delete().eq("id", id);
      if (error) throw error;

      setBookings((prev) => prev.filter((b) => b.id !== id));
      toast.success("Đã huỷ lịch học");
    } catch (error: any) {
      console.error("Error deleting booking:", error);
      toast.error("Không thể huỷ lịch học");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Chờ xác nhận</Badge>;
      case "confirmed":
        return <Badge className="bg-green-500">Đã xác nhận</Badge>;
      case "completed":
        return <Badge variant="outline">Hoàn thành</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Đã huỷ</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Chưa có lịch học nào</h3>
          <p className="text-muted-foreground">
            Đặt lịch học với giáo viên để bắt đầu!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => {
        const meeting = getMeetingForBooking(booking.id);
        
        return (
          <Card key={booking.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{booking.teacher_name}</span>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {format(new Date(booking.booking_date), "EEEE, dd/MM/yyyy", {
                          locale: vi,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {booking.booking_time} ({booking.duration_minutes} phút)
                      </span>
                    </div>
                  </div>

                  {booking.notes && (
                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-lg">
                      {booking.notes}
                    </p>
                  )}

                  {/* Google Meet Link */}
                  {meeting && booking.status === 'confirmed' && (
                    <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Video className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-700 dark:text-green-400">
                            Link Google Meet đã sẵn sàng
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => window.open(meeting.meet_link, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Tham gia
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {booking.status === "pending" && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {deletingId === booking.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Huỷ lịch học?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Bạn có chắc muốn huỷ buổi học với {booking.teacher_name} vào{" "}
                          {format(new Date(booking.booking_date), "dd/MM/yyyy")} lúc{" "}
                          {booking.booking_time}?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Không</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(booking.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Huỷ lịch
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
